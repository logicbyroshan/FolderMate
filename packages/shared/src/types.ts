export type FileStatus =
  | "detected"
  | "checking_lock"
  | "stable"
  | "analyzing"
  | "classifying"
  | "needs_review"
  | "queued_for_move"
  | "staging"
  | "verifying_hash"
  | "organized"
  | "archived"
  | "trashed"
  | "failed_rollback"
  | "ignored";

export type ReviewQueueStatus = "pending" | "resolved" | "ignored";

export type EventType =
  | "FILE_DETECTED"
  | "FILE_LOCK_WAITING"
  | "FILE_STABLE"
  | "FILE_ANALYSIS_STARTED"
  | "FILE_ANALYZED"
  | "CLASSIFICATION_COMPLETED"
  | "REVIEW_REQUIRED"
  | "ORGANIZATION_STARTED"
  | "FILE_STAGED"
  | "HASH_VERIFIED"
  | "FILE_ORGANIZED"
  | "VERSION_INCREMENTED"
  | "DUPLICATE_DETECTED"
  | "FILE_OPERATION_FAILED"
  | "FILE_RESTORED"
  | "COREL_CONNECTED"
  | "COREL_DISCONNECTED"
  | "COREL_OPERATION_COMPLETED";

export interface ClientDTO {
  id: string;
  name: string;
  code: string;
  aliases: string[];
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDTO {
  id: string;
  clientId: string;
  name: string;
  code?: string | null;
  category: string;
  year: number;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  defaultNamingTemplateId?: string | null;
  defaultFolderTemplateId?: string | null;
  createdAt: string;
}

export interface FileRecordDTO {
  id: string;
  originalName: string;
  currentName: string;
  originalPath: string;
  currentPath: string;
  relativePath: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  clientId?: string | null;
  projectId?: string | null;
  categoryId?: string | null;
  year?: number | null;
  versionNumber: number;
  status: FileStatus;
  confidenceScore: number;
  sourceApp?: string | null;
  isArchived: boolean;
  organizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileVersionDTO {
  id: string;
  fileId: string;
  versionNumber: number;
  parentVersionId?: string | null;
  filePath: string;
  sha256Hash: string;
  sizeBytes: number;
  changeSummary?: string | null;
  createdBy: string;
  isApproved: boolean;
  isLatest: boolean;
  createdAt: string;
}

export interface FileRelationshipDTO {
  id: string;
  sourceFileId: string;
  targetFileId: string;
  relationshipType: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ReviewQueueItemDTO {
  id: string;
  fileId?: string | null;
  originalPath: string;
  originalName: string;
  proposedClientId?: string | null;
  proposedClientName?: string | null;
  proposedProjectId?: string | null;
  proposedProjectName?: string | null;
  proposedYear?: number | null;
  proposedVersion: number;
  proposedTargetPath?: string | null;
  confidenceScore: number;
  reasons: string[];
  status: ReviewQueueStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface FileEventDTO {
  id: string;
  fileId?: string | null;
  eventType: EventType;
  oldState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  details?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface SearchResultItemDTO {
  fileId: string;
  filename: string;
  originalFilename: string;
  clientName?: string;
  projectName?: string;
  categoryName?: string;
  year?: number;
  version: number;
  path: string;
  extension: string;
  sizeBytes: number;
  rank: number;
}
