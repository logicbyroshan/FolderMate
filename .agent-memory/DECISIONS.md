# FolderMate Decision History

## 2026-09-14
Decision: Preserve the repository’s existing architecture and treat the project as a Windows-native engine + Electron desktop split.
Context: The codebase is organized into an engine daemon, database layer, shared runtime contracts, and desktop UI. The docs and source confirm deliberate separation between long-running file processing and user interaction.
Reason: This boundary is central to the project’s file safety, responsiveness, and OS integration model.
Alternatives: A monolithic single-process implementation or a browser-only architecture would conflict with the repo’s design and platform assumptions.
Consequences: Future changes should respect the engine/UI split, IPC, config-driven organization, and database-first persistence model.
