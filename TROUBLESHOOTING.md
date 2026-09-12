# FolderMate — Troubleshooting & Diagnostics Guide

This document provides resolutions for common operational, integration, and runtime scenarios in **FolderMate**.

---

## 1. File Watcher & Ingestion Issues

### Symptom: Files saved to the Inbox folder are not being organized.
- **Cause 1: Active File Lock**: Applications like CorelDRAW, Adobe Illustrator, or Microsoft Office keep files locked with exclusive write access during active editing. FolderMate's `waitForFileStability` deliberately waits until locks are released before touching the file.
  - **Resolution**: Save and close the document in the authoring application. FolderMate will detect stability and process the file within 2–5 seconds.
- **Cause 2: Ignored File Extension**: Temporary files (`.tmp`, `.part`, `.crswap`, `.lock`) are ignored by default.
  - **Resolution**: Check `Settings -> Ingestion -> Ignored Extensions` to ensure the target extension is not on the ignore list.
- **Cause 3: Watcher Paused**: The watcher may be paused via the System Tray menu.
  - **Resolution**: Right-click the FolderMate icon in the System Tray and click `Resume File Watcher`.

---

## 2. CorelDRAW Integration Issues

### Symptom: "CorelDRAW is not responding" or "Bridge disconnected".
- **Cause 1: COM Application Registration**: CorelDRAW COM ProgIDs (`CorelDRAW.Application`) may not be properly registered in the Windows Registry if installed via an atypical package or without admin rights.
  - **Resolution**: Start CorelDRAW as Administrator once, or run `bridges/coreldraw-bridge/bin/Release/net8.0-windows/FolderMate.CorelBridge.exe --inspect` to test direct COM binding.
- **Cause 2: Bit Architecture Mismatch**: Running a 32-bit CorelDRAW version on 64-bit Windows requires the bridge to match bitness.
  - **Resolution**: The .NET bridge supports AnyCPU/x64 and automatically inspects fallback `.cdr` Zip archives if active COM is unavailable.

---

## 3. Review Queue & Classification

### Symptom: Files frequently enter the Review Queue instead of organizing automatically.
- **Cause 1: Confidence Below Threshold**: When the combined confidence score is below the configured threshold (default: 85%), FolderMate prioritizes data safety over guessing.
  - **Resolution**:
    1. Navigate to **Review Queue** in the desktop UI.
    2. Select the client and click **Resolve**.
    3. Ensure **Learn Alias** is checked. Subsequent files with that naming convention will now be classified automatically with high confidence.
- **Cause 2: Unregistered Client or Project**: The client name or alias is missing from the database.
  - **Resolution**: Add the client name or alias in **Clients** view.

---

## 4. Database & Storage Recovery

### Symptom: Storage volume disconnected or network drive dropped mid-operation.
- **Safety Mechanism**:
  1. The `TwoPhaseMover` writes first to a temporary staging file (`.foldermate_staging_*.tmp`) on the target volume.
  2. If the operation fails or crashes, no database record is committed, and orphaned staging files are purged upon restart.
  3. Safe Mode retains an original backup copy under the Inbox `_Archived/` directory.

---

## 5. IPC Connection Diagnostics

### Symptom: Desktop UI displays "Connecting to FolderMate Engine..." indefinitely.
- **Verification**:
  1. Check if the engine process is running:
     ```powershell
     Get-Process -Name node | Where-Object { $_.CommandLine -like "*engine*" }
     ```
  2. Verify that `%APPDATA%\FolderMate\.auth_token` exists and is accessible.
  3. Verify that the Named Pipe `\\.\pipe\foldermate-ipc` is created:
     ```powershell
     [System.IO.Directory]::GetFiles("\\.\\pipe\\") -match "foldermate"
     ```
