import crypto from "crypto";
import { IDatabase } from "../connection.js";

export interface OrganizationRuleDTO {
  id: string;
  name: string;
  priority: number;
  isActive: boolean;
  condition: Record<string, any>;
  folderTemplateId?: string | null;
  namingTemplateId?: string | null;
  autoOrganizeThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export class RulesRepository {
  constructor(private db: IDatabase) {}

  public create(rule: Omit<OrganizationRuleDTO, "id" | "createdAt" | "updatedAt"> & { id?: string }): OrganizationRuleDTO {
    const id = rule.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO organization_rules (
        id, name, priority, is_active, condition_json, folder_template_id,
        naming_template_id, auto_organize_threshold, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      id,
      rule.name,
      rule.priority || 100,
      rule.isActive ? 1 : 0,
      JSON.stringify(rule.condition || {}),
      rule.folderTemplateId || null,
      rule.namingTemplateId || null,
      rule.autoOrganizeThreshold ?? 0.85,
      now,
      now
    );

    return this.getById(id)!;
  }

  public getById(id: string): OrganizationRuleDTO | null {
    const row = this.db.prepare("SELECT * FROM organization_rules WHERE id = ?;").get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public listActive(): OrganizationRuleDTO[] {
    const rows = this.db.prepare("SELECT * FROM organization_rules WHERE is_active = 1 ORDER BY priority ASC;").all() as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public listAll(): OrganizationRuleDTO[] {
    const rows = this.db.prepare("SELECT * FROM organization_rules ORDER BY priority ASC;").all() as any[];
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: any): OrganizationRuleDTO {
    let condition = {};
    try {
      condition = JSON.parse(row.condition_json || "{}");
    } catch {
      condition = {};
    }

    return {
      id: row.id,
      name: row.name,
      priority: Number(row.priority),
      isActive: Boolean(row.is_active),
      condition,
      folderTemplateId: row.folder_template_id,
      namingTemplateId: row.naming_template_id,
      autoOrganizeThreshold: Number(row.auto_organize_threshold),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
