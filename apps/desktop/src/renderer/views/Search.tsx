import React, { useState, useEffect } from "react";
import {
  FileText,
  ExternalLink,
  Calendar,
  Filter,
  Copy,
  Check,
  FolderOpen,
  History,
  Layers,
  ShieldCheck,
  Sparkles,
  ArrowUpDown,
  Search as SearchIcon,
  Tag,
  Hash,
  Eye,
  FileCode,
} from "lucide-react";
import { SearchBar } from "../components/ui/SearchBar.js";
import { Card } from "../components/ui/Card.js";
import { Badge, StatusBadge } from "../components/ui/Badge.js";
import { Button } from "../components/ui/Button.js";
import { IconButton } from "../components/ui/IconButton.js";
import { Select } from "../components/ui/Select.js";
import { EmptyState } from "../components/ui/EmptyState.js";
import { useToast } from "../components/ui/Toast.js";

export const Search: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { showToast } = useToast();

  // Filters & Sorting
  const [filterExt, setFilterExt] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState<string>("ALL");
  const [filterYear, setFilterYear] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NEWEST");

  const loadClients = async () => {
    try {
      if ((window as any).foldermate) {
        const cRes = await (window as any).foldermate.call("clients.list");
        setClients(cRes || []);
      }
    } catch {}
  };

  const performSearch = async (searchTerm: string) => {
    setIsLoading(true);
    try {
      if ((window as any).foldermate) {
        let res: any[] = [];
        if (!searchTerm.trim()) {
          const listRes = await (window as any).foldermate.call("files.list", { limit: 100 });
          res = listRes.items || [];
        } else {
          const searchRes = await (window as any).foldermate.call("search.query", {
            query: searchTerm,
            limit: 100,
          });
          res = searchRes || [];
        }

        setResults(res);
        if (res.length > 0 && (!selectedFile || !res.find((r) => (r.id || r.fileId) === (selectedFile.id || selectedFile.fileId)))) {
          setSelectedFile(res[0]);
        } else if (res.length === 0) {
          setSelectedFile(null);
        }
      }
    } catch (err: any) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    performSearch(query);
  }, [query]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard`, "info");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleReveal = async (filePath: string) => {
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.showItemInFolder(filePath);
      }
    } catch (err: any) {
      showToast(`Cannot reveal file: ${err.message}`, "error");
    }
  };

  const handleOpenFile = async (filePath: string) => {
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.openPath(filePath);
      }
    } catch (err: any) {
      showToast(`Cannot open file: ${err.message}`, "error");
    }
  };

  const getFileIconColor = (ext: string) => {
    const e = (ext || "").toLowerCase().replace(".", "");
    switch (e) {
      case "cdr": return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" }; // CorelDRAW Amber
      case "pdf": return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" }; // PDF Red
      case "ai": return { color: "#f97316", bg: "rgba(249, 115, 22, 0.15)" }; // AI Orange
      case "psd": return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" }; // PSD Blue
      case "png":
      case "jpg":
      case "jpeg":
        return { color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)" }; // Image Cyan
      default:
        return { color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" };
    }
  };

  // Filter and sort results
  let filteredResults = results.filter((item) => {
    const ext = (item.extension || "").toLowerCase().replace(".", "");
    if (filterExt && ext !== filterExt.toLowerCase().replace(".", "")) return false;

    if (filterClient !== "ALL") {
      const matchClient = item.clientName === filterClient || item.clientId === filterClient;
      if (!matchClient) return false;
    }

    if (filterYear !== "ALL") {
      if (String(item.year) !== filterYear) return false;
    }

    return true;
  });

  filteredResults.sort((a, b) => {
    if (sortBy === "NEWEST") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === "OLDEST") {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (sortBy === "NAME_ASC") {
      return (a.filename || a.currentName || "").localeCompare(b.filename || b.currentName || "");
    }
    if (sortBy === "VERSION_DESC") {
      return (b.version || b.versionNumber || 1) - (a.version || a.versionNumber || 1);
    }
    if (sortBy === "SIZE_DESC") {
      return (b.fileSizeBytes || b.sizeBytes || 0) - (a.fileSizeBytes || a.sizeBytes || 0);
    }
    return 0;
  });

  const extBadges = ["cdr", "pdf", "ai", "png", "jpg", "psd", "docx"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "calc(100vh - 120px)" }}>
      {/* Search Bar & Multi-Faceted Filters Card */}
      <Card style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          placeholder="Search by filename, client, project deliverable, year, or extension (e.g. 'ABC School ID Card 2026')..."
          autoFocus
        />

        {/* Filter Controls Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {/* Extension Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <Filter size={12} /> Format:
            </span>

            <Button
              size="sm"
              variant={filterExt === null ? "primary" : "secondary"}
              onClick={() => setFilterExt(null)}
            >
              All Types
            </Button>

            {extBadges.map((ext) => (
              <Button
                key={ext}
                size="sm"
                variant={filterExt === ext ? "primary" : "secondary"}
                onClick={() => setFilterExt(filterExt === ext ? null : ext)}
              >
                .{ext.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Client, Year & Sorting Dropdowns */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 150 }}>
              <Select
                value={filterClient}
                onChange={setFilterClient}
                options={[
                  { label: "All Clients", value: "ALL" },
                  ...clients.map((c) => ({ label: c.name, value: c.name })),
                ]}
              />
            </div>

            <div style={{ width: 110 }}>
              <Select
                value={filterYear}
                onChange={setFilterYear}
                options={[
                  { label: "All Years", value: "ALL" },
                  { label: "2026", value: "2026" },
                  { label: "2025", value: "2025" },
                  { label: "2024", value: "2024" },
                ]}
              />
            </div>

            <div style={{ width: 140 }}>
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { label: "Newest First", value: "NEWEST" },
                  { label: "Oldest First", value: "OLDEST" },
                  { label: "Name (A-Z)", value: "NAME_ASC" },
                  { label: "Version (High)", value: "VERSION_DESC" },
                  { label: "Size (Largest)", value: "SIZE_DESC" },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Split Layout: Results Feed (Left) & Deep Inspector (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16, flex: 1, minHeight: 0 }}>
        {/* Left Column: Search Results Feed */}
        <Card padded={false} style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
              {isLoading ? "Searching FTS5 Index..." : `Found ${filteredResults.length} indexed files`}
            </span>

            {(filterExt || filterClient !== "ALL" || filterYear !== "ALL" || query) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setFilterExt(null);
                  setFilterClient("ALL");
                  setFilterYear("ALL");
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredResults.length === 0 ? (
              <EmptyState
                icon={<SearchIcon size={36} color="var(--text-muted)" />}
                title="No Matching Files Found"
                description="Try clearing your filters or searching for client names, categories, or year numbers."
              />
            ) : (
              filteredResults.map((item) => {
                const isSelected = (selectedFile?.id || selectedFile?.fileId) === (item.id || item.fileId);
                const fileIcon = getFileIconColor(item.extension);
                const sizeKb = Math.round((item.fileSizeBytes || item.sizeBytes || 0) / 1024);

                return (
                  <div
                    key={item.id || item.fileId}
                    onClick={() => setSelectedFile(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: isSelected ? "var(--accent-amber-subtle)" : "var(--bg-canvas)",
                      border: `1px solid ${isSelected ? "var(--border-focus)" : "var(--border-subtle)"}`,
                      cursor: "pointer",
                      transition: "all 0.12s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: fileIcon.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={18} color={fileIcon.color} />
                      </div>

                      <div style={{ minWidth: 0 }}>
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
                          {item.filename || item.currentName || item.originalName}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {item.clientName && (
                            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{item.clientName}</span>
                          )}
                          <span>•</span>
                          <span>{item.projectName || item.category || "Design"}</span>
                          {item.year && (
                            <>
                              <span>•</span>
                              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <Calendar size={11} /> {item.year}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>{sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <Badge variant="amber" size="sm">
                        v{item.version || item.versionNumber || 1}
                      </Badge>
                      <IconButton
                        icon={<ExternalLink size={13} />}
                        tooltip="Reveal in Explorer"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReveal(item.path || item.currentPath);
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Column: Deep File & Version Inspector */}
        <Card padded={false} style={{ display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "var(--bg-surface-elevated)" }}>
          {selectedFile ? (
            <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Header Preview */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: getFileIconColor(selectedFile.extension).bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={22} color={getFileIconColor(selectedFile.extension).color} />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Badge variant="amber" size="sm">
                      v{selectedFile.version || selectedFile.versionNumber || 1}
                    </Badge>
                    <StatusBadge status={selectedFile.status || "ORGANIZED"} />
                  </div>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedFile.filename || selectedFile.currentName || selectedFile.originalName}
                  </h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Eye size={13} />}
                  onClick={() => handleOpenFile(selectedFile.path || selectedFile.currentPath)}
                >
                  Open File
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ExternalLink size={13} />}
                  onClick={() => handleReveal(selectedFile.path || selectedFile.currentPath)}
                >
                  Reveal in Explorer
                </Button>
              </div>

              {/* File Location Card */}
              <div style={{ padding: "10px 12px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Physical File Location
                  </span>
                  <button
                    onClick={() => handleCopy(selectedFile.path || selectedFile.currentPath, "path")}
                    style={{
                      background: "none",
                      border: "none",
                      color: copiedField === "path" ? "var(--status-success)" : "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {copiedField === "path" ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedField === "path" ? "Copied" : "Copy Path"}</span>
                  </button>
                </div>
                <code className="mono-font" style={{ fontSize: 11, color: "var(--text-primary)", wordBreak: "break-all", display: "block" }}>
                  {selectedFile.path || selectedFile.currentPath}
                </code>
              </div>

              {/* Structured Metadata Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  File & Classification Metadata
                </span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ padding: "8px 10px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Client Name</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                      {selectedFile.clientName || "—"}
                    </div>
                  </div>

                  <div style={{ padding: "8px 10px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Project Scope</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                      {selectedFile.projectName || selectedFile.category || "—"}
                    </div>
                  </div>

                  <div style={{ padding: "8px 10px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Year Scope</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                      {selectedFile.year || "—"}
                    </div>
                  </div>

                  <div style={{ padding: "8px 10px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>File Size</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                      {Math.round((selectedFile.fileSizeBytes || selectedFile.sizeBytes || 0) / 1024)} KB
                    </div>
                  </div>
                </div>

                {/* Classification Confidence */}
                {selectedFile.classificationConfidence !== undefined && (
                  <div style={{ padding: "8px 10px", backgroundColor: "var(--bg-surface)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", marginTop: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Confidence Score</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--status-success)" }}>
                        {Math.round(selectedFile.classificationConfidence * 100)}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.round(selectedFile.classificationConfidence * 100)}%`,
                          height: "100%",
                          backgroundColor: "var(--status-success)",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Version History Lineage */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <History size={13} color="var(--accent-amber)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Version Lineage History
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(selectedFile.versionChain || [
                    {
                      version: selectedFile.version || selectedFile.versionNumber || 1,
                      name: selectedFile.filename || selectedFile.currentName,
                      date: "Current Active Version",
                      isCurrent: true,
                    },
                  ]).map((vItem: any, vIdx: number) => (
                    <div
                      key={vIdx}
                      style={{
                        padding: "8px 10px",
                        backgroundColor: vItem.isCurrent ? "var(--accent-amber-subtle)" : "var(--bg-surface)",
                        border: `1px solid ${vItem.isCurrent ? "var(--border-focus)" : "var(--border-subtle)"}`,
                        borderRadius: "var(--radius-sm)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: vItem.isCurrent ? "var(--accent-amber)" : "var(--text-primary)" }}>
                          Version {vItem.version} {vItem.isCurrent && "• Current"}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                          {vItem.date || "Organized"}
                        </div>
                      </div>

                      <Badge variant={vItem.isCurrent ? "amber" : "neutral"} size="sm">
                        v{vItem.version}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
              <EmptyState
                icon={<FileText size={36} color="var(--text-muted)" />}
                title="Select a File"
                description="Click on any search result on the left to inspect complete metadata, version lineage, and file location."
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
