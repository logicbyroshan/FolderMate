import Database, { Database as DatabaseType } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { getAppDataDir } from "@foldermate/config";

export interface DatabaseOptions {
  path?: string;
  readonly?: boolean;
  fileMustExist?: boolean;
}

export function getDatabasePath(): string {
  const dbDir = getAppDataDir();
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, "foldermate.db");
}

export function createDatabaseConnection(options: DatabaseOptions = {}): DatabaseType {
  const dbPath = options.path || getDatabasePath();

  const db = new Database(dbPath, {
    readonly: options.readonly || false,
    fileMustExist: options.fileMustExist || false,
  });

  // Apply high-reliability performance PRAGMAs
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  db.pragma("cache_size = -64000"); // 64MB cache
  db.pragma("temp_store = MEMORY");
  db.pragma("mmap_size = 268435456"); // 256MB memory map
  db.pragma("busy_timeout = 5000");

  return db;
}
