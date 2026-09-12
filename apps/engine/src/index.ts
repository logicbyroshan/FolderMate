import fs from "fs";
import { loadConfig } from "@foldermate/config";
import { DatabaseManager } from "@foldermate/database";
import { FilePipeline } from "./queue/file-pipeline.js";
import { AuthManager } from "./ipc/auth-manager.js";
import { IPCServer } from "./ipc/ipc-server.js";
import { dispatchRPCMethod, RPCContext } from "./ipc/rpc-dispatcher.js";
import { TwoPhaseMover } from "./organization/two-phase-mover.js";
import { VersionEngine } from "./versioning/version-engine.js";
import { ReviewManager } from "./review/review-manager.js";
import { CorelDrawAdapter } from "./integrations/coreldraw-adapter.js";
import { ClassificationPipeline } from "./classification/classification-pipeline.js";

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
  console.log("[Engine] Connected to SQLite database (WAL mode).");

  const appliedMigrations = db.runMigrations();
  if (appliedMigrations.length > 0) {
    console.log(`[Engine] Applied ${appliedMigrations.length} database migrations: ${appliedMigrations.join(", ")}`);
  } else {
    console.log("[Engine] Database schema is up to date.");
  }

  // 3. Initialize Auth Token for Win32 Named Pipe IPC
  const authManager = new AuthManager();
  authManager.initializeToken();
  console.log("[Engine] Initialized 256-bit IPC authentication token.");

  // 4. Initialize Domain Subsystems for RPC Dispatcher
  const mover = new TwoPhaseMover(db, config);
  const versionEngine = new VersionEngine(db.db, db.files, db.versions, db.events);
  const reviewManager = new ReviewManager(db, config);
  const corelAdapter = new CorelDrawAdapter();
  const classifier = new ClassificationPipeline(db);

  // 5. Initialize & Start Named Pipe IPC Server
  const ipcServer = new IPCServer(authManager);

  const rpcContext: RPCContext = {
    db,
    config,
    mover,
    versionEngine,
    reviewManager,
    corelAdapter,
    classifier,
  };

  ipcServer.setRequestHandler(async (method, params) => {
    return await dispatchRPCMethod(method, params, rpcContext);
  });

  await ipcServer.start();
  console.log("[Engine] Win32 Named Pipe IPC Server listening at \\\\.\\pipe\\foldermate-ipc");

  // 6. Start File Ingestion Pipeline
  const pipeline = new FilePipeline({ config, db, ipcServer });
  await pipeline.start();

  pipeline.on("started", ({ inboxPath }) => {
    console.log(`[Engine] File Watcher active on: ${inboxPath}`);
  });

  pipeline.on("file-organized", (result) => {
    console.log(`[Engine] Organized: ${result.filename} -> ${result.finalPath} (v${result.versionNumber})`);
  });

  pipeline.on("review-required", (item) => {
    console.log(`[Engine] Low confidence, queued for review: ${item.originalName} (Score: ${Math.round(item.confidenceScore * 100)}%)`);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log("\n[Engine] Shutting down gracefully...");
    await pipeline.stop();
    await ipcServer.stop();
    corelAdapter.dispose();
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
