import React from "react";
import {
  LayoutDashboard,
  Search,
  Inbox,
  Users,
  Sliders,
  Settings,
  FolderSync,
  FolderTree,
} from "lucide-react";
import { Badge } from "./ui/Badge.js";

export type NavView = "dashboard" | "search" | "review" | "clients" | "rules" | "settings";

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  pendingReviewCount: number;
  engineConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  pendingReviewCount,
  engineConnected,
}) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "search", label: "Search Files", icon: Search },
    { id: "review", label: "Review Queue", icon: Inbox, badge: pendingReviewCount },
    { id: "clients", label: "Client Folders", icon: FolderTree },
    { id: "rules", label: "Rules & Folders", icon: Sliders },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside
      style={{
        width: 230,
        minWidth: 230,
        height: "100vh",
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px 14px",
      }}
    >
      <div>
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 24px 8px" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(245, 158, 11, 0.35)",
            }}
          >
            <FolderSync size={18} color="#0f172a" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px", color: "var(--text-primary)" }}>
              FolderMate
            </h1>
            <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              Background Organizer
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id as NavView)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: isActive ? "var(--accent-amber-subtle)" : "transparent",
                  color: isActive ? "var(--accent-amber-text)" : "var(--text-secondary)",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  transition: "all 0.12s ease-in-out",
                  textAlign: "left",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={17} color={isActive ? "var(--accent-amber)" : "currentColor"} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="amber" size="sm">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Engine Daemon Status */}
      <div
        className="glass-panel"
        style={{
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          backgroundColor: "var(--bg-elevated)",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: engineConnected ? "var(--status-success)" : "var(--status-danger)",
            boxShadow: engineConnected ? "0 0 8px var(--status-success)" : "0 0 8px var(--status-danger)",
          }}
        />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
            {engineConnected ? "Daemon Active" : "Daemon Offline"}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            Win32 Named Pipe
          </div>
        </div>
      </div>
    </aside>
  );
};
