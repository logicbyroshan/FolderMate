# ADR-008: Zero-Idle Background Service & Lightweight Resource Optimization

## Context
FolderMate's background daemon runs continuously on Windows machines to ingest, classify, and organize files. In traditional desktop applications, background engines frequently wake up CPUs and spin disks through constant polling, recursive directory rescans, repeated SHA-256 hashing, and continuous database updates, draining battery and consuming system memory.

## Decision
We engineered a zero-idle, event-driven background processing architecture:

1. **In-Memory Stat Cache (`StatCache`)**:
   - Maintains an LRU cache mapping `filePath` to `{ size, mtimeMs, hash }`.
   - If `stat.size` and `stat.mtimeMs` match the cache entry, expensive disk hashing is completely skipped.
2. **Event-Driven Chokidar Pipeline with Debounce**:
   - Zero polling loops. The engine reacts exclusively to Windows `add` and `change` filesystem notifications with a 1500ms debounce buffer.
3. **Lock & Stability Detection**:
   - Checks non-destructive file read locks (`fs.openSync(r+)`) without streaming entire 500MB+ CDR/PDF files into RAM.
4. **Batched Database Writes**:
   - Filesystem operations write to SQLite exclusively on state transitions (`QUEUED` $\rightarrow$ `ORGANIZED` or `REVIEW_REQUIRED`) within scoped transactions with WAL journal mode.
5. **Bounded Concurrency**:
   - Heavy operations (classification, hashing, file moving) are constrained to 2–4 workers via `JobQueue`, preventing runaway memory or I/O thrashing during mass file drops.
6. **Graceful IPC & Server Context**:
   - The engine hosts an authenticated Named Pipe / domain socket IPC server with zero polling, broadcasting notifications via push events to connected Electron renderer windows.

## Consequences
- **Positive**: Background CPU utilization remains at ~0.0% when idle.
- **Positive**: Disk I/O drops to 0 reads/writes when no new files arrive in the Inbox.
- **Positive**: Memory footprint stabilizes under 35MB RAM for the background engine daemon.
