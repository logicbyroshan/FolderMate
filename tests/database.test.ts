import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { DatabaseManager } from "../packages/database/src/index.js";

describe("DatabaseManager & Repositories", () => {
  let tempDbDir: string;
  let dbPath: string;
  let dbManager: DatabaseManager;

  beforeEach(() => {
    tempDbDir = fs.mkdtempSync(path.join(os.tmpdir(), "foldermate-db-test-"));
    dbPath = path.join(tempDbDir, "test.db");
    dbManager = new DatabaseManager({ path: dbPath });
    const migrationsDir = path.join(process.cwd(), "packages", "database", "src", "migrations");
    dbManager.runMigrations(migrationsDir);
  });

  afterEach(() => {
    dbManager.close();
    fs.rmSync(tempDbDir, { recursive: true, force: true });
  });

  it("should create and retrieve clients with aliases", () => {
    const client = dbManager.clients.create({
      name: "ABC School",
      code: "ABCSCH",
      aliases: ["ABC", "ABC-School", "ABCS"],
      notes: "Test school client",
      isActive: true,
    });

    expect(client.id).toBeDefined();
    expect(client.name).toBe("ABC School");
    expect(client.aliases).toEqual(["ABC", "ABC-School", "ABCS"]);

    const fetched = dbManager.clients.getById(client.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.code).toBe("ABCSCH");

    // Add new alias
    const added = dbManager.clients.addAlias(client.id, "ABC_Primary");
    expect(added).toBe(true);

    const updated = dbManager.clients.getById(client.id);
    expect(updated?.aliases).toContain("ABC_Primary");
  });

  it("should create and retrieve projects linked to clients", () => {
    const client = dbManager.clients.create({
      name: "XYZ Academy",
      code: "XYZACA",
      aliases: ["XYZ"],
      isActive: true,
    });

    const project = dbManager.projects.create({
      clientId: client.id,
      name: "ID Card",
      code: "IDC2026",
      category: "Identity",
      year: 2026,
      status: "active",
      metadata: { color: "blue", size: "CR80" },
    });

    expect(project.id).toBeDefined();
    expect(project.clientId).toBe(client.id);
    expect(project.name).toBe("ID Card");
    expect(project.year).toBe(2026);

    const clientProjects = dbManager.projects.listByClient(client.id);
    expect(clientProjects.length).toBe(1);
    expect(clientProjects[0].name).toBe("ID Card");
  });

  it("should create and query files with versions", () => {
    const client = dbManager.clients.create({
      name: "Global Print",
      code: "GLBPRT",
      aliases: [],
      isActive: true,
    });

    const project = dbManager.projects.create({
      clientId: client.id,
      name: "Flyer",
      year: 2026,
      status: "active",
    });

    const file = dbManager.files.create({
      originalName: "flyer final.cdr",
      currentName: "Global Print Flyer 2026 v1.cdr",
      originalPath: "C:\\FolderMate\\Inbox\\flyer final.cdr",
      currentPath: "D:\\Clients\\Global Print\\2026\\Flyer\\Global Print Flyer 2026 v1.cdr",
      relativePath: "Clients/Global Print/2026/Flyer/Global Print Flyer 2026 v1.cdr",
      extension: ".cdr",
      mimeType: "application/vnd.corel-draw",
      sizeBytes: 2048500,
      sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      clientId: client.id,
      projectId: project.id,
      year: 2026,
      versionNumber: 1,
      status: "organized",
      confidenceScore: 0.95,
      isArchived: false,
    });

    expect(file.id).toBeDefined();
    expect(file.versionNumber).toBe(1);

    // Create Version 1 record
    const v1 = dbManager.versions.create({
      fileId: file.id,
      versionNumber: 1,
      filePath: file.currentPath,
      sha256Hash: file.sha256Hash,
      sizeBytes: file.sizeBytes,
      createdBy: "auto_rule",
      isApproved: false,
      isLatest: true,
    });

    expect(v1.versionNumber).toBe(1);
    expect(v1.isLatest).toBe(true);

    // Create Version 2 record
    const v2 = dbManager.versions.create({
      fileId: file.id,
      versionNumber: 2,
      parentVersionId: v1.id,
      filePath: "D:\\Clients\\Global Print\\2026\\Flyer\\Global Print Flyer 2026 v2.cdr",
      sha256Hash: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      sizeBytes: 2050000,
      createdBy: "user",
      isApproved: true,
      isLatest: true,
    });

    expect(v2.versionNumber).toBe(2);
    expect(v2.isLatest).toBe(true);

    // Verify v1 is no longer latest
    const updatedV1 = dbManager.versions.getById(v1.id);
    expect(updatedV1?.isLatest).toBe(false);

    const latest = dbManager.versions.getLatestByFile(file.id);
    expect(latest?.versionNumber).toBe(2);
  });

  it("should perform instant FTS5 full-text search", () => {
    const client = dbManager.clients.create({
      name: "Starlight Academy",
      code: "STRACD",
      aliases: ["Starlight"],
      isActive: true,
    });

    const project = dbManager.projects.create({
      clientId: client.id,
      name: "Annual Brochure",
      year: 2026,
      status: "active",
    });

    dbManager.files.create({
      originalName: "brochure draft.pdf",
      currentName: "Starlight Academy Annual Brochure 2026 v1.pdf",
      originalPath: "C:\\FolderMate\\Inbox\\brochure draft.pdf",
      currentPath: "D:\\Clients\\Starlight Academy\\2026\\Brochure\\v1.pdf",
      relativePath: "Clients/Starlight Academy/2026/Brochure/v1.pdf",
      extension: ".pdf",
      mimeType: "application/pdf",
      sizeBytes: 500000,
      sha256Hash: "1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
      clientId: client.id,
      projectId: project.id,
      year: 2026,
      versionNumber: 1,
      status: "organized",
      confidenceScore: 0.98,
      isArchived: false,
    });

    // Search for "Starlight"
    const results = dbManager.search.search("Starlight");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].filename).toContain("Starlight Academy");

    // Search for "Brochure 2026"
    const results2 = dbManager.search.search("Brochure 2026");
    expect(results2.length).toBeGreaterThanOrEqual(1);
  });
});
