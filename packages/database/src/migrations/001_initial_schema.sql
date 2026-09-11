-- 001_initial_schema.sql: Core Relational Tables & FTS5 Virtual Index

CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 1. Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL COLLATE NOCASE,
    code TEXT NOT NULL COLLATE NOCASE,
    aliases_json TEXT NOT NULL DEFAULT '[]',
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_code ON clients(code);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL COLLATE NOCASE,
    code TEXT COLLATE NOCASE,
    category TEXT DEFAULT 'General',
    year INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    metadata_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(client_id, name, year)
);

CREATE INDEX IF NOT EXISTS idx_projects_client_year ON projects(client_id, year);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT 'folder',
    description TEXT,
    default_naming_template_id TEXT,
    default_folder_template_id TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 4. Files Table
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    current_name TEXT NOT NULL,
    original_path TEXT NOT NULL,
    current_path TEXT NOT NULL,
    relative_path TEXT NOT NULL,
    extension TEXT NOT NULL COLLATE NOCASE,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256_hash TEXT NOT NULL,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    year INTEGER,
    version_number INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'organized',
    confidence_score REAL NOT NULL DEFAULT 1.0,
    source_app TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    organized_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_files_hash ON files(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_files_client_project ON files(client_id, project_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_extension ON files(extension);
CREATE INDEX IF NOT EXISTS idx_files_created ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_current_path ON files(current_path);

-- 5. File Versions Table
CREATE TABLE IF NOT EXISTS file_versions (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    parent_version_id TEXT REFERENCES file_versions(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    change_summary TEXT,
    created_by TEXT DEFAULT 'user',
    is_approved INTEGER NOT NULL DEFAULT 0,
    is_latest INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(file_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_file_latest ON file_versions(file_id, is_latest);
CREATE INDEX IF NOT EXISTS idx_versions_hash ON file_versions(sha256_hash);

-- 6. File Relationships Table
CREATE TABLE IF NOT EXISTS file_relationships (
    id TEXT PRIMARY KEY,
    source_file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    target_file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    metadata_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(source_file_id, target_file_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_rel_source ON file_relationships(source_file_id);
CREATE INDEX IF NOT EXISTS idx_rel_target ON file_relationships(target_file_id);

-- 7. Templates Tables
CREATE TABLE IF NOT EXISTS naming_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    template_string TEXT NOT NULL,
    description TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS folder_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    template_string TEXT NOT NULL,
    description TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 8. Organization Rules Table
CREATE TABLE IF NOT EXISTS organization_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100,
    is_active INTEGER NOT NULL DEFAULT 1,
    condition_json TEXT NOT NULL,
    folder_template_id TEXT REFERENCES folder_templates(id),
    naming_template_id TEXT REFERENCES naming_templates(id),
    auto_organize_threshold REAL DEFAULT 0.85,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_rules_priority ON organization_rules(priority, is_active);

-- 9. Review Queue Table
CREATE TABLE IF NOT EXISTS review_queue (
    id TEXT PRIMARY KEY,
    file_id TEXT REFERENCES files(id) ON DELETE CASCADE,
    original_path TEXT NOT NULL,
    proposed_client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    proposed_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    proposed_year INTEGER,
    proposed_version INTEGER DEFAULT 1,
    proposed_target_path TEXT,
    confidence_score REAL NOT NULL,
    reasons_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_review_queue_status ON review_queue(status, created_at DESC);

-- 10. File Events (Audit) Table
CREATE TABLE IF NOT EXISTS file_events (
    id TEXT PRIMARY KEY,
    file_id TEXT REFERENCES files(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    old_state_json TEXT,
    new_state_json TEXT,
    details TEXT,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_events_file_id ON file_events(file_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON file_events(event_type);

-- 11. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- 12. Full-Text Search (FTS5) Virtual Table & Triggers
CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
    file_id UNINDEXED,
    filename,
    original_filename,
    client_name,
    project_name,
    category_name,
    year UNINDEXED,
    version UNINDEXED,
    tags,
    content_text,
    tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS trg_files_fts_insert AFTER INSERT ON files
BEGIN
    INSERT INTO files_fts(file_id, filename, original_filename, client_name, project_name, category_name, year, version, tags, content_text)
    VALUES (
        NEW.id,
        NEW.current_name,
        NEW.original_name,
        COALESCE((SELECT name FROM clients WHERE id = NEW.client_id), ''),
        COALESCE((SELECT name FROM projects WHERE id = NEW.project_id), ''),
        COALESCE((SELECT name FROM categories WHERE id = NEW.category_id), ''),
        NEW.year,
        NEW.version_number,
        '',
        ''
    );
END;

CREATE TRIGGER IF NOT EXISTS trg_files_fts_update AFTER UPDATE ON files
BEGIN
    DELETE FROM files_fts WHERE file_id = OLD.id;
    INSERT INTO files_fts(file_id, filename, original_filename, client_name, project_name, category_name, year, version, tags, content_text)
    VALUES (
        NEW.id,
        NEW.current_name,
        NEW.original_name,
        COALESCE((SELECT name FROM clients WHERE id = NEW.client_id), ''),
        COALESCE((SELECT name FROM projects WHERE id = NEW.project_id), ''),
        COALESCE((SELECT name FROM categories WHERE id = NEW.category_id), ''),
        NEW.year,
        NEW.version_number,
        '',
        ''
    );
END;

CREATE TRIGGER IF NOT EXISTS trg_files_fts_delete AFTER DELETE ON files
BEGIN
    DELETE FROM files_fts WHERE file_id = OLD.id;
END;
