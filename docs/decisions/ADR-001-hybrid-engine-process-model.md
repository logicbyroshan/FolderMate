# ADR-001: Hybrid Background Daemon with Named Pipe IPC

## Status
`ACCEPTED` (2026-09-11)

## Context
FolderMate is designed as a background-first Windows application that must continuously watch folders, detect file modifications, execute lock checks, and organize files 24/7. 

When users close the Electron desktop interface, file watching and organization must not stop. Furthermore, running a full Chromium/Electron UI in the background consumes 150MB–300MB of RAM, which is unacceptable for a silent utility on designer workstations.

## Decision
We decouple FolderMate into two independent execution domains:
1. **Background Engine Daemon (`foldermate-engine.exe`)**: A lightweight Node.js/TypeScript daemon running continuously in the background (or minimized to the Windows System Tray) with an idle RAM footprint of $<50\text{MB}$.
2. **Desktop UI (`foldermate.exe`)**: A modern Electron + React application that launches on demand or hides to the system tray.
3. **IPC Protocol**: Inter-process communication between the UI and Engine utilizes **Windows Named Pipes** (`\\.\pipe\foldermate-ipc`) with JSON-RPC 2.0 framing and local ephemeral token authentication.

## Consequences
### Positive
- The engine runs silently with negligible resource consumption even when the UI is closed.
- Crashing or restarting the UI does not interrupt ongoing file moves, lock checks, or database transactions.
- Zero-latency IPC on Windows via Named Pipes.

### Negative / Mitigations
- Requires managing two processes and ensuring proper process lifecycles.
- *Mitigation*: Windows auto-start installer registers the engine daemon; the Electron UI seamlessly reconnects on launch.
