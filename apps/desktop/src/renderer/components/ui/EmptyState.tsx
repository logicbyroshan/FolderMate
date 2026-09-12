import React from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button.js";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        color: "var(--text-muted)",
        ...style,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-lg)",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          color: "var(--text-secondary)",
        }}
      >
        {icon || <FolderOpen size={24} />}
      </div>
      <h4 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
        {title}
      </h4>
      <p style={{ fontSize: 13, maxWidth: 360, lineHeight: 1.5, marginBottom: actionLabel ? 20 : 0 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="amber" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
