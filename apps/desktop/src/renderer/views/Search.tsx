import React, { useState, useEffect } from "react";
import { Search as SearchIcon, FileText, ExternalLink, Calendar, Hash, Tag, Filter } from "lucide-react";

export const Search: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterExt, setFilterExt] = useState<string | null>(null);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      // Load recent files if search is empty
      try {
        if ((window as any).foldermate) {
          const res = await (window as any).foldermate.call("files.list", { limit: 25 });
          setResults(res.items || []);
        }
      } catch {}
      return;
    }

    setIsLoading(true);
    try {
      if ((window as any).foldermate) {
        const res = await (window as any).foldermate.call("search.query", {
          query: searchTerm,
          limit: 50,
        });
        setResults(res || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performSearch(query);
  }, [query]);

  const handleReveal = async (filePath: string) => {
    if ((window as any).foldermate) {
      await (window as any).foldermate.showItemInFolder(filePath);
    }
  };

  const filteredResults = filterExt
    ? results.filter((r) => r.extension?.toLowerCase() === filterExt.toLowerCase())
    : results;

  const extBadges = [".cdr", ".pdf", ".ai", ".png", ".jpg", ".docx"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Search Header */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--border-focus)",
          borderRadius: "10px",
          padding: "12px 18px",
        }}>
          <SearchIcon size={20} color="#818cf8" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client, project, year, or filename (e.g. 'ABC School ID Card 2026')..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#f8fafc",
              fontSize: "14px",
              width: "100%",
            }}
            autoFocus
          />
        </div>

        {/* Extension Filter Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
            <Filter size={12} /> Filter:
          </span>

          <button
            onClick={() => setFilterExt(null)}
            style={{
              padding: "3px 10px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: "600",
              border: "1px solid",
              borderColor: filterExt === null ? "#6366f1" : "var(--border-subtle)",
              backgroundColor: filterExt === null ? "rgba(99, 102, 241, 0.2)" : "transparent",
              color: filterExt === null ? "#818cf8" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            All Types
          </button>

          {extBadges.map((ext) => (
            <button
              key={ext}
              onClick={() => setFilterExt(filterExt === ext ? null : ext)}
              style={{
                padding: "3px 10px",
                borderRadius: "9999px",
                fontSize: "11px",
                fontWeight: "600",
                border: "1px solid",
                borderColor: filterExt === ext ? "#6366f1" : "var(--border-subtle)",
                backgroundColor: filterExt === ext ? "rgba(99, 102, 241, 0.2)" : "transparent",
                color: filterExt === ext ? "#818cf8" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {ext.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Results Feed */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", fontWeight: "600" }}>
          Found {filteredResults.length} indexed files
        </div>

        {filteredResults.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "13px" }}>
            No matching files found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredResults.map((item, idx) => (
              <div
                key={item.fileId || idx}
                className="glass-panel-interactive"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <FileText size={20} color="#818cf8" />
                  </div>

                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
                      {item.filename || item.currentName}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {item.clientName && (
                        <span>Client: <strong style={{ color: "var(--text-secondary)" }}>{item.clientName}</strong></span>
                      )}
                      {item.projectName && (
                        <span>Project: <strong style={{ color: "var(--text-secondary)" }}>{item.projectName}</strong></span>
                      )}
                      {item.year && (
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          <Calendar size={11} /> {item.year}
                        </span>
                      )}
                      {item.sizeBytes && (
                        <span>{Math.round(item.sizeBytes / 1024)} KB</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="badge-glow-primary" style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}>
                    v{item.version || item.versionNumber || 1}
                  </span>

                  <button
                    onClick={() => handleReveal(item.path || item.currentPath)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-subtle)",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      color: "#f8fafc",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Open in Explorer</span>
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
