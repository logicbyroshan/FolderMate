-- 002_folder_customization.sql: Folder Appearance & Customization Rules

CREATE TABLE IF NOT EXISTS folder_appearance_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'CLIENT', 'PROJECT', 'CATEGORY', 'ARCHIVE', 'CUSTOM'
    match_condition_json TEXT NOT NULL DEFAULT '{}',
    color TEXT NOT NULL DEFAULT 'amber',
    icon_resource TEXT,
    icon_index INTEGER DEFAULT 0,
    info_tip_template TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 100,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_folder_rules_target ON folder_appearance_rules(target_type, is_active);
