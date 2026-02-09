import { Moon, Sun, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDarkMode } from "@/hooks/useDarkMode";
import { repositoryCollection } from "@/collections/repositories";
import { issueCollection } from "@/collections/issues";
import { pullRequestCollection } from "@/collections/pull-requests";
import { eventCollection } from "@/collections/events";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { isDark, toggle } = useDarkMode();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        repositoryCollection.utils.refetch(),
        issueCollection.utils.refetch(),
        pullRequestCollection.utils.refetch(),
        eventCollection.utils.refetch(),
      ]);
    } catch {
      // Silently handle — individual errors are managed by TanStack Query
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-border-primary bg-bg-primary px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </Button>
      </div>
    </header>
  );
}
