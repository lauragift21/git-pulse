import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-lg border border-border-primary bg-bg-primary px-3.5 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/20 ${className}`}
        {...props}
      />
    </div>
  );
}
