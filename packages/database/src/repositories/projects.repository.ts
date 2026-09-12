import crypto from "crypto";
import { ProjectDTO } from "@foldermate/shared";
import { IDatabase } from "../connection.js";

export class ProjectsRepository {
  constructor(private db: IDatabase) {}

  public create(project: Omit<ProjectDTO, "id" | "createdAt" | "updatedAt"> & { id?: string }): ProjectDTO {
    const id = project.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const metadataJson = JSON.stringify(project.metadata || {});

    const stmt = this.db.prepare(`
      INSERT INTO projects (id, client_id, name, code, category, year, status, metadata_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      id,
      project.clientId,
      project.name,
      project.code || null,
      project.category || "General",
      project.year,
      project.status || "active",
      metadataJson,
      now,
      now
    );

    return this.getById(id)!;
  }

  public getById(id: string): ProjectDTO | null {
    const row = this.db.prepare("SELECT * FROM projects WHERE id = ?;").get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public listByClient(clientId: string): ProjectDTO[] {
    const rows = this.db.prepare("SELECT * FROM projects WHERE client_id = ? ORDER BY year DESC, name ASC;").all(clientId) as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public listAll(): ProjectDTO[] {
    const rows = this.db.prepare("SELECT * FROM projects ORDER BY year DESC, name ASC;").all() as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public findByClientAndNameAndYear(clientId: string, name: string, year: number): ProjectDTO | null {
    const row = this.db.prepare(
      "SELECT * FROM projects WHERE client_id = ? AND name = ? COLLATE NOCASE AND year = ?;"
    ).get(clientId, name, year) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  private mapRow(row: any): ProjectDTO {
    let metadata = {};
    try {
      metadata = JSON.parse(row.metadata_json || "{}");
    } catch {
      metadata = {};
    }

    return {
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      code: row.code,
      category: row.category,
      year: row.year,
      status: row.status,
      metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
