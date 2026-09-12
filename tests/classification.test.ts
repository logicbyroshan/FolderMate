import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { DatabaseManager } from "../packages/database/src/index.js";
import { parseVersionFromFilename } from "../apps/engine/src/classification/version-parser.js";
import { extractTemporalInfo } from "../apps/engine/src/classification/temporal-extractor.js";
import { levenshteinDistance, findBestDictionaryMatch } from "../apps/engine/src/classification/fuzzy-matcher.js";
import { evaluateConfidence } from "../apps/engine/src/classification/confidence-scorer.js";
import { ClassificationPipeline } from "../apps/engine/src/classification/classification-pipeline.js";

describe("Classification Subsystem", () => {
  let tempDbDir: string;
  let dbManager: DatabaseManager;

  beforeEach(() => {
    tempDbDir = fs.mkdtempSync(path.join(os.tmpdir(), "foldermate-class-test-"));
    dbManager = new DatabaseManager({ path: path.join(tempDbDir, "test.db") });
    dbManager.runMigrations(path.join(process.cwd(), "packages", "database", "src", "migrations"));
  });

  afterEach(() => {
    dbManager.close();
    fs.rmSync(tempDbDir, { recursive: true, force: true });
  });

  it("parses explicit and qualitative versions accurately", () => {
    expect(parseVersionFromFilename("id card v8").versionNumber).toBe(8);
    expect(parseVersionFromFilename("banner_v02_final").versionNumber).toBe(2);
    expect(parseVersionFromFilename("flyer (v4)").versionNumber).toBe(4);
    expect(parseVersionFromFilename("design final").isQualitative).toBe(true);
  });

  it("extracts 4-digit years from filenames", () => {
    expect(extractTemporalInfo("abc school 2026 design.cdr").year).toBe(2026);
    expect(extractTemporalInfo("calendar_2025-11.pdf").month).toBe(11);
  });

  it("computes Levenshtein distance and fuzzy matches", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    expect(levenshteinDistance("school", "scool")).toBe(1);

    const match = findBestDictionaryMatch(["abc", "scool", "id", "card"], [
      { name: "ABC School", code: "ABCSCH", aliases: ["ABC"], data: { id: "1" } }
    ]);

    expect(match.match).not.toBeNull();
    expect(match.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it("computes weighted confidence scores correctly", () => {
    const highConf = evaluateConfidence({
      clientScore: 1.0,
      projectScore: 1.0,
      yearScore: 1.0,
      versionScore: 1.0,
    });
    expect(highConf.compositeScore).toBe(1.0);
    expect(highConf.action).toBe("AUTO_ORGANIZE");

    const partialConf = evaluateConfidence({
      clientScore: 0.95,
      projectScore: 0.0,
      yearScore: 1.0,
      versionScore: 0.8,
    });
    // 0.4*0.95 + 0 + 0.15*1.0 + 0.10*0.8 = 0.38 + 0.15 + 0.08 = 0.61
    expect(partialConf.action).toBe("REVIEW_SUGGESTED");
  });

  it("executes full classification pipeline against database clients and projects", async () => {
    const client = dbManager.clients.create({
      name: "ABC School",
      code: "ABCSCH",
      aliases: ["ABC", "ABC School", "ABCS"],
      isActive: true,
    });

    dbManager.projects.create({
      clientId: client.id,
      name: "ID Card",
      code: "IDC2026",
      year: 2026,
    });

    const pipeline = new ClassificationPipeline(dbManager);
    const result = await pipeline.classifyFile("C:\\FolderMate\\Inbox\\abc id card 2026 v7.cdr");

    expect(result.clientId).toBe(client.id);
    expect(result.clientName).toBe("ABC School");
    expect(result.projectName).toBe("ID Card");
    expect(result.year).toBe(2026);
    expect(result.versionNumber).toBe(7);
    expect(result.confidence.action).toBe("AUTO_ORGANIZE");
    expect(result.confidence.percentage).toBeGreaterThanOrEqual(90);
  });
});
