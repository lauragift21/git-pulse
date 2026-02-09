import type { CSSProperties, ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "purple";

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  style?: CSSProperties;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default: "bg-bg-tertiary text-text-secondary",
  success:
    "bg-neutral-900/10 text-neutral-900 dark:bg-white/10 dark:text-white",
  warning:
    "bg-neutral-500/10 text-neutral-600 dark:bg-neutral-400/10 dark:text-neutral-300",
  danger: "bg-neutral-900/10 text-neutral-900 dark:bg-white/10 dark:text-white",
  info: "bg-neutral-900/10 text-neutral-900 dark:bg-white/10 dark:text-white",
  purple: "bg-neutral-900/10 text-neutral-900 dark:bg-white/10 dark:text-white",
};

export function Badge({
  children,
  variant = "default",
  style,
  className = "",
}: BadgeProps) {
  return (
    <span
      style={style}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
