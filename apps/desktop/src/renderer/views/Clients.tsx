import React, { useState, useEffect } from "react";
import { Users, Plus, Tag, FolderTree, Building, Check, Sparkles } from "lucide-react";

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // New Client Form
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientCode, setNewClientCode] = useState("");
  const [newClientAliases, setNewClientAliases] = useState("");

  // New Project Form
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectYear, setNewProjectYear] = useState(new Date().getFullYear());
  const [newProjectCategory, setNewProjectCategory] = useState("Design");

  const loadData = async () => {
    try {
      if ((window as any).foldermate) {
        const cRes = await (window as any).foldermate.call("clients.list");
        setClients(cRes || []);
        if (cRes?.length > 0 && !selectedClientId) {
          setSelectedClientId(cRes[0].id);
        }

        const pRes = await (window as any).foldermate.call("projects.list");
        setProjects(pRes || []);
      }
    } catch (err) {
      console.error("Failed to load clients/projects:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const aliases = newClientAliases
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    try {
      if ((window as any).foldermate) {
        const created = await (window as any).foldermate.call("clients.create", {
          name: newClientName.trim(),
          code: newClientCode.trim() || newClientName.replace(/\s+/g, "").toUpperCase().slice(0, 6),
          aliases,
          isActive: true,
        });

        setNewClientName("");
        setNewClientCode("");
        setNewClientAliases("");
        setShowNewClient(false);
        await loadData();
        setSelectedClientId(created.id);
      }
    } catch (err: any) {
      alert(`Failed to create client: ${err.message}`);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newProjectName.trim()) return;

    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.call("projects.create", {
          clientId: selectedClientId,
          name: newProjectName.trim(),
          category: newProjectCategory,
          year: Number(newProjectYear),
        });

        setNewProjectName("");
        setShowNewProject(false);
        loadData();
      }
    } catch (err: any) {
      alert(`Failed to create project: ${err.message}`);
    }
  };

  const activeClient = clients.find((c) => c.id === selectedClientId);
  const clientProjects = projects.filter((p) => p.clientId === selectedClientId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px", height: "calc(100vh - 120px)" }}>
      {/* Left Column: Client List */}
      <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc" }}>
            Clients ({clients.length})
          </h3>
          <button
            onClick={() => setShowNewClient(!showNewClient)}
            style={{
              padding: "4px 8px",
              borderRadius: "6px",
              backgroundColor: "#4f46e5",
              color: "#ffffff",
              border: "none",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Plus size={13} />
            <span>New Client</span>
          </button>
        </div>

        {showNewClient && (
          <form onSubmit={handleCreateClient} style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid var(--border-focus)",
          }}>
            <input
              type="text"
              placeholder="Client Name (e.g. ABC School)"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", marginBottom: "8px", backgroundColor: "#0f172a", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "#f8fafc", fontSize: "12px" }}
              required
            />
            <input
              type="text"
              placeholder="Client Code (e.g. ABCSCH)"
              value={newClientCode}
              onChange={(e) => setNewClientCode(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", marginBottom: "8px", backgroundColor: "#0f172a", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "#f8fafc", fontSize: "12px" }}
            />
            <input
              type="text"
              placeholder="Aliases (comma-separated: ABC, ABCS)"
              value={newClientAliases}
              onChange={(e) => setNewClientAliases(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", marginBottom: "10px", backgroundColor: "#0f172a", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "#f8fafc", fontSize: "12px" }}
            />
            <button
              type="submit"
              style={{ width: "100%", padding: "6px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
            >
              Save Client
            </button>
          </form>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                backgroundColor: selectedClientId === client.id ? "rgba(99, 102, 241, 0.15)" : "transparent",
                border: "1px solid",
                borderColor: selectedClientId === client.id ? "rgba(99, 102, 241, 0.4)" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "600", color: selectedClientId === client.id ? "#818cf8" : "#f8fafc" }}>
                {client.name}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Code: {client.code} • {client.aliases?.length || 0} aliases
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Selected Client Details & Projects */}
      <div className="glass-panel" style={{ padding: "24px", overflowY: "auto" }}>
        {activeClient ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#f8fafc" }}>
                  {activeClient.name}
                </h2>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  Normalized Code: <span className="mono-font" style={{ color: "#38bdf8" }}>{activeClient.code}</span>
                </div>
              </div>

              <button
                onClick={() => setShowNewProject(!showNewProject)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={14} />
                <span>New Project</span>
              </button>
            </div>

            {/* Aliases Card */}
            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.02)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px" }}>
                REGISTERED CLASSIFICATION ALIASES:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {activeClient.aliases && activeClient.aliases.length > 0 ? (
                  activeClient.aliases.map((alias: string, aIdx: number) => (
                    <span key={aIdx} className="badge-glow-primary" style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
                      {alias}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>No aliases configured yet.</span>
                )}
              </div>
            </div>

            {/* New Project Form */}
            {showNewProject && (
              <form onSubmit={handleCreateProject} style={{
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid var(--border-focus)",
              }}>
                <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc", marginBottom: "12px" }}>
                  Add Project for {activeClient.name}
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <input
                    type="text"
                    placeholder="Project Name (e.g. ID Card)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    style={{ padding: "8px 12px", backgroundColor: "#0f172a", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "#f8fafc", fontSize: "12px" }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Year"
                    value={newProjectYear}
                    onChange={(e) => setNewProjectYear(Number(e.target.value))}
                    style={{ padding: "8px 12px", backgroundColor: "#0f172a", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "#f8fafc", fontSize: "12px" }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={newProjectCategory}
                    onChange={(e) => setNewProjectCategory(e.target.value)}
                    style={{ padding: "8px 12px", backgroundColor: "#0f172a", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "#f8fafc", fontSize: "12px" }}
                  />
                </div>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                >
                  Create Project
                </button>
              </form>
            )}

            {/* Projects List */}
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f8fafc", marginBottom: "12px" }}>
              Associated Projects ({clientProjects.length})
            </h3>

            {clientProjects.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "13px", padding: "20px 0" }}>
                No projects added for this client yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {clientProjects.map((p) => (
                  <div
                    key={p.id}
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
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#f8fafc" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Category: {p.category} • Year: {p.year}
                      </div>
                    </div>
                    <span className="badge-glow-primary" style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center", padding: "40px" }}>
            Select a client to inspect projects and aliases.
          </div>
        )}
      </div>
    </div>
  );
};
