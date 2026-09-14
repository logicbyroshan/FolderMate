import React, { useEffect, useState } from "react";
import {
  FileCheck2,
  Inbox,
  Users,
  FolderTree,
  ExternalLink,
  ShieldCheck,
  FileCode,
  FolderOpen,
  Layers,
} from "lucide-react";
import { Card } from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
import { Button } from "../components/ui/Button.js";
import { IconButton } from "../components/ui/IconButton.js";
import { EmptyState } from "../components/ui/EmptyState.js";

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
      variant: "success" as const,
      color: "var(--status-success)",
      bgColor: "var(--status-success-bg)",
    },
    {
      title: "Needs Review",
      value: status?.pendingReviewCount || 0,
      icon: Inbox,
      variant: (status?.pendingReviewCount > 0 ? "amber" : "neutral") as "amber" | "neutral",
      color: status?.pendingReviewCount > 0 ? "var(--accent-amber)" : "var(--text-muted)",
      bgColor: status?.pendingReviewCount > 0 ? "var(--accent-amber-subtle)" : "rgba(255,255,255,0.03)",
      onClick: () => onNavigate("review"),
    },
    {
      title: "Client Folders",
      value: clientsCount,
      icon: FolderTree,
      variant: "info" as const,
      color: "var(--status-info)",
      bgColor: "var(--status-info-bg)",
      onClick: () => onNavigate("clients"),
    },
    {
      title: "Project Subfolders",
      value: projectsCount,
      icon: Layers,
      variant: "amber" as const,
      color: "var(--accent-amber)",
      bgColor: "var(--accent-amber-subtle)",
      onClick: () => onNavigate("clients"),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Metric Tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card
              key={i}
              interactive={Boolean(card.onClick)}
              onClick={card.onClick}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, marginBottom: 4 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>
                  {card.value}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: card.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={22} color={card.color} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Files Table */}
      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            Recently Organized Files
          </h3>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("search")}>
            View All Files →
          </Button>
        </div>

        {files.length === 0 ? (
          <EmptyState
            title="No files organized yet"
            description="Drop CDR designs, PDFs, or documents into your Inbox folder to see them organized automatically!"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {files.map((file) => (
              <div
                key={file.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-canvas)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--accent-amber-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileCode size={18} color="var(--accent-amber)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {file.currentName}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      From: {file.originalName} • {Math.round(file.sizeBytes / 1024)} KB
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Badge variant="amber" size="sm">
                    v{file.versionNumber}
                  </Badge>

                  <IconButton
                    icon={<ExternalLink size={15} />}
                    onClick={() => handleRevealFile(file.currentPath)}
                    tooltip="Reveal in Explorer"
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
