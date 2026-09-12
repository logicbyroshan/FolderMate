import { DatabaseManager } from "@foldermate/database";
import { FolderMateConfig } from "@foldermate/config";
import { ReviewQueueItemDTO } from "@foldermate/shared";
import { TwoPhaseMover, MoveExecutionResult } from "../organization/two-phase-mover.js";

export interface ResolveReviewParams {
  reviewQueueId: string;
  clientId: string;
  projectId: string;
  year?: number;
  versionNumber?: number;
  learnAlias?: boolean;
  createNewAlias?: string;
}

export class ReviewManager {
  private mover: TwoPhaseMover;

  constructor(
    private db: DatabaseManager,
    private config: FolderMateConfig
  ) {
    this.mover = new TwoPhaseMover(db, config);
  }

  public async enqueueForReview(params: {
    fileId?: string;
    originalPath: string;
    proposedClientId?: string;
    proposedProjectId?: string;
    proposedYear?: number;
    proposedVersion?: number;
    proposedTargetPath?: string;
    confidenceScore: number;
    reasons: string[];
  }): Promise<ReviewQueueItemDTO> {
    const item = this.db.reviewQueue.create({
      fileId: params.fileId,
      originalPath: params.originalPath,
      proposedClientId: params.proposedClientId,
      proposedProjectId: params.proposedProjectId,
      proposedYear: params.proposedYear,
      proposedVersion: params.proposedVersion || 1,
      proposedTargetPath: params.proposedTargetPath,
      confidenceScore: params.confidenceScore,
      reasons: params.reasons,
      status: "pending",
    });

    this.db.events.record({
      fileId: params.fileId,
      eventType: "REVIEW_REQUIRED",
      details: `File enqueued for review. Confidence: ${Math.round(params.confidenceScore * 100)}%`,
    });

    return item;
  }

  public async resolveItem(params: ResolveReviewParams): Promise<MoveExecutionResult> {
    const reviewItem = this.db.reviewQueue.getById(params.reviewQueueId);
    if (!reviewItem) {
      throw new Error(`Review queue item not found: ${params.reviewQueueId}`);
    }

    const client = this.db.clients.getById(params.clientId);
    if (!client) {
      throw new Error(`Client not found: ${params.clientId}`);
    }

    const project = this.db.projects.getById(params.projectId);
    if (!project) {
      throw new Error(`Project not found: ${params.projectId}`);
    }

    // 1. Move file using two-phase mover
    const moveResult = await this.mover.executeMove({
      sourcePath: reviewItem.originalPath,
      clientId: client.id,
      clientName: client.name,
      projectId: project.id,
      projectName: project.name,
      categoryName: project.category,
      year: params.year || project.year,
      versionNumber: params.versionNumber || reviewItem.proposedVersion,
      confidenceScore: 1.0,
    });

    // 2. Mark review queue item as resolved
    this.db.reviewQueue.resolve(params.reviewQueueId, "resolved");

    // 3. Adaptive Alias Learning
    if (params.createNewAlias) {
      this.db.clients.addAlias(client.id, params.createNewAlias);
      this.db.events.record({
        fileId: moveResult.fileId,
        eventType: "FILE_ORGANIZED",
        details: `Learned new alias '${params.createNewAlias}' for client '${client.name}'`,
      });
    } else if (params.learnAlias) {
      const originalBasename = reviewItem.originalName.replace(/\.[^/.]+$/, "");
      const tokens = originalBasename.split(/[\s_\-.]+/).filter((t) => t.length >= 2);
      for (const token of tokens) {
        const isExactWordInName = client.name.split(/\s+/).some((w) => w.toLowerCase() === token.toLowerCase());
        if (!isExactWordInName && !client.aliases.includes(token)) {
          this.db.clients.addAlias(client.id, token);
          this.db.events.record({
            fileId: moveResult.fileId,
            eventType: "FILE_ORGANIZED",
            details: `Learned new alias '${token}' for client '${client.name}'`,
          });
          break;
        }
      }
    }

    return moveResult;
  }
}
