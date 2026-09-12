import React from "react";
import {
  LayoutDashboard,
  Search,
  Inbox,
  Users,
  Sliders,
  Settings,
  FolderSync,
  Activity,
} from "lucide-react";

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
    { id: "clients", label: "Clients & Projects", icon: Users },
    { id: "rules", label: "Rules & Templates", icon: Sliders },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside style={{
      width: "240px",
      minWidth: "240px",
      height: "100vh",
      backgroundColor: "var(--bg-secondary)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "20px 16px",
    }}>
      <div>
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 8px 24px 8px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
          }}>
            <FolderSync size={20} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "-0.3px", color: "#f8fafc" }}>
              FolderMate
            </h1>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>
              Automated Organizer
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  color: isActive ? "#818cf8" : "var(--text-secondary)",
                  fontWeight: isActive ? "600" : "500",
                  fontSize: "13px",
                  transition: "all 0.15s ease",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icon size={18} color={isActive ? "#818cf8" : "currentColor"} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 7px",
                    borderRadius: "9999px",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)",
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Engine Daemon Status */}
      <div className="glass-panel" style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: engineConnected ? "#10b981" : "#ef4444",
          boxShadow: engineConnected ? "0 0 10px #10b981" : "0 0 10px #ef4444",
        }} />
        <div>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#f8fafc" }}>
            {engineConnected ? "Daemon Active" : "Daemon Offline"}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            Named Pipe IPC Connected
          </div>
        </div>
      </div>
    </aside>
  );
};
