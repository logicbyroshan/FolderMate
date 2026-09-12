import crypto from "crypto";
import { FileRecordDTO, FileStatus } from "@foldermate/shared";
import { IDatabase } from "../connection.js";

export class FilesRepository {
  constructor(private db: IDatabase) {}

  public create(file: Omit<FileRecordDTO, "id" | "createdAt" | "updatedAt"> & { id?: string }): FileRecordDTO {
    const id = file.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO files (
        id, original_name, current_name, original_path, current_path, relative_path,
        extension, mime_type, size_bytes, sha256_hash, client_id, project_id,
        category_id, year, version_number, status, confidence_score, source_app,
        is_archived, organized_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      id,
      file.originalName,
      file.currentName,
      file.originalPath,
      file.currentPath,
      file.relativePath,
      file.extension,
      file.mimeType,
      file.sizeBytes,
      file.sha256Hash,
      file.clientId || null,
      file.projectId || null,
      file.categoryId || null,
      file.year || null,
      file.versionNumber || 1,
      file.status || "organized",
      file.confidenceScore ?? 1.0,
      file.sourceApp || null,
      file.isArchived ? 1 : 0,
      file.organizedAt || null,
      now,
      now
    );

    return this.getById(id)!;
  }

  public getById(id: string): FileRecordDTO | null {
    const row = this.db.prepare("SELECT * FROM files WHERE id = ?;").get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public getByHash(hash: string): FileRecordDTO | null {
    const row = this.db.prepare("SELECT * FROM files WHERE sha256_hash = ?;").get(hash) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public getByCurrentPath(currentPath: string): FileRecordDTO | null {
    const row = this.db.prepare("SELECT * FROM files WHERE current_path = ?;").get(currentPath) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public list(options: {
    clientId?: string;
    projectId?: string;
    status?: FileStatus;
    limit?: number;
    offset?: number;
  } = {}): { items: FileRecordDTO[]; total: number } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (options.clientId) {
      conditions.push("client_id = ?");
      params.push(options.clientId);
    }
    if (options.projectId) {
      conditions.push("project_id = ?");
      params.push(options.projectId);
    }
    if (options.status) {
      conditions.push("status = ?");
      params.push(options.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const totalRow = this.db.prepare(`SELECT COUNT(*) as count FROM files ${whereClause};`).get(...params) as any;
    const total = totalRow ? Number(totalRow.count) : 0;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const query = `
      SELECT * FROM files
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?;
    `;
    const rows = this.db.prepare(query).all(...params, limit, offset) as any[];

    return {
      items: rows.map((r) => this.mapRow(r)),
      total,
    };
  }

  public updateStatus(id: string, status: FileStatus): boolean {
    const now = new Date().toISOString();
    const result = this.db.prepare("UPDATE files SET status = ?, updated_at = ? WHERE id = ?;").run(status, now, id);
    return result.changes > 0;
  }

  public updateOrganizedFile(id: string, updates: {
    currentName: string;
    currentPath: string;
    relativePath: string;
    clientId?: string | null;
    projectId?: string | null;
    year?: number | null;
    versionNumber: number;
    status: FileStatus;
    confidenceScore: number;
    organizedAt: string;
  }): boolean {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE files SET
        current_name = ?,
        current_path = ?,
        relative_path = ?,
        client_id = ?,
        project_id = ?,
        year = ?,
        version_number = ?,
        status = ?,
        confidence_score = ?,
        organized_at = ?,
        updated_at = ?
      WHERE id = ?;
    `);

    const res = stmt.run(
      updates.currentName,
      updates.currentPath,
      updates.relativePath,
      updates.clientId || null,
      updates.projectId || null,
      updates.year || null,
      updates.versionNumber,
      updates.status,
      updates.confidenceScore,
      updates.organizedAt,
      now,
      id
    );

    return res.changes > 0;
  }

  private mapRow(row: any): FileRecordDTO {
    return {
      id: row.id,
      originalName: row.original_name,
      currentName: row.current_name,
      originalPath: row.original_path,
      currentPath: row.current_path,
      relativePath: row.relative_path,
      extension: row.extension,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
      sha256Hash: row.sha256_hash,
      clientId: row.client_id,
      projectId: row.project_id,
      categoryId: row.category_id,
      year: row.year ? Number(row.year) : null,
      versionNumber: Number(row.version_number),
      status: row.status as FileStatus,
      confidenceScore: Number(row.confidence_score),
      sourceApp: row.source_app,
      isArchived: Boolean(row.is_archived),
      organizedAt: row.organized_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
