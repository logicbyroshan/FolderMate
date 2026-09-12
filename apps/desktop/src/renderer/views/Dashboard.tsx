import React, { useEffect, useState } from "react";
import {
  FileCheck2,
  Inbox,
  Users,
  FolderTree,
  ExternalLink,
  Clock,
  ShieldCheck,
  CheckCircle,
  FileCode,
} from "lucide-react";

interface DashboardProps {
  onNavigate: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);

  const loadData = async () => {
    try {
      if ((window as any).foldermate) {
        const sysStatus = await (window as any).foldermate.call("system.getStatus");
        setStatus(sysStatus);

        const filesRes = await (window as any).foldermate.call("files.list", { limit: 10 });
        setFiles(filesRes.items || []);

        const clientsRes = await (window as any).foldermate.call("clients.list");
        setClientsCount(clientsRes.length || 0);

        const projectsRes = await (window as any).foldermate.call("projects.list");
        setProjectsCount(projectsRes.length || 0);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRevealFile = async (filePath: string) => {
    if ((window as any).foldermate) {
      await (window as any).foldermate.showItemInFolder(filePath);
    }
  };

  const statCards = [
    {
      title: "Organized Files",
      value: files.length,
      icon: FileCheck2,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.12)",
    },
    {
      title: "Needs Review",
      value: status?.pendingReviewCount || 0,
      icon: Inbox,
      color: status?.pendingReviewCount > 0 ? "#ef4444" : "#f59e0b",
      bgColor: status?.pendingReviewCount > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.12)",
      onClick: () => onNavigate("review"),
    },
    {
      title: "Active Clients",
      value: clientsCount,
      icon: Users,
      color: "#6366f1",
      bgColor: "rgba(99, 102, 241, 0.12)",
      onClick: () => onNavigate("clients"),
    },
    {
      title: "Active Projects",
      value: projectsCount,
      icon: FolderTree,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.12)",
      onClick: () => onNavigate("clients"),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: "24px",
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#f8fafc", marginBottom: "4px" }}>
            Workspace Engine Active
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            Watching Inbox <span className="mono-font" style={{ color: "#38bdf8" }}>{status?.inboxPath || "C:\\FolderMate\\Inbox"}</span>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="badge-glow-success" style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 14px",
            borderRadius: "9999px",
            fontSize: "12px",
            fontWeight: "600",
          }}>
            <ShieldCheck size={16} />
            <span>Safe Mode: {status?.safeMode ? "Enabled (Archival Protection)" : "Direct"}</span>
          </div>
        </div>
      </div>

      {/* Metric Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={card.onClick}
              className="glass-panel-interactive"
              style={{
                padding: "20px",
                cursor: card.onClick ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "6px" }}>
                  {card.title}
                </div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#f8fafc" }}>
                  {card.value}
                </div>
              </div>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: card.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Icon size={24} color={card.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Files Table */}
      <div className="glass-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc" }}>
            Recently Organized Files
          </h3>
          <button
            onClick={() => onNavigate("search")}
            style={{
              background: "none",
              border: "none",
              color: "#818cf8",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            View All Files →
          </button>
        </div>

        {files.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "13px" }}>
            No files organized yet. Drop designs or PDFs into your configured Inbox!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {files.map((file) => (
              <div
                key={file.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <FileCode size={18} color="#818cf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#f8fafc" }}>
                      {file.currentName}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      From: {file.originalName} • {Math.round(file.sizeBytes / 1024)} KB
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span className="badge-glow-primary" style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}>
                    v{file.versionNumber}
                  </span>

                  <button
                    onClick={() => handleRevealFile(file.currentPath)}
                    title="Reveal in Explorer"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
