# FolderMate Conventions

## Naming
- Feature names map to folders and domain modules: `classification`, `organization`, `review`, `versioning`, `ipc`, `integrations`.
- Client/project semantics are handled using explicit domain concepts rather than ad hoc generic names.
- The project favors descriptive business-domain names over generic utility naming.

## File organization
- Runtime code is split by subsystem.
- Shared runtime contracts live in `packages/shared`.
- Database logic lives under `packages/database`.
- Config logic stays under `packages/config`.
- Engine behaviors live under `apps/engine/src`.
- Desktop/resources live under `apps/desktop/src`.

## API and backend patterns
- `DatabaseManager` is the central database seam.
- RPC dispatch is centralized in the engine `rpc-dispatcher` abstraction.
- File movement logic is intentionally implemented as a safe, staged workflow rather than a direct rename-based approach.
- Auth and IPC are treated as system concerns separate from domain logic.

## Database patterns
- SQLite repositories encapsulate persistence.
- Data access is repository-based rather than directly spread through business logic.
- Search is implemented using FTS5 virtual tables.

## Error handling and validation
- Domain logic should validate paths and config before executing risky operations.
- External adapter failures are considered system-level concerns and must not be silently assumed safe.
- Low-confidence classification is routed to a review queue instead of forcing a risky hard decision.

## Testing patterns
- Vitest is the repo’s active testing framework.
- Tests cover engine logic, IPC flow, classification, versioning, database interactions, and end-to-end pipeline behavior.
- Changes should be backed by meaningful test coverage where behavior is altered.

## Documentation and comments
- The repository already includes extensive top-level documentation and ADRs.
- Documentation is treated as a project asset and should remain aligned with actual code behavior.

## Git and change hygiene
- Preserve existing code structure and deliberate design boundaries.
- Keep changes minimal and domain-appropriate.
- Do not sweep unrelated cleanup into a task.
