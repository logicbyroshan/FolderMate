# Changelog

All notable changes to the **FolderMate** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-09-14

### Added
- Established the baseline Copilot memory and project instruction system for the repository.
- Added a mandatory GitHub CLI branch/PR workflow rule to the operating guidance.
- Kept the documentation set limited to the files required for project understanding and future agent work.
- Added the branded FolderMate app icon, favicon set, and desktop theme refresh to align the Electron shell with the project logo and yellow brand palette.

## [1.0.0] - 2026-09-12

### Added
- **Storage & Relational Database Layer**:
  - Implemented universal SQLite driver supporting synchronous WAL mode, foreign key constraints, busy timeout handling, and nested savepoints.
  - Added repository modules: `ClientsRepository`, `ProjectsRepository`, `FilesRepository`, `VersionsRepository`, `ReviewQueueRepository`, `EventsRepository`, `RulesRepository`, and `SearchRepository`.
  - Added SQLite FTS5 full-text search virtual index with automatic trigger synchronization.

- **Classification & Naming Engine**:
  - Implemented multi-tier classification pipeline (`ClassificationPipeline`) with fuzzy dictionary matching, temporal extraction, version number parsing, and composite confidence scoring.
  - Implemented token template renderer (`TemplateEngine`) and cross-platform path sanitizer (`Sanitizer`) preventing directory traversal attacks.

- **Two-Phase Transactional Safe Mover & Versioning**:
  - Implemented `TwoPhaseMover` with staging copy -> SHA-256 integrity verification -> atomic destination rename -> Safe Mode archival.
  - Implemented `VersionEngine` with deterministic version DAG lineage tracking, collision auto-incrementing, and rollback/restoration.
  - Implemented `ReviewManager` with manual override resolution and adaptive alias learning.

- **CorelDRAW Integration Bridge**:
  - Implemented out-of-process C# .NET COM bridge (`FolderMate.CorelBridge`) with Win32 P/Invoke (`GetActiveObject`, `CLSIDFromProgID`) supporting CorelDRAW 2020 through 2024.
  - Added offline `.cdr` Zip archive metadata and thumbnail extraction fallback (`ZipInspector`).
  - Added TypeScript `CorelDrawAdapter` with process spawning, heartbeat checks, and RPC execution.

- **Inter-Process Communication (IPC) & Daemon Subsystem**:
  - Implemented secure Win32 Named Pipe (`\\.\pipe\foldermate-ipc`) JSON-RPC 2.0 server.
  - Added 256-bit cryptographic auth token handshake stored in `%APPDATA%/FolderMate/.auth_token`.
  - Added Server-Sent Event (SSE) broadcasting for real-time file event notifications.

- **Electron Desktop Application & React 18 UI**:
  - Built Electron main process with system tray integration and background minimization.
  - Built React 18 frontend with dark aesthetic theme, live stats widget, and complete view catalog:
    - **Dashboard**: Live activity feed, pipeline status, quick scan triggers.
    - **Search**: Instant FTS5 full-text search with filtering and explorer launch.
    - **Review Queue**: Ambiguous file triage with client reassignment and alias learning.
    - **Clients & Projects**: Management of clients, codes, aliases, and project hierarchies.
    - **Rules & Templates**: Custom naming and folder routing rules.
    - **Settings**: Ingestion paths, automation thresholds, and CorelDRAW COM options.

- **Verification & Testing Suite**:
  - Comprehensive unit and integration test suite covering 32 test cases across 11 test suites with 100% pass rate.
  - End-to-end integration test (`tests/e2e-pipeline.test.ts`) validating complete lifecycle from Inbox ingestion to FTS5 search indexing.
