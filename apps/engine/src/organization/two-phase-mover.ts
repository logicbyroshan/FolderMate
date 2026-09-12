import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import crypto from "crypto";
import { DatabaseManager } from "@foldermate/database";
import { FolderMateConfig } from "@foldermate/config";
import { HashMismatchError, SecurityPathError } from "@foldermate/shared";
import { assertPathWithinRoot } from "../naming/sanitizer.js";
import { TemplateEngine } from "../naming/template-engine.js";

export interface MoveExecutionParams {
  sourcePath: string;
  sourceHash?: string;
  clientId?: string | null;
  clientName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  categoryName?: string | null;
  year?: number | null;
  versionNumber?: number;
  confidenceScore?: number;
  folderTemplate?: string;
  namingTemplate?: string;
  collisionPolicy?: "AUTO_INCREMENT" | "PROMPT_REVIEW" | "CREATE_BRANCH";
}

export interface MoveExecutionResult {
  success: boolean;
  fileId: string;
  versionId: string;
  finalPath: string;
  relativePath: string;
  finalFilename: string;
  versionNumber: number;
  isDuplicate: boolean;
  stagedCopyVerified: boolean;
}

export class TwoPhaseMover {
  private templateEngine: TemplateEngine;

  constructor(
    private db: DatabaseManager,
    private config: FolderMateConfig
  ) {
    this.templateEngine = new TemplateEngine();
  }

  public async executeMove(params: MoveExecutionParams): Promise<MoveExecutionResult> {
    const { sourcePath } = params;

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }

    const stats = await fsPromises.stat(sourcePath);
    const originalFilename = path.basename(sourcePath);
    const extension = path.extname(sourcePath).toLowerCase();

    // 1. Calculate Source Hash if not provided
    const sourceHash = params.sourceHash || (await this.computeHash(sourcePath));

    // 2. Check for Content-Based Exact Duplicate in Database
    const existingByHash = this.db.files.getByHash(sourceHash);
    if (existingByHash && existingByHash.currentPath && fs.existsSync(existingByHash.currentPath)) {
      this.db.events.record({
        fileId: existingByHash.id,
        eventType: "DUPLICATE_DETECTED",
        details: `Exact SHA-256 duplicate of file ${existingByHash.currentName} detected for ${originalFilename}`,
      });

      return {
        success: true,
        fileId: existingByHash.id,
        versionId: "",
        finalPath: existingByHash.currentPath,
        relativePath: existingByHash.relativePath,
        finalFilename: existingByHash.currentName,
        versionNumber: existingByHash.versionNumber,
        isDuplicate: true,
        stagedCopyVerified: true,
      };
    }

    // 3. Resolve Target Directory and Filename via Templates
    const folderTpl = params.folderTemplate || this.config.storage.defaultFolderTemplate;
    const namingTpl = params.namingTemplate || this.config.storage.defaultNamingTemplate;

    let targetVersion = params.versionNumber || 1;

    const templateCtx = {
      clientName: params.clientName,
      clientCode: params.clientName ? params.clientName.replace(/\s+/g, "").toUpperCase().slice(0, 6) : "GEN",
      projectName: params.projectName,
      projectCode: "PRJ",
      categoryName: params.categoryName || "General",
      year: params.year || new Date().getFullYear(),
      versionNumber: targetVersion,
      originalName: originalFilename,
      extension,
    };

    const relativeFolder = this.templateEngine.renderFolderPath(folderTpl, templateCtx);
    const targetFolder = path.join(this.config.storage.organizationRoot, relativeFolder);

    // Verify storage path security bounds
    assertPathWithinRoot(targetFolder, this.config.storage.organizationRoot);

    if (!fs.existsSync(targetFolder)) {
      await fsPromises.mkdir(targetFolder, { recursive: true });
    }

    let targetFilename = this.templateEngine.renderFilename(namingTpl, templateCtx);
    let targetPath = path.join(targetFolder, targetFilename);

    // 4. Collision Detection & Next Version Resolution
    if (fs.existsSync(targetPath)) {
      const existingFileStats = await fsPromises.stat(targetPath);
      const existingFileHash = await this.computeHash(targetPath);

      if (existingFileHash === sourceHash) {
        // Same file already in place
        return {
          success: true,
          fileId: "",
          versionId: "",
          finalPath: targetPath,
          relativePath: path.join(relativeFolder, targetFilename),
          finalFilename: targetFilename,
          versionNumber: targetVersion,
          isDuplicate: true,
          stagedCopyVerified: true,
        };
      }

      // If collision policy is AUTO_INCREMENT, increment version until unique
      const policy = params.collisionPolicy || this.config.storage.collisionPolicy;
      if (policy === "AUTO_INCREMENT") {
        while (fs.existsSync(targetPath)) {
          targetVersion++;
          templateCtx.versionNumber = targetVersion;
          targetFilename = this.templateEngine.renderFilename(namingTpl, templateCtx);
          targetPath = path.join(targetFolder, targetFilename);
        }
      } else {
        throw new Error(`Target destination already exists: ${targetPath}`);
      }
    }

    // 5. PHASE 1: Staging Copy & SHA-256 Verification
    const stagingFilename = `.foldermate_staging_${sourceHash.slice(0, 16)}_${Date.now()}.tmp`;
    const stagingPath = path.join(targetFolder, stagingFilename);

    try {
      await this.streamCopy(sourcePath, stagingPath);
      const stagedHash = await this.computeHash(stagingPath);

      if (stagedHash !== sourceHash) {
        // Corrupted transfer! Delete staging and throw
        await fsPromises.unlink(stagingPath).catch(() => {});
        throw new HashMismatchError(sourceHash, stagedHash, stagingPath);
      }

      // 6. PHASE 2: Atomic Rename on Destination Volume
      await fsPromises.rename(stagingPath, targetPath);

      const relativePath = path.join(relativeFolder, targetFilename);
      const now = new Date().toISOString();

      // 7. Atomic Database Transaction
      let fileRecord: any;
      let versionRecord: any;

      const tx = this.db.db.transaction(() => {
        // Record master file
        fileRecord = this.db.files.create({
          originalName: originalFilename,
          currentName: targetFilename,
          originalPath: sourcePath,
          currentPath: targetPath,
          relativePath,
          extension,
          mimeType: this.getMimeType(extension),
          sizeBytes: stats.size,
          sha256Hash: sourceHash,
          clientId: params.clientId || null,
          projectId: params.projectId || null,
          year: params.year || null,
          versionNumber: targetVersion,
          status: "organized",
          confidenceScore: params.confidenceScore ?? 1.0,
          organizedAt: now,
          isArchived: false,
        });

        // Record initial version in lineage ledger
        versionRecord = this.db.versions.create({
          fileId: fileRecord.id,
          versionNumber: targetVersion,
          filePath: targetPath,
          sha256Hash: sourceHash,
          sizeBytes: stats.size,
          createdBy: "foldermate_engine",
          isApproved: false,
          isLatest: true,
        });

        // Audit log event
        this.db.events.record({
          fileId: fileRecord.id,
          eventType: "FILE_ORGANIZED",
          details: `Organized '${originalFilename}' -> '${targetFilename}' (v${targetVersion})`,
        });
      });

      tx();

      // 8. Safe Cleanup of Source File in Inbox
      if (this.config.storage.safeMode) {
        const inboxDir = path.dirname(sourcePath);
        const archiveDir = path.join(inboxDir, "_Archived");
        if (!fs.existsSync(archiveDir)) {
          await fsPromises.mkdir(archiveDir, { recursive: true });
        }
        const archiveDest = path.join(archiveDir, `${Date.now()}_${originalFilename}`);
        await fsPromises.rename(sourcePath, archiveDest).catch(() => {});
      } else {
        await fsPromises.unlink(sourcePath).catch(() => {});
      }

      return {
        success: true,
        fileId: fileRecord.id,
        versionId: versionRecord.id,
        finalPath: targetPath,
        relativePath,
        finalFilename: targetFilename,
        versionNumber: targetVersion,
        isDuplicate: false,
        stagedCopyVerified: true,
      };
    } catch (err) {
      // Clean up orphaned staging file on failure
      if (fs.existsSync(stagingPath)) {
        await fsPromises.unlink(stagingPath).catch(() => {});
      }
      throw err;
    }
  }

  private async computeHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });
  }

  private async streamCopy(src: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(src, { highWaterMark: 64 * 1024 });
      const writeStream = fs.createWriteStream(dest, { highWaterMark: 64 * 1024 });

      readStream.on("error", reject);
      writeStream.on("error", reject);
      writeStream.on("finish", () => resolve());

      readStream.pipe(writeStream);
    });
  }

  private getMimeType(ext: string): string {
    const map: Record<string, string> = {
      ".cdr": "application/vnd.corel-draw",
      ".pdf": "application/pdf",
      ".ai": "application/postscript",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    return map[ext] || "application/octet-stream";
  }
}
