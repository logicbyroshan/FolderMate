import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "amber" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  style,
  className = "",
}) => {
  const variantStyles: Record<string, { bg: string; text: string; border: string; dotColor?: string }> = {
    default: {
      bg: "var(--bg-elevated)",
      text: "var(--text-secondary)",
      border: "var(--border-subtle)",
      dotColor: "var(--text-muted)",
    },
    amber: {
      bg: "var(--accent-amber-subtle)",
      text: "var(--accent-amber-text)",
      border: "rgba(245, 158, 11, 0.3)",
      dotColor: "var(--accent-amber)",
    },
    success: {
      bg: "var(--status-success-bg)",
      text: "var(--status-success-text)",
      border: "rgba(16, 185, 129, 0.3)",
      dotColor: "var(--status-success)",
    },
    warning: {
      bg: "var(--status-warning-bg)",
      text: "var(--status-warning-text)",
      border: "rgba(245, 158, 11, 0.3)",
      dotColor: "var(--status-warning)",
    },
    danger: {
      bg: "var(--status-danger-bg)",
      text: "var(--status-danger-text)",
      border: "rgba(239, 68, 68, 0.3)",
      dotColor: "var(--status-danger)",
    },
    info: {
      bg: "var(--status-info-bg)",
      text: "var(--status-info-text)",
      border: "rgba(59, 130, 246, 0.3)",
      dotColor: "var(--status-info)",
    },
    neutral: {
      bg: "rgba(255, 255, 255, 0.05)",
      text: "var(--text-muted)",
      border: "transparent",
      dotColor: "var(--text-muted)",
    },
  };

  const v = variantStyles[variant] || variantStyles.default;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: size === "sm" ? "1px 6px" : "2px 8px",
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 500,
        borderRadius: "var(--radius-full)",
        backgroundColor: v.bg,
        color: v.text,
        border: `1px solid ${v.border}`,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        ...style,
      }}
      className={`foldermate-badge ${className}`}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: v.dotColor,
          }}
        />
      )}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; style?: React.CSSProperties }> = ({ status, style }) => {
  const norm = status.toLowerCase();
  let variant: BadgeProps["variant"] = "default";

  if (["organized", "active", "resolved", "completed", "approved"].includes(norm)) {
    variant = "success";
  } else if (["pending", "review", "needs_review", "checking_lock"].includes(norm)) {
    variant = "amber";
  } else if (["archived", "ignored", "inactive"].includes(norm)) {
    variant = "neutral";
  } else if (["failed", "error", "corrupted"].includes(norm)) {
    variant = "danger";
  }

  return (
    <Badge variant={variant} dot style={style}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
};
