import React, { useState, useEffect } from "react";
import { Sliders, Save, FileText, FolderTree, Sparkles } from "lucide-react";

export const Rules: React.FC = () => {
  const [namingTemplate, setNamingTemplate] = useState("{Client} {Project} {Year} v{Version}");
  const [folderTemplate, setFolderTemplate] = useState("Clients/{Client}/{Year}/{Project}");
  const [autoThreshold, setAutoThreshold] = useState(85);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if ((window as any).foldermate) {
          const cfg = await (window as any).foldermate.call("settings.get");
          if (cfg?.storage?.defaultNamingTemplate) setNamingTemplate(cfg.storage.defaultNamingTemplate);
          if (cfg?.storage?.defaultFolderTemplate) setFolderTemplate(cfg.storage.defaultFolderTemplate);
          if (cfg?.automation?.autoOrganizeThreshold) setAutoThreshold(Math.round(cfg.automation.autoOrganizeThreshold * 100));
        }
      } catch {}
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.call("settings.update", {
          storage: {
            defaultNamingTemplate: namingTemplate,
            defaultFolderTemplate: folderTemplate,
          },
          automation: {
            autoOrganizeThreshold: autoThreshold / 100,
          },
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    }
  };

  // Preview computation
  const previewFilename = namingTemplate
    .replace(/\{Client\}/gi, "ABC School")
    .replace(/\{ClientCode\}/gi, "ABCSCH")
    .replace(/\{Project\}/gi, "ID Card")
    .replace(/\{ProjectCode\}/gi, "IDC2026")
    .replace(/\{Year\}/gi, "2026")
    .replace(/\{Month\}/gi, "09")
    .replace(/\{Version\}/gi, "8")
    .replace(/\{VersionPadded\}/gi, "08") + ".cdr";

  const previewFolderPath = folderTemplate
    .replace(/\{Client\}/gi, "ABC School")
    .replace(/\{Year\}/gi, "2026")
    .replace(/\{Project\}/gi, "ID Card");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#f8fafc" }}>
            Rules & Template Configuration
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Define naming conventions and folder structures applied to organized files
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
          <span>{isSaved ? "Saved!" : "Save Rules"}</span>
        </button>
      </div>

      {/* Naming Template Card */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", marginBottom: "12px" }}>
          1. Filename Naming Template
        </h3>

        <input
          type="text"
          value={namingTemplate}
          onChange={(e) => setNamingTemplate(e.target.value)}
          className="mono-font"
          style={{
            width: "100%",
            padding: "10px 14px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-focus)",
            borderRadius: "6px",
            color: "#f8fafc",
            fontSize: "13px",
            outline: "none",
            marginBottom: "12px",
          }}
        />

        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Live Resolution Output:</span>
          <span className="mono-font" style={{ fontSize: "13px", color: "#34d399", fontWeight: "700" }}>
            {previewFilename}
          </span>
        </div>
      </div>

      {/* Folder Structure Card */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", marginBottom: "12px" }}>
          2. Folder Structure Template
        </h3>

        <input
          type="text"
          value={folderTemplate}
          onChange={(e) => setFolderTemplate(e.target.value)}
          className="mono-font"
          style={{
            width: "100%",
            padding: "10px 14px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--border-focus)",
            borderRadius: "6px",
            color: "#f8fafc",
            fontSize: "13px",
            outline: "none",
            marginBottom: "12px",
          }}
        />

        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Live Hierarchy Tree:</span>
          <span className="mono-font" style={{ fontSize: "13px", color: "#38bdf8", fontWeight: "700" }}>
            {previewFolderPath}/
          </span>
        </div>
      </div>

      {/* Confidence Threshold Slider */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc" }}>
            3. Automatic Organization Threshold
          </h3>
          <span className="badge-glow-primary" style={{ padding: "3px 10px", borderRadius: "9999px", fontSize: "12px", fontWeight: "700" }}>
            {autoThreshold}% Strictness
          </span>
        </div>

        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
          Files with a confidence score equal to or above {autoThreshold}% are organized automatically. Files below {autoThreshold}% are placed in the Review Queue.
        </p>

        <input
          type="range"
          min="50"
          max="98"
          value={autoThreshold}
          onChange={(e) => setAutoThreshold(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#6366f1", cursor: "pointer" }}
        />
      </div>
    </div>
  );
};
