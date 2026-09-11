import { EventEmitter } from "events";
import { DatabaseManager } from "@foldermate/database";
import { FileWatcher } from "../watcher/file-watcher.js";
import { waitForFileStability } from "../watcher/lock-detector.js";
import { FileAnalyzer } from "../analyzer/file-analyzer.js";
import { JobQueue } from "./job-queue.js";
import { FolderMateConfig } from "@foldermate/config";

export interface FilePipelineOptions {
  config: FolderMateConfig;
  db: DatabaseManager;
}

export class FilePipeline extends EventEmitter {
  private watcher: FileWatcher;
  private analyzer: FileAnalyzer;
  private queue: JobQueue;
  private db: DatabaseManager;
  private config: FolderMateConfig;

  constructor(options: FilePipelineOptions) {
    super();
    this.config = options.config;
    this.db = options.db;

    this.analyzer = new FileAnalyzer();
    this.queue = new JobQueue(4);
    this.watcher = new FileWatcher({
      inboxPath: this.config.ingestion.inboxPath,
      debounceMs: this.config.ingestion.debounceWindowMs,
      recursive: this.config.ingestion.watchRecursively,
    });

    this.setupHandlers();
  }

  public async start(): Promise<void> {
    this.watcher.start();
    this.emit("started", { inboxPath: this.config.ingestion.inboxPath });
  }

  public async stop(): Promise<void> {
    await this.watcher.stop();
    this.emit("stopped");
  }

  public getQueueStats() {
    return this.queue.getQueueStats();
  }

  private setupHandlers(): void {
    // 1. Watcher emits file-detected
    this.watcher.on("file-detected", ({ filePath }: { filePath: string }) => {
      this.db.events.record({
        eventType: "FILE_DETECTED",
        details: `File detected in inbox: ${filePath}`,
      });

      this.queue.enqueue("PROCESS_NEW_FILE", { filePath }, 10);
    });

    // 2. Register job handler for PROCESS_NEW_FILE
    this.queue.registerHandler("PROCESS_NEW_FILE", async (job) => {
      const { filePath } = job.payload;

      // Check lock & stability
      const stability = await waitForFileStability(
        filePath,
        this.config.ingestion.stabilityCheckIntervalMs,
        60000
      );

      if (!stability.isStable) {
        throw new Error(`File ${filePath} failed stability check: ${stability.error}`);
      }

      this.db.events.record({
        eventType: "FILE_STABLE",
        details: `File ${filePath} verified stable (${stability.sizeBytes} bytes)`,
      });

      // Analyze file
      const analysis = await this.analyzer.analyzeFile(filePath);

      this.db.events.record({
        eventType: "FILE_ANALYZED",
        details: `File analyzed. SHA-256: ${analysis.sha256Hash}`,
      });

      this.emit("file-analyzed", analysis);
      return analysis;
    });

    this.queue.on("job-error", (data) => this.emit("error", data));
    this.queue.on("job-failed", (data) => this.emit("pipeline-failed", data));
  }
}
