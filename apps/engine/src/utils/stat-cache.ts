import fs from "fs";
import { promises as fsPromises } from "fs";
import crypto from "crypto";

export interface CachedFileMeta {
  filePath: string;
  sizeBytes: number;
  mtimeMs: number;
  sha256Hash: string;
  cachedAt: number;
}

/**
 * High-performance in-memory metadata & SHA-256 cache to prevent redundant disk I/O.
 * Keyed by normalized file path, verified against file size and mtime.
 */
export class StatCache {
  private cache: Map<string, CachedFileMeta> = new Map();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries: number = 10000, ttlMs: number = 24 * 60 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  /**
   * Retrieves cached SHA-256 hash if the file's size and mtime are identical to cached values.
   */
  public getValidHash(filePath: string, sizeBytes: number, mtimeMs: number): string | null {
    const entry = this.cache.get(filePath);
    if (!entry) return null;

    // Check expiration
    if (Date.now() - entry.cachedAt > this.ttlMs) {
      this.cache.delete(filePath);
      return null;
    }

    // Validate size and mtime match exactly
    if (entry.sizeBytes === sizeBytes && entry.mtimeMs === mtimeMs) {
      return entry.sha256Hash;
    }

    // Stale entry
    this.cache.delete(filePath);
    return null;
  }

  /**
   * Caches or updates the hash and stat metadata for a file.
   */
  public set(filePath: string, sizeBytes: number, mtimeMs: number, sha256Hash: string): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(filePath, {
      filePath,
      sizeBytes,
      mtimeMs,
      sha256Hash,
      cachedAt: Date.now(),
    });
  }

  /**
   * Invalidate a specific path when moved or deleted.
   */
  public invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * Computes SHA-256 with cache acceleration.
   */
  public async getOrComputeHash(filePath: string): Promise<string> {
    const stats = await fsPromises.stat(filePath);
    const cachedHash = this.getValidHash(filePath, stats.size, stats.mtimeMs);
    if (cachedHash) {
      return cachedHash;
    }

    const computedHash = await new Promise<string>((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", (err) => reject(err));
    });

    this.set(filePath, stats.size, stats.mtimeMs, computedHash);
    return computedHash;
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }
}

export const globalStatCache = new StatCache();
