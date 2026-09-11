import fs from "fs";
import crypto from "crypto";
import path from "path";

export interface AnalyzedFileInfo {
  filePath: string;
  filename: string;
  extension: string;
  sizeBytes: number;
  sha256Hash: string;
  mimeType: string;
  sourceApp?: string;
  createdAt: string;
  modifiedAt: string;
}

export class FileAnalyzer {
  public async analyzeFile(filePath: string): Promise<AnalyzedFileInfo> {
    const stats = await fs.promises.stat(filePath);
    const hash = await this.computeHashStreaming(filePath);
    const filename = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = await this.detectMimeType(filePath, ext);
    const sourceApp = this.inferSourceApp(ext);

    return {
      filePath,
      filename,
      extension: ext,
      sizeBytes: stats.size,
      sha256Hash: hash,
      mimeType,
      sourceApp,
      createdAt: stats.birthtime.toISOString(),
      modifiedAt: stats.mtime.toISOString(),
    };
  }

  public async computeHashStreaming(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });

      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });
  }

  private async detectMimeType(filePath: string, ext: string): Promise<string> {
    // Check magic bytes for common design & office formats
    try {
      const fd = await fs.promises.open(filePath, "r");
      const buffer = Buffer.alloc(16);
      await fd.read(buffer, 0, 16, 0);
      await fd.close();

      // PK.. (Zip container for CorelDRAW X4+, Office docs, etc.)
      if (buffer[0] === 0x50 && buffer[1] === 0x4B) {
        if (ext === ".cdr") return "application/vnd.corel-draw";
        if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (ext === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        return "application/zip";
      }

      // %PDF
      if (buffer.toString("utf8", 0, 4) === "%PDF") {
        return "application/pdf";
      }

      // PNG \x89PNG\r\n\x1a\n
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return "image/png";
      }

      // JPEG \xFF\xD8\xFF
      if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return "image/jpeg";
      }
    } catch {
      // fallback to extension map
    }

    const mimeMap: Record<string, string> = {
      ".cdr": "application/vnd.corel-draw",
      ".pdf": "application/pdf",
      ".ai": "application/postscript",
      ".eps": "application/postscript",
      ".psd": "image/vnd.adobe.photoshop",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".txt": "text/plain",
    };

    return mimeMap[ext] || "application/octet-stream";
  }

  private inferSourceApp(ext: string): string {
    switch (ext) {
      case ".cdr":
        return "CorelDRAW";
      case ".ai":
        return "Adobe Illustrator";
      case ".psd":
        return "Adobe Photoshop";
      case ".indd":
        return "Adobe InDesign";
      case ".docx":
        return "Microsoft Word";
      case ".xlsx":
        return "Microsoft Excel";
      case ".pdf":
        return "PDF Document";
      default:
        return "Generic Application";
    }
  }
}
