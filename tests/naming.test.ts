import { describe, it, expect } from "vitest";
import { sanitizeWindowsFilename, sanitizeFolderPath, assertPathWithinRoot } from "../apps/engine/src/naming/sanitizer.js";
import { TemplateEngine } from "../apps/engine/src/naming/template-engine.js";

describe("Naming Sanitizer", () => {
  it("sanitizes illegal Windows characters", () => {
    expect(sanitizeWindowsFilename("ABC: School <ID> Card? *")).toBe("ABC- School -ID- Card- -");
    expect(sanitizeWindowsFilename("file|with/slashes\\and\"quotes")).toBe("file-with-slashes-and-quotes");
  });

  it("handles reserved Windows device names safely", () => {
    expect(sanitizeWindowsFilename("CON")).toBe("_CON");
    expect(sanitizeWindowsFilename("PRN.cdr")).toBe("_PRN.cdr");
    expect(sanitizeWindowsFilename("AUX")).toBe("_AUX");
    expect(sanitizeWindowsFilename("NUL.pdf")).toBe("_NUL.pdf");
  });

  it("sanitizes folder path hierarchy and prevents upward traversal", () => {
    const safe = sanitizeFolderPath("Clients/../ABC School/2026/../../ID Card");
    expect(safe).not.toContain("..");
    expect(safe).toContain("ABC School");
  });

  it("assertPathWithinRoot throws on path traversal attempt", () => {
    expect(() => {
      assertPathWithinRoot("D:\\OtherFolder\\secret.txt", "D:\\Clients");
    }).toThrow(/Security Violation/);
  });
});

describe("TemplateEngine", () => {
  const engine = new TemplateEngine();

  it("renders standard naming template with tokens", () => {
    const filename = engine.renderFilename("{Client} {Project} {Year} v{Version}", {
      clientName: "ABC School",
      projectName: "ID Card",
      year: 2026,
      versionNumber: 8,
      extension: ".cdr",
    });

    expect(filename).toBe("ABC School ID Card 2026 v8.cdr");
  });

  it("renders padded version numbers and client codes", () => {
    const filename = engine.renderFilename("{ClientCode}_{Year}-{Month}_{Project}_v{VersionPadded}", {
      clientName: "ABC School",
      clientCode: "ABCSCH",
      projectName: "Banner",
      year: 2026,
      month: 9,
      versionNumber: 3,
      extension: ".pdf",
    });

    expect(filename).toBe("ABCSCH_2026-09_Banner_v03.pdf");
  });

  it("renders folder hierarchy templates", () => {
    const folder = engine.renderFolderPath("Clients/{Client}/{Year}/{Project}", {
      clientName: "ABC School",
      projectName: "ID Card",
      year: 2026,
    });

    expect(folder).toContain("ABC School");
    expect(folder).toContain("2026");
    expect(folder).toContain("ID Card");
  });
});
