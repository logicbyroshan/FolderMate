import { z } from "zod";
import { DEFAULT_INBOX_DIR, DEFAULT_STORAGE_DIR, DEFAULT_ARCHIVE_DIR } from "@foldermate/shared";

export const FolderMateConfigSchema = z.object({
  ingestion: z.object({
    inboxPath: z.string().min(1).default(DEFAULT_INBOX_DIR),
    stabilityCheckIntervalMs: z.number().int().min(500).max(30000).default(2500),
    debounceWindowMs: z.number().int().min(500).max(10000).default(1500),
    watchRecursively: z.boolean().default(false),
    ignoredExtensions: z.array(z.string()).default([".tmp", ".part", ".crswap", ".lock"]),
  }).default({}),

  storage: z.object({
    organizationRoot: z.string().min(1).default(DEFAULT_STORAGE_DIR),
    archiveRoot: z.string().min(1).default(DEFAULT_ARCHIVE_DIR),
    safeMode: z.boolean().default(true),
    collisionPolicy: z.enum(["AUTO_INCREMENT", "PROMPT_REVIEW", "CREATE_BRANCH"]).default("AUTO_INCREMENT"),
    defaultNamingTemplate: z.string().default("{Client} {Project} {Year} v{Version}"),
    defaultFolderTemplate: z.string().default("Clients/{Client}/{Year}/{Project}"),
  }).default({}),

  automation: z.object({
    mode: z.enum(["AUTOMATIC", "ASSISTED", "MANUAL"]).default("AUTOMATIC"),
    autoOrganizeThreshold: z.number().min(0.0).max(1.0).default(0.85),
    suggestionThreshold: z.number().min(0.0).max(1.0).default(0.60),
    autoLearnAliases: z.boolean().default(true),
    fuzzyMatchThreshold: z.number().int().min(0).max(3).default(1),
  }).default({}),

  coreldraw: z.object({
    enabled: z.boolean().default(true),
    progId: z.string().default("CorelDRAW.Application"),
    comTimeoutMs: z.number().int().min(2000).max(60000).default(10000),
    autoGenerateThumbnail: z.boolean().default(true),
    autoExportPdfOnSave: z.boolean().default(false),
  }).default({}),

  search: z.object({
    ftsEnabled: z.boolean().default(true),
    deepMetadataExtraction: z.boolean().default(true),
    maxSearchResults: z.number().int().min(5).max(200).default(50),
  }).default({}),

  system: z.object({
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
    logRetentionDays: z.number().int().min(1).max(365).default(30),
    autoStartWithWindows: z.boolean().default(true),
    minimizeToTrayOnClose: z.boolean().default(true),
  }).default({}),
});

export type FolderMateConfig = z.infer<typeof FolderMateConfigSchema>;
