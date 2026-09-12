import React, { useState, useEffect } from "react";
import { FileText, ExternalLink, Calendar, Filter } from "lucide-react";
import { SearchBar } from "../components/ui/SearchBar.js";
import { Card } from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
import { Button } from "../components/ui/Button.js";
import { IconButton } from "../components/ui/IconButton.js";
import { EmptyState } from "../components/ui/EmptyState.js";

export const Search: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterExt, setFilterExt] = useState<string | null>(null);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
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
    ? results.filter((r) => (r.extension || "").toLowerCase() === filterExt.toLowerCase())
    : results;

  const extBadges = [".cdr", ".pdf", ".ai", ".png", ".jpg", ".docx"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Search Header */}
      <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by client, project, year, or filename (e.g. 'Apex ID Card 2026')..."
          autoFocus
        />

        {/* Extension Filter Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <Filter size={12} /> Filter:
          </span>

          <Button
            size="sm"
            variant={filterExt === null ? "amber" : "secondary"}
            onClick={() => setFilterExt(null)}
          >
            All Types
          </Button>

          {extBadges.map((ext) => (
            <Button
              key={ext}
              size="sm"
              variant={filterExt === ext ? "amber" : "secondary"}
              onClick={() => setFilterExt(filterExt === ext ? null : ext)}
            >
              {ext.toUpperCase()}
            </Button>
          ))}
        </div>
      </Card>

      {/* Results Feed */}
      <Card style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, fontWeight: 600 }}>
          {isLoading ? "Searching index..." : `Found ${filteredResults.length} indexed files`}
        </div>

        {filteredResults.length === 0 ? (
          <EmptyState
            title="No matching files found"
            description="Try adjusting your search terms or clearing the extension filter."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredResults.map((item, idx) => (
              <div
                key={item.fileId || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-canvas)",
                  border: "1px solid var(--border-subtle)",
                  transition: "border-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--accent-amber-subtle)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={18} color="var(--accent-amber)" />
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.filename || item.currentName}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {item.clientName && (
                        <span>Client: <strong style={{ color: "var(--text-secondary)" }}>{item.clientName}</strong></span>
                      )}
                      {item.projectName && (
                        <span>Project: <strong style={{ color: "var(--text-secondary)" }}>{item.projectName}</strong></span>
                      )}
                      {item.year && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Calendar size={11} /> {item.year}
                        </span>
                      )}
                      {item.sizeBytes && (
                        <span>{Math.round(item.sizeBytes / 1024)} KB</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Badge variant="amber" size="sm">
                    v{item.version || item.versionNumber || 1}
                  </Badge>

                  <IconButton
                    icon={<ExternalLink size={15} />}
                    onClick={() => handleReveal(item.path || item.currentPath)}
                    tooltip="Open in Explorer"
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
