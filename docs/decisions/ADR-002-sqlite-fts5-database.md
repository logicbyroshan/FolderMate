# ADR-002: Embedded SQLite 3 with WAL Mode and FTS5

## Status
`ACCEPTED` (2026-09-11)

## Context
FolderMate requires an embedded, zero-configuration, ACID-compliant database capable of storing tens of thousands of file records, version lineage DAGs, audit trails, and client/project hierarchies with instant $(<5\text{ms})$ full-text search.

## Decision
We select **SQLite 3** operating in **Write-Ahead Logging (WAL) Mode** and utilizing the **FTS5 (Full-Text Search)** virtual table engine, interfaced via `better-sqlite3`.

Key PRAGMAs configured:
- `journal_mode = WAL`
- `synchronous = NORMAL`
- `foreign_keys = ON`
- `mmap_size = 268435456` (256MB memory-mapped I/O)
- `cache_size = -64000` (64MB page cache)

## Consequences
### Positive
- Zero external server installation or daemon management for the end user.
- WAL mode allows simultaneous multi-threaded readers and a dedicated background writer without lock contention.
- Built-in FTS5 engine with BM25 ranking provides Google-like instant search without needing Elasticsearch or Meilisearch.
- Fast daily automated snapshots using SQLite's online backup API.

### Negative / Mitigations
- SQLite single-writer limitation.
- *Mitigation*: The background engine serializes write transactions through a dedicated priority queue, easily handling hundreds of write operations per second.
