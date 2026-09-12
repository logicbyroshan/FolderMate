import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { DatabaseManager } from "@foldermate/database";
import { FileVersionDTO } from "@foldermate/shared";

export class VersionEngine {
  constructor(private db: DatabaseManager) {}

  public getLineage(fileId: string): FileVersionDTO[] {
    return this.db.versions.listByFile(fileId);
  }

  public getLatestVersion(fileId: string): FileVersionDTO | null {
    return this.db.versions.getLatestByFile(fileId);
  }

  /**
   * Restores an older historical version by promoting it as the next forward canonical version.
   */
  public async restoreVersion(fileId: string, versionNumberToRestore: number, restoredBy: string = "user"): Promise<FileVersionDTO> {
    const file = this.db.files.getById(fileId);
    if (!file) {
      throw new Error(`File not found: ${fileId}`);
    }

    const versions = this.db.versions.listByFile(fileId);
    const targetHistoricalVersion = versions.find((v) => v.versionNumber === versionNumberToRestore);
    if (!targetHistoricalVersion) {
      throw new Error(`Version v${versionNumberToRestore} not found for file ${file.currentName}`);
    }

    if (!fs.existsSync(targetHistoricalVersion.filePath)) {
      throw new Error(`Historical file payload missing from disk: ${targetHistoricalVersion.filePath}`);
    }

    const maxVersion = this.db.versions.getMaxVersionNumber(fileId);
    const newVersionNumber = maxVersion + 1;

    // Build new filename and destination path
    const parsedPath = path.parse(file.currentPath);
    const ext = file.extension;
    const oldVersionToken = `v${file.versionNumber}`;
    const newVersionToken = `v${newVersionNumber}`;

    let newFilename = file.currentName;
    if (newFilename.includes(oldVersionToken)) {
      newFilename = newFilename.replace(oldVersionToken, newVersionToken);
    } else {
      newFilename = `${parsedPath.name} ${newVersionToken}${ext}`;
    }

    const newFilePath = path.join(parsedPath.dir, newFilename);

    // Copy historical payload to new forward path
    await fsPromises.copyFile(targetHistoricalVersion.filePath, newFilePath);
    const stats = await fsPromises.stat(newFilePath);

    let newVersionRecord: FileVersionDTO;

    const tx = this.db.db.transaction(() => {
      newVersionRecord = this.db.versions.create({
        fileId,
        versionNumber: newVersionNumber,
        parentVersionId: targetHistoricalVersion.id,
        filePath: newFilePath,
        sha256Hash: targetHistoricalVersion.sha256Hash,
        sizeBytes: stats.size,
        changeSummary: `Restored from version v${versionNumberToRestore}`,
        createdBy: restoredBy,
        isApproved: false,
        isLatest: true,
      });

      this.db.files.updateOrganizedFile(fileId, {
        currentName: newFilename,
        currentPath: newFilePath,
        relativePath: path.join(path.dirname(file.relativePath), newFilename),
        clientId: file.clientId,
        projectId: file.projectId,
        year: file.year,
        versionNumber: newVersionNumber,
        status: "organized",
        confidenceScore: file.confidenceScore,
        organizedAt: new Date().toISOString(),
      });

      this.db.events.record({
        fileId,
        eventType: "FILE_RESTORED",
        details: `Restored file to v${newVersionNumber} from historical v${versionNumberToRestore}`,
      });
    });

    tx();
    return newVersionRecord!;
  }
}
