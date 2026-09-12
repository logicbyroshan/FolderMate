import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { DatabaseManager } from "../packages/database/src/index.js";
import { FolderMateConfigSchema } from "../packages/config/src/schema.js";
import { TwoPhaseMover } from "../apps/engine/src/organization/two-phase-mover.js";

describe("TwoPhaseMover", () => {
  let tempDir: string;
  let inboxDir: string;
  let storageRoot: string;
  let dbManager: DatabaseManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "foldermate-mover-test-"));
    inboxDir = path.join(tempDir, "Inbox");
    storageRoot = path.join(tempDir, "Clients");
    fs.mkdirSync(inboxDir, { recursive: true });
    fs.mkdirSync(storageRoot, { recursive: true });

    dbManager = new DatabaseManager({ path: path.join(tempDir, "test.db") });
    dbManager.runMigrations(path.join(process.cwd(), "packages", "database", "src", "migrations"));
  });

  afterEach(() => {
    dbManager.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("stages, verifies hash, and atomically moves file into structured folders", async () => {
    const config = FolderMateConfigSchema.parse({
      ingestion: { inboxPath: inboxDir },
      storage: { organizationRoot: storageRoot, safeMode: true },
    });

    const client = dbManager.clients.create({
      name: "ABC School",
      code: "ABCSCH",
      aliases: ["ABC"],
      isActive: true,
    });

    const project = dbManager.projects.create({
      clientId: client.id,
      name: "ID Card",
      year: 2026,
    });

    const sourceFile = path.join(inboxDir, "abc id card final.cdr");
    const testContent = Buffer.from("CorelDRAW binary payload stream for testing");
    fs.writeFileSync(sourceFile, testContent);

    const mover = new TwoPhaseMover(dbManager, config);
    const result = await mover.executeMove({
      sourcePath: sourceFile,
      clientId: client.id,
      clientName: client.name,
      projectId: project.id,
      projectName: project.name,
      year: 2026,
      versionNumber: 8,
    });

    expect(result.success).toBe(true);
    expect(result.finalFilename).toBe("ABC School ID Card 2026 v8.cdr");
    expect(fs.existsSync(result.finalPath)).toBe(true);

    // Verify database records
    const fileRow = dbManager.files.getById(result.fileId);
    expect(fileRow).not.toBeNull();
    expect(fileRow?.versionNumber).toBe(8);
    expect(fileRow?.currentName).toBe("ABC School ID Card 2026 v8.cdr");

    // In Safe Mode, original in Inbox moved to _Archived
    expect(fs.existsSync(sourceFile)).toBe(false);
    expect(fs.existsSync(path.join(inboxDir, "_Archived"))).toBe(true);
  });

  it("auto-increments version on collision if file content differs", async () => {
    const config = FolderMateConfigSchema.parse({
      ingestion: { inboxPath: inboxDir },
      storage: { organizationRoot: storageRoot, safeMode: false, collisionPolicy: "AUTO_INCREMENT" },
    });

    const mover = new TwoPhaseMover(dbManager, config);

    // Create existing file at destination
    const targetFolder = path.join(storageRoot, "Clients", "ABC School", "2026", "ID Card");
    fs.mkdirSync(targetFolder, { recursive: true });
    const existingFile = path.join(targetFolder, "ABC School ID Card 2026 v1.cdr");
    fs.writeFileSync(existingFile, "Original Version 1 Content");

    // Attempt to move new file with different content as v1
    const newSource = path.join(inboxDir, "new_design.cdr");
    fs.writeFileSync(newSource, "Different Updated Content for v2");

    const result = await mover.executeMove({
      sourcePath: newSource,
      clientName: "ABC School",
      projectName: "ID Card",
      year: 2026,
      versionNumber: 1,
    });

    expect(result.success).toBe(true);
    expect(result.versionNumber).toBe(2);
    expect(result.finalFilename).toBe("ABC School ID Card 2026 v2.cdr");
    expect(fs.existsSync(result.finalPath)).toBe(true);
    expect(fs.existsSync(existingFile)).toBe(true); // Original v1 preserved
  });
});
