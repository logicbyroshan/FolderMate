import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";
import { CorelDrawAdapter } from "../apps/engine/src/integrations/coreldraw-adapter.js";

describe("CorelDrawAdapter", () => {
  const adapter = new CorelDrawAdapter();

  it("handles getStatus gracefully when CorelDRAW is not running or in offline mode", async () => {
    const status = await adapter.getStatus();
    expect(status).toBeDefined();
    expect(typeof status.success).toBe("boolean");
  });

  it("inspects CDR package info or falls back cleanly", async () => {
    const sampleFile = path.resolve(process.cwd(), "package.json");
    const result = await adapter.inspectCdrPackage(sampleFile);

    expect(result).toBeDefined();
    expect(result.fileSizeBytes).toBeGreaterThan(0);
    expect(result.title).toBe("package");
  });
});
