import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const base = "cmt-button";
  const variantClass = `cmt-button--${variant}`;
  const sizeClass = `cmt-button--${size}`;
  const loadingClass = isLoading ? "cmt-button--loading" : "";

  return (
    <button
      className={`${base} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <span className="cmt-button__spinner" aria-hidden="true" />
      ) : null}
      <span className="cmt-button__content">{children}</span>
    </button>
  );
}
