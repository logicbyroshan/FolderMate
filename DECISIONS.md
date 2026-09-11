# FolderMate Architecture Decision Records (ADRs)

This document indexes all major architectural, database, technology, and design decisions recorded for FolderMate.

---

## Architecture Decision Index

| ADR ID | Title | Status | Date | Core Decision Summary |
| :--- | :--- | :---: | :---: | :--- |
| [ADR-001](file:///e:/E/FolderMate/docs/decisions/ADR-001-hybrid-engine-process-model.md) | **Hybrid Background Daemon with Named Pipe IPC** | `ACCEPTED` | 2026-09-11 | Separate 24/7 background engine daemon from Electron UI to guarantee zero-latency file watching and <50MB idle memory. |
| [ADR-002](file:///e:/E/FolderMate/docs/decisions/ADR-002-sqlite-fts5-database.md) | **Embedded SQLite 3 with WAL Mode & FTS5** | `ACCEPTED` | 2026-09-11 | Adopt embedded SQLite 3 with WAL concurrency and FTS5 full-text indexing via `better-sqlite3` native bindings. |
| [ADR-003](file:///e:/E/FolderMate/docs/decisions/ADR-003-two-phase-safe-file-operations.md) | **Two-Phase Transactional Staging for File Moves** | `ACCEPTED` | 2026-09-11 | Enforce copy-to-stage $\to$ hash verification $\to$ atomic rename pipeline to guarantee 0% file loss during power failure or crash. |
| [ADR-004](file:///e:/E/FolderMate/docs/decisions/ADR-004-coreldraw-out-of-process-com-bridge.md) | **Out-of-Process C# COM Bridge for CorelDRAW** | `ACCEPTED` | 2026-09-11 | Isolate Windows COM Single-Threaded Apartment (STA) calls inside an external C# CLI bridge to shield Node.js from modal hangs. |
| [ADR-005](file:///e:/E/FolderMate/docs/decisions/ADR-005-classification-scoring-pipeline.md) | **Multi-Tier Classification & Confidence Pipeline** | `ACCEPTED` | 2026-09-11 | Implement strict deterministic rules $\to$ alias dictionaries $\to$ metadata $\to$ heuristics priority before invoking AI. |

---

## Core Principles Guiding All Architectural Decisions

1. **Deterministic-First Over Heuristics**: If a rule can be computed with exact logic or regex, never delegate it to a probabilistic model.
2. **Zero In-Memory Buffering for Media**: Never read complete design files or PDFs into RAM. Use 64KB streamed chunking.
3. **Fail-Safe Rollbacks**: Every destructive or modifying action must be preceded by a verifiable snapshot and staged copy.
4. **Local Sovereignty**: All data, metadata, and indexes reside locally on the user's machine by default.
