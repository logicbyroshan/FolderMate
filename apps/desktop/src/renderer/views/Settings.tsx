import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
  Folder,
  Shield,
  Palette,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Layers,
  Cpu,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  Card,
  Badge,
  useToast,
} from "../components/ui/index.js";

export const Settings: React.FC = () => {
  const [inboxPath, setInboxPath] = useState("C:\\FolderMate\\Inbox");
  const [organizationRoot, setOrganizationRoot] = useState("D:\\Clients");
  const [archiveRoot, setArchiveRoot] = useState("D:\\Archive");
  const [safeMode, setSafeMode] = useState(true);
  const [corelEnabled, setCorelEnabled] = useState(true);
  const [collisionPolicy, setCollisionPolicy] = useState("AUTO_INCREMENT");
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        if ((window as any).foldermate) {
          const cfg = await (window as any).foldermate.call("settings.get");
          if (cfg?.ingestion?.inboxPath) setInboxPath(cfg.ingestion.inboxPath);
          if (cfg?.storage?.organizationRoot) setOrganizationRoot(cfg.storage.organizationRoot);
          if (cfg?.storage?.archiveRoot) setArchiveRoot(cfg.storage.archiveRoot);
          if (cfg?.storage?.safeMode !== undefined) setSafeMode(cfg.storage.safeMode);
          if (cfg?.storage?.collisionPolicy) setCollisionPolicy(cfg.storage.collisionPolicy);
          if (cfg?.coreldraw?.enabled !== undefined) setCorelEnabled(cfg.coreldraw.enabled);
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.call("settings.update", {
          ingestion: { inboxPath },
          storage: { organizationRoot, archiveRoot, safeMode, collisionPolicy },
          coreldraw: { enabled: corelEnabled },
        });
        showToast("System configuration updated and applied to background engine.", "success");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update configuration.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      {/* Header bar */}
      <Card
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--bg-surface-elevated)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <SettingsIcon size={18} color="var(--accent-amber)" />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              System Configuration
            </h2>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Control directory boundaries, safety journals, version collision logic, and COM automation bridges.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Save size={14} />}
          onClick={handleSave}
          isLoading={isSaving}
        >
          Save Configuration
        </Button>
      </Card>

      {/* Directory Paths Section */}
      <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
          <Folder size={18} color="var(--accent-amber)" />
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Directory Boundaries
            </h3>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Absolute Windows filesystem locations used by the background file watcher and organizer.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="WATCHED INBOX DIRECTORY"
            value={inboxPath}
            onChange={(e) => setInboxPath(e.target.value)}
            className="mono-font"
            placeholder="e.g. C:\FolderMate\Inbox"
          />

          <Input
            label="ORGANIZATION STORAGE ROOT (LIBRARY)"
            value={organizationRoot}
            onChange={(e) => setOrganizationRoot(e.target.value)}
            className="mono-font"
            placeholder="e.g. D:\Clients"
          />

          <Input
            label="ARCHIVE STORAGE ROOT"
            value={archiveRoot}
            onChange={(e) => setArchiveRoot(e.target.value)}
            className="mono-font"
            placeholder="e.g. D:\Archive"
          />
        </div>
      </Card>

      {/* Safety & Version Policies */}
      <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
          <Shield size={18} color="var(--status-success)" />
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Safety & Version Collision Policies
            </h3>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Protects against accidental overwrites and ensures non-destructive transactions.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                <span>Safe Mode (Archival Journal Protection)</span>
                <Badge variant="success" size="sm">Recommended</Badge>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Moves original inbox files to <code className="mono-font" style={{ color: "var(--accent-amber)" }}>_Archived</code> staging rather than unrecoverable deletion.
              </div>
            </div>
            <input
              type="checkbox"
              checked={safeMode}
              onChange={(e) => setSafeMode(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--accent-amber)", cursor: "pointer" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 14px",
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ maxWidth: 450 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Collision Resolution Strategy
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Determines action when a destination file already exists with matching name.
              </div>
            </div>
            <div style={{ width: 220 }}>
              <Select
                value={collisionPolicy}
                onChange={(val) => setCollisionPolicy(val)}
                options={[
                  { label: "Auto-Increment (v+1)", value: "AUTO_INCREMENT" },
                  { label: "Route to Review Queue", value: "PROMPT_REVIEW" },
                  { label: "Overwrite Destination", value: "OVERWRITE" },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* CorelDRAW COM Automation */}
      <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
          <Palette size={18} color="var(--accent-amber)" />
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              CorelDRAW COM Bridge
            </h3>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Automates active document detection, page counts, metadata extraction, and version exports.
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>Enable CorelDRAW Automation Adapter</span>
              {corelEnabled && <Badge variant="amber" size="sm">Active</Badge>}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Communicates with running CorelDRAW instances via Windows COM interface without background polling.
            </div>
          </div>
          <input
            type="checkbox"
            checked={corelEnabled}
            onChange={(e) => setCorelEnabled(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: "var(--accent-amber)", cursor: "pointer" }}
          />
        </div>
      </Card>
    </div>
  );
};
