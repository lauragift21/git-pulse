import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({
  children,
  padding = "md",
  hover = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border-primary bg-bg-card ${paddingClasses[padding]} ${hover ? "hover:border-border-primary/80 hover:shadow-sm cursor-pointer transition-all duration-150" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
