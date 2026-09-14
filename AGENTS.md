# FolderMate Agent Operating Manual

## 0. Mandatory branch and PR workflow
This repository requires a strict Git workflow for every meaningful change.

1. All work must begin on a dedicated branch with a purpose-specific name such as `feat/...`, `fix/...`, `bug/...`, `chore/...`, or `docs/...`.
2. No direct commits to `main` are allowed.
3. Each logical task must be split into clean, reviewable commits.
4. After the branch is ready, it must be pushed to the remote repository.
5. A pull request must be created with `gh pr create` using the GitHub CLI.
6. The PR must be merged only through `gh pr merge` using the GitHub CLI.
7. Branches must be deleted after merge when the repository policy requires cleanup.
8. The default path for collaboration is: branch -> commit(s) -> push -> PR -> merge via gh CLI.

This rule is the first operational requirement for all future work.

## 1. Project overview
FolderMate is a Windows-focused desktop automation platform for organizing and versioning design and business files. It watches an Inbox, classifies incoming work by client/project/year, applies naming templates, performs safe two-phase moves, stores metadata in SQLite, and optionally routes low-confidence files to a review queue.

The codebase is a TypeScript monorepo with:
- `apps/desktop`: Electron + React desktop shell
- `apps/engine`: background daemon and orchestration layer
- `packages/config`: configuration loading and validation
- `packages/database`: SQLite repository layer and migrations
- `packages/shared`: cross-process IPC/client contracts and shared constants

## 2. Architecture summary
The application is intentionally split into a background daemon and a desktop UI.

- The desktop UI is a React/Electron app with a main process, preload bridge, and renderer UI.
- The engine runs as a separate Node process and owns file ingestion, file movement, classification, versioning, and IPC.
- Communication between UI and engine uses a Named Pipe JSON-RPC protocol over `\\.\pipe\foldermate-ipc` with a shared authentication token.
- The database is SQLite in WAL mode with FTS5 search, transactional repositories, and migration scripts.
- CorelDRAW integration is isolated behind an adapter and an external .NET bridge, not embedded directly in the main engine.

## 3. Important directories
- `apps/engine/src`: background daemon implementation
- `apps/desktop/src`: Electron shell and React UI
- `packages/database/src`: SQLite schema, repositories, migrations
- `packages/config/src`: runtime config schema and loader
- `packages/shared/src`: shared runtime contracts and IPC client
- `bridges/coreldraw-bridge`: .NET bridge for CorelDRAW COM automation
- `tests`: integration/unit test coverage
- `docs`: design and architecture documentation

## 4. Important files
- `package.json`: workspace scripts and root toolchain
- `apps/engine/src/index.ts`: engine bootstrap and subsystem startup
- `apps/engine/src/ipc/ipc-server.ts`: named-pipe server
- `apps/engine/src/ipc/rpc-dispatcher.ts`: command dispatch router
- `apps/desktop/src/main/index.ts`: Electron app bootstrap and IPC bridging
- `packages/config/src/schema.ts`: config validation schema
- `packages/database/src/index.ts`: database access entry point
- `README.md`: user-facing project overview
- `CHANGELOG.md`: baseline changelog history for the repository

## 5. How the project works
1. Files land in a configured inbox directory.
2. The engine watches for file changes, debounces them, and validates that the file is stable before processing.
3. The classification pipeline matches client/project/year/version information using rules, aliases, and heuristics.
4. Confidence scoring determines whether a file is auto-organized or routed to review.
5. The two-phase mover copies/stages the file, verifies integrity, then moves it to the final target path.
6. Metadata and audit information are persisted in SQLite and surfaced through the desktop UI.
7. The UI queries the engine over IPC and listens to server-sent events for real-time updates.

## 6. Development commands
Use the workspace scripts defined in the root `package.json`.

- Install dependencies: `npm install`
- Run full app stack: `npm run dev`
- Run engine only: `npm run dev:engine`
- Run desktop UI only: `npm run dev:desktop`
- Run browser-accessible dev UI: `npm run dev:browser`
- Build all workspaces: `npm run build`
- Run tests: `npm test`
- Run lint: `npm run lint`
- Build Windows bridge: `npm run build:bridge`

## 7. Testing and build rules
- Prefer the existing Vitest suite over ad hoc checks.
- Use the smallest targeted validation command relevant to the change.
- Do not add test-only production APIs.
- Make sure new behavior is exercised with real functional tests when possible.
- Preserve the repo’s existing build structure unless there is a strong reason to change it.

## 8. Existing coding conventions
Follow the conventions already present in the repository, not generic best-practice preferences.

- TypeScript is the primary language across the monorepo.
- Modular organization by domain is preferred; subfolders match feature roles such as `classification`, `organization`, `review`, `versioning`, `ipc`, and `integrations`.
- File names are descriptive and domain-oriented.
- Imports are path- and package-based; package aliases such as `@foldermate/config` are used where the repository already expects them.
- `DatabaseManager` and repository patterns are the underlying persistence abstraction.
- The project uses strong domain objects and config-driven behavior rather than hardcoded runtime assumptions.

## 9. Naming and file-organization rules
- Keep directories aligned with existing architectural boundaries.
- Do not create broad new abstraction layers unless the existing code clearly requires them.
- Preserve existing names where the code already uses them.
- Favor domain terminology already established in `classification`, `review`, `organization`, `versioning`, and `ipc`.

## 10. Security rules
- Never store secrets in repository files or memory files.
- Treat all file system paths as untrusted input until normalized and checked against configured roots.
- Respect the project’s intent to isolate system-level integrations (CorelDRAW, shell operations, IPC) behind controlled adapters.
- Keep authentication and authorization patterns aligned with the existing Named Pipe token flow.

## 11. Dependency and toolchain rules
- Do not add or remove dependencies casually.
- Respect the current TypeScript/Vite/Vitest/esbuild toolchain unless the task requires a small, explicit change.
- When a dependency change is necessary, document it in the changelog and relevant memory files.

## 12. Git and change rules
- The repository already contains baseline project docs and a changelog at `CHANGELOG.md`; do not rewrite or reformat those without a specific, intentional reason.
- Prefer minimal, targeted edits.
- If a change materially affects architecture, configuration, security, or data model semantics, update the project memory and relevant design docs.
- Do not silently change long-standing architectural decisions.

## 13. Rules for modifying existing code
- Do not refactor unrelated code.
- Do not optimize unrelated logic.
- Do not perform opportunistic cleanup.
- Do not rewrite working systems just to make them “cleaner.”
- If a bug is discovered, record it in `.agent-memory/KNOWN_ISSUES.md` before any fix is considered.

## 14. Rules for adding features
- Keep the feature aligned with the current architecture of engine + desktop + SQLite + IPC.
- Prefer reusing existing services and repositories over introducing duplicate patterns.
- Ensure the feature has a clear data flow and configuration surface.
- Add or update tests for meaningful behavior.

## 15. Rules for debugging
- Reproduce the issue before changing code.
- Investigate actual system boundaries: engine, database, IPC, file system, or UI.
- Prefer narrow reads and targeted searches over broad repository scans.
- Validate the root cause with the smallest relevant check.

## 16. Documentation rules
- Keep project docs synchronized with the actual implementation.
- If a feature or architecture change is intentional, update the memory files and changelog as appropriate.
- Preserve the project’s existing documentation structure and tone.

## 17. `.agent-memory` rules
The repository includes a persistent memory folder at `.agent-memory/`.

Use it as the project’s operational memory system. The high-level intent is:
- keep durable project understanding,
- preserve architectural context,
- document known issues,
- store important decisions,
- track meaningful work,
- reduce unnecessary rereads.

For future work:
1. Read the relevant agent instructions.
2. Read the relevant memory files before acting.
3. Inspect current implementation only where necessary.
4. Keep memory synchronized with actual project reality.

## 18. Known repository constraints
- The project is Windows-oriented and expects native filesystem and COM behavior on Windows hosts.
- The engine depends on local filesystem roots and named-pipe IPC, not browser-only web hosting.
- The desktop shell and engine are intentionally decoupled and should remain so unless a specific task requires a deeper architectural change.
- The project contains architecture documents and design docs that should be treated as implementation context, not as a substitute for reading the actual code when required.

## 19. Future change discipline
When making meaningful changes:
- update `.agent-memory/CURRENT_STATE.md`
- update `.agent-memory/TASK_HISTORY.md`
- update `.agent-memory/KNOWN_ISSUES.md` if relevant
- update `.agent-memory/DECISIONS.md` for significant design decisions
- update `CHANGELOG.md` for meaningful project changes
- update `AGENTS.md` only when repository rules materially change

## 20. Bottom line
This repository is a production-style Windows automation system with a decoupled engine, SQLite persistence, named-pipe IPC, Electron UI, inspection/organization logic, and a CorelDRAW bridge. Future agents should respect the repository’s architecture and preserve its current conventions unless a task explicitly requires otherwise.
