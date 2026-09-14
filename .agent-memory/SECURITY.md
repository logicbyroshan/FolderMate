# FolderMate Security Memory

## Authentication and authorization
- The engine uses a shared cryptographic token for IPC authentication over Named Pipes.
- Authentication is required before a client can execute non-handshake RPCs.
- Client access is not treated as public API access; it is tied to the local IPC auth model.

## File handling and trust boundaries
- The engine operates on filesystem paths and should treat all external paths as untrusted until normalized and validated.
- File grouping and destination generation must remain within configured runtime roots.
- Safe file movement semantics are central to the system’s trust model.

## Secrets management
- Secrets are not stored in source files or project documentation.
- Runtime auth tokens are managed in the platform app-data area, not in the repository.

## Database security considerations
- SQLite is embedded and local to the machine.
- The project uses transactionality and WAL semantics to reduce integrity issues.

## External integration security
- CorelDRAW automation is kept behind an isolated adapter boundary to reduce direct system-level risk.
- The engine avoids assuming that external tools are always healthy or responsive.

## Current security posture
The repository has a deliberate safety-first design aimed at avoiding destructive file operations and isolating risky runtime integrations. This is a strong starting point for future secure change work, but environment-specific local validation remains necessary.
