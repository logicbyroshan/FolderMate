# FolderMate Architecture Memory

## Repository structure
- `apps/engine`: background daemon process
- `apps/desktop`: Electron app shell and renderer
- `packages/config`: schema + config loader
- `packages/database`: SQLite repositories and migrations
- `packages/shared`: shared runtime utilities and IPC contracts
- `bridges/coreldraw-bridge`: native integration bridge for CorelDRAW automation
- `docs`: design and architecture writing
- `tests`: unit and end-to-end coverage

## Runtime architecture
The system is split into two major processes:

1. Engine daemon
   - watches the inbox
   - classifies files
   - runs versioning and move logic
   - manages review queue behavior
   - exposes RPC over pipe

2. Desktop process
   - hosts the user experience
   - connects to the engine
   - surfaces events and calls into the daemon through IPC
   - remains lightweight and can be minimized to background tray behavior

## Data flow
1. A file enters the configured inbox.
2. The engine validates stability and integrity requirements.
3. Classification identifies client, project, year, and version.
4. The file is either auto-organized or queued for review.
5. A safe mover stages and verifies the file before final placement.
6. SQLite records the result and search data.
7. The UI receives event updates from the engine.

## Data / persistence model
- SQLite is the source of truth for repository state.
- WAL mode is used for operational throughput and journaling.
- FTS5 provides searchable metadata and document indexing.
- Repository modules are grouped by domain: clients, projects, files, versions, rules, events, search, and review queue.

## IPC model
- Engine exposes a named-pipe listener.
- Clients establish a connection using a shared token from `AuthManager`.
- RPC calls are dispatched through `rpc-dispatcher` and resolved to domain handlers.
- Server-sent event notifications push engine activity to connected clients.

## External integrations
- CorelDRAW is handled through a specialized adapter and external bridge, keeping the main engine from directly owning COM-managed runtime behavior.
- Folder customization and Windows Explorer styling are treated as a dedicated integration concern rather than core business logic.

## Current architectural patterns
- Domain-first modular separation
- Database-backed rich metadata model
- Event-driven file ingestion pipeline
- Safety-first file movement semantics
- UI/daemon decoupling via IPC
- Config-driven runtime behavior
