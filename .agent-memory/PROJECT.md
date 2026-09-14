# FolderMate Project Memory

## Purpose
FolderMate is a Windows-focused desktop automation system for organizing files in a structured, repeatable way. It watches an inbox, interprets file names and metadata, routes files into client/project/year structures, preserves version history, and exposes status through a desktop UI.

## Primary users / use cases
- Offices or design studios receiving mixed files from multiple sources
- Users who need consistent file naming and folder placement
- Teams that need version-safe file handling and auditability
- Administrators that want a review queue for ambiguous names or low-confidence classification

## Stack
- TypeScript monorepo
- Electron for desktop UI shell
- React for renderer UI
- Node.js runtime for the engine and daemon logic
- SQLite for persistence and search
- Vite for UI build/dev tooling
- Vitest for testing
- esbuild for workspace bundling
- chokidar for file watching
- Windows Named Pipe IPC for engine/UI communication
- .NET CorelDRAW bridge for design-file integration

## Major integrations
- CorelDRAW automation via `bridges/coreldraw-bridge`
- File-system watching and organization via engine pipeline
- SQLite FTS5 search and WAL transaction handling
- Desktop shell integration via Electron tray and window lifecycle

## Constraints
- The product is designed for Windows execution and Windows folder semantics.
- The UI and daemon are intentionally decoupled.
- The system is built around safe file movement, not destructive write patterns.
- Native integration points such as CorelDRAW COM and folder customization are treated as isolated subsystems.

## Current maturity
The repository contains a substantial implementation and a documented architecture, with a formal set of modules for classification, storage, IPC, review, versioning, and UI workflow. It is production-oriented in structure and scope, though some platform-specific behaviors require real Windows validation.
