import path from "path";
import { sanitizeWindowsFilename, sanitizeFolderPath } from "./sanitizer.js";

export interface TemplateContext {
  clientName?: string | null;
  clientCode?: string | null;
  projectName?: string | null;
  projectCode?: string | null;
  categoryName?: string | null;
  year?: number | null;
  month?: number | null;
  date?: number | null;
  versionNumber?: number | null;
  originalName?: string | null;
  extension?: string | null;
}

export class TemplateEngine {
  /**
   * Expands a filename template with context values and applies Windows filename sanitization.
   */
  public renderFilename(templateString: string, context: TemplateContext): string {
    const tokens = this.extractTokens(context);
    let result = templateString;

    for (const [key, value] of Object.entries(tokens)) {
      const regex = new RegExp(`\\{${key}\\}`, "gi");
      result = result.replace(regex, value);
    }

    // Clean up any double spaces or orphan separators
    result = result.replace(/\s+/g, " ").trim();

    // Ensure extension is preserved/appended
    const ext = context.extension ? (context.extension.startsWith(".") ? context.extension : `.${context.extension}`) : "";
    let baseName = result;

    if (ext && baseName.toLowerCase().endsWith(ext.toLowerCase())) {
      baseName = baseName.slice(0, -ext.length);
    }

    const sanitizedBase = sanitizeWindowsFilename(baseName);
    return `${sanitizedBase}${ext}`;
  }

  /**
   * Expands a folder hierarchy template with context values and applies safe folder path sanitization.
   */
  public renderFolderPath(templateString: string, context: TemplateContext): string {
    const tokens = this.extractTokens(context);
    let result = templateString;

    for (const [key, value] of Object.entries(tokens)) {
      const regex = new RegExp(`\\{${key}\\}`, "gi");
      result = result.replace(regex, value);
    }

    return sanitizeFolderPath(result);
  }

  private extractTokens(ctx: TemplateContext): Record<string, string> {
    const now = new Date();
    const year = ctx.year ?? now.getFullYear();
    const month = ctx.month ?? (now.getMonth() + 1);
    const date = ctx.date ?? now.getDate();
    const version = ctx.versionNumber ?? 1;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return {
      Client: ctx.clientName || "General",
      ClientCode: ctx.clientCode || (ctx.clientName ? ctx.clientName.replace(/\s+/g, "").toUpperCase().slice(0, 6) : "GEN"),
      Project: ctx.projectName || "Default",
      ProjectCode: ctx.projectCode || "PRJ",
      Category: ctx.categoryName || "General",
      Year: String(year),
      Month: String(month).padStart(2, "0"),
      MonthName: monthNames[month - 1] || "Jan",
      Date: String(date).padStart(2, "0"),
      Version: String(version),
      VersionPadded: String(version).padStart(2, "0"),
      OriginalName: ctx.originalName ? path.parse(ctx.originalName).name : "file",
      Extension: ctx.extension || "",
    };
  }
}
