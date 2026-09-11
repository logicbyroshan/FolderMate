# ADR-004: Out-of-Process C# COM Bridge for CorelDRAW

## Status
`ACCEPTED` (2026-09-11)

## Context
CorelDRAW exposes rich Windows COM automation (`CorelDRAW.Application`) for querying active documents, saving versions, and exporting previews. However, COM uses Windows Single-Threaded Apartment (STA) threading. 

Directly calling COM in Node.js worker threads risks V8 thread crashes, COM apartment marshalling deadlocks, or indefinite process hangs if CorelDRAW displays a modal dialog (e.g. *Font Substitution Warning*).

## Decision
We isolate all CorelDRAW COM interactions inside a dedicated, standalone C# .NET 8 CLI executable: `FolderMate.CorelBridge.exe`.

Communication between Node.js and the bridge takes place via standard input/output with structured JSON payloads and a strict process timeout watchdog ($10\text{s}$).

## Consequences
### Positive
- Total crash isolation: If CorelDRAW hangs or crashes, only the bridge child process is terminated; the FolderMate engine daemon remains unaffected.
- Native C# COM interop provides clean type-safe bindings and reliable RCW (`ReleaseComObject`) garbage collection.
- Easy to test and develop standalone from the command line (`dotnet run -- status`).

### Negative / Mitigations
- Minor process spawn overhead (~50ms per invocation).
- *Mitigation*: Ephemeral calls are sufficient for on-demand actions (e.g. "Save as New Version"). A persistent pooled process mode can be enabled if high-frequency polling is needed.
