import fs from "fs";
import { promises as fsPromises } from "fs";

export interface StabilityResult {
  isStable: boolean;
  sizeBytes: number;
  mtimeMs: number;
  error?: string;
}

/**
 * Checks if a file is exclusively locked by another application (e.g. CorelDRAW, Office).
 */
export async function isFileLocked(filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    fs.open(filePath, "r+", (err, fd) => {
      if (err) {
        if (["EBUSY", "EPERM", "EACCES"].includes(err.code || "")) {
          return resolve(true);
        }
      }
      if (fd !== undefined) {
        fs.close(fd, () => resolve(false));
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Monitors a file until its size and modification time remain constant across intervals and locks are released.
 */
export async function waitForFileStability(
  filePath: string,
  checkIntervalMs: number = 2000,
  maxWaitMs: number = 60000
): Promise<StabilityResult> {
  const startTime = Date.now();

  let previousSize = -1;
  let previousMtime = -1;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      if (!fs.existsSync(filePath)) {
        return { isStable: false, sizeBytes: 0, mtimeMs: 0, error: "FILE_NOT_FOUND" };
      }

      const locked = await isFileLocked(filePath);
      if (locked) {
        await new Promise((r) => setTimeout(r, checkIntervalMs));
        continue;
      }

      const stats = await fsPromises.stat(filePath);
      const currentSize = stats.size;
      const currentMtime = stats.mtimeMs;

      if (previousSize !== -1 && currentSize === previousSize && currentMtime === previousMtime) {
        // File has remained completely identical across the interval and is unlocked
        return {
          isStable: true,
          sizeBytes: currentSize,
          mtimeMs: currentMtime,
        };
      }

      previousSize = currentSize;
      previousMtime = currentMtime;

      await new Promise((r) => setTimeout(r, checkIntervalMs));
    } catch (err: any) {
      if (["EBUSY", "EPERM", "EACCES"].includes(err.code)) {
        await new Promise((r) => setTimeout(r, checkIntervalMs));
        continue;
      }
      return { isStable: false, sizeBytes: 0, mtimeMs: 0, error: err.message };
    }
  }

  return { isStable: false, sizeBytes: previousSize, mtimeMs: previousMtime, error: "STABILITY_TIMEOUT" };
}
