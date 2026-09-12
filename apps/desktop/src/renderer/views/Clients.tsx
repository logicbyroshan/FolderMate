import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Tag,
  FolderTree,
  Building,
  Check,
  Sparkles,
  Folder,
  Calendar,
  Layers,
  Search,
} from "lucide-react";
import {
  Button,
  Input,
  SearchBar,
  Badge,
  Card,
  Modal,
  EmptyState,
  useToast,
} from "../components/ui/index.js";

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const { showToast } = useToast();

  // New Client Modal
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientCode, setNewClientCode] = useState("");
  const [newClientAliases, setNewClientAliases] = useState("");
  const [isCreatingClient, setIsCreatingClient] = useState(false);

  // New Project Modal
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectYear, setNewProjectYear] = useState(new Date().getFullYear());
  const [newProjectCategory, setNewProjectCategory] = useState("ID Card");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

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
    } catch (err: any) {
      console.error("Failed to load clients/projects:", err);
      showToast(err.message || "Failed to load clients and projects", "error");
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

    setIsCreatingClient(true);
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
        setShowNewClientModal(false);
        showToast(`Successfully registered client ${created.name}`, "success");
        await loadData();
        setSelectedClientId(created.id);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create client", "error");
    } finally {
      setIsCreatingClient(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newProjectName.trim()) return;

    setIsCreatingProject(true);
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.call("projects.create", {
          clientId: selectedClientId,
          name: newProjectName.trim(),
          category: newProjectCategory,
          year: Number(newProjectYear),
        });

        setNewProjectName("");
        setShowNewProjectModal(false);
        showToast(`Created project ${newProjectName} for ${activeClient?.name}`, "success");
        await loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create project", "error");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.code?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.aliases?.some((a: string) => a.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const activeClient = clients.find((c) => c.id === selectedClientId);
  const clientProjects = projects.filter((p) => p.clientId === selectedClientId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, height: "calc(100vh - 120px)" }}>
      {/* Left Column: Client List */}
      <Card padded={false} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 16px 12px 16px", borderBottom: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} color="var(--accent-amber)" />
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                Clients ({clients.length})
              </h3>
            </div>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus size={14} />}
              onClick={() => setShowNewClientModal(true)}
            >
              New Client
            </Button>
          </div>
          <SearchBar
            value={clientSearch}
            onChange={setClientSearch}
            onClear={() => setClientSearch("")}
            placeholder="Search clients or codes..."
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {filteredClients.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              {clients.length === 0 ? "No clients registered yet." : "No matching clients found."}
            </div>
          ) : (
            filteredClients.map((client) => {
              const isSelected = selectedClientId === client.id;
              const projectCount = projects.filter((p) => p.clientId === client.id).length;
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: isSelected ? "var(--accent-amber-subtle)" : "transparent",
                    border: `1px solid ${isSelected ? "var(--border-focus)" : "transparent"}`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  className="client-list-item"
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isSelected ? "var(--accent-amber)" : "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {client.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span className="mono-font" style={{ color: "var(--text-secondary)" }}>{client.code}</span>
                      <span>•</span>
                      <span>{projectCount} projects</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent-amber)" }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Right Column: Selected Client Details & Projects */}
      <Card padded={false} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {activeClient ? (
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {/* Header section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <Building size={22} color="var(--accent-amber)" />
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                    {activeClient.name}
                  </h2>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Canonical Code:</span>
                  <span className="mono-font" style={{ color: "var(--status-info)", fontWeight: 600 }}>{activeClient.code}</span>
                </div>
              </div>

              <Button
                variant="primary"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowNewProjectModal(true)}
              >
                Add Project
              </Button>
            </div>

            {/* Aliases Card */}
            <Card style={{ marginBottom: 24, backgroundColor: "var(--bg-surface-elevated)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                <Tag size={13} />
                <span>Registered Recognition Aliases</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {activeClient.aliases && activeClient.aliases.length > 0 ? (
                  activeClient.aliases.map((alias: string, aIdx: number) => (
                    <Badge key={aIdx} variant="amber" size="md">
                      {alias}
                    </Badge>
                  ))
                ) : (
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    No aliases configured yet. The engine will match by canonical name and code.
                  </span>
                )}
              </div>
            </Card>

            {/* Projects List Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FolderTree size={16} color="var(--accent-amber)" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                  Associated Projects ({clientProjects.length})
                </h3>
              </div>
            </div>

            {clientProjects.length === 0 ? (
              <EmptyState
                icon={<Layers size={36} color="var(--text-muted)" />}
                title="No Projects Configured"
                description={`Create a project for ${activeClient.name} to start organizing deliverables by year and category.`}
                actionLabel="Create First Project"
                onAction={() => setShowNewProjectModal(true)}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {clientProjects.map((p) => (
                  <Card
                    key={p.id}
                    interactive
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Folder size={16} color="var(--accent-amber)" />
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                            {p.name}
                          </span>
                        </div>
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Layers size={12} />
                          {p.category || "Design"}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Calendar size={12} />
                          {p.year || new Date().getFullYear()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <EmptyState
              icon={<Users size={40} color="var(--text-muted)" />}
              title="Select a Client"
              description="Choose a client from the left directory to view associated projects, aliases, and folder mappings."
            />
          </div>
        )}
      </Card>

      {/* New Client Modal */}
      <Modal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        title="Register New Client"
        subtitle="Add a new client entity to the organization catalog. FolderMate uses this to classify incoming files."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNewClientModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateClient} isLoading={isCreatingClient}>
              Save Client
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateClient} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Client Name *"
            placeholder="e.g. ABC School"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Client Code"
            placeholder="e.g. ABCSCH (optional, auto-generated if blank)"
            value={newClientCode}
            onChange={(e) => setNewClientCode(e.target.value)}
          />
          <Input
            label="Recognition Aliases"
            placeholder="Comma-separated: ABC, ABCS, ABC SCHOOL"
            value={newClientAliases}
            onChange={(e) => setNewClientAliases(e.target.value)}
          />
        </form>
      </Modal>

      {/* New Project Modal */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title={`Add Project for ${activeClient?.name || "Client"}`}
        subtitle="Projects define work categories and year scopes within the client directory hierarchy."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNewProjectModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateProject} isLoading={isCreatingProject}>
              Create Project
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProject} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Project Name *"
            placeholder="e.g. ID Card, Annual Magazine, Certificate"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
            autoFocus
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Year Scope *"
              type="number"
              placeholder="Year"
              value={newProjectYear}
              onChange={(e) => setNewProjectYear(Number(e.target.value))}
              required
            />
            <Input
              label="Category"
              placeholder="e.g. ID Card, Design, Print"
              value={newProjectCategory}
              onChange={(e) => setNewProjectCategory(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
