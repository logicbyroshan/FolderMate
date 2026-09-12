import { DatabaseManager } from "@foldermate/database";
import { FolderMateConfig, saveConfig } from "@foldermate/config";
import { TwoPhaseMover } from "../organization/two-phase-mover.js";
import { VersionEngine } from "../versioning/version-engine.js";
import { ReviewManager } from "../review/review-manager.js";
import { CorelDrawAdapter } from "../integrations/coreldraw-adapter.js";
import { ClassificationPipeline } from "../classification/classification-pipeline.js";

export interface RPCContext {
  db: DatabaseManager;
  config: FolderMateConfig;
  mover: TwoPhaseMover;
  versionEngine: VersionEngine;
  reviewManager: ReviewManager;
  corelAdapter: CorelDrawAdapter;
  classifier: ClassificationPipeline;
  triggerScan?: () => Promise<{ scanned: number }>;
}

export async function dispatchRPCMethod(
  method: string,
  params: any,
  ctx: RPCContext
): Promise<any> {
  switch (method) {
    // 1. System
    case "system.getStatus": {
      return {
        status: "running",
        uptimeSeconds: Math.floor(process.uptime()),
        inboxPath: ctx.config.ingestion.inboxPath,
        organizationRoot: ctx.config.storage.organizationRoot,
        safeMode: ctx.config.storage.safeMode,
        pendingReviewCount: ctx.db.reviewQueue.listPending().length,
      };
    }

    case "system.triggerScan": {
      if (ctx.triggerScan) {
        return await ctx.triggerScan();
      }
      return { scanned: 0 };
    }

    // 2. Files
    case "files.list": {
      return ctx.db.files.list(params || {});
    }

    case "files.getById": {
      const file = ctx.db.files.getById(params.id);
      if (!file) throw new Error(`File not found: ${params.id}`);
      const versions = ctx.versionEngine.getLineage(params.id);
      const events = ctx.db.events.listByFile(params.id);
      return { file, versions, events };
    }

    case "files.organize": {
      return await ctx.mover.executeMove(params);
    }

    case "files.restoreVersion": {
      return await ctx.versionEngine.restoreVersion(params.fileId, params.versionNumber);
    }

    // 3. Review Queue
    case "reviewQueue.list": {
      return ctx.db.reviewQueue.listPending();
    }

    case "reviewQueue.resolve": {
      return await ctx.reviewManager.resolveItem(params);
    }

    case "reviewQueue.ignore": {
      return ctx.db.reviewQueue.resolve(params.id, "ignored");
    }

    // 4. Clients
    case "clients.list": {
      return ctx.db.clients.list(params?.activeOnly ?? true);
    }

    case "clients.create": {
      return ctx.db.clients.create(params);
    }

    case "clients.addAlias": {
      return ctx.db.clients.addAlias(params.clientId, params.alias);
    }

    // 5. Projects
    case "projects.list": {
      if (params?.clientId) {
        return ctx.db.projects.listByClient(params.clientId);
      }
      return ctx.db.projects.listAll();
    }

    case "projects.create": {
      return ctx.db.projects.create(params);
    }

    // 6. Rules
    case "rules.list": {
      return ctx.db.rules.listAll();
    }

    case "rules.create": {
      return ctx.db.rules.create(params);
    }

    // 7. Search
    case "search.query": {
      return ctx.db.search.search(params.query, params.limit || 25);
    }

    // 8. CorelDRAW
    case "corel.getStatus": {
      return await ctx.corelAdapter.getStatus();
    }

    case "corel.saveAsNewVersion": {
      return await ctx.corelAdapter.saveAsNewVersion(params.targetPath);
    }

    case "corel.inspectCdr": {
      return await ctx.corelAdapter.inspectCdrPackage(params.filePath);
    }

    // 9. Settings
    case "settings.get": {
      return ctx.config;
    }

    case "settings.update": {
      Object.assign(ctx.config, params);
      saveConfig(ctx.config);
      return { success: true, config: ctx.config };
    }

    default:
      throw new Error(`Method not found: ${method}`);
  }
}
