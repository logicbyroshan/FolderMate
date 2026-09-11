import { Database as DatabaseType } from "better-sqlite3";
import crypto from "crypto";
import { ReviewQueueItemDTO, ReviewQueueStatus } from "@foldermate/shared";

export class ReviewQueueRepository {
  constructor(private db: DatabaseType) {}

  public create(item: Omit<ReviewQueueItemDTO, "id" | "createdAt" | "resolvedAt"> & { id?: string }): ReviewQueueItemDTO {
    const id = item.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const reasonsJson = JSON.stringify(item.reasons || []);

    const stmt = this.db.prepare(`
      INSERT INTO review_queue (
        id, file_id, original_path, proposed_client_id, proposed_project_id,
        proposed_year, proposed_version, proposed_target_path, confidence_score,
        reasons_json, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      item.fileId || null,
      item.originalPath,
      item.proposedClientId || null,
      item.proposedProjectId || null,
      item.proposedYear || null,
      item.proposedVersion || 1,
      item.proposedTargetPath || null,
      item.confidenceScore,
      reasonsJson,
      item.status || "pending",
      now
    );

    return this.getById(id)!;
  }

  public getById(id: string): ReviewQueueItemDTO | null {
    const query = `
      SELECT rq.*, c.name as client_name, p.name as project_name
      FROM review_queue rq
      LEFT JOIN clients c ON rq.proposed_client_id = c.id
      LEFT JOIN projects p ON rq.proposed_project_id = p.id
      WHERE rq.id = ?
    `;
    const row = this.db.prepare(query).get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public listPending(): ReviewQueueItemDTO[] {
    const query = `
      SELECT rq.*, c.name as client_name, p.name as project_name
      FROM review_queue rq
      LEFT JOIN clients c ON rq.proposed_client_id = c.id
      LEFT JOIN projects p ON rq.proposed_project_id = p.id
      WHERE rq.status = 'pending'
      ORDER BY rq.created_at DESC
    `;
    const rows = this.db.prepare(query).all() as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public resolve(id: string, status: ReviewQueueStatus = "resolved"): boolean {
    const now = new Date().toISOString();
    const result = this.db.prepare("UPDATE review_queue SET status = ?, resolved_at = ? WHERE id = ?").run(status, now, id);
    return result.changes > 0;
  }

  private mapRow(row: any): ReviewQueueItemDTO {
    let reasons: string[] = [];
    try {
      reasons = JSON.parse(row.reasons_json || "[]");
    } catch {
      reasons = [];
    }

    const path = require("path");
    const originalName = path.basename(row.original_path);

    return {
      id: row.id,
      fileId: row.file_id,
      originalPath: row.original_path,
      originalName,
      proposedClientId: row.proposed_client_id,
      proposedClientName: row.client_name || null,
      proposedProjectId: row.proposed_project_id,
      proposedProjectName: row.project_name || null,
      proposedYear: row.proposed_year,
      proposedVersion: row.proposed_version,
      proposedTargetPath: row.proposed_target_path,
      confidenceScore: row.confidence_score,
      reasons,
      status: row.status as ReviewQueueStatus,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    };
  }
}
