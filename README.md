# FolderMate

> **Your files organize themselves.**

FolderMate is an intelligent, zero-idle Windows desktop service and lightweight desktop application. It automatically watches your inbox, classifies incoming deliverables, applies standardized naming conventions, increments versions safely, and organizes files into clean directory hierarchies with native Windows folder color coding.

---

## ⚡ What is FolderMate?

In busy office, prepress, and design environments, users constantly save files with arbitrary names like `abc final.cdr`, `id card latest v2.pdf`, or `student data new.xlsx`. Finding files later or managing versions becomes chaotic.

**FolderMate solves this quietly in the background:**
1. **Drop Any File in Inbox** $\rightarrow$ `C:\FolderMate\Inbox\abc id card 2026.cdr`
2. **Autonomous Engine Classifies & Versions** $\rightarrow$ Extracts Client (`ABC School`), Year (`2026`), Project (`ID Card`), and next Version (`v8`).
3. **Safe Two-Phase Move** $\rightarrow$ Instantly files to `D:\Clients\ABC School\2026\ID Card\ABC School ID Card 2026 v8.cdr` with zero data loss risk.
4. **Native Windows Folder Appearance** $\rightarrow$ Automatically styles client & project folders with customizable colors and icons directly in Windows Explorer.

---

## 🚀 Key Features

| Feature | Description | Status |
| :--- | :--- | :---: |
| 🛡️ **Zero-Idle Background Daemon** | Consumes <0.05% CPU and 0 KB/s disk I/O when idle. Bounded memory footprint (~32 MB). | **Production** |
| 🔒 **Two-Phase Safe File Move** | Hash validation + copy verification ensures zero data corruption or silent file overwrite. | **Production** |
| 🏷️ **Multi-Tier Classification** | Client dictionary, regex tokenization, year extraction, and confidence scoring. | **Production** |
| 🎨 **Native Windows Folder Colors** | Customizes Windows Explorer folder colors (Amber, Blue, Green, Red) via native `desktop.ini`. | **Production** |
| 📈 **Automated Version Tracking** | Detects existing deliverables and increments versions (`v1` $\rightarrow$ `v2` $\rightarrow$ `v3`) automatically. | **Production** |
| 👁️ **Review Queue** | Routes low-confidence files to a 1-click human review queue instead of guessing. | **Production** |
| ⚡ **Sub-Millisecond Search** | Instant full-text search across 100,000+ files using embedded SQLite FTS5 engine. | **Production** |
| ⌨️ **Command Center (`Ctrl+K`)** | Keyboard-first search, navigation, and rule management in a refined dark UI. | **Production** |
| 🔌 **CorelDRAW COM Integration** | Communicates with CorelDRAW for live document detection and version exports. | **Production** |

---

## 🏗️ How It Works

```text
  Windows File Event (Inbox)
              ↓
  In-Memory StatCache & Debounce (1.5s)
              ↓
  Non-Destructive File Lock Check
              ↓
  Multi-Tier Classification (Rules → Aliases → Heuristics)
              ↓
  Confidence Check (≥ 0.85?)
      ├─ YES ──→ Two-Phase Atomic Move & Versioning
      │                 ↓
      │          SQLite WAL Indexing & Audit Log
      │                 ↓
      │          Windows Folder Color & Icon Customizer
      │                 ↓
      │          Push Event to Desktop UI
      │
      └─ NO  ──→ Route to Review Queue for 1-Click Confirmation
```

---

## 🎨 Design System & UI

FolderMate features a standardized, cohesive dark theme engineered for comfortable daily office use:
- **Surface Palette**: Deep obsidian and charcoal glass surfaces.
- **Warm Amber Accent**: Constrained to 2–5% visible area for primary focus and key actions.
- **Reusable Component Primitives**: Standardized Buttons, Inputs, Modals, Badges, Toasts, and Command Palette.

---

## 📦 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.x LTS` or higher
- **Windows**: `10 / 11 (x64)`

### 2. Installation & Launch
```bash
# Clone the repository
git clone https://github.com/logicbyroshan/FolderMate.git
cd FolderMate

# Install workspace dependencies
npm install

# Run full build across all packages
npm run build

# Run test suite (35 tests across 12 test suites)
npm test

# Launch background engine daemon & desktop UI
npm run dev
```

---

## 📚 Documentation Index

### 👥 User Documentation
- [User Guide & Operations Handbook](file:///e:/E/FolderMate/docs/USER_GUIDE.md) — Comprehensive guide to daily usage, review queues, and folder rules.

### 🛠️ Technical & Developer Documentation
- [Architecture Overview](file:///e:/E/FolderMate/docs/ARCHITECTURE.md) — Process model, Named Pipe IPC, and subsystem lifecycles.
- [UI Design System Specification](file:///e:/E/FolderMate/docs/DESIGN_SYSTEM.md) — Design tokens, component inventory, and consistency matrix.
- [Performance Benchmarks](file:///e:/E/FolderMate/docs/PERFORMANCE.md) — Zero-idle metrics, memory limits, and FTS5 query latency.
- [Architecture Decision Records (ADRs)](file:///e:/E/FolderMate/docs/decisions/) — ADR-001 through ADR-008.

---

## 🛡️ Data Safety Guarantee
FolderMate prioritizes **File Safety above all else**. It never performs destructive file operations without verified copy integrity, provides Safe Mode archival staging, and isolates external COM integrations to guarantee zero application hangs.

---

## 📄 License
Proprietary & Confidential. All rights reserved. FolderMate 2026.
