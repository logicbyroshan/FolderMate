import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { getAppDataDir } from "@foldermate/config";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite");

export interface DatabaseOptions {
  path?: string;
  readonly?: boolean;
  fileMustExist?: boolean;
}

export interface StatementWrapper {
  all(...params: any[]): any[];
  get(...params: any[]): any | undefined;
  run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
}

export interface IDatabase {
  exec(sql: string): void;
  prepare(sql: string): StatementWrapper;
  pragma(pragmaSql: string): any;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  close(): void;
}

export class SQLiteDatabaseWrapper implements IDatabase {
  private rawDb: any;

  constructor(dbPath: string, _options: DatabaseOptions = {}) {
    this.rawDb = new DatabaseSync(dbPath);

    try {
      this.rawDb.exec("PRAGMA journal_mode = WAL;");
      this.rawDb.exec("PRAGMA synchronous = NORMAL;");
      this.rawDb.exec("PRAGMA foreign_keys = ON;");
      this.rawDb.exec("PRAGMA temp_store = MEMORY;");
      this.rawDb.exec("PRAGMA busy_timeout = 5000;");
    } catch (err) {
      console.warn("[Database] Notice on initial PRAGMAs:", err);
    }
  }

  public exec(sql: string): void {
    this.rawDb.exec(sql);
  }

  public prepare(sql: string): StatementWrapper {
    const stmt = this.rawDb.prepare(sql);
    return {
      all: (...params: any[]) => stmt.all(...params),
      get: (...params: any[]) => stmt.get(...params),
      run: (...params: any[]) => stmt.run(...params),
    };
  }

  public pragma(pragmaSql: string): any {
    try {
      return this.rawDb.exec(`PRAGMA ${pragmaSql};`);
    } catch {
      return null;
    }
  }

  public transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      this.rawDb.exec("BEGIN IMMEDIATE;");
      try {
        const result = fn(...args);
        this.rawDb.exec("COMMIT;");
        return result;
      } catch (err) {
        try {
          this.rawDb.exec("ROLLBACK;");
        } catch {
          // Ignore rollback errors
        }
        throw err;
      }
    }) as T;
  }

  public close(): void {
    this.rawDb.close();
  }
}

export function getDatabasePath(): string {
  const dbDir = getAppDataDir();
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, "foldermate.db");
}

export function createDatabaseConnection(options: DatabaseOptions = {}): IDatabase {
  const dbPath = options.path || getDatabasePath();
  return new SQLiteDatabaseWrapper(dbPath, options);
}
