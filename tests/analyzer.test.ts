import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { FileAnalyzer } from "../apps/engine/src/analyzer/file-analyzer.js";

describe("FileAnalyzer", () => {
  let tempDir: string;
  let analyzer: FileAnalyzer;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "foldermate-analyzer-test-"));
    analyzer = new FileAnalyzer();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should stream and calculate exact SHA-256 hash of arbitrary content", async () => {
    const testFilePath = path.join(tempDir, "sample_design.cdr");
    const payload = Buffer.from("CorelDRAW Vector Graphic binary mock simulation data");
    fs.writeFileSync(testFilePath, payload);

    const expectedHash = crypto.createHash("sha256").update(payload).digest("hex");
    const analysis = await analyzer.analyzeFile(testFilePath);

    expect(analysis.sha256Hash).toBe(expectedHash);
    expect(analysis.sizeBytes).toBe(payload.length);
    expect(analysis.extension).toBe(".cdr");
    expect(analysis.sourceApp).toBe("CorelDRAW");
  });

  it("should detect PDF mime type from %PDF magic bytes", async () => {
    const testFilePath = path.join(tempDir, "document.pdf");
    const payload = Buffer.from("%PDF-1.7\nSample PDF payload stream");
    fs.writeFileSync(testFilePath, payload);

    const analysis = await analyzer.analyzeFile(testFilePath);
    expect(analysis.mimeType).toBe("application/pdf");
    expect(analysis.sourceApp).toBe("PDF Document");
  });
});
