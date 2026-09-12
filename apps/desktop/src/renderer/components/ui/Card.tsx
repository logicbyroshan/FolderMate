import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  padded = true,
  style,
  className = "",
  ...props
}) => {
  return (
    <div
      style={{
        padding: padded ? "16px 20px" : 0,
        ...style,
      }}
      className={`${interactive ? "glass-panel-interactive" : "glass-panel"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
