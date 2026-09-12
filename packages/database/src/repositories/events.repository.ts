import crypto from "crypto";
import { EventType, FileEventDTO } from "@foldermate/shared";
import { IDatabase } from "../connection.js";

export class EventsRepository {
  constructor(private db: IDatabase) {}

  public record(event: {
    fileId?: string | null;
    eventType: EventType;
    oldState?: Record<string, unknown> | null;
    newState?: Record<string, unknown> | null;
    details?: string | null;
    durationMs?: number | null;
    errorMessage?: string | null;
  }): FileEventDTO {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO file_events (
        id, file_id, event_type, old_state_json, new_state_json, details,
        duration_ms, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    stmt.run(
      id,
      event.fileId || null,
      event.eventType,
      event.oldState ? JSON.stringify(event.oldState) : null,
      event.newState ? JSON.stringify(event.newState) : null,
      event.details || null,
      event.durationMs || null,
      event.errorMessage || null,
      now
    );

    return {
      id,
      fileId: event.fileId || null,
      eventType: event.eventType,
      oldState: event.oldState,
      newState: event.newState,
      details: event.details,
      durationMs: event.durationMs,
      errorMessage: event.errorMessage,
      createdAt: now,
    };
  }

  public listByFile(fileId: string): FileEventDTO[] {
    const rows = this.db.prepare("SELECT * FROM file_events WHERE file_id = ? ORDER BY created_at DESC;").all(fileId) as any[];
    return rows.map((r) => this.mapRow(r));
  }

  public listRecent(limit: number = 50): FileEventDTO[] {
    const rows = this.db.prepare("SELECT * FROM file_events ORDER BY created_at DESC LIMIT ?;").all(limit) as any[];
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: any): FileEventDTO {
    let oldState = null;
    let newState = null;
    try {
      if (row.old_state_json) oldState = JSON.parse(row.old_state_json);
      if (row.new_state_json) newState = JSON.parse(row.new_state_json);
    } catch {
      // ignore
    }

    return {
      id: row.id,
      fileId: row.file_id,
      eventType: row.event_type as EventType,
      oldState,
      newState,
      details: row.details,
      durationMs: row.duration_ms ? Number(row.duration_ms) : null,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    };
  }
}
