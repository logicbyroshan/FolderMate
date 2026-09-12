import React from "react";
import { Folder, Check } from "lucide-react";

export interface FolderColorOption {
  key: string;
  name: string;
  hex: string;
}

export const FOLDER_COLOR_PALETTE: FolderColorOption[] = [
  { key: "amber", name: "Amber (Default)", hex: "#f59e0b" },
  { key: "blue", name: "Blue (Active)", hex: "#3b82f6" },
  { key: "green", name: "Green (Completed)", hex: "#10b981" },
  { key: "red", name: "Red (Priority)", hex: "#ef4444" },
  { key: "purple", name: "Purple (Special)", hex: "#a855f7" },
  { key: "cyan", name: "Cyan (Template)", hex: "#06b6d4" },
  { key: "gray", name: "Gray (Archive)", hex: "#64748b" },
];

export interface FolderColorPickerProps {
  selectedColor: string;
  onChange: (color: string) => void;
  label?: string;
}

export const FolderColorPicker: React.FC<FolderColorPickerProps> = ({
  selectedColor,
  onChange,
  label = "Folder Color Preset",
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {FOLDER_COLOR_PALETTE.map((opt) => {
          const isSelected = selectedColor === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              title={opt.name}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--bg-elevated)",
                border: isSelected ? `2px solid ${opt.hex}` : "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.15s ease-in-out",
                boxShadow: isSelected ? `0 0 10px ${opt.hex}40` : "none",
              }}
            >
              <Folder size={16} color={opt.hex} fill={`${opt.hex}30`} />
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: opt.hex,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={8} color="#000" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
