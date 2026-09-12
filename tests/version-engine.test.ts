import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { DatabaseManager } from "../packages/database/src/index.js";
import { FolderMateConfigSchema } from "../packages/config/src/schema.js";
import { TwoPhaseMover } from "../apps/engine/src/organization/two-phase-mover.js";
import { VersionEngine } from "../apps/engine/src/versioning/version-engine.js";

describe("VersionEngine", () => {
  let tempDir: string;
  let inboxDir: string;
  let storageRoot: string;
  let dbManager: DatabaseManager;
  let versionEngine: VersionEngine;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "foldermate-version-test-"));
    inboxDir = path.join(tempDir, "Inbox");
    storageRoot = path.join(tempDir, "Clients");
    fs.mkdirSync(inboxDir, { recursive: true });
    fs.mkdirSync(storageRoot, { recursive: true });

    dbManager = new DatabaseManager({ path: path.join(tempDir, "test.db") });
    dbManager.runMigrations(path.join(process.cwd(), "packages", "database", "src", "migrations"));
    versionEngine = new VersionEngine(dbManager);
  });

  afterEach(() => {
    dbManager.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("maintains version lineage and restores historical versions safely", async () => {
    const config = FolderMateConfigSchema.parse({
      ingestion: { inboxPath: inboxDir },
      storage: { organizationRoot: storageRoot, safeMode: false },
    });

    const mover = new TwoPhaseMover(dbManager, config);

    // 1. Move Initial File v1
    const file1 = path.join(inboxDir, "v1.cdr");
    fs.writeFileSync(file1, "Version 1 Content");
    const res1 = await mover.executeMove({
      sourcePath: file1,
      clientName: "ABC School",
      projectName: "ID Card",
      year: 2026,
      versionNumber: 1,
    });

    // 2. Add Version 2 to same lineage
    const v2Path = path.join(storageRoot, "Clients", "ABC School", "2026", "ID Card", "ABC School ID Card 2026 v2.cdr");
    fs.writeFileSync(v2Path, "Version 2 Content");
    dbManager.versions.create({
      fileId: res1.fileId,
      versionNumber: 2,
      parentVersionId: res1.versionId,
      filePath: v2Path,
      sha256Hash: "hash_v2",
      sizeBytes: 100,
      isLatest: true,
      isApproved: false,
    });

    // Check lineage
    const lineage = versionEngine.getLineage(res1.fileId);
    expect(lineage.length).toBe(2);
    expect(lineage[0].versionNumber).toBe(1);
    expect(lineage[1].versionNumber).toBe(2);

    // 3. Restore Version 1
    const restoredV3 = await versionEngine.restoreVersion(res1.fileId, 1);
    expect(restoredV3.versionNumber).toBe(3);
    expect(restoredV3.changeSummary).toContain("Restored from version v1");
    expect(fs.existsSync(restoredV3.filePath)).toBe(true);

    const updatedLineage = versionEngine.getLineage(res1.fileId);
    expect(updatedLineage.length).toBe(3);
  });
});
