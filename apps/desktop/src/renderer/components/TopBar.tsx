import React from "react";
import { Search, Play, FolderOpen, Bell } from "lucide-react";
import { CorelStatusWidget } from "./CorelStatusWidget.js";

interface TopBarProps {
  onSearchFocus: () => void;
  onScanNow: () => void;
  onOpenInbox: () => void;
  onOpenStorage: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onSearchFocus,
  onScanNow,
  onOpenInbox,
  onOpenStorage,
}) => {
  return (
    <header style={{
      height: "56px",
      borderBottom: "1px solid var(--border-subtle)",
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      userSelect: "none",
    }}>
      {/* Search Bar Trigger */}
      <div
        onClick={onSearchFocus}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid var(--border-subtle)",
          padding: "6px 14px",
          borderRadius: "8px",
          cursor: "pointer",
          width: "320px",
          color: "var(--text-muted)",
          fontSize: "12px",
          transition: "border-color 0.2s ease",
        }}
      >
        <Search size={15} color="#64748b" />
        <span>Search files, clients, versions (Ctrl+K)...</span>
      </div>

      {/* Center / Right Integrations & Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <CorelStatusWidget />

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={onScanNow}
            title="Scan Inbox Now"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              color: "#f8fafc",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <Play size={13} fill="currentColor" color="#38bdf8" />
            <span>Scan Inbox</span>
          </button>

          <button
            onClick={onOpenInbox}
            title="Open Inbox Directory"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            <FolderOpen size={13} color="#94a3b8" />
            <span>Inbox</span>
          </button>

          <button
            onClick={onOpenStorage}
            title="Open Organized Storage Root"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "6px",
              color: "var(--text-secondary)",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            <FolderOpen size={13} color="#94a3b8" />
            <span>Storage</span>
          </button>
        </div>
      </div>
    </header>
  );
};
