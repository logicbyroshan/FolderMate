import crypto from "crypto";
import { ClientDTO } from "@foldermate/shared";
import { IDatabase } from "../connection.js";

export class ClientsRepository {
  constructor(private db: IDatabase) {}

  public create(client: Omit<ClientDTO, "id" | "createdAt" | "updatedAt"> & { id?: string }): ClientDTO {
    const id = client.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const aliasesJson = JSON.stringify(client.aliases || []);
    const code = client.code || client.name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8).toUpperCase() || id.substring(0, 8).toUpperCase();

    const stmt = this.db.prepare(`
      INSERT INTO clients (id, name, code, aliases_json, notes, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      id,
      client.name,
      code,
      aliasesJson,
      client.notes || null,
      client.isActive !== false ? 1 : 0,
      now,
      now
    );

    return this.getById(id)!;
  }

  public getById(id: string): ClientDTO | null {
    const row = this.db.prepare("SELECT * FROM clients WHERE id = ?;").get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public getByName(name: string): ClientDTO | null {
    const row = this.db.prepare("SELECT * FROM clients WHERE name = ? COLLATE NOCASE;").get(name) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public list(activeOnly: boolean = true): ClientDTO[] {
    const sql = activeOnly
      ? "SELECT * FROM clients WHERE is_active = 1 ORDER BY name ASC;"
      : "SELECT * FROM clients ORDER BY name ASC;";
    const rows = this.db.prepare(sql).all() as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public addAlias(clientId: string, newAlias: string): boolean {
    const client = this.getById(clientId);
    if (!client) return false;

    const trimmed = newAlias.trim();
    if (!client.aliases.includes(trimmed)) {
      client.aliases.push(trimmed);
      const now = new Date().toISOString();
      this.db.prepare("UPDATE clients SET aliases_json = ?, updated_at = ? WHERE id = ?;").run(
        JSON.stringify(client.aliases),
        now,
        clientId
      );
      return true;
    }
    return false;
  }

  private mapRow(row: any): ClientDTO {
    let aliases: string[] = [];
    try {
      aliases = JSON.parse(row.aliases_json || "[]");
    } catch {
      aliases = [];
    }

    return {
      id: row.id,
      name: row.name,
      code: row.code,
      aliases,
      notes: row.notes,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
