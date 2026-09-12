# ADR-006: Windows Folder Customization and Appearance Engine

## Context
FolderMate organizes client and project deliverables into structured directory trees on Windows. To provide instant visual hierarchy and immediate recognition in Windows Explorer, folders need dynamic color coding and iconic branding based on client status, project category, or workflow priority (e.g., Active, Archived, High Priority, Waiting).

Windows Explorer does not provide a single REST API for folder coloring. Explorer's shell extension checks for folder customization via a localized `desktop.ini` file located inside the target directory, but **only if the directory itself has the Windows `Read-Only` (`+r`) or `System` (`+s`) file attribute set**.

## Decision
We implemented a native Windows folder appearance engine (`FolderCustomizer`) backed by the `folder_appearance_rules` SQLite database repository:

1. **`desktop.ini` Generation**: Writes standard Windows ShellClassInfo sections specifying `IconResource` or `IconFile` and `InfoTip`.
2. **Directory Attribute Setting**: Automatically invokes Windows `attrib +r "<folderPath>"` to flag Explorer to evaluate `desktop.ini`.
3. **Hidden System Protection**: Invokes `attrib +h +s "<folderPath>\\desktop.ini"` so the configuration file does not clutter standard user file listings.
4. **Deterministic Color & Icon Presets**: Ships standard Windows shell icon presets (Amber, Blue, Green, Red, Purple, Cyan, Gray) while supporting custom `.ico` and `.dll` index resources.
5. **Reversibility & Safe Cleanup**: Calling `removeCustomization()` strips attributes and removes `desktop.ini` cleanly without touching user data or folder permissions.
6. **Cross-Platform Test Fallback**: In non-Windows/test environments where `attrib.exe` is absent, the engine safely writes and tests `desktop.ini` without raising uncaught exceptions.

## Consequences
- **Positive**: Native Windows Explorer folder appearance customization without installing brittle third-party shell hooks or modifying Windows registry keys.
- **Positive**: 100% reversible and safe—never touches user file deliverables.
- **Trade-off**: Requires Windows Explorer to refresh its icon cache or restart the Explorer window to immediately display updated folder icons on older Windows builds.
