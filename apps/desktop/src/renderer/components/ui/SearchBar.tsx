import React from "react";
import { Search, X } from "lucide-react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  shortcutBadge?: string;
  autoFocus?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Search files, clients, metadata...",
  shortcutBadge = "/",
  autoFocus = false,
  className = "",
  style,
}) => {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
        ...style,
      }}
      className={className}
    >
      <Search
        size={15}
        style={{
          position: "absolute",
          left: 12,
          color: "var(--text-muted)",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: "100%",
          height: 38,
          paddingLeft: 36,
          paddingRight: value ? 36 : shortcutBadge ? 42 : 14,
          backgroundColor: "var(--bg-surface)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          fontSize: 13,
          outline: "none",
          transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--border-focus)";
          e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent-amber-glow)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {value ? (
        <button
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          style={{
            position: "absolute",
            right: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: "var(--radius-sm)",
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
          title="Clear search"
        >
          <X size={12} />
        </button>
      ) : (
        shortcutBadge && (
          <kbd
            style={{
              position: "absolute",
              right: 10,
              padding: "2px 6px",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-muted)",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              pointerEvents: "none",
            }}
          >
            {shortcutBadge}
          </kbd>
        )
      )}
    </div>
  );
};
