# FolderMate User Guide & Operations Handbook

Welcome to **FolderMate**! This guide walks you through daily workflows, client configuration, review queues, and folder customization.

---

## 1. Core Workflow Overview

FolderMate works automatically in the background. Your daily workflow is as simple as saving or dragging files into your **Inbox**.

```text
Save / Drop File in Inbox
          ↓
FolderMate Analyzes in Background (<50ms)
          ↓
Files Stored in Library under Client / Year / Project
          ↓
Folder Color & Icon Automatically Applied
```

---

## 2. Directory Setup & Configuration

Under **Settings**, configure your three primary working paths:

| Directory | Default | Purpose |
| :--- | :--- | :--- |
| **Inbox** | `C:\FolderMate\Inbox` | Drop zone watched by FolderMate. Save work here. |
| **Library** | `D:\Clients` | Destination where organized folders and files live. |
| **Archive** | `D:\Archive` | Storage for retired projects or safe-mode originals. |

---

## 3. Managing Clients & Projects

To ensure 100% accurate classification:
1. Navigate to **Clients** (or press `Ctrl+K` $\rightarrow$ *Register New Client*).
2. Enter the **Client Name** (e.g. `Greenwood High School`).
3. (Optional) Provide a **Client Code** (e.g. `GHS`) and **Aliases** (e.g. `Greenwood, GW High`).
4. Click **Add Project** under the client to define deliverable categories (e.g. `ID Card`, `Magazine`, `Brochure`) with year scopes.

---

## 4. Understanding the Review Queue

When a file has ambiguous names (e.g. `draft final.cdr` without a client name), FolderMate will **never guess**. Instead, it routes the file to the **Review Queue**:

- **Review Badge**: The dashboard displays a notification badge when items need attention.
- **1-Click Resolution**: Select the file, pick the intended Client, Project, and Category from the dropdowns.
- **Instant Organization**: Click **Organize File**—FolderMate immediately moves the file into its proper location and learns the association for the future.

---

## 5. Folder Appearance & Color-Coding Rules

You can customize how folders appear in Windows Explorer:

1. Open **Rules & Templates** $\rightarrow$ **Folder Appearance Rules**.
2. Select a rule scope:
   - **Active Clients** $\rightarrow$ Yellow / Amber icon
   - **Active Design Projects** $\rightarrow$ Blue icon
   - **Approved / Completed** $\rightarrow$ Green icon
   - **Rush / High Priority** $\rightarrow$ Red icon
   - **Archived Material** $\rightarrow$ Gray icon
3. Click **Apply Rules**—Windows Explorer folders are updated automatically with native `desktop.ini` configurations.

---

## 6. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` | Open Global Command Palette (Navigate views, search files, run actions) |
| `/` | Focus search bar in Search and Client views |
| `Escape` | Close active modal, dialog, or command palette |

---

## 7. Safety & Recovery

- **Safe Mode**: When enabled, original files from the Inbox are preserved in an `_Archived` subfolder rather than deleted.
- **Audit Log**: Every move, rename, and version increment is recorded with timestamps and cryptographic SHA-256 hashes in the local SQLite database.
- **Non-Destructive Collisions**: If a file with the same name exists, FolderMate automatically increments the version (`v1` $\rightarrow$ `v2`) so no work is overwritten.
