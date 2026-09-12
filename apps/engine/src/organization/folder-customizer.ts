import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export type FolderColor = "amber" | "yellow" | "blue" | "green" | "red" | "purple" | "gray" | "cyan";

export interface FolderCustomizationOptions {
  color?: FolderColor;
  iconResource?: string;
  iconIndex?: number;
  infoTip?: string;
  folderType?: "Generic" | "Documents" | "Pictures" | "Videos";
}

export const FOLDER_COLOR_ICON_MAP: Record<FolderColor, { resource: string; index: number }> = {
  amber: { resource: "%SystemRoot%\\system32\\imageres.dll", index: 3 },
  yellow: { resource: "%SystemRoot%\\system32\\imageres.dll", index: 3 },
  blue: { resource: "%SystemRoot%\\system32\\shell32.dll", index: 235 },
  green: { resource: "%SystemRoot%\\system32\\imageres.dll", index: 114 },
  red: { resource: "%SystemRoot%\\system32\\imageres.dll", index: 112 },
  purple: { resource: "%SystemRoot%\\system32\\imageres.dll", index: 182 },
  gray: { resource: "%SystemRoot%\\system32\\imageres.dll", index: 110 },
  cyan: { resource: "%SystemRoot%\\system32\\imageres.dll", index: 175 },
};

/**
 * Manages native Windows Explorer folder visual appearance and color coding via desktop.ini.
 */
export class FolderCustomizer {
  /**
   * Generates formatted desktop.ini contents.
   */
  public static generateDesktopIni(options: FolderCustomizationOptions): string {
    const color = options.color || "amber";
    const defaultIcon = FOLDER_COLOR_ICON_MAP[color] || FOLDER_COLOR_ICON_MAP.amber;

    const resource = options.iconResource || defaultIcon.resource;
    const index = options.iconIndex ?? defaultIcon.index;
    const folderType = options.folderType || "Generic";

    const lines: string[] = [
      "[.ShellClassInfo]",
      `IconResource=${resource},${index}`,
      `IconFile=${resource}`,
      `IconIndex=${index}`,
    ];

    if (options.infoTip) {
      lines.push(`InfoTip=${options.infoTip.replace(/[\r\n]/g, " ")}`);
    }

    lines.push("[ViewState]", `Mode=`, `Vid=`, `FolderType=${folderType}`, "");

    return lines.join("\r\n");
  }

  /**
   * Applies desktop.ini and sets required Windows directory attributes (+r on folder, +h +s on desktop.ini).
   */
  public async applyFolderCustomization(
    folderPath: string,
    options: FolderCustomizationOptions
  ): Promise<{ success: boolean; desktopIniPath: string }> {
    if (!fs.existsSync(folderPath)) {
      await fsPromises.mkdir(folderPath, { recursive: true });
    }

    const desktopIniPath = path.join(folderPath, "desktop.ini");
    const content = FolderCustomizer.generateDesktopIni(options);

    // If desktop.ini exists with hidden/system attributes, remove them first to allow writing
    if (fs.existsSync(desktopIniPath) && process.platform === "win32") {
      try {
        await execAsync(`attrib -h -s -r "${desktopIniPath}"`);
      } catch {
        // ignore
      }
    }

    // Write desktop.ini
    await fsPromises.writeFile(desktopIniPath, content, "utf-8");

    // On Windows, set directory to Read-Only (+r) and desktop.ini to Hidden + System (+h +s)
    if (process.platform === "win32") {
      try {
        await execAsync(`attrib +r "${folderPath}"`);
        await execAsync(`attrib +h +s "${desktopIniPath}"`);
      } catch (err) {
        console.warn(`[FolderCustomizer] Notice setting Windows attributes on ${folderPath}:`, err);
      }
    }

    return { success: true, desktopIniPath };
  }

  /**
   * Removes folder customization and restores standard folder appearance.
   */
  public async removeFolderCustomization(folderPath: string): Promise<boolean> {
    const desktopIniPath = path.join(folderPath, "desktop.ini");
    if (!fs.existsSync(desktopIniPath)) {
      return false;
    }

    if (process.platform === "win32") {
      try {
        await execAsync(`attrib -h -s -r "${desktopIniPath}"`);
      } catch {
        // ignore
      }
    }

    await fsPromises.unlink(desktopIniPath).catch(() => {});

    if (process.platform === "win32") {
      try {
        await execAsync(`attrib -r "${folderPath}"`);
      } catch {
        // ignore
      }
    }

    return true;
  }

  /**
   * Reads existing customization info from desktop.ini.
   */
  public async getFolderCustomization(folderPath: string): Promise<FolderCustomizationOptions | null> {
    const desktopIniPath = path.join(folderPath, "desktop.ini");
    if (!fs.existsSync(desktopIniPath)) {
      return null;
    }

    try {
      const content = await fsPromises.readFile(desktopIniPath, "utf-8");
      const iconMatch = content.match(/IconResource=([^,\r\n]+)(?:,(\d+))?/);
      const tipMatch = content.match(/InfoTip=([^\r\n]+)/);
      const typeMatch = content.match(/FolderType=([^\r\n]+)/);

      return {
        iconResource: iconMatch ? iconMatch[1] : undefined,
        iconIndex: iconMatch && iconMatch[2] ? parseInt(iconMatch[2], 10) : undefined,
        infoTip: tipMatch ? tipMatch[1] : undefined,
        folderType: typeMatch ? (typeMatch[1] as any) : undefined,
      };
    } catch {
      return null;
    }
  }
}
