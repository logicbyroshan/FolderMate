# FolderMate Multi-Phase Development Roadmap

## 1. Roadmap Overview & Phased Milestones

The FolderMate roadmap is organized into 11 strictly sequenced, independently testable phases. Development follows a **Core Engine First $\to$ UI Second $\to$ Integrations Third $\to$ AI Last** progression.

```mermaid
gantt
    title FolderMate Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 0-2 (Foundation)
    Phase 0: Architecture & Blueprint           :done, 2026-09-01, 2026-09-11
    Phase 1: DB & Filesystem Engine             :active, 2026-09-12, 2026-09-22
    Phase 2: Naming, Templates & Safe Mover    :2026-09-23, 2026-10-03
    section Phase 3-6 (MVP Completion)
    Phase 3: Version Lineage & Collision Engine :2026-10-04, 2026-10-14
    Phase 4: SQLite FTS5 Search & Indexer      :2026-10-15, 2026-10-22
    Phase 5: Electron UI & System Tray Agent   :2026-10-23, 2026-11-06
    Phase 6: Review Queue & Feedback Learning  :2026-11-07, 2026-11-17
    section Phase 7-10 (Advanced & AI)
    Phase 7: CorelDRAW C# COM Bridge           :2026-11-18, 2026-12-02
    Phase 8: Deduplication & Audit Timeline    :2026-12-03, 2026-12-12
    Phase 9: Deep Document Content & OCR       :2026-12-13, 2026-12-24
    Phase 10: AI Classification & NL Search     :2026-12-25, 2027-01-15
```

---

## 2. Detailed Milestone Specifications

### 🟢 MVP Delivery Scope (Phases 1 through 6)

#### Phase 0: Technical Architecture Blueprint (Current)
- **Goal**: Complete system architecture, database schema, IPC protocol, threat modeling, and implementation blueprint.
- **Deliverables**: Complete documentation suite (`ARCHITECTURE.md`, `DATABASE.md`, `API.md`, etc.) and Architecture Decision Records (ADRs).

#### Phase 1: Filesystem Engine, SQLite Layer & Stability Watcher
- **Goal**: Build the core headless daemon that watches the Inbox, verifies file lock release, streams SHA-256 hashes, and records files in SQLite.
- **Deliverables**:
  - `packages/database`: SQLite 3 WAL schema, connection manager, migration runner.
  - `apps/engine/watcher`: Chokidar wrapper with debounce and active Windows lock checker (`isFileLocked`).
  - Unit & Integration tests for lock acquisition, hash streaming, and SQLite persistence.

#### Phase 2: Naming Engine, Folder Templates & Safe Two-Phase Mover
- **Goal**: Implement token-based string interpolation, path sanitization, and the two-phase transactional staging mover.
- **Deliverables**:
  - `apps/engine/naming`: Template engine for `{Client}`, `{Project}`, `{Year}`, `{Version}`.
  - `apps/engine/organization`: Two-phase mover (`copy -> verify sha256 -> atomic rename`).
  - Fault-injection tests for disk-full and abort recovery.

#### Phase 3: Version Lineage & Collision Engine
- **Goal**: Canonical integer versioning, parent-child DAG lineage tracking in SQLite, and collision policies (`AUTO_INCREMENT`).
- **Deliverables**:
  - `apps/engine/versioning`: Version parser regexes and database lineage graph.
  - Version increment and rollback tests.

#### Phase 4: SQLite FTS5 Search & Indexing Engine
- **Goal**: Sub-millisecond full-text search across indexed files, clients, projects, and metadata.
- **Deliverables**:
  - `apps/engine/search`: FTS5 query parser with BM25 ranking, tokenization, and trigger synchronization.

#### Phase 5: Electron Desktop UI & System Tray Agent
- **Goal**: Build the lightweight desktop UI (React + Tailwind) and Windows Tray agent with auto-start and IPC communication.
- **Deliverables**:
  - `apps/desktop`: Electron main/preload/renderer processes.
  - Windows System Tray menu (Status, Open Dashboard, Scan Now, Pause, Exit).
  - Main Dashboard with recent files, storage stats, and system status widgets.

#### Phase 6: Review Queue & Feedback Learning Loop (MVP Milestone)
- **Goal**: Complete the human-in-the-loop review interface for ambiguous files, with adaptive client alias learning.
- **Deliverables**:
  - Electron Review Queue screen with side-by-side proposal editor and one-click resolution.
  - Alias auto-learning module in `classification`.
  - **MVP Release Candidate Package** (`FolderMate-Setup-1.0.0.exe`).

---

### 🟡 Phase 7–9: Advanced Integrations & Prepress Features

#### Phase 7: CorelDRAW C# Out-of-Process COM Bridge
- **Goal**: Standalone C# .NET 8 CLI bridge for CorelDRAW 2020–2024 automation.
- **Capabilities**: Active document detection, "Save as New Version" COM trigger, prepress PDF publishing, and thumbnail export.

#### Phase 8: Cryptographic Deduplication & Audit History Timeline
- **Goal**: Content-based duplicate detection, hardlink/symlink space savers, and visual audit history timeline.

#### Phase 9: Deep Document Content & Local OCR
- **Goal**: Background text extraction from CDR XML internals, PDF text streams, and offline OCR for scanned assets.

---

### 🟣 Phase 10: Experimental / AI Enhancements

#### Phase 10: AI-Assisted Semantic Classification & Natural Language Search
- **Goal**: Optional, privacy-preserving LLM assistant for highly unstructured or cryptic filenames (e.g. `final_final_submission_print_ok_revised_3.cdr`).
- **Capabilities**:
  - Semantic entity extraction for unusual client/project names.
  - Natural language search queries (e.g. *"Show me last month's brochures for ABC School"*).
  - Local ONNX / Ollama support + optional OpenAI/Gemini API keys.
