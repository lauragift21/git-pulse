import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-neutral-800 active:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200 dark:active:bg-neutral-300",
  secondary:
    "bg-bg-tertiary text-text-primary hover:bg-bg-active border border-border-primary",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-hover hover:text-text-primary",
  danger:
    "bg-transparent text-black border-2 border-black hover:bg-black hover:text-white active:bg-neutral-800 dark:text-white dark:border-white dark:hover:bg-white dark:hover:text-black dark:active:bg-neutral-200",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
