# FolderMate Configuration Reference & Settings Schema

## 1. Configuration Architecture

FolderMate maintains configuration through a centralized, type-safe settings manager. Settings are loaded with the following precedence:
1. **Database Settings Store** (`system_settings` table in SQLite).
2. **Local Configuration File** (`%APPDATA%\FolderMate\config.json`).
3. **Environment Variable Overrides** (`FOLDERMATE_*`).
4. **Built-in System Defaults**.

---

## 2. Complete Configuration Schema (TypeScript / Zod)

```typescript
import { z } from "zod";

export const FolderMateConfigSchema = z.object({
  // 1. Filesystem & Ingestion Settings
  ingestion: z.object({
    inboxPath: z.string().min(1).default("C:\\FolderMate\\Inbox"),
    stabilityCheckIntervalMs: z.number().int().min(500).max(30000).default(2500),
    debounceWindowMs: z.number().int().min(500).max(10000).default(1500),
    watchRecursively: z.boolean().default(false),
    ignoredExtensions: z.array(z.string()).default([".tmp", ".part", ".crswap", ".lock"]),
  }),

  // 2. Storage & Organization Settings
  storage: z.object({
    organizationRoot: z.string().min(1).default("D:\\Clients"),
    archiveRoot: z.string().min(1).default("D:\\Archive"),
    safeMode: z.boolean().default(true), // Move original to _Archived rather than hard delete
    collisionPolicy: z.enum(["AUTO_INCREMENT", "PROMPT_REVIEW", "CREATE_BRANCH"]).default("AUTO_INCREMENT"),
    defaultNamingTemplate: z.string().default("{Client} {Project} {Year} v{Version}"),
    defaultFolderTemplate: z.string().default("Clients/{Client}/{Year}/{Project}"),
  }),

  // 3. Classification & Automation Strictness
  automation: z.object({
    mode: z.enum(["AUTOMATIC", "ASSISTED", "MANUAL"]).default("AUTOMATIC"),
    autoOrganizeThreshold: z.number().min(0.0).max(1.0).default(0.85),
    suggestionThreshold: z.number().min(0.0).max(1.0).default(0.60),
    autoLearnAliases: z.boolean().default(true),
    fuzzyMatchThreshold: z.number().int().min(0).max(3).default(1),
  }),

  // 4. CorelDRAW Integration
  coreldraw: z.object({
    enabled: z.boolean().default(true),
    progId: z.string().default("CorelDRAW.Application"),
    comTimeoutMs: z.number().int().min(2000).max(60000).default(10000),
    autoGenerateThumbnail: z.boolean().default(true),
    autoExportPdfOnSave: z.boolean().default(false),
  }),

  // 5. Indexing & Search
  search: z.object({
    ftsEnabled: z.boolean().default(true),
    deepMetadataExtraction: z.boolean().default(true),
    maxSearchResults: z.number().int().min(5).max(200).default(50),
  }),

  // 6. Logging & Telemetry
  system: z.object({
    logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
    logRetentionDays: z.number().int().min(1).max(365).default(30),
    autoStartWithWindows: z.boolean().default(true),
    minimizeToTrayOnClose: z.boolean().default(true),
  }),
});

export type FolderMateConfig = z.infer<typeof FolderMateConfigSchema>;
```

---

## 3. Supported Template Tokens Reference

FolderMate's naming and folder template engines dynamically interpolate the following tokens:

| Token | Description | Example Value |
| :--- | :--- | :--- |
| `{Client}` | Sanitized Client Name | `ABC School` |
| `{ClientCode}` | Normalized Client Code | `ABCSCH` |
| `{Project}` | Sanitized Project Name | `ID Card` |
| `{ProjectCode}` | Normalized Project Code | `IDC2026` |
| `{Category}` | Category Grouping | `Identity` |
| `{Year}` | 4-Digit Year | `2026` |
| `{Month}` | 2-Digit Month (`01`–`12`) | `09` |
| `{MonthName}` | 3-Letter Month Abbreviation | `Sep` |
| `{Date}` | 2-Digit Day of Month (`01`–`31`) | `11` |
| `{Version}` | Canonical Integer Version | `8` |
| `{VersionPadded}` | 2-Digit Zero-Padded Version | `08` |
| `{OriginalName}` | Raw Unsanitized Basename | `abc new final` |
| `{Extension}` | Lowercase File Extension with Dot | `.cdr` |

### 3.1. Template Examples & Resolutions

- **Standard Design Template**:
  - *Template*: `{Client} {Project} {Year} v{Version}`
  - *Output*: `ABC School ID Card 2026 v8.cdr`
- **Dated Campaign Template**:
  - *Template*: `{ClientCode}_{Year}-{Month}_{Project}_v{VersionPadded}`
  - *Output*: `ABCSCH_2026-09_ID Card_v08.cdr`
- **Hierarchy Folder Structure**:
  - *Template*: `Clients/{Client}/{Year}/{Project}/`
  - *Output*: `Clients/ABC School/2026/ID Card/`
