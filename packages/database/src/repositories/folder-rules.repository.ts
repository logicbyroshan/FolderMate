import crypto from "crypto";
import { IDatabase } from "../connection.js";

export interface FolderAppearanceRuleDTO {
  id: string;
  name: string;
  targetType: "CLIENT" | "PROJECT" | "CATEGORY" | "ARCHIVE" | "CUSTOM";
  matchCondition: Record<string, unknown>;
  color: string;
  iconResource?: string | null;
  iconIndex: number;
  infoTipTemplate?: string | null;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export class FolderRulesRepository {
  constructor(private db: IDatabase) {}

  public create(rule: Omit<FolderAppearanceRuleDTO, "id" | "createdAt" | "updatedAt"> & { id?: string }): FolderAppearanceRuleDTO {
    const id = rule.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const matchJson = JSON.stringify(rule.matchCondition || {});

    const stmt = this.db.prepare(`
      INSERT INTO folder_appearance_rules (
        id, name, target_type, match_condition_json, color, icon_resource,
        icon_index, info_tip_template, is_active, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      id,
      rule.name,
      rule.targetType,
      matchJson,
      rule.color || "amber",
      rule.iconResource || null,
      rule.iconIndex || 0,
      rule.infoTipTemplate || null,
      rule.isActive !== false ? 1 : 0,
      rule.priority || 100,
      now,
      now
    );

    return this.getById(id)!;
  }

  public getById(id: string): FolderAppearanceRuleDTO | null {
    const row = this.db.prepare("SELECT * FROM folder_appearance_rules WHERE id = ?;").get(id) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public listAll(activeOnly: boolean = false): FolderAppearanceRuleDTO[] {
    const sql = activeOnly
      ? "SELECT * FROM folder_appearance_rules WHERE is_active = 1 ORDER BY priority ASC, name ASC;"
      : "SELECT * FROM folder_appearance_rules ORDER BY priority ASC, name ASC;";
    const rows = this.db.prepare(sql).all() as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public listByTargetType(targetType: string): FolderAppearanceRuleDTO[] {
    const rows = this.db.prepare(
      "SELECT * FROM folder_appearance_rules WHERE target_type = ? AND is_active = 1 ORDER BY priority ASC;"
    ).all(targetType) as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public delete(id: string): boolean {
    const res = this.db.prepare("DELETE FROM folder_appearance_rules WHERE id = ?;").run(id);
    return res.changes > 0;
  }

  private mapRow(row: any): FolderAppearanceRuleDTO {
    let matchCondition = {};
    try {
      matchCondition = JSON.parse(row.match_condition_json || "{}");
    } catch {
      matchCondition = {};
    }

    return {
      id: row.id,
      name: row.name,
      targetType: row.target_type,
      matchCondition,
      color: row.color,
      iconResource: row.icon_resource,
      iconIndex: Number(row.icon_index || 0),
      infoTipTemplate: row.info_tip_template,
      isActive: Boolean(row.is_active),
      priority: Number(row.priority),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
