# FolderMate Developer Setup & Engineering Guide

## 1. Prerequisites & Environment Setup

FolderMate requires the following developer toolchain on Windows 10/11 (x64):

| Tool | Minimum Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v20.10.0 LTS` or higher | Core Engine Daemon and Electron runtime |
| **pnpm / npm** | `npm v10+` or `pnpm v9+` | Monorepo package management |
| **.NET SDK** | `.NET 8.0 SDK` | CorelDRAW COM Bridge CLI compilation |
| **Visual Studio Build Tools** | `VS 2022 C++ Workload` | Compiling native node modules (`better-sqlite3`) |
| **Git** | `2.40+` | Version control |

---

## 2. Monorepo Structure & Workspace Scripts

FolderMate is organized as a modular TypeScript monorepo:

```text
FolderMate/
├── apps/
│   ├── desktop/          # Electron + React User Interface
│   └── engine/           # Background Engine Daemon
├── bridges/
│   └── coreldraw-bridge/ # C# .NET 8 Out-of-Process COM Bridge
├── packages/
│   ├── shared/           # Shared types, Zod schemas, IPC definitions
│   ├── database/         # SQLite Drizzle / better-sqlite3 layer
│   └── config/           # App configuration schemas & defaults
```

### 2.1. Key NPM Scripts

```bash
# 1. Install all dependencies across monorepo packages
npm install

# 2. Build the C# CorelDRAW COM bridge
npm run build:bridge

# 3. Run database migrations to create local SQLite schema
npm run db:migrate

# 4. Seed sample test clients, projects, and rules
npm run db:seed

# 5. Start both background engine and Electron UI concurrently in dev mode
npm run dev

# 6. Run all unit and integration tests
npm test

# 7. Run fault injection / chaos tests
npm run test:chaos

# 8. Package production Windows installer (NSIS / MSI)
npm run package:win
```

---

## 3. Debugging Workflows

### 3.1. Debugging the Background Engine Daemon
In Visual Studio Code, use the preconfigured `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Engine Daemon",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:engine"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Electron Desktop App",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev:desktop"]
    }
  ]
}
```

### 3.2. Debugging the CorelDRAW COM Bridge
To test and debug COM operations standalone from PowerShell:

```powershell
# Navigate to bridge directory
cd bridges/coreldraw-bridge

# Build in Debug configuration
dotnet build

# Query active CorelDRAW status
dotnet run -- status

# Trigger test version save
dotnet run -- save-as-new-version --target "D:\Test\Sample v8.cdr"
```

---

## 4. Packaging & Installer Generation

Production builds use `electron-builder` with standard Windows signing and NSIS / MSI target outputs:

- **Installer Output**: `dist/FolderMate-Setup-1.0.0.exe`
- **Embedded Components**:
  - `foldermate-engine.exe` (Standalone packaged engine binary or Node runtime)
  - `FolderMate.CorelBridge.exe` (Published single-file C# binary)
  - `foldermate.exe` (Electron UI wrapper with Tray auto-start)
- **Windows Startup Integration**: Registers in `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` on first user configuration.
