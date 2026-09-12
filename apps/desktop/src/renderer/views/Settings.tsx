import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Folder, Shield, Palette, HardDrive } from "lucide-react";

export const Settings: React.FC = () => {
  const [inboxPath, setInboxPath] = useState("C:\\FolderMate\\Inbox");
  const [organizationRoot, setOrganizationRoot] = useState("D:\\Clients");
  const [archiveRoot, setArchiveRoot] = useState("D:\\Archive");
  const [safeMode, setSafeMode] = useState(true);
  const [corelEnabled, setCorelEnabled] = useState(true);
  const [collisionPolicy, setCollisionPolicy] = useState("AUTO_INCREMENT");
  const [isSaved, setIsSaved] = useState(false);

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
      } catch {}
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.call("settings.update", {
          ingestion: { inboxPath },
          storage: { organizationRoot, archiveRoot, safeMode, collisionPolicy },
          coreldraw: { enabled: corelEnabled },
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#f8fafc" }}>
            Application Settings
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Configure directory paths, background engine policies, and external integrations
          </p>
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: "8px 18px",
            borderRadius: "6px",
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            border: "none",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Save size={14} />
          <span>{isSaved ? "Saved!" : "Save Settings"}</span>
        </button>
      </div>

      {/* Directory Paths Card */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Folder size={16} color="#38bdf8" />
          <span>Directory Paths</span>
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              WATCHED INBOX DIRECTORY:
            </label>
            <input
              type="text"
              value={inboxPath}
              onChange={(e) => setInboxPath(e.target.value)}
              className="mono-font"
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#f8fafc", fontSize: "12px" }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              ORGANIZATION STORAGE ROOT:
            </label>
            <input
              type="text"
              value={organizationRoot}
              onChange={(e) => setOrganizationRoot(e.target.value)}
              className="mono-font"
              style={{ width: "100%", padding: "8px 12px", backgroundColor: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#f8fafc", fontSize: "12px" }}
            />
          </div>
        </div>
      </div>

      {/* Safety & Collision Policies */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Shield size={16} color="#10b981" />
          <span>Safety & Version Policies</span>
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#f8fafc" }}>
                Safe Mode (Archival Protection)
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Move original files to Inbox/_Archived instead of immediate deletion
              </div>
            </div>
            <input
              type="checkbox"
              checked={safeMode}
              onChange={(e) => setSafeMode(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "#10b981", cursor: "pointer" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#f8fafc" }}>
                Collision Policy
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Action when destination filename already exists
              </div>
            </div>
            <select
              value={collisionPolicy}
              onChange={(e) => setCollisionPolicy(e.target.value)}
              style={{ padding: "6px 12px", backgroundColor: "#0f172a", border: "1px solid var(--border-subtle)", borderRadius: "6px", color: "#f8fafc", fontSize: "12px" }}
            >
              <option value="AUTO_INCREMENT">Auto-Increment Version (v+1)</option>
              <option value="PROMPT_REVIEW">Route to Review Queue</option>
            </select>
          </div>
        </div>
      </div>

      {/* CorelDRAW Integration */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Palette size={16} color="#8b5cf6" />
          <span>CorelDRAW Integration</span>
        </h3>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#f8fafc" }}>
              Enable COM Automation Bridge
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Allows live document detection, Save as New Version, and preview generation
            </div>
          </div>
          <input
            type="checkbox"
            checked={corelEnabled}
            onChange={(e) => setCorelEnabled(e.target.checked)}
            style={{ width: "18px", height: "18px", accentColor: "#6366f1", cursor: "pointer" }}
          />
        </div>
      </div>
    </div>
  );
};
