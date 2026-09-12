import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { DatabaseManager } from "../packages/database/src/index.js";
import { FolderMateConfigSchema } from "../packages/config/src/schema.js";
import { ReviewManager } from "../apps/engine/src/review/review-manager.js";

describe("ReviewManager", () => {
  let tempDir: string;
  let inboxDir: string;
  let storageRoot: string;
  let dbManager: DatabaseManager;
  let reviewManager: ReviewManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "foldermate-review-test-"));
    inboxDir = path.join(tempDir, "Inbox");
    storageRoot = path.join(tempDir, "Clients");
    fs.mkdirSync(inboxDir, { recursive: true });
    fs.mkdirSync(storageRoot, { recursive: true });

    dbManager = new DatabaseManager({ path: path.join(tempDir, "test.db") });
    dbManager.runMigrations(path.join(process.cwd(), "packages", "database", "src", "migrations"));

    const config = FolderMateConfigSchema.parse({
      ingestion: { inboxPath: inboxDir },
      storage: { organizationRoot: storageRoot, safeMode: false },
    });

    reviewManager = new ReviewManager(dbManager, config);
  });

  afterEach(() => {
    dbManager.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("enqueues ambiguous files and resolves them with adaptive alias learning", async () => {
    const client = dbManager.clients.create({
      name: "Sunrise Academy",
      code: "SUNACD",
      aliases: ["Sunrise"],
      isActive: true,
    });

    const project = dbManager.projects.create({
      clientId: client.id,
      name: "Brochure",
      year: 2026,
    });

    const unknownFile = path.join(inboxDir, "sunrise_special_brochure.cdr");
    fs.writeFileSync(unknownFile, "Test binary data for ambiguous file");

    // 1. Enqueue for review
    const item = await reviewManager.enqueueForReview({
      originalPath: unknownFile,
      proposedClientId: client.id,
      proposedProjectId: project.id,
      proposedYear: 2026,
      proposedVersion: 1,
      confidenceScore: 0.65,
      reasons: ["Partial match on 'sunrise'"],
    });

    expect(item.id).toBeDefined();
    expect(item.status).toBe("pending");

    const pendingList = dbManager.reviewQueue.listPending();
    expect(pendingList.length).toBe(1);

    // 2. Resolve Review Item with learnAlias = true
    const resolveResult = await reviewManager.resolveItem({
      reviewQueueId: item.id,
      clientId: client.id,
      projectId: project.id,
      year: 2026,
      versionNumber: 1,
      learnAlias: true,
    });

    expect(resolveResult.success).toBe(true);
    expect(fs.existsSync(resolveResult.finalPath)).toBe(true);

    // Verify Review Item status is resolved
    const updatedItem = dbManager.reviewQueue.getById(item.id);
    expect(updatedItem?.status).toBe("resolved");

    // Verify Adaptive Alias Learning
    const updatedClient = dbManager.clients.getById(client.id);
    expect(updatedClient?.aliases.length).toBeGreaterThan(1);
  });
});
