import React, { useState, useEffect } from "react";
import { CheckCircle, ArrowRight, FileQuestion } from "lucide-react";
import { Card } from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
import { Button } from "../components/ui/Button.js";
import { Select } from "../components/ui/Select.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { useToast } from "../components/ui/Toast.js";

export const ReviewQueue: React.FC = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedClientMap, setSelectedClientMap] = useState<Record<string, string>>({});
  const [selectedProjectMap, setSelectedProjectMap] = useState<Record<string, string>>({});
  const [learnAliasMap, setLearnAliasMap] = useState<Record<string, boolean>>({});
  const [isResolving, setIsResolving] = useState<string | null>(null);

  const loadData = async () => {
    try {
      if ((window as any).foldermate) {
        const queueRes = await (window as any).foldermate.call("reviewQueue.list");
        setItems(queueRes || []);

        const clientsRes = await (window as any).foldermate.call("clients.list");
        setClients(clientsRes || []);

        const projectsRes = await (window as any).foldermate.call("projects.list");
        setProjects(projectsRes || []);

        const cMap: Record<string, string> = {};
        const pMap: Record<string, string> = {};
        const lMap: Record<string, boolean> = {};

        for (const item of queueRes || []) {
          if (item.proposedClientId) cMap[item.id] = item.proposedClientId;
          if (item.proposedProjectId) pMap[item.id] = item.proposedProjectId;
          lMap[item.id] = true;
        }

        setSelectedClientMap(cMap);
        setSelectedProjectMap(pMap);
        setLearnAliasMap(lMap);
      }
    } catch (err) {
      console.error("Failed to load review queue:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolve = async (item: any) => {
    const clientId = selectedClientMap[item.id] || item.proposedClientId;
    const projectId = selectedProjectMap[item.id] || item.proposedProjectId;

    if (!clientId) {
      showToast("Please select a target client", "warning");
      return;
    }

    if (!projectId) {
      showToast("Please select a target project", "warning");
      return;
    }

    setIsResolving(item.id);
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.call("reviewQueue.resolve", {
          reviewQueueId: item.id,
          clientId,
          projectId,
          year: item.proposedYear || 2026,
          versionNumber: item.proposedVersion || 1,
          learnAlias: learnAliasMap[item.id] ?? true,
        });

        showToast(`Organized ${item.originalName} successfully`, "success");
        loadData();
      }
    } catch (err: any) {
      showToast(`Resolution failed: ${err.message}`, "error");
    } finally {
      setIsResolving(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Review Queue
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Files requiring confirmation before autonomous organization
          </p>
        </div>

        <Badge variant={items.length > 0 ? "amber" : "success"} dot size="md">
          {items.length} Pending
        </Badge>
      </Card>

      {/* Items List */}
      {items.length === 0 ? (
        <Card style={{ padding: "40px 20px" }}>
          <EmptyState
            icon={<CheckCircle size={28} color="var(--status-success)" />}
            title="Review Queue is Empty!"
            description="All incoming files are matching client & project rules with high confidence."
          />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item) => {
            const confPct = Math.round(item.confidenceScore * 100);

            return (
              <Card key={item.id} style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
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
                      <FileQuestion size={18} color="var(--accent-amber)" />
                    </div>
                    <div>
                      <span className="mono-font" style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                        {item.originalName}
                      </span>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Detected in Inbox • {item.originalPath}
                      </div>
                    </div>
                  </div>

                  <Badge variant={confPct >= 70 ? "amber" : "danger"} size="md">
                    {confPct}% Confidence
                  </Badge>
                </div>

                {/* Reasons Breakdown */}
                {item.reasons && item.reasons.length > 0 && (
                  <div
                    style={{
                      backgroundColor: "var(--bg-canvas)",
                      borderRadius: "var(--radius-md)",
                      padding: "8px 12px",
                      marginBottom: 14,
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 3 }}>
                      Inference Rationale:
                    </div>
                    {item.reasons.map((reason: string, rIdx: number) => (
                      <div key={rIdx} style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>•</span> {reason}
                      </div>
                    ))}
                  </div>
                )}

                {/* Proposal Editor & Action Bar */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 120px auto",
                    gap: 12,
                    alignItems: "flex-end",
                  }}
                >
                  <Select
                    label="Assign Client:"
                    value={selectedClientMap[item.id] || ""}
                    onChange={(val) => setSelectedClientMap({ ...selectedClientMap, [item.id]: val })}
                    options={[
                      { value: "", label: "-- Select Client --" },
                      ...clients.map((c) => ({ value: c.id, label: `${c.name} (${c.code})` })),
                    ]}
                  />

                  <Select
                    label="Assign Project:"
                    value={selectedProjectMap[item.id] || ""}
                    onChange={(val) => setSelectedProjectMap({ ...selectedProjectMap, [item.id]: val })}
                    options={[
                      { value: "", label: "-- Select Project --" },
                      ...projects.map((p) => ({ value: p.id, label: `${p.name} (${p.year})` })),
                    ]}
                  />

                  <div style={{ display: "flex", alignItems: "center", gap: 6, paddingBottom: 8 }}>
                    <input
                      type="checkbox"
                      id={`learn_${item.id}`}
                      checked={learnAliasMap[item.id] ?? true}
                      onChange={(e) => setLearnAliasMap({ ...learnAliasMap, [item.id]: e.target.checked })}
                      style={{ accentColor: "var(--accent-amber)" }}
                    />
                    <label htmlFor={`learn_${item.id}`} style={{ fontSize: 11, color: "var(--text-secondary)", cursor: "pointer" }}>
                      Learn Alias
                    </label>
                  </div>

                  <div>
                    <Button
                      variant="primary"
                      size="md"
                      isLoading={isResolving === item.id}
                      rightIcon={<ArrowRight size={14} />}
                      onClick={() => handleResolve(item)}
                    >
                      Organize Now
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
