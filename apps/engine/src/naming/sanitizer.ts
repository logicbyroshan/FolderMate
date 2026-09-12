import path from "path";
import { ILLEGAL_WINDOWS_CHARS, RESERVED_WINDOWS_NAMES } from "@foldermate/shared";

/**
 * Sanitizes a filename component by removing illegal Windows characters and handling reserved device names.
 */
export function sanitizeWindowsFilename(input: string, replacement: string = "-"): string {
  if (!input) return "unnamed";

  let clean = input.replace(ILLEGAL_WINDOWS_CHARS, replacement);

  // Trim trailing periods and spaces (illegal in Windows NTFS paths)
  clean = clean.replace(/[. ]+$/, "").trim();

  // Collapse multiple hyphens/spaces
  clean = clean.replace(/--+/g, "-").replace(/\s+/g, " ");

  if (RESERVED_WINDOWS_NAMES.test(clean) || clean.length === 0) {
    clean = `_${clean || "file"}`;
  }

  return clean;
}

/**
 * Sanitizes a relative folder path hierarchy ensuring no path traversal escapes.
 */
export function sanitizeFolderPath(folderPath: string): string {
  const parts = folderPath
    .replace(/\\/g, "/")
    .split("/")
    .filter((p) => p.length > 0 && p !== ".");

  const sanitizedParts: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      // Disallow upward traversal
      continue;
    }
    sanitizedParts.push(sanitizeWindowsFilename(part));
  }

  return sanitizedParts.join(path.sep);
}

/**
 * Asserts that a target absolute path resides strictly within the configured root directory.
 */
export function assertPathWithinRoot(targetPath: string, rootDir: string): void {
  const normalizedTarget = path.normalize(path.resolve(targetPath));
  const normalizedRoot = path.normalize(path.resolve(rootDir));

  if (!normalizedTarget.startsWith(normalizedRoot + path.sep) && normalizedTarget !== normalizedRoot) {
    throw new Error(`Security Violation: Target path ${targetPath} is outside storage root ${rootDir}`);
  }
}

/**
 * Prefixes path with Win32 extended path identifier (\\?\) for paths exceeding MAX_PATH (260 characters).
 */
export function toExtendedWindowsPath(absolutePath: string): string {
  if (process.platform !== "win32") return absolutePath;
  if (absolutePath.startsWith("\\\\?\\")) return absolutePath;

  if (absolutePath.startsWith("\\\\")) {
    return `\\\\?\\UNC\\${absolutePath.slice(2)}`;
  }
  return `\\\\?\\${absolutePath}`;
}
