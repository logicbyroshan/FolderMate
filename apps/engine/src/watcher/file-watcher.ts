import chokidar, { FSWatcher } from "chokidar";
import path from "path";
import { EventEmitter } from "events";
import { IGNORED_FILE_REGEXES } from "@foldermate/shared";

export interface FileWatcherOptions {
  inboxPath: string;
  debounceMs?: number;
  recursive?: boolean;
}

export class FileWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private debounceMs: number;

  constructor(private options: FileWatcherOptions) {
    super();
    this.debounceMs = options.debounceMs ?? 1500;
  }

  public start(): void {
    if (this.watcher) return;

    this.watcher = chokidar.watch(this.options.inboxPath, {
      ignored: (filePath: string) => this.isIgnored(filePath),
      persistent: true,
      ignoreInitial: false,
      depth: this.options.recursive ? 99 : 0,
      awaitWriteFinish: false, // We use our custom 2-phase lock detector instead of naive awaitWriteFinish
    });

    this.watcher.on("add", (filePath: string) => this.handleFileEvent("add", filePath));
    this.watcher.on("change", (filePath: string) => this.handleFileEvent("change", filePath));
    this.watcher.on("unlink", (filePath: string) => this.handleUnlink(filePath));
    this.watcher.on("error", (error: Error) => this.emit("error", error));
  }

  public async stop(): Promise<void> {
    if (this.watcher) {
      // Clear pending debouncers
      for (const timer of this.debounceTimers.values()) {
        clearTimeout(timer);
      }
      this.debounceTimers.clear();

      await this.watcher.close();
      this.watcher = null;
    }
  }

  private isIgnored(filePath: string): boolean {
    const filename = path.basename(filePath);
    if (!filename) return false;

    for (const regex of IGNORED_FILE_REGEXES) {
      if (regex.test(filename)) {
        return true;
      }
    }
    return false;
  }

  private handleFileEvent(type: "add" | "change", filePath: string): void {
    if (this.isIgnored(filePath)) return;

    const existing = this.debounceTimers.get(filePath);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      this.emit("file-detected", { type, filePath, detectedAt: new Date().toISOString() });
    }, this.debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  private handleUnlink(filePath: string): void {
    const existing = this.debounceTimers.get(filePath);
    if (existing) {
      clearTimeout(existing);
      this.debounceTimers.delete(filePath);
    }
    this.emit("file-removed", { filePath, removedAt: new Date().toISOString() });
  }
}
