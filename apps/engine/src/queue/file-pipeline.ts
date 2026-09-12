import { EventEmitter } from "events";
import path from "path";
import { DatabaseManager } from "@foldermate/database";
import { FolderMateConfig } from "@foldermate/config";
import { FileWatcher } from "../watcher/file-watcher.js";
import { waitForFileStability } from "../watcher/lock-detector.js";
import { JobQueue } from "./job-queue.js";
import { ClassificationPipeline } from "../classification/classification-pipeline.js";
import { TwoPhaseMover, MoveExecutionResult } from "../organization/two-phase-mover.js";
import { ReviewManager } from "../review/review-manager.js";
import { IPCServer } from "../ipc/ipc-server.js";
import { globalStatCache } from "../utils/stat-cache.js";

export interface FilePipelineOptions {
  config: FolderMateConfig;
  db: DatabaseManager;
  ipcServer?: IPCServer;
}

export class FilePipeline extends EventEmitter {
  private watcher: FileWatcher;
  private queue: JobQueue;
  private db: DatabaseManager;
  private config: FolderMateConfig;
  private ipcServer?: IPCServer;

  private classificationPipeline: ClassificationPipeline;
  private mover: TwoPhaseMover;
  private reviewManager: ReviewManager;

  constructor(options: FilePipelineOptions) {
    super();
    this.config = options.config;
    this.db = options.db;
    this.ipcServer = options.ipcServer;

    this.classificationPipeline = new ClassificationPipeline(this.db);
    this.mover = new TwoPhaseMover(this.db, this.config);
    this.reviewManager = new ReviewManager(this.db, this.config);

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

  public setIPCServer(ipcServer: IPCServer): void {
    this.ipcServer = ipcServer;
  }

  private broadcastEvent(eventType: string, data: any): void {
    if (this.ipcServer) {
      this.ipcServer.broadcast(eventType, data);
    }
  }

  private setupHandlers(): void {
    // 1. File detected in inbox
    this.watcher.on("file-detected", ({ filePath }: { filePath: string }) => {
      const filename = path.basename(filePath);
      
      // Skip hidden / temp files
      if (filename.startsWith(".") || filename.startsWith("~")) {
        return;
      }

      this.db.events.record({
        eventType: "FILE_DETECTED",
        details: `File detected in inbox: ${filename}`,
      });

      this.broadcastEvent("file:detected", { filePath, filename });
      this.queue.enqueue("PROCESS_NEW_FILE", { filePath }, 10);
    });

    // 2. Register job handler for autonomous file pipeline execution
    this.queue.registerHandler("PROCESS_NEW_FILE", async (job) => {
      const { filePath } = job.payload;
      const originalFilename = path.basename(filePath);

      // A. Check lock & stability
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
        details: `File ${originalFilename} verified stable (${stability.sizeBytes} bytes)`,
      });

      // B. Multi-tier classification pipeline
      const classification = await this.classificationPipeline.classifyFile(
        filePath,
        stability.mtimeMs
      );

      const threshold = this.config.automation.autoOrganizeThreshold;
      const isAutoApproved = classification.confidence.compositeScore >= threshold && classification.clientId;

      if (isAutoApproved) {
        // C. High Confidence -> Autonomous Safe Move
        const moveResult: MoveExecutionResult = await this.mover.executeMove({
          sourcePath: filePath,
          clientId: classification.clientId,
          clientName: classification.clientName,
          projectId: classification.projectId,
          projectName: classification.projectName,
          categoryName: classification.categoryName,
          year: classification.year,
          versionNumber: classification.versionNumber,
          confidenceScore: classification.confidence.compositeScore,
        });

        // Invalidate stat cache for source and cache destination
        globalStatCache.invalidate(filePath);

        this.broadcastEvent("file:organized", {
          fileId: moveResult.fileId,
          finalPath: moveResult.finalPath,
          filename: moveResult.finalFilename,
          versionNumber: moveResult.versionNumber,
          isDuplicate: moveResult.isDuplicate,
        });

        this.emit("file-organized", moveResult);
        return moveResult;
      } else {
        // D. Low Confidence -> Enqueue into Review Queue
        const reviewItem = await this.reviewManager.enqueueForReview({
          originalPath: filePath,
          proposedClientId: classification.clientId,
          proposedProjectId: classification.projectId,
          proposedYear: classification.year,
          proposedVersion: classification.versionNumber,
          confidenceScore: classification.confidence.compositeScore,
          reasons: classification.confidence.reasons,
        });

        this.broadcastEvent("review:required", reviewItem);
        this.emit("review-required", reviewItem);
        return reviewItem;
      }
    });

    this.queue.on("job-error", (data) => {
      this.broadcastEvent("job:error", data);
      this.emit("error", data);
    });

    this.queue.on("job-failed", (data) => {
      this.broadcastEvent("job:failed", data);
      this.emit("pipeline-failed", data);
    });
  }
}
