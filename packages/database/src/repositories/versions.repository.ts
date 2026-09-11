import { Database as DatabaseType } from "better-sqlite3";
import crypto from "crypto";
import { FileVersionDTO } from "@foldermate/shared";

export class VersionsRepository {
  constructor(private db: DatabaseType) {}

  public create(version: Omit<FileVersionDTO, "id" | "createdAt"> & { id?: string }): FileVersionDTO {
    const id = version.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const tx = this.db.transaction(() => {
      // If marked as latest, set previous versions is_latest to 0
      if (version.isLatest) {
        this.db.prepare("UPDATE file_versions SET is_latest = 0 WHERE file_id = ?").run(version.fileId);
      }

      const stmt = this.db.prepare(`
        INSERT INTO file_versions (
          id, file_id, version_number, parent_version_id, file_path, sha256_hash,
          size_bytes, change_summary, created_by, is_approved, is_latest, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        version.fileId,
        version.versionNumber,
        version.parentVersionId || null,
        version.filePath,
        version.sha256Hash,
        version.sizeBytes,
        version.changeSummary || null,
        version.createdBy || "user",
        version.isApproved ? 1 : 0,
        version.isLatest ? 1 : 0,
        now
      );
    });

    tx();
    return this.getById(id)!;
  }

  public getById(id: string): FileVersionDTO | null {
    const row = this.db.prepare("SELECT * FROM file_versions WHERE id = ?").get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public listByFile(fileId: string): FileVersionDTO[] {
    const rows = this.db.prepare("SELECT * FROM file_versions WHERE file_id = ? ORDER BY version_number ASC").all(fileId) as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public getLatestByFile(fileId: string): FileVersionDTO | null {
    const row = this.db.prepare("SELECT * FROM file_versions WHERE file_id = ? AND is_latest = 1").get(fileId) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public getMaxVersionNumber(fileId: string): number {
    const row = this.db.prepare("SELECT MAX(version_number) as max_v FROM file_versions WHERE file_id = ?").get(fileId) as any;
    return row?.max_v || 0;
  }

  private mapRow(row: any): FileVersionDTO {
    return {
      id: row.id,
      fileId: row.file_id,
      versionNumber: row.version_number,
      parentVersionId: row.parent_version_id,
      filePath: row.file_path,
      sha256Hash: row.sha256_hash,
      sizeBytes: row.size_bytes,
      changeSummary: row.change_summary,
      createdBy: row.created_by,
      isApproved: Boolean(row.is_approved),
      isLatest: Boolean(row.is_latest),
      createdAt: row.created_at,
    };
  }
}
