import React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  error,
  style,
  className = "",
  disabled,
  ...props
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            width: "100%",
            height: 36,
            paddingLeft: 12,
            paddingRight: 34,
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: `1px solid ${error ? "var(--status-danger)" : "var(--border-subtle)"}`,
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            outline: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            transition: "border-color 0.15s ease-in-out",
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--border-focus)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--status-danger)" : "var(--border-subtle)";
          }}
          className={`foldermate-select ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{
            position: "absolute",
            right: 12,
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
      </div>
      {error && <span style={{ fontSize: 11, color: "var(--status-danger-text)" }}>{error}</span>}
    </div>
  );
};
