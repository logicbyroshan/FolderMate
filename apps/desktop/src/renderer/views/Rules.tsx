import React, { useState, useEffect } from "react";
import { Sliders, Save, FolderTree, FolderCog, Plus, Trash2, Palette } from "lucide-react";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
import { Badge } from "../components/ui/Badge.js";
import { FolderColorPicker, FOLDER_COLOR_PALETTE } from "../components/ui/FolderColorPicker.js";
import { useToast } from "../components/ui/Toast.js";

interface FolderRuleItem {
  id: string;
  name: string;
  targetType: string;
  color: string;
  infoTipTemplate: string;
}

export const Rules: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"templates" | "folders">("templates");

  const [namingTemplate, setNamingTemplate] = useState("{Client} {Project} {Year} v{Version}");
  const [folderTemplate, setFolderTemplate] = useState("Clients/{Client}/{Year}/{Project}");
  const [autoThreshold, setAutoThreshold] = useState(85);
  const [isSaving, setIsSaving] = useState(false);

  // Folder Appearance Rules
  const [folderRules, setFolderRules] = useState<FolderRuleItem[]>([
    { id: "1", name: "Client Folders", targetType: "CLIENT", color: "amber", infoTipTemplate: "Client: {Client}" },
    { id: "2", name: "Active Projects", targetType: "PROJECT", color: "blue", infoTipTemplate: "Active Project: {Project}" },
    { id: "3", name: "Archived Folders", targetType: "ARCHIVE", color: "gray", infoTipTemplate: "Archived Material" },
    { id: "4", name: "High Priority", targetType: "CUSTOM", color: "red", infoTipTemplate: "High Priority Folder" },
  ]);

  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleColor, setNewRuleColor] = useState("amber");
  const [newRuleType, setNewRuleType] = useState("CLIENT");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if ((window as any).foldermate) {
          const cfg = await (window as any).foldermate.call("settings.get");
          if (cfg?.storage?.defaultNamingTemplate) setNamingTemplate(cfg.storage.defaultNamingTemplate);
          if (cfg?.storage?.defaultFolderTemplate) setFolderTemplate(cfg.storage.defaultFolderTemplate);
          if (cfg?.automation?.autoOrganizeThreshold) {
            setAutoThreshold(Math.round(cfg.automation.autoOrganizeThreshold * 100));
          }
        }
      } catch {}
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if ((window as any).foldermate) {
        await (window as any).foldermate.call("settings.update", {
          storage: {
            defaultNamingTemplate: namingTemplate,
            defaultFolderTemplate: folderTemplate,
          },
          automation: {
            autoOrganizeThreshold: autoThreshold / 100,
          },
        });
        showToast("Rules and templates saved successfully", "success");
      }
    } catch (err: any) {
      showToast(`Failed to save settings: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFolderRule = () => {
    if (!newRuleName.trim()) return;
    const rule: FolderRuleItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: newRuleName.trim(),
      targetType: newRuleType,
      color: newRuleColor,
      infoTipTemplate: `Folder: ${newRuleName}`,
    };
    setFolderRules((prev) => [...prev, rule]);
    setNewRuleName("");
    showToast("Folder appearance rule added", "success");
  };

  const handleDeleteFolderRule = (id: string) => {
    setFolderRules((prev) => prev.filter((r) => r.id !== id));
    showToast("Folder appearance rule removed", "info");
  };

  // Preview computation
  const previewFilename = namingTemplate
    .replace(/\{Client\}/gi, "Apex International")
    .replace(/\{ClientCode\}/gi, "APEX")
    .replace(/\{Project\}/gi, "ID Cards")
    .replace(/\{ProjectCode\}/gi, "IDC")
    .replace(/\{Year\}/gi, "2026")
    .replace(/\{Month\}/gi, "09")
    .replace(/\{Version\}/gi, "2")
    .replace(/\{VersionPadded\}/gi, "02") + ".cdr";

  const previewFolderPath = folderTemplate
    .replace(/\{Client\}/gi, "Apex International")
    .replace(/\{Year\}/gi, "2026")
    .replace(/\{Project\}/gi, "ID Cards");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
            Rules & Organization Engine
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Configure naming conventions, folder hierarchy routing, and Windows Explorer folder appearance
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "var(--bg-elevated)",
              padding: 3,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <button
              onClick={() => setActiveTab("templates")}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: activeTab === "templates" ? "var(--accent-amber-subtle)" : "transparent",
                color: activeTab === "templates" ? "var(--accent-amber-text)" : "var(--text-secondary)",
              }}
            >
              Templates & Strictness
            </button>
            <button
              onClick={() => setActiveTab("folders")}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: activeTab === "folders" ? "var(--accent-amber-subtle)" : "transparent",
                color: activeTab === "folders" ? "var(--accent-amber-text)" : "var(--text-secondary)",
              }}
            >
              Folder Appearance (Windows)
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            isLoading={isSaving}
            leftIcon={<Save size={14} />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </Card>

      {activeTab === "templates" ? (
        <>
          {/* Naming Template Card */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                1. Standardized Filename Template
              </h3>
              <Badge variant="amber" size="sm">Template Engine</Badge>
            </div>

            <Input
              value={namingTemplate}
              onChange={(e) => setNamingTemplate(e.target.value)}
              className="mono-font"
              style={{ marginBottom: 12 }}
            />

            <div
              style={{
                backgroundColor: "var(--bg-canvas)",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Live Resolution Output:</span>
              <span className="mono-font" style={{ fontSize: 13, color: "var(--status-success-text)", fontWeight: 700 }}>
                {previewFilename}
              </span>
            </div>
          </Card>

          {/* Folder Structure Card */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                2. Target Hierarchy Routing Template
              </h3>
              <Badge variant="info" size="sm">Folder Routing</Badge>
            </div>

            <Input
              value={folderTemplate}
              onChange={(e) => setFolderTemplate(e.target.value)}
              className="mono-font"
              style={{ marginBottom: 12 }}
            />

            <div
              style={{
                backgroundColor: "var(--bg-canvas)",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Live Hierarchy Path:</span>
              <span className="mono-font" style={{ fontSize: 13, color: "var(--status-info-text)", fontWeight: 700 }}>
                {previewFolderPath}/
              </span>
            </div>
          </Card>

          {/* Confidence Threshold Slider */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                3. Autonomous Classification Strictness
              </h3>
              <Badge variant="amber" size="md">
                {autoThreshold}% Confidence
              </Badge>
            </div>

            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              Files scoring equal to or above {autoThreshold}% are organized automatically into destination folders. Files below {autoThreshold}% are safely held in the Review Queue.
            </p>

            <input
              type="range"
              min="50"
              max="98"
              value={autoThreshold}
              onChange={(e) => setAutoThreshold(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent-amber)", cursor: "pointer" }}
            />
          </Card>
        </>
      ) : (
        /* Folder Appearance Rules Tab */
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
              Windows Explorer Folder Appearance & Color-Coding
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
              FolderMate automatically generates Windows-native desktop.ini configurations to color-code folders and assign custom visual cues in Windows Explorer.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 20 }}>
              {folderRules.map((rule) => {
                const colorObj = FOLDER_COLOR_PALETTE.find((c) => c.key === rule.color) || FOLDER_COLOR_PALETTE[0];
                return (
                  <div
                    key={rule.id}
                    style={{
                      padding: 14,
                      backgroundColor: "var(--bg-canvas)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--bg-elevated)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1px solid ${colorObj.hex}40`,
                        }}
                      >
                        <FolderCog size={18} color={colorObj.hex} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{rule.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Target: {rule.targetType} ({colorObj.name})</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteFolderRule(rule.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 4,
                      }}
                      title="Delete rule"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Rule Form */}
            <div
              style={{
                padding: 16,
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Add New Folder Appearance Rule
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 12 }}>
                <Input
                  placeholder="e.g. VIP School Client Folders"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                />
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value)}
                  style={{
                    height: 36,
                    backgroundColor: "var(--bg-canvas)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "0 10px",
                    fontSize: 13,
                    outline: "none",
                  }}
                >
                  <option value="CLIENT">Client Folders</option>
                  <option value="PROJECT">Project Folders</option>
                  <option value="CATEGORY">Category Folders</option>
                  <option value="ARCHIVE">Archive Folders</option>
                  <option value="CUSTOM">Custom Rule</option>
                </select>
              </div>

              <FolderColorPicker selectedColor={newRuleColor} onChange={setNewRuleColor} />

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="amber"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  onClick={handleAddFolderRule}
                  disabled={!newRuleName.trim()}
                >
                  Add Appearance Rule
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
