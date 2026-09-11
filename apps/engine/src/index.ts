import fs from "fs";
import { loadConfig } from "@foldermate/config";
import { DatabaseManager } from "@foldermate/database";
import { FilePipeline } from "./queue/file-pipeline.js";

async function main() {
  console.log("==========================================");
  console.log("   FolderMate Engine Daemon Initializing   ");
  console.log("==========================================");

  // 1. Load configuration
  const config = loadConfig();
  console.log(`[Engine] Loaded configuration. Organization Root: ${config.storage.organizationRoot}`);
  console.log(`[Engine] Inbox Path: ${config.ingestion.inboxPath}`);

  // Ensure directories exist
  if (!fs.existsSync(config.ingestion.inboxPath)) {
    fs.mkdirSync(config.ingestion.inboxPath, { recursive: true });
    console.log(`[Engine] Created Inbox directory: ${config.ingestion.inboxPath}`);
  }
  if (!fs.existsSync(config.storage.organizationRoot)) {
    fs.mkdirSync(config.storage.organizationRoot, { recursive: true });
    console.log(`[Engine] Created Storage Root: ${config.storage.organizationRoot}`);
  }

  // 2. Initialize Database & Migrations
  const db = new DatabaseManager();
  console.log("[Engine] Connected to SQLite database.");

  const appliedMigrations = db.runMigrations();
  if (appliedMigrations.length > 0) {
    console.log(`[Engine] Applied ${appliedMigrations.length} database migrations: ${appliedMigrations.join(", ")}`);
  } else {
    console.log("[Engine] Database schema is up to date.");
  }

  // 3. Start Pipeline
  const pipeline = new FilePipeline({ config, db });
  await pipeline.start();

  pipeline.on("started", ({ inboxPath }) => {
    console.log(`[Engine] Watcher active on: ${inboxPath}`);
  });

  pipeline.on("file-analyzed", (analysis) => {
    console.log(`[Engine] File Analyzed: ${analysis.filename} (Hash: ${analysis.sha256Hash.slice(0, 12)}...)`);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log("\n[Engine] Shutting down gracefully...");
    await pipeline.stop();
    db.close();
    console.log("[Engine] Shutdown complete. Goodbye.");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[Engine] Fatal startup error:", err);
  process.exit(1);
});
