import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import {
  DatabaseManager,
  ClientsRepository,
  ProjectsRepository,
  FilesRepository,
  VersionsRepository,
  SearchRepository,
  ReviewQueueRepository,
  EventsRepository,
} from "@foldermate/database";
import { DEFAULT_CONFIG, FolderMateConfig } from "@foldermate/config";
import { waitForFileStability } from "../apps/engine/src/watcher/lock-detector.js";
import { ClassificationPipeline } from "../apps/engine/src/classification/classification-pipeline.js";
import { TwoPhaseMover } from "../apps/engine/src/organization/two-phase-mover.js";
import { VersionEngine } from "../apps/engine/src/versioning/version-engine.js";
import { ReviewManager } from "../apps/engine/src/review/review-manager.js";

describe("FolderMate End-to-End Workflow & Pipeline Simulation", () => {
  let testRoot: string;
  let inboxDir: string;
  let storageRoot: string;
  let stagingDir: string;
  let dbPath: string;
  let dbManager: DatabaseManager;
  let config: FolderMateConfig;

  let clientsRepo: ClientsRepository;
  let projectsRepo: ProjectsRepository;
  let filesRepo: FilesRepository;
  let versionsRepo: VersionsRepository;
  let searchRepo: SearchRepository;
  let reviewRepo: ReviewQueueRepository;
  let eventsRepo: EventsRepository;

  let classificationPipeline: ClassificationPipeline;
  let twoPhaseMover: TwoPhaseMover;
  let versionEngine: VersionEngine;
  let reviewManager: ReviewManager;

  beforeEach(() => {
    testRoot = fs.mkdtempSync(path.join(os.tmpdir(), "foldermate-e2e-"));
    inboxDir = path.join(testRoot, "Inbox");
    storageRoot = path.join(testRoot, "OrganizedFiles");
    stagingDir = path.join(storageRoot, ".foldermate_staging");
    dbPath = path.join(testRoot, "foldermate.db");

    fs.mkdirSync(inboxDir, { recursive: true });
    fs.mkdirSync(storageRoot, { recursive: true });
    fs.mkdirSync(stagingDir, { recursive: true });

    config = {
      ...DEFAULT_CONFIG,
      storage: {
        ...DEFAULT_CONFIG.storage,
        inboxPath: inboxDir,
        organizationRoot: storageRoot,
        safeMode: false,
      },
    };

    dbManager = new DatabaseManager({ dbPath });
    dbManager.runMigrations();

    const db = dbManager.db;
    clientsRepo = dbManager.clients;
    projectsRepo = dbManager.projects;
    filesRepo = dbManager.files;
    versionsRepo = dbManager.versions;
    searchRepo = dbManager.search;
    reviewRepo = dbManager.reviewQueue;
    eventsRepo = dbManager.events;

    classificationPipeline = new ClassificationPipeline(dbManager);
    twoPhaseMover = new TwoPhaseMover(dbManager, config);
    versionEngine = new VersionEngine(db, filesRepo, versionsRepo, eventsRepo);
    reviewManager = new ReviewManager(dbManager, config);
  });

  afterEach(() => {
    dbManager.close();
    try {
      fs.rmSync(testRoot, { recursive: true, force: true });
    } catch {}
  });

  it("completes full autonomous file organization, versioning, search indexing, and audit logging", async () => {
    // 1. Setup Client & Project in database
    const client = clientsRepo.create({
      name: "Apex International School",
      code: "AIS",
      aliases: ["Apex", "AIS"],
      notes: "VIP Client",
      isActive: true,
    });

    const project = projectsRepo.create({
      clientId: client.id,
      name: "ID Cards",
      code: "IDC",
      category: "Design",
      year: 2026,
      status: "active",
    });

    expect(client.id).toBeDefined();
    expect(project.id).toBeDefined();

    // 2. Simulate User saving CorelDRAW CDR file to Inbox
    const originalFilename = "Apex_ID_Card_Design_v1.cdr";
    const inboxFile = path.join(inboxDir, originalFilename);
    const mockContentV1 = Buffer.from("PK\x03\x04Mock CorelDRAW 2024 CDR File Content v1 - Apex International");
    fs.writeFileSync(inboxFile, mockContentV1);

    // 3. File Stability Check (Lock & Size stability verification)
    const stability = await waitForFileStability(inboxFile, 50, 2000);
    expect(stability.isStable).toBe(true);
    expect(stability.sizeBytes).toBe(mockContentV1.length);

    // 4. Multi-tier Classification Pipeline
    const classification = await classificationPipeline.classifyFile(inboxFile);

    expect(classification.clientId).toBe(client.id);
    expect(classification.projectId).toBe(project.id);
    expect(classification.versionNumber).toBe(1);
    expect(classification.year).toBe(2026);
    expect(classification.categoryName).toBe("Design");
    expect(classification.confidence.compositeScore).toBeGreaterThanOrEqual(0.85);

    // 5. Two-Phase Safe File Move & Atomic Rename
    const moveResult = await twoPhaseMover.executeMove({
      sourcePath: inboxFile,
      clientId: client.id,
      clientName: client.name,
      projectId: project.id,
      projectName: project.name,
      categoryName: classification.categoryName,
      year: classification.year,
      versionNumber: classification.versionNumber,
      confidenceScore: classification.confidence.compositeScore,
    });

    expect(moveResult.success).toBe(true);
    expect(fs.existsSync(inboxFile)).toBe(false); // Cleaned from Inbox
    expect(fs.existsSync(moveResult.finalPath)).toBe(true); // Moved to organized path
    expect(fs.readFileSync(moveResult.finalPath).equals(mockContentV1)).toBe(true); // Content verified

    // 6. Full-Text Search Verification (FTS5 indexed)
    const searchResults = searchRepo.search({
      query: "Apex ID Cards",
      limit: 10,
    });

    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults[0].clientName).toBe("Apex International School");
    expect(searchResults[0].version).toBe(1);

    // 7. Version Progression: User drops revision v2
    const revisionFilename = "Apex_ID_Card_Design_v2.cdr";
    const inboxFileV2 = path.join(inboxDir, revisionFilename);
    const mockContentV2 = Buffer.from("PK\x03\x04Mock CorelDRAW 2024 CDR File Content v2 - Updated Color Theme");
    fs.writeFileSync(inboxFileV2, mockContentV2);

    const classificationV2 = await classificationPipeline.classifyFile(inboxFileV2);
    expect(classificationV2.versionNumber).toBe(2);

    const moveResultV2 = await twoPhaseMover.executeMove({
      sourcePath: inboxFileV2,
      clientId: client.id,
      clientName: client.name,
      projectId: project.id,
      projectName: project.name,
      categoryName: classificationV2.categoryName,
      year: classificationV2.year,
      versionNumber: classificationV2.versionNumber,
      confidenceScore: classificationV2.confidence.compositeScore,
    });

    expect(moveResultV2.success).toBe(true);
    expect(fs.existsSync(moveResultV2.finalPath)).toBe(true);

    // 8. Version Lineage & History in Database
    const fileRecord = filesRepo.getById(moveResult.fileId);
    expect(fileRecord).toBeDefined();

    const versionHistory = versionsRepo.listByFile(moveResult.fileId);
    expect(versionHistory.length).toBeGreaterThanOrEqual(1);

    // 9. Audit Events Trail
    const events = eventsRepo.listRecent(20);
    expect(events.length).toBeGreaterThanOrEqual(2);
    const eventTypes = events.map((e) => e.eventType);
    expect(eventTypes).toContain("FILE_ORGANIZED");
  });

  it("handles ambiguous files with Review Queue and adaptive alias learning", async () => {
    // 1. Create registered client
    const client = clientsRepo.create({
      name: "Starlight Academy",
      code: "SLA",
      aliases: ["Starlight"],
      notes: "School Client",
      isActive: true,
    });

    const project = projectsRepo.create({
      clientId: client.id,
      name: "Brochures",
      code: "BRC",
      category: "Marketing",
      year: 2026,
      status: "active",
    });

    // 2. Ambiguous file saved to Inbox
    const ambiguousFilename = "STA_Unknown_Flyer_Design.cdr";
    const inboxFile = path.join(inboxDir, ambiguousFilename);
    fs.writeFileSync(inboxFile, Buffer.from("Mock Content for Unknown Flyer"));

    const classification = await classificationPipeline.classifyFile(inboxFile);

    // Score is low because "STA" is an unrecognized abbreviation
    expect(classification.confidence.compositeScore).toBeLessThan(0.75);

    // 3. Enqueue to Review Queue
    const reviewItem = await reviewManager.enqueueForReview({
      originalPath: inboxFile,
      proposedClientId: classification.clientId,
      proposedProjectId: classification.projectId,
      proposedYear: classification.year,
      proposedVersion: classification.versionNumber,
      confidenceScore: classification.confidence.compositeScore,
      reasons: classification.confidence.reasons,
    });

    expect(reviewItem.status).toBe("pending");

    // 4. User reviews and resolves with adaptive alias learning
    const resolution = await reviewManager.resolveItem({
      reviewQueueId: reviewItem.id,
      clientId: client.id,
      projectId: project.id,
      createNewAlias: "STA",
    });

    expect(resolution.success).toBe(true);
    expect(fs.existsSync(resolution.finalPath)).toBe(true);

    // 5. Verify that client record now has "STA" in aliases
    const updatedClient = clientsRepo.getById(client.id);
    expect(updatedClient?.aliases).toContain("STA");

    // 6. Test subsequent file with the new alias -> now automatically classifies with high confidence!
    const subsequentFile = "STA_Brochures_2026_v1.pdf";
    const inboxSubsequent = path.join(inboxDir, subsequentFile);
    fs.writeFileSync(inboxSubsequent, Buffer.from("PDF Content for Brochures"));

    const subsequentClassification = await classificationPipeline.classifyFile(inboxSubsequent);

    expect(subsequentClassification.clientId).toBe(client.id);
    expect(subsequentClassification.projectId).toBe(project.id);
    expect(subsequentClassification.confidence.compositeScore).toBeGreaterThanOrEqual(0.75);
  });
});
