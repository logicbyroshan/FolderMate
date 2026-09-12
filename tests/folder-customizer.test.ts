import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import os from "os";
import { DatabaseManager } from "@foldermate/database";
import { FolderCustomizer } from "../apps/engine/src/organization/folder-customizer.js";

describe("FolderCustomizer & Appearance Rules", () => {
  let testDir: string;
  let dbPath: string;
  let dbManager: DatabaseManager;
  let customizer: FolderCustomizer;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), "foldermate-customizer-"));
    dbPath = path.join(testDir, "test.db");
    dbManager = new DatabaseManager({ dbPath });
    dbManager.runMigrations();
    customizer = new FolderCustomizer();
  });

  afterEach(() => {
    dbManager.close();
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("generates valid Windows desktop.ini format with color and infotip", () => {
    const iniContent = FolderCustomizer.generateDesktopIni({
      color: "blue",
      infoTip: "Client: Apex International School",
    });

    expect(iniContent).toContain("[.ShellClassInfo]");
    expect(iniContent).toContain("IconResource=");
    expect(iniContent).toContain("shell32.dll,235");
    expect(iniContent).toContain("InfoTip=Client: Apex International School");
    expect(iniContent).toContain("[ViewState]");
    expect(iniContent).toContain("FolderType=Generic");
  });

  it("applies, reads, and removes folder customization safely", async () => {
    const targetFolder = path.join(testDir, "Apex_Client_Folder");
    fs.mkdirSync(targetFolder, { recursive: true });

    // 1. Apply customization
    const result = await customizer.applyFolderCustomization(targetFolder, {
      color: "green",
      infoTip: "Project Completed",
      folderType: "Documents",
    });

    expect(result.success).toBe(true);
    expect(fs.existsSync(result.desktopIniPath)).toBe(true);

    // 2. Read back customization
    const readMeta = await customizer.getFolderCustomization(targetFolder);
    expect(readMeta).toBeDefined();
    expect(readMeta?.infoTip).toBe("Project Completed");
    expect(readMeta?.folderType).toBe("Documents");

    // 3. Remove customization
    const removed = await customizer.removeFolderCustomization(targetFolder);
    expect(removed).toBe(true);
    expect(fs.existsSync(result.desktopIniPath)).toBe(false);
  });

  it("persists and queries folder appearance rules in database", () => {
    const rule = dbManager.folderRules.create({
      name: "Client Folder Yellow Styling",
      targetType: "CLIENT",
      matchCondition: { clientType: "VIP" },
      color: "amber",
      iconResource: "%SystemRoot%\\system32\\imageres.dll",
      iconIndex: 3,
      infoTipTemplate: "Managed Client: {Client}",
      isActive: true,
      priority: 10,
    });

    expect(rule.id).toBeDefined();
    expect(rule.color).toBe("amber");

    const activeRules = dbManager.folderRules.listByTargetType("CLIENT");
    expect(activeRules.length).toBeGreaterThanOrEqual(1);
    expect(activeRules[0].name).toBe("Client Folder Yellow Styling");
  });
});
