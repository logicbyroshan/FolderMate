import React, { useState, useEffect } from "react";
import {
  Inbox,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Plus,
} from "lucide-react";

export const ReviewQueue: React.FC = () => {
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

        // Pre-populate selections from suggestions
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
      alert("Please select or assign a client.");
      return;
    }

    if (!projectId) {
      alert("Please select or assign a project.");
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

        loadData();
      }
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
    } finally {
      setIsResolving(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#f8fafc" }}>
            Review Queue
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Files requiring human confirmation before final organization
          </p>
        </div>

        <div className="badge-glow-warning" style={{
          padding: "4px 12px",
          borderRadius: "9999px",
          fontSize: "12px",
          fontWeight: "700",
        }}>
          {items.length} Pending
        </div>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="glass-panel" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
          }}>
            <CheckCircle size={28} color="#34d399" />
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc", marginBottom: "4px" }}>
            Review Queue is Empty!
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            All incoming files are being organized with 100% confidence.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {items.map((item) => {
            const confPct = Math.round(item.confidenceScore * 100);

            return (
              <div key={item.id} className="glass-panel" style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <span className="mono-font" style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc" }}>
                      {item.originalName}
                    </span>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                      Detected in Inbox • {item.originalPath}
                    </div>
                  </div>

                  {/* Confidence Score Pill */}
                  <div style={{
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: "700",
                    backgroundColor: confPct >= 70 ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    color: confPct >= 70 ? "#fbbf24" : "#f87171",
                    border: "1px solid",
                    borderColor: confPct >= 70 ? "rgba(245, 158, 11, 0.3)" : "rgba(239, 68, 68, 0.3)",
                  }}>
                    {confPct}% Confidence
                  </div>
                </div>

                {/* Reasons Breakdown */}
                {item.reasons && item.reasons.length > 0 && (
                  <div style={{
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    marginBottom: "16px",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Inference Rationale:
                    </div>
                    {item.reasons.map((reason: string, rIdx: number) => (
                      <div key={rIdx} style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>•</span> {reason}
                      </div>
                    ))}
                  </div>
                )}

                {/* Proposal Editor & Action Bar */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 120px auto",
                  gap: "12px",
                  alignItems: "center",
                }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: "600" }}>
                      Assign Client:
                    </label>
                    <select
                      value={selectedClientMap[item.id] || ""}
                      onChange={(e) => setSelectedClientMap({ ...selectedClientMap, [item.id]: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "6px",
                        color: "#f8fafc",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px", fontWeight: "600" }}>
                      Assign Project:
                    </label>
                    <select
                      value={selectedProjectMap[item.id] || ""}
                      onChange={(e) => setSelectedProjectMap({ ...selectedProjectMap, [item.id]: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        backgroundColor: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "6px",
                        color: "#f8fafc",
                        fontSize: "12px",
                        outline: "none",
                      }}
                    >
                      <option value="">-- Select Project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.year})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingTop: "18px" }}>
                    <input
                      type="checkbox"
                      id={`learn_${item.id}`}
                      checked={learnAliasMap[item.id] ?? true}
                      onChange={(e) => setLearnAliasMap({ ...learnAliasMap, [item.id]: e.target.checked })}
                    />
                    <label htmlFor={`learn_${item.id}`} style={{ fontSize: "11px", color: "var(--text-secondary)", cursor: "pointer" }}>
                      Learn Alias
                    </label>
                  </div>

                  <div style={{ paddingTop: "18px" }}>
                    <button
                      onClick={() => handleResolve(item)}
                      disabled={isResolving === item.id}
                      style={{
                        padding: "8px 18px",
                        backgroundColor: "#4f46e5",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        fontWeight: "600",
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 0 12px rgba(79, 70, 229, 0.4)",
                      }}
                    >
                      <span>Organize Now</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
