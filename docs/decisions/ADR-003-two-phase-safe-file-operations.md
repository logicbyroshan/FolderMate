# ADR-003: Two-Phase Transactional Staging for Safe File Moves

## Status
`ACCEPTED` (2026-09-11)

## Context
Filesystem operations across Windows drive volumes (e.g. `C:\Inbox` to `D:\Clients\`) are not atomic at the OS level. If a system crashes, power fails, or an antivirus intercepts a move mid-stream, partial files or corrupted data can result in permanent user data loss.

## Decision
All file moves in FolderMate must adhere to a strict **Two-Phase Transactional Staging Pipeline**:
1. **Phase 1 (Staging & Hash Check)**:
   - File is streamed in 64KB chunks to `<TargetDir>/.foldermate_staging_<hash>.tmp`.
   - The SHA-256 hash of the staged file is computed and compared to the source file hash.
   - If a mismatch or error occurs, the temporary file is deleted immediately and the source is untouched.
2. **Phase 2 (Atomic Finalization & State Commit)**:
   - The staged file is atomically renamed to the final destination filename on the same volume (an atomic filesystem operation on NTFS).
   - The SQLite database transaction commits the file record, version row, and audit event.
   - In Safe Mode, the original file in Inbox is moved to `Inbox/_Archived/` or Windows Recycle Bin.

## Consequences
### Positive
- Guarantees 0% data corruption or byte loss.
- Crash recovery can deterministically clean up orphaned `.foldermate_staging_*` files on reboot.

### Negative / Mitigations
- Staging requires brief additional disk space ($1\times$ the file size during copy).
- *Mitigation*: The engine explicitly checks available target volume disk space before initiating Phase 1.
