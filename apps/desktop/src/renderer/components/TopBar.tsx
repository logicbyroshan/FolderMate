import React from "react";
import { Search, Play, FolderOpen } from "lucide-react";
import { CorelStatusWidget } from "./CorelStatusWidget.js";
import { Button } from "./ui/Button.js";

interface TopBarProps {
  onSearchFocus: () => void;
  onScanNow: () => void;
  onOpenInbox: () => void;
  onOpenStorage: () => void;
  onOpenCommandPalette: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onSearchFocus,
  onScanNow,
  onOpenInbox,
  onOpenStorage,
  onOpenCommandPalette,
}) => {
  return (
    <header
      style={{
        height: 56,
        borderBottom: "1px solid var(--border-subtle)",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        userSelect: "none",
      }}
    >
      {/* Search Bar Trigger */}
      <div
        onClick={onOpenCommandPalette}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          padding: "6px 14px",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          width: 320,
          color: "var(--text-muted)",
          fontSize: 12,
          transition: "border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-medium)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Search size={14} color="var(--text-muted)" />
          <span>Quick actions & search...</span>
        </div>
        <kbd
          style={{
            padding: "1px 5px",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-muted)",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          Ctrl+K
        </kbd>
      </div>

      {/* Center / Right Integrations & Action Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <CorelStatusWidget />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            size="sm"
            variant="amber"
            leftIcon={<Play size={13} fill="currentColor" />}
            onClick={onScanNow}
          >
            Scan Inbox
          </Button>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FolderOpen size={13} />}
            onClick={onOpenInbox}
          >
            Inbox
          </Button>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FolderOpen size={13} />}
            onClick={onOpenStorage}
          >
            Storage
          </Button>
        </div>
      </div>
    </header>
  );
};
