# FolderMate IPC & Local API Specifications

## 1. Protocol Architecture & Transports

FolderMate exposes an internal JSON-RPC 2.0 API over two local transports:

1. **Primary Transport**: Windows Named Pipe (`\\.\pipe\foldermate-ipc`).
2. **Secondary / Debug Transport**: Local WebSocket on loopback (`ws://127.0.0.1:49221`).

### 1.1. Security & Handshake Authentication
To prevent unauthorized local processes from interacting with the background engine:
1. When `foldermate-engine.exe` launches, it generates a 256-bit cryptographically secure token and writes it to `%APPDATA%\FolderMate\.auth_token`.
2. Windows Access Control Lists (ACLs) are set to restrict read permissions exclusively to the current Windows user SID.
3. Every IPC connection must send an initial `auth.handshake` message within 2000ms. Unauthenticated connections are forcefully severed.

```typescript
// Handshake Request
{
  "jsonrpc": "2.0",
  "id": "init-1",
  "method": "auth.handshake",
  "params": {
    "token": "a8f5c9e2b1d447a083f98216c024d2fe9485b0d738f72c3a59e19d7a8c3e8091",
    "clientVersion": "1.0.0",
    "clientType": "electron-ui"
  }
}

// Handshake Response
{
  "jsonrpc": "2.0",
  "id": "init-1",
  "result": {
    "authenticated": true,
    "daemonVersion": "1.0.0",
    "status": "running",
    "inboxPath": "C:\\FolderMate\\Inbox",
    "organizationRoot": "D:\\Clients"
  }
}
```

---

## 2. Standard Message Framing & Error Codes

### 2.1. Request & Response Structures

```typescript
// RPC Request
interface RPCRequest<T = Record<string, unknown>> {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: T;
}

// RPC Success Response
interface RPCSuccessResponse<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  result: T;
}

// RPC Error Response
interface RPCErrorResponse {
  jsonrpc: "2.0";
  id: string | number;
  error: {
    code: number;
    message: string;
    data?: Record<string, unknown>;
  };
}
```

### 2.2. Error Code Registry

| Error Code | Constant | Meaning |
| :--- | :--- | :--- |
| `-32700` | `PARSE_ERROR` | Invalid JSON received |
| `-32600` | `INVALID_REQUEST` | Malformed JSON-RPC structure |
| `-32601` | `METHOD_NOT_FOUND` | Method does not exist |
| `-32602` | `INVALID_PARAMS` | Parameter schema validation failed |
| `-32000` | `AUTH_FAILED` | Invalid or missing authentication token |
| `1001` | `FILE_NOT_FOUND` | Specified file ID or filesystem path does not exist |
| `1002` | `FILE_LOCKED` | File is currently locked or being written by another process |
| `1003` | `DESTINATION_EXISTS` | Target destination already exists without collision policy |
| `1004` | `PERMISSION_DENIED` | Windows filesystem access denied |
| `1005` | `HASH_MISMATCH` | Two-phase staging hash verification failed |
| `1006` | `DISK_FULL` | Insufficient disk space for staging or move |
| `2001` | `COREL_NOT_RUNNING` | CorelDRAW application is not open or not responding |
| `2002` | `COREL_COM_ERROR` | CorelDRAW COM automation method threw an exception |

---

## 3. Complete API Method Catalog

### 3.1. System & Health

#### `system.getStatus`
Returns engine daemon state, uptime, disk usage, active watchers, and queue metrics.
- **Params**: none
- **Result**:
```json
{
  "status": "idle",
  "uptimeSeconds": 14230,
  "inboxPath": "C:\\FolderMate\\Inbox",
  "organizationRoot": "D:\\Clients",
  "queue": {
    "pending": 0,
    "active": 0,
    "reviewRequired": 2,
    "failed": 0
  },
  "stats": {
    "totalOrganized": 1842,
    "totalClients": 48,
    "totalProjects": 112
  }
}
```

#### `system.triggerScan`
Forces an immediate re-scan of the configured Inbox folder.
- **Params**: `{ "recursive": boolean }`
- **Result**: `{ "scannedCount": number, "queuedCount": number }`

---

### 3.2. Files Subsystem

#### `files.list`
Retrieves a paginated list of tracked files with filtering and sorting.
- **Params**:
```json
{
  "page": 1,
  "pageSize": 50,
  "clientId": "uuid-optional",
  "projectId": "uuid-optional",
  "status": "organized",
  "sortBy": "created_at",
  "sortOrder": "desc"
}
```
- **Result**:
```json
{
  "items": [
    {
      "id": "f8a1e2-...",
      "originalName": "abc new final.cdr",
      "currentName": "ABC School ID Card 2026 v8.cdr",
      "currentPath": "D:\\Clients\\ABC School\\2026\\ID Card\\ABC School ID Card 2026 v8.cdr",
      "extension": ".cdr",
      "sizeBytes": 1458920,
      "clientName": "ABC School",
      "projectName": "ID Card",
      "year": 2026,
      "versionNumber": 8,
      "status": "organized",
      "confidenceScore": 0.94,
      "organizedAt": "2026-09-11T20:45:00.000Z"
    }
  ],
  "total": 1842,
  "page": 1,
  "pageSize": 50
}
```

#### `files.getById`
Retrieves comprehensive details for a file, including versions, lineage, and audit events.
- **Params**: `{ "id": "uuid" }`
- **Result**: Complete `FileDetailDTO` with versions, relationships, and history logs.

#### `files.organize`
Manually triggers organization for a detected or staged file.
- **Params**:
```json
{
  "fileId": "uuid",
  "clientId": "uuid",
  "projectId": "uuid",
  "year": 2026,
  "versionNumber": 8,
  "customName": "Optional Custom Name.cdr"
}
```
- **Result**: `{ "success": true, "newPath": "D:\\...", "versionNumber": 8 }`

#### `files.restoreVersion`
Restores an older historical version as the active version.
- **Params**: `{ "fileId": "uuid", "versionNumber": 6 }`
- **Result**: `{ "success": true, "restoredVersion": 6, "activePath": "D:\\..." }`

#### `files.openInExplorer`
Reveals the file in Windows File Explorer.
- **Params**: `{ "fileId": "uuid" }`
- **Result**: `{ "success": true }`

---

### 3.3. Review Queue Subsystem

#### `reviewQueue.list`
Returns files awaiting user approval or manual classification.
- **Params**: `{ "status": "pending" }`
- **Result**:
```json
{
  "items": [
    {
      "id": "rq-101",
      "fileId": "f-99",
      "originalPath": "C:\\FolderMate\\Inbox\\id card latest.cdr",
      "originalName": "id card latest.cdr",
      "proposedClientId": "c-101",
      "proposedClientName": "ABC School",
      "proposedProjectId": "p-202",
      "proposedProjectName": "ID Card",
      "proposedYear": 2026,
      "proposedVersion": 7,
      "proposedTargetPath": "D:\\Clients\\ABC School\\2026\\ID Card\\ABC School ID Card 2026 v7.cdr",
      "confidenceScore": 0.68,
      "reasons": [
        "Matched project keyword 'id card' (85%)",
        "Multiple client candidates found; defaulted to highest frequency 'ABC School' (62%)",
        "Year extracted from creation timestamp (99%)"
      ],
      "createdAt": "2026-09-11T20:55:12.000Z"
    }
  ]
}
```

#### `reviewQueue.resolve`
Resolves a review item by confirming or modifying proposed metadata.
- **Params**:
```json
{
  "reviewQueueId": "rq-101",
  "clientId": "c-101",
  "projectId": "p-202",
  "year": 2026,
  "versionNumber": 7,
  "learnAlias": true
}
```
- **Result**: `{ "success": true, "organizedPath": "D:\\..." }`

---

### 3.4. Clients & Projects

#### `clients.list`
Returns all registered clients and their configured aliases.

#### `clients.create`
- **Params**:
```json
{
  "name": "ABC School",
  "code": "ABCSCH",
  "aliases": ["ABC", "ABC School", "ABC-School", "ABCS"],
  "notes": "Primary educational client"
}
```

#### `projects.create`
- **Params**:
```json
{
  "clientId": "c-101",
  "name": "ID Card",
  "code": "IDC2026",
  "category": "Identity",
  "year": 2026
}
```

---

### 3.5. Search Subsystem

#### `search.query`
Executes an ultra-fast FTS5 BM25 search across indexed metadata, files, and tags.
- **Params**:
```json
{
  "query": "ABC School ID Card 2026",
  "extension": ".cdr",
  "limit": 25
}
```
- **Result**:
```json
{
  "results": [
    {
      "fileId": "f8a1e2-...",
      "filename": "ABC School ID Card 2026 v8.cdr",
      "clientName": "ABC School",
      "projectName": "ID Card",
      "year": 2026,
      "version": 8,
      "path": "D:\\Clients\\ABC School\\2026\\ID Card\\ABC School ID Card 2026 v8.cdr",
      "rank": -14.28
    }
  ],
  "executionTimeMs": 1.2
}
```

---

### 3.6. CorelDRAW COM Integration Subsystem

#### `corel.getStatus`
Checks if CorelDRAW is running and returns active document information.
- **Result**:
```json
{
  "isRunning": true,
  "version": "CorelDRAW 2024 (25.0)",
  "activeDocument": {
    "name": "ABC School ID Card 2026 v7.cdr",
    "fullPath": "D:\\Clients\\ABC School\\2026\\ID Card\\ABC School ID Card 2026 v7.cdr",
    "isDirty": true,
    "pagesCount": 2
  }
}
```

#### `corel.saveAsNewVersion`
Saves the currently active CorelDRAW document as the next incremental version ($v_{N+1}$) in the organized folder structure.
- **Params**: `{ "incrementType": "minor" | "major" }`
- **Result**:
```json
{
  "success": true,
  "oldVersion": 7,
  "newVersion": 8,
  "savedPath": "D:\\Clients\\ABC School\\2026\\ID Card\\ABC School ID Card 2026 v8.cdr"
}
```

---

## 4. Server-Sent Event Streams (IPC Notifications)

The background daemon pushes real-time events to connected UI clients over the Named Pipe / WebSocket:

```typescript
interface DaemonEvent<T = unknown> {
  jsonrpc: "2.0";
  method: "event";
  params: {
    eventType: DaemonEventType;
    payload: T;
    timestamp: string;
  };
}

type DaemonEventType =
  | "FILE_DETECTED"
  | "FILE_STABLE"
  | "FILE_ANALYZED"
  | "FILE_ORGANIZED"
  | "REVIEW_REQUIRED"
  | "VERSION_INCREMENTED"
  | "DUPLICATE_DETECTED"
  | "FILE_OPERATION_FAILED"
  | "COREL_STATUS_CHANGED";
```

### Event Example: `FILE_ORGANIZED`
```json
{
  "jsonrpc": "2.0",
  "method": "event",
  "params": {
    "eventType": "FILE_ORGANIZED",
    "payload": {
      "fileId": "f-108",
      "originalName": "abc new final.cdr",
      "currentName": "ABC School ID Card 2026 v8.cdr",
      "targetPath": "D:\\Clients\\ABC School\\2026\\ID Card\\ABC School ID Card 2026 v8.cdr",
      "version": 8,
      "confidence": 0.96
    },
    "timestamp": "2026-09-11T20:56:30.120Z"
  }
}
```
