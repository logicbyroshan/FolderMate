import { z } from "zod";

export const ClientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Client name is required").max(120),
  code: z.string().min(1, "Client code is required").max(20),
  aliases: z.array(z.string()).default([]),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const ProjectSchema = z.object({
  id: z.string().uuid().optional(),
  clientId: z.string().uuid(),
  name: z.string().min(1, "Project name is required").max(120),
  code: z.string().max(30).nullable().optional(),
  category: z.string().default("General"),
  year: z.number().int().min(1900).max(2100),
  status: z.enum(["active", "completed", "archived"]).default("active"),
  metadata: z.record(z.unknown()).default({}),
});

export const FileRecordSchema = z.object({
  id: z.string().uuid().optional(),
  originalName: z.string().min(1),
  currentName: z.string().min(1),
  originalPath: z.string().min(1),
  currentPath: z.string().min(1),
  relativePath: z.string().min(1),
  extension: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  sha256Hash: z.string().length(64),
  clientId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  year: z.number().int().nullable().optional(),
  versionNumber: z.number().int().positive().default(1),
  status: z.string().default("organized"),
  confidenceScore: z.number().min(0.0).max(1.0).default(1.0),
  sourceApp: z.string().nullable().optional(),
  isArchived: z.boolean().default(false),
  organizedAt: z.string().nullable().optional(),
});

export const ResolveReviewItemSchema = z.object({
  reviewQueueId: z.string().uuid(),
  clientId: z.string().uuid(),
  projectId: z.string().uuid(),
  year: z.number().int().min(1900).max(2100),
  versionNumber: z.number().int().positive().default(1),
  learnAlias: z.boolean().default(true),
  customName: z.string().optional(),
});
