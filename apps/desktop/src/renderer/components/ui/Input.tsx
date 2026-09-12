import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, style, className = "", ...props }, ref) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
        {label && (
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
            {label}
          </label>
        )}
        <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
          {leftIcon && (
            <div
              style={{
                position: "absolute",
                left: 10,
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
                color: "var(--text-muted)",
              }}
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            style={{
              width: "100%",
              height: 36,
              paddingLeft: leftIcon ? 34 : 12,
              paddingRight: rightIcon ? 34 : 12,
              backgroundColor: "var(--bg-surface)",
              color: "var(--text-primary)",
              border: `1px solid ${error ? "var(--status-danger)" : "var(--border-subtle)"}`,
              borderRadius: "var(--radius-md)",
              fontSize: 13,
              outline: "none",
              transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--border-focus)";
              e.currentTarget.style.boxShadow = "0 0 0 1px var(--accent-amber-glow)";
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? "var(--status-danger)" : "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "none";
              props.onBlur?.(e);
            }}
            className={`foldermate-input ${className}`}
            {...props}
          />
          {rightIcon && (
            <div
              style={{
                position: "absolute",
                right: 10,
                display: "flex",
                alignItems: "center",
                color: "var(--text-muted)",
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span style={{ fontSize: 11, color: "var(--status-danger-text)" }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
