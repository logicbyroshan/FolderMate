import { Database as DatabaseType } from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export function runMigrations(db: DatabaseType, customMigrationsDir?: string): string[] {
  // Ensure schema_migrations exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const appliedRows = db.prepare("SELECT id FROM schema_migrations").all() as { id: string }[];
  const appliedSet = new Set(appliedRows.map((r) => r.id));

  let migrationsDir = customMigrationsDir;
  if (!migrationsDir) {
    // Resolve relative to current module or project
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      migrationsDir = currentDir;
    } catch {
      migrationsDir = path.join(process.cwd(), "packages", "database", "src", "migrations");
    }
  }

  if (!fs.existsSync(migrationsDir)) {
    // Fallback search
    migrationsDir = path.join(__dirname, "migrations");
  }

  const appliedNow: string[] = [];

  if (fs.existsSync(migrationsDir)) {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (!appliedSet.has(file)) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf-8");

        const tx = db.transaction(() => {
          db.exec(sql);
          db.prepare("INSERT INTO schema_migrations (id) VALUES (?)").run(file);
        });

        tx();
        appliedNow.push(file);
      }
    }
  }

  return appliedNow;
}
