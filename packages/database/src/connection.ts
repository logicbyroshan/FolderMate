import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { getAppDataDir } from "@foldermate/config";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite");

export interface DatabaseOptions {
  path?: string;
  dbPath?: string;
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
  private transactionDepth: number = 0;

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
    const sanitize = (params: any[]) =>
      params.map((p) => (p === undefined ? null : p));

    return {
      all: (...params: any[]) => stmt.all(...sanitize(params)),
      get: (...params: any[]) => stmt.get(...sanitize(params)),
      run: (...params: any[]) => stmt.run(...sanitize(params)),
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
      const isOuter = this.transactionDepth === 0;
      const savepointName = `sp_${this.transactionDepth}`;

      if (isOuter) {
        this.rawDb.exec("BEGIN IMMEDIATE;");
      } else {
        this.rawDb.exec(`SAVEPOINT ${savepointName};`);
      }

      this.transactionDepth++;

      try {
        const result = fn(...args);
        this.transactionDepth--;

        if (isOuter) {
          this.rawDb.exec("COMMIT;");
        } else {
          this.rawDb.exec(`RELEASE ${savepointName};`);
        }

        return result;
      } catch (err) {
        this.transactionDepth--;

        try {
          if (isOuter) {
            this.rawDb.exec("ROLLBACK;");
          } else {
            this.rawDb.exec(`ROLLBACK TO ${savepointName};`);
          }
        } catch {
          // ignore rollback error
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
  const dbPath = options.path || options.dbPath || getDatabasePath();
  return new SQLiteDatabaseWrapper(dbPath, options);
}
