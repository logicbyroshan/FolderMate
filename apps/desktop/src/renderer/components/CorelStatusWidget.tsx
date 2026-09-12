import React, { useState, useEffect } from "react";
import { Palette, RefreshCw, Save, CheckCircle2 } from "lucide-react";

export const CorelStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      if ((window as any).foldermate) {
        const res = await (window as any).foldermate.call("corel.getStatus");
        setStatus(res);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveAsNewVersion = async () => {
    if (!status?.activeDocument?.fullPath) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Query next version from server
      const res = await (window as any).foldermate.call("corel.saveAsNewVersion", {
        targetPath: status.activeDocument.fullPath,
      });

      if (res.success) {
        setSaveMessage(`Saved v${res.newVersion || "new"}!`);
        fetchStatus();
      }
    } catch (err: any) {
      setSaveMessage(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  if (!status?.isRunning) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-muted)" }}>
        <Palette size={14} color="#64748b" />
        <span>CorelDRAW Inactive</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div className="badge-glow-primary" style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "9999px",
        fontSize: "11px",
        fontWeight: "600",
      }}>
        <Palette size={13} color="#818cf8" />
        <span>Corel Active: {status.activeDocument?.title || "No Document Open"}</span>
      </div>

      {status.activeDocument && (
        <button
          onClick={handleSaveAsNewVersion}
          disabled={isSaving}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 10px",
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 0 10px rgba(79, 70, 229, 0.4)",
          }}
        >
          {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
          <span>Save New Version (v+1)</span>
        </button>
      )}

      {saveMessage && (
        <span style={{ fontSize: "11px", color: "#34d399", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}>
          <CheckCircle2 size={13} /> {saveMessage}
        </span>
      )}
    </div>
  );
};
