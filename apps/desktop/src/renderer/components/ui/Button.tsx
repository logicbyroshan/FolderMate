import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "amber";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "secondary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  style,
  ...props
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { height: 30, padding: "0 10px", fontSize: 12, borderRadius: "var(--radius-md)", gap: 6 },
    md: { height: 36, padding: "0 14px", fontSize: 13, borderRadius: "var(--radius-md)", gap: 8 },
    lg: { height: 42, padding: "0 18px", fontSize: 14, borderRadius: "var(--radius-lg)", gap: 10 },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: "var(--accent-amber)",
      color: "var(--text-inverse)",
      fontWeight: 600,
      border: "none",
      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
    },
    amber: {
      backgroundColor: "var(--accent-amber-subtle)",
      color: "var(--accent-amber-text)",
      fontWeight: 500,
      border: "1px solid rgba(245, 158, 11, 0.3)",
    },
    secondary: {
      backgroundColor: "var(--bg-elevated)",
      color: "var(--text-primary)",
      fontWeight: 500,
      border: "1px solid var(--border-subtle)",
    },
    ghost: {
      backgroundColor: "transparent",
      color: "var(--text-secondary)",
      fontWeight: 500,
      border: "none",
    },
    danger: {
      backgroundColor: "var(--status-danger-bg)",
      color: "var(--status-danger-text)",
      fontWeight: 500,
      border: "1px solid rgba(239, 68, 68, 0.3)",
    },
  };

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease-in-out",
        outline: "none",
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={`foldermate-btn ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
