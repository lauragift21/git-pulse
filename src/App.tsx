import { useState, useCallback } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { useGitHubToken } from "@/hooks/useGitHubToken";
import { useTrackedRepos } from "@/hooks/useTrackedRepos";
import { AppShell } from "@/components/layout/AppShell";
import type { Page } from "@/components/layout/Sidebar";

import { Setup } from "@/pages/Setup";
import { Dashboard } from "@/pages/Dashboard";
import { ActivityFeed } from "@/pages/ActivityFeed";
import { Issues } from "@/pages/Issues";
import { PullRequests } from "@/pages/PullRequests";
import { Contributors } from "@/pages/Contributors";

function AppContent() {
  const { isAuthenticated, removeToken } = useGitHubToken();
  const { hasRepos } = useTrackedRepos();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [setupComplete, setSetupComplete] = useState(
    isAuthenticated && hasRepos,
  );

  const handleSetupComplete = useCallback(() => {
    // Invalidate all queries so collections refetch with the new token/repos
    queryClient.invalidateQueries();
    setSetupComplete(true);
  }, []);

  const handleLogout = () => {
    removeToken();
    setSetupComplete(false);
  };

  // Show setup if not authenticated or no repos tracked yet
  if (!setupComplete || !isAuthenticated) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "activity":
        return <ActivityFeed />;
      case "issues":
        return <Issues />;
      case "pull-requests":
        return <PullRequests />;
      case "contributors":
        return <Contributors />;
      case "settings":
        // For now, redirect back to setup to allow reconfiguration
        return (
          <Setup
            onComplete={() => {
              queryClient.invalidateQueries();
              setCurrentPage("dashboard");
            }}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppShell
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onLogout={handleLogout}
    >
      {renderPage()}
    </AppShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
