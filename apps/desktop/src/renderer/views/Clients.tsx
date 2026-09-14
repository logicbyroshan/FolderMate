import React, { useState, useEffect } from "react";
import {
  Folder,
  FolderPlus,
  FolderTree,
  FolderOpen,
  Plus,
  Tag,
  Calendar,
  Layers,
  FileText,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Sparkles,
  ArrowLeft,
  Check,
  Search as SearchIcon,
} from "lucide-react";
import {
  Button,
  IconButton,
  Input,
  SearchBar,
  Badge,
  Card,
  Modal,
  EmptyState,
  FolderColorPicker,
  useToast,
} from "../components/ui/index.js";

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [libraryRoot, setLibraryRoot] = useState("D:\\Clients");
  const { showToast } = useToast();

  // New Project Subfolder Modal
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectYear, setNewProjectYear] = useState(new Date().getFullYear());
  const [newProjectCategory, setNewProjectCategory] = useState("ID Card");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const loadData = async () => {
    try {
      if ((window as any).foldermate) {
        const cfg = await (window as any).foldermate.call("settings.get");
        if (cfg?.storage?.organizationRoot) {
          setLibraryRoot(cfg.storage.organizationRoot);
        }

        const cRes = await (window as any).foldermate.call("clients.list");
        setClients(cRes || []);

        const pRes = await (window as any).foldermate.call("projects.list");
        setProjects(pRes || []);

        const fRes = await (window as any).foldermate.call("files.list", { limit: 100 });
        setFiles(fRes?.items || []);
      }
    } catch (err: any) {
      console.error("Failed to load client library folders:", err);
      showToast(err.message || "Failed to load client library folders", "error");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProjectSubfolder = async (e: React.FormEvent) => {
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
        showToast(`Created project subfolder "${newProjectName}" on disk`, "success");
        await loadData();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create project folder", "error");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleOpenFolder = async (folderPath: string) => {
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.openPath(folderPath);
      }
    } catch (err: any) {
      showToast(`Cannot open path: ${err.message}`, "error");
    }
  };

  const handleRevealFile = async (filePath: string) => {
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.showItemInFolder(filePath);
      }
    } catch (err: any) {
      showToast(`Cannot reveal file: ${err.message}`, "error");
    }
  };

  const getColorHex = (color?: string) => {
    switch ((color || "").toLowerCase()) {
      case "blue": return "#3b82f6";
      case "green": return "#10b981";
      case "red": return "#ef4444";
      case "purple": return "#8b5cf6";
      case "cyan": return "#06b6d4";
      case "gray": return "#64748b";
      case "amber":
      default:
        return "#f59e0b";
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
  const clientFiles = files.filter((f) => f.clientId === selectedClientId || f.clientName === activeClient?.name);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Header Card / Library Root Navigation */}
      <Card
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "var(--bg-surface-elevated)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--accent-amber-subtle)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(245, 158, 11, 0.3)",
            }}
          >
            <FolderTree size={20} color="var(--accent-amber)" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                Client Library Folders
              </h2>
              <Badge variant="amber" size="sm">
                {clients.length} Clients
              </Badge>
              <Badge variant="info" size="sm">
                {projects.length} Project Subfolders
              </Badge>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, fontSize: 12, color: "var(--text-muted)" }}>
              <span>Main Storage Location:</span>
              <code className="mono-font" style={{ color: "var(--text-secondary)", backgroundColor: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>
                {libraryRoot}
              </code>
              <IconButton
                icon={<ExternalLink size={13} />}
                tooltip="Open Library Root in Windows Explorer"
                size="sm"
                onClick={() => handleOpenFolder(libraryRoot)}
              />
            </div>
          </div>
        </div>

      </Card>

      {/* Main View: Either Folder Grid (when no client is selected) or Deep Client Inspector */}
      {!activeClient ? (
        /* Folder Grid View */
        <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                All Client Folders ({filteredClients.length})
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Each folder below represents a physical folder inside <span className="mono-font" style={{ color: "var(--accent-amber)" }}>{libraryRoot}\</span>.
              </p>
            </div>

            <div style={{ width: 280 }}>
              <SearchBar
                value={clientSearch}
                onChange={setClientSearch}
                onClear={() => setClientSearch("")}
                placeholder="Search client folders..."
              />
            </div>
          </div>

          {filteredClients.length === 0 ? (
            <EmptyState
              icon={<FolderPlus size={40} color="var(--text-muted)" />}
              title="No Client Folders Found"
              description="No client folders were detected in the configured library root yet."
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
              {filteredClients.map((client) => {
                const clientFolderProjects = projects.filter((p) => p.clientId === client.id);
                const clientFolderFiles = files.filter((f) => f.clientId === client.id || f.clientName === client.name);
                const folderColor = getColorHex(client.color);

                return (
                  <Card
                    key={client.id}
                    interactive
                    onClick={() => setSelectedClientId(client.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                      padding: "18px 20px",
                      borderTop: `3px solid ${folderColor}`,
                      cursor: "pointer",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Folder size={26} color={folderColor} fill={folderColor} fillOpacity={0.15} />
                          <div>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                              {client.name}
                            </h4>
                            <span className="mono-font" style={{ fontSize: 11, color: "var(--status-info)", fontWeight: 600 }}>
                              {client.code}
                            </span>
                          </div>
                        </div>

                        <IconButton
                          icon={<ExternalLink size={14} />}
                          tooltip="Open in Windows Explorer"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFolder(`${libraryRoot}\\${client.name}`);
                          }}
                        />
                      </div>

                      {/* Aliases pill */}
                      {client.aliases && client.aliases.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                          {client.aliases.slice(0, 3).map((alias: string, aIdx: number) => (
                            <span
                              key={aIdx}
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                                padding: "1px 6px",
                                borderRadius: 4,
                                backgroundColor: "rgba(255,255,255,0.06)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {alias}
                            </span>
                          ))}
                          {client.aliases.length > 3 && (
                            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                              +{client.aliases.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Layers size={12} />
                        {clientFolderProjects.length} Project Subfolders
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent-amber)" }}>
                        <FileText size={12} />
                        {clientFolderFiles.length} files
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      ) : (
        /* Detailed Client Folder Explorer View */
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Back Navigation Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft size={14} />}
                onClick={() => setSelectedClientId(null)}
              >
                All Client Folders
              </Button>

              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
                <span>Library</span>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{activeClient.name}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ExternalLink size={14} />}
                onClick={() => handleOpenFolder(`${libraryRoot}\\${activeClient.name}`)}
              >
                Open in Windows Explorer
              </Button>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowNewProjectModal(true)}
              >
                Add Project Subfolder
              </Button>
            </div>
          </div>

          {/* Client Folder Overview Card */}
          <Card style={{ padding: 20, backgroundColor: "var(--bg-surface-elevated)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <Folder
                    size={26}
                    color={getColorHex(activeClient.color)}
                    fill={getColorHex(activeClient.color)}
                    fillOpacity={0.2}
                  />
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                      {activeClient.name}
                    </h3>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      <span>Canonical Code:</span>
                      <span className="mono-font" style={{ color: "var(--status-info)", fontWeight: 600 }}>{activeClient.code}</span>
                      <span>•</span>
                      <span>Physical Directory:</span>
                      <code className="mono-font" style={{ color: "var(--text-secondary)" }}>
                        {libraryRoot}\{activeClient.name}\
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aliases Tags */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Active Recognition Aliases:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {activeClient.aliases && activeClient.aliases.length > 0 ? (
                    activeClient.aliases.map((alias: string, aIdx: number) => (
                      <Badge key={aIdx} variant="amber" size="sm">
                        {alias}
                      </Badge>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Matches canonical name only</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Subfolders Grid: Project Categories and Years */}
          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FolderOpen size={18} color="var(--accent-amber)" />
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                  Project Subfolders inside {activeClient.name} ({clientProjects.length})
                </h4>
              </div>
            </div>

            {clientProjects.length === 0 ? (
              <EmptyState
                icon={<FolderPlus size={36} color="var(--text-muted)" />}
                title="No Project Subfolders Yet"
                description={`Create a project subfolder (like "2026/ID Card") to organize deliverables inside ${activeClient.name}.`}
                actionLabel="Add First Project Subfolder"
                onAction={() => setShowNewProjectModal(true)}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {clientProjects.map((p) => {
                  const projFolderPath = `${libraryRoot}\\${activeClient.name}\\${p.year || 2026}\\${p.name}`;
                  const projectFileCount = files.filter(
                    (f) => f.projectId === p.id || (f.projectName === p.name && f.clientName === activeClient.name)
                  ).length;

                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: "14px 16px",
                        backgroundColor: "var(--bg-canvas)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Folder size={18} color="var(--accent-amber)" />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <Calendar size={11} /> {p.year || new Date().getFullYear()}
                              </span>
                              <span>•</span>
                              <span>{p.category || "Design"}</span>
                            </div>
                          </div>
                        </div>

                        <IconButton
                          icon={<ExternalLink size={13} />}
                          tooltip="Open in Windows Explorer"
                          size="sm"
                          onClick={() => handleOpenFolder(projFolderPath)}
                        />
                      </div>

                      <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
                        <code className="mono-font" style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {p.year || 2026}\{p.name}
                        </code>
                        <Badge variant="neutral" size="sm">
                          {projectFileCount} files
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Files Inside this Client Folder */}
          <Card style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={18} color="var(--status-info)" />
                <h4 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                  Deliverable Files in {activeClient.name} ({clientFiles.length})
                </h4>
              </div>
            </div>

            {clientFiles.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No files organized under this client folder yet. Drop files into your Inbox to organize automatically.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {clientFiles.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      backgroundColor: "var(--bg-canvas)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--accent-amber-subtle)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileText size={16} color="var(--accent-amber)" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          {file.filename || file.currentName || file.originalName}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                          <span>{file.projectName || "Design"}</span>
                          <span>•</span>
                          <span>{Math.round((file.fileSizeBytes || file.sizeBytes || 0) / 1024)} KB</span>
                          <span>•</span>
                          <span className="mono-font">.{file.extension}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Badge variant="amber" size="sm">
                        v{file.version || file.versionNumber || 1}
                      </Badge>
                      <IconButton
                        icon={<ExternalLink size={14} />}
                        tooltip="Reveal in Windows Explorer"
                        size="sm"
                        onClick={() => handleRevealFile(file.path || file.currentPath)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* New Project Subfolder Modal */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title={`Add Project Subfolder for ${activeClient?.name || "Client"}`}
        subtitle="Creates a structured project folder (e.g. 2026\ID Card\) inside this client directory."
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNewProjectModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateProjectSubfolder} isLoading={isCreatingProject}>
              Create Subfolder
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProjectSubfolder} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Project Name *"
            placeholder="e.g. ID Card, Annual Magazine, Banner"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
            autoFocus
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
