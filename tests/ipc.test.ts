import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { DatabaseManager } from "../packages/database/src/index.js";
import { FolderMateConfigSchema } from "../packages/config/src/schema.js";
import { AuthManager } from "../apps/engine/src/ipc/auth-manager.js";
import { IPCServer } from "../apps/engine/src/ipc/ipc-server.js";
import { FolderMateIPCClient } from "../packages/shared/src/ipc-client.js";
import { TwoPhaseMover } from "../apps/engine/src/organization/two-phase-mover.js";
import { VersionEngine } from "../apps/engine/src/versioning/version-engine.js";
import { ReviewManager } from "../apps/engine/src/review/review-manager.js";
import { CorelDrawAdapter } from "../apps/engine/src/integrations/coreldraw-adapter.js";
import { ClassificationPipeline } from "../apps/engine/src/classification/classification-pipeline.js";

describe("IPC Subsystem", () => {
  let tempDir: string;
  let testPipePath: string;
  let dbManager: DatabaseManager;
  let authManager: AuthManager;
  let server: IPCServer;
  let client: FolderMateIPCClient;
  let token: string;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "foldermate-ipc-test-"));
    testPipePath = process.platform === "win32"
      ? `\\\\.\\pipe\\foldermate-test-pipe-${Date.now()}`
      : path.join(tempDir, "test.sock");

    dbManager = new DatabaseManager({ path: path.join(tempDir, "test.db") });
    dbManager.runMigrations(path.join(process.cwd(), "packages", "database", "src", "migrations"));

    const config = FolderMateConfigSchema.parse({
      ingestion: { inboxPath: path.join(tempDir, "Inbox") },
      storage: { organizationRoot: path.join(tempDir, "Clients") },
    });

    authManager = new AuthManager(tempDir);
    token = authManager.initializeToken();

    const mover = new TwoPhaseMover(dbManager, config);
    const versionEngine = new VersionEngine(dbManager);
    const reviewManager = new ReviewManager(dbManager, config);
    const corelAdapter = new CorelDrawAdapter();
    const classifier = new ClassificationPipeline(dbManager);

    server = new IPCServer({
      pipePath: testPipePath,
      authManager,
      rpcContext: {
        db: dbManager,
        config,
        mover,
        versionEngine,
        reviewManager,
        corelAdapter,
        classifier,
      },
    });

    await server.start();
    client = new FolderMateIPCClient(testPipePath);
  });

  afterEach(async () => {
    client.disconnect();
    await server.stop();
    dbManager.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("authenticates via handshake and executes system.getStatus", async () => {
    const handshakeResult = await client.connect(token);
    expect(handshakeResult.authenticated).toBe(true);

    const status = await client.call("system.getStatus");
    expect(status.status).toBe("running");
    expect(status.organizationRoot).toBeDefined();
  });

  it("rejects connection with invalid auth token", async () => {
    const badClient = new FolderMateIPCClient(testPipePath);
    await expect(badClient.connect("invalid_token_12345")).rejects.toThrow();
    badClient.disconnect();
  });

  it("handles CRUD operations over IPC", async () => {
    await client.connect(token);

    // Create client
    const newClient = await client.call("clients.create", {
      name: "Acme Graphics",
      code: "ACME",
      aliases: ["Acme"],
      isActive: true,
    });
    expect(newClient.name).toBe("Acme Graphics");

    // List clients
    const clients = await client.call("clients.list");
    expect(clients.length).toBe(1);
    expect(clients[0].code).toBe("ACME");
  });

  it("broadcasts server-sent events to connected clients", async () => {
    await client.connect(token);

    const eventReceivedPromise = new Promise<any>((resolve) => {
      client.on("event:FILE_ORGANIZED", (payload) => {
        resolve(payload);
      });
    });

    server.broadcastEvent("FILE_ORGANIZED", {
      fileId: "test-123",
      filename: "test.cdr",
      version: 2,
    });

    const payload = await eventReceivedPromise;
    expect(payload.fileId).toBe("test-123");
    expect(payload.version).toBe(2);
  });
});
