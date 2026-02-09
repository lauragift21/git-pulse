type Size = "xs" | "sm" | "md" | "lg";

interface AvatarProps {
  src: string;
  alt: string;
  size?: Size;
  className?: string;
}

const sizeClasses: Record<Size, string> = {
  xs: "w-5 h-5",
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function Avatar({ src, alt, size = "md", className = "" }: AvatarProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover ring-1 ring-border-secondary ${sizeClasses[size]} ${className}`}
    />
  );
}

interface AvatarGroupProps {
  avatars: { src: string; alt: string }[];
  max?: number;
  size?: Size;
}

export function AvatarGroup({
  avatars,
  max = 3,
  size = "sm",
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-1.5">
      {visible.map((avatar, i) => (
        <Avatar
          key={i}
          src={avatar.src}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-bg-primary"
        />
      ))}
      {remaining > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-bg-tertiary text-xs font-medium text-text-secondary ring-2 ring-bg-primary ${sizeClasses[size]}`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
