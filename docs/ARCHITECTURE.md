# FolderMate Architecture Specification

## 1. System Overview & Process Architecture

FolderMate is structured as a decoupled, multi-process desktop platform for Windows. It separates background filesystem ingestion from the user interface to guarantee that background organization remains active and ultra-lightweight even when the UI is closed.

```text
+-------------------------------------------------------------------------+
|                        Windows Operating System                         |
+-------------------------------------------------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
+-----------------------------+             +-----------------------------+
|    Electron Desktop UI      |             |  FolderMate Engine Daemon   |
|  - React 18 UI              |             |  - File Pipeline            |
|  - Design System Tokens     |             |  - StatCache & Lock Check   |
|  - Command Palette (Ctrl+K) |             |  - Multi-Tier Classifier    |
|  - Preload ContextBridge    |             |  - Two-Phase Safe Mover     |
+-----------------------------+             |  - Folder Customizer        |
               ^                            +-----------------------------+
               |                                           |
               |  Named Pipe IPC (\\\\.\\pipe\\foldermate)  |
               +-------------------------------------------+
                                                           |
                                                           v
                                            +-----------------------------+
                                            |   Embedded SQLite Database  |
                                            |  - WAL Journal Mode         |
                                            |  - FTS5 Full-Text Index     |
                                            |  - Transactional Repos      |
                                            +-----------------------------+
```

---

## 2. Core Subsystems

### 2.1 Background Engine Daemon (`@foldermate/engine`)
- **Process Lifecycle**: Runs as a background service with Windows tray minimization.
- **StatCache**: In-memory cache mapping `filePath` to `(size, mtimeMs, hash)`. Completely avoids repeated disk hashing during idle state.
- **Event-Driven Pipeline**: Listens to Windows filesystem events via `chokidar` with a 1500ms debounce buffer.
- **JobQueue**: Priority-ordered task queue with bounded worker concurrency (2–4 active jobs max).
- **TwoPhaseMover**: Atomic staging, SHA-256 verification, and destination commit to prevent corruption.

### 2.2 Database Engine (`@foldermate/database`)
- **Embedded Engine**: Local SQLite 3 operating in Write-Ahead Logging (`WAL`) mode with `NORMAL` synchronous pragma.
- **Repositories**:
  - `FilesRepository`: File records, hash indices, version lineages, and soft deletion flags.
  - `ClientsRepository`: Clients, recognition aliases, codes, and project hierarchies.
  - `ProjectsRepository`: Project scopes, categories, and years.
  - `FolderRulesRepository`: Rules mapping client/project/priority to Windows folder colors and icons.
  - `SearchRepository`: Sub-millisecond full-text search backed by SQLite `FTS5` virtual table with BM25 ranking.
  - `AuditLogRepository`: Immutable transaction history for all move, rename, and version events.

### 2.3 Windows Folder Appearance Engine (`FolderCustomizer`)
- **Mechanism**: Generates Windows-compliant `desktop.ini` configurations inside target directories.
- **Attribute Enforcement**: Executes `attrib +r <folderPath>` to instruct Windows Explorer to read `desktop.ini`, and `attrib +h +s <desktop.ini>` to hide system files.
- **Reversibility**: Full support for stripping attributes and restoring default Windows folder styling without touching user files.

### 2.4 Desktop UI (`@foldermate/desktop`)
- **Main Process**: Manages window lifecycles, tray icon, IPC proxying, and background daemon spawn/supervision.
- **Preload**: Secure, isolated `contextBridge` exposing `window.foldermate.call(channel, payload)` and `window.foldermate.on(event, handler)`.
- **Renderer**: React 18 single-page application built on strict Design Tokens, zero inline styling drift, and warm amber accent palette.

---

## 3. Data Flow & File Organization Lifecycle

```text
1. File Arrival: User drops 'abc school id 2026.cdr' in Inbox.
2. Stability Check: StatCache monitors size & mtime stability; tests non-destructive read lock.
3. Classification:
   - Rule Match: Checks explicit pattern rules.
   - Alias Match: Matches 'abc school' to Client 'ABC School' (Code: ABCSCH).
   - Year Extraction: Extracts '2026'.
   - Project Matching: Identifies 'ID Card' category.
4. Confidence Evaluation:
   - Score >= 0.85: Automatically proceeds to Organization.
   - Score < 0.85: Dispatches to Review Queue for human confirmation.
5. Two-Phase Safe Organization:
   - Calculates target path: 'D:\Clients\ABC School\2026\ID Card\ABC School ID Card 2026 v1.cdr'.
   - Staging copy -> Hash verification -> Final move.
   - Archives original in '_Archived' staging if Safe Mode is enabled.
6. Customization & Indexing:
   - Inserts record into SQLite FTS5 database within an atomic transaction.
   - Applies folder color rule to 'D:\Clients\ABC School'.
   - Emits IPC push event to connected Desktop UI instances.
```

---

## 4. Security & Fault Tolerance

1. **Path Traversal Defense**: All input paths and generated destination paths are strictly validated against configured root boundaries using normalized path prefixes.
2. **Crash Recovery**: If the application crashes during a move, the uncommitted staging files remain intact. On startup, the engine scans the staging area and reconciles interrupted transactions.
3. **IPC Authentication**: IPC connections over Named Pipes require a shared cryptographic token generated at engine startup.
4. **COM Bridge Isolation**: CorelDRAW automation executes in an isolated adapter process with timeouts, preventing COM deadlocks or CorelDRAW crashes from affecting the FolderMate daemon.
