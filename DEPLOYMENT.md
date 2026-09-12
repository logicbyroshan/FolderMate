# FolderMate — Production Deployment & Distribution Guide

This document outlines the deployment, packaging, auto-start configuration, and Windows release lifecycle for **FolderMate**.

---

## 1. Distribution Architecture

FolderMate is distributed as a native Windows desktop package containing two coordinated runtime subsystems:

```
+-----------------------------------------------------------------------+
| FolderMate Windows Application Bundle                                 |
|                                                                       |
|  +---------------------------+       +-----------------------------+  |
|  | Electron Desktop UI       |       | Node.js Daemon Engine       |  |
|  | (React 18 + Vite)         | <===> | (File Watcher + Movers)     |  |
|  +---------------------------+  IPC  +-----------------------------+  |
|               |                                     |                 |
|               |                             Win32 Named Pipe          |
|               |                                     |                 |
|               |                      +-----------------------------+  |
|               |                      | FolderMate.CorelBridge.exe  |  |
|               |                      | (.NET 8/10 COM Bridge)      |  |
|               |                      +-----------------------------+  |
|               |                                     |                 |
|               |                              CorelDRAW COM API        |
|               v                                     v                 |
|  [ Windows System Tray ]             [ CorelDRAW 2020 - 2024 ]        |
+-----------------------------------------------------------------------+
```

---

## 2. Production Build Pipeline

### Prerequisites
- **Node.js**: v20.x or v22.x+ (Node 24 with native SQLite support)
- **.NET SDK**: v8.0 or v10.0 Windows SDK (`dotnet`)
- **Visual Studio Build Tools**: C++ build tools (optional if using built-in node:sqlite)
- **Windows OS**: Windows 10/11 x64

### Build Steps

```powershell
# 1. Install all dependencies across monorepo workspaces
npm install

# 2. Build .NET CorelDRAW COM Bridge
dotnet build bridges/coreldraw-bridge -c Release

# 3. Build Background Engine & Database
npm run build --workspace=@foldermate/database
npm run build --workspace=@foldermate/engine

# 4. Build Desktop Renderer, Preload, and Main bundles
npm run build --workspace=@foldermate/desktop

# 5. Run full verification test suite
npm test
```

### Packaging Windows Installer (NSIS & Portable)

```powershell
# Generate NSIS Installer (.exe) and Portable standalone
npm run package:win
```

The output installers will be generated under `apps/desktop/release/`:
- `FolderMate-Setup-1.0.0.exe` (NSIS Wizard with shortcut generation)
- `FolderMate-1.0.0.exe` (Portable executable)

---

## 3. Windows Service & Auto-Start Configuration

FolderMate registers in the Windows Registry to launch silently in the background at user logon without popping up windows:

### Registry Entry (User Run Key)
```registry
[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run]
"FolderMate"="\"C:\\Program Files\\FolderMate\\FolderMate.exe\" --minimized --background"
```

### Background Daemon Execution
When launched with `--minimized` or `--background`:
1. The background file watcher starts immediately on the designated `inboxPath`.
2. Win32 Named Pipe server (`\\.\pipe\foldermate-ipc`) opens for local IPC connections.
3. The System Tray icon initializes with status indicators.
4. The main GUI window remains hidden until clicked or double-clicked from the System Tray.

---

## 4. Database Initialization & Auto-Migration

FolderMate stores user application data under `%APPDATA%\FolderMate\`:
- `foldermate.db`: SQLite database in WAL (Write-Ahead Logging) mode.
- `config.json`: User runtime configuration.
- `.auth_token`: Cryptographically generated 256-bit authentication token for local IPC handshakes.
- `logs/`: Rotating application audit and diagnostic logs.

On startup, `DatabaseManager` runs schema migrations located in `packages/database/src/migrations/` sequentially inside atomic transactions.

---

## 5. Security & Isolation

- **Preload Sandboxing**: Context isolation is strictly enabled (`contextIsolation: true`, `nodeIntegration: false`).
- **IPC Handshake**: Named Pipe requests are rejected unless accompanied by the 256-bit `%APPDATA%\FolderMate\.auth_token` shared secret.
- **Path Sanitization**: `assertPathWithinRoot` enforces path traversal protection on all move and copy operations.
- **Out-of-Process COM**: CorelDRAW COM interactions run isolated in `FolderMate.CorelBridge.exe` to prevent third-party crashes from impacting the core organization engine.
