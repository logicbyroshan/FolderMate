import React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "secondary" | "danger" | "amber";
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = "md",
  variant = "ghost",
  tooltip,
  style,
  disabled,
  ...props
}) => {
  const sizeMap = {
    sm: { width: 28, height: 28, borderRadius: "var(--radius-sm)" },
    md: { width: 34, height: 34, borderRadius: "var(--radius-md)" },
    lg: { width: 40, height: 40, borderRadius: "var(--radius-md)" },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    ghost: {
      backgroundColor: "transparent",
      color: "var(--text-secondary)",
      border: "none",
    },
    secondary: {
      backgroundColor: "var(--bg-elevated)",
      color: "var(--text-primary)",
      border: "1px solid var(--border-subtle)",
    },
    amber: {
      backgroundColor: "var(--accent-amber-subtle)",
      color: "var(--accent-amber-text)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
    },
    danger: {
      backgroundColor: "var(--status-danger-bg)",
      color: "var(--status-danger-text)",
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
  };

  return (
    <button
      title={tooltip}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s ease-in-out",
        outline: "none",
        ...sizeMap[size],
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {icon}
    </button>
  );
};
