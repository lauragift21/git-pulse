import { useState, useCallback, lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { useGitHubToken } from "@/hooks/useGitHubToken";
import { useTrackedRepos } from "@/hooks/useTrackedRepos";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Page } from "@/components/layout/Sidebar";

// Eagerly loaded (part of entry flow)
import { LandingPage } from "@/pages/LandingPage";
import { Setup } from "@/pages/Setup";

// Lazy-loaded page components for code splitting
const Dashboard = lazy(() =>
  import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const ActivityFeed = lazy(() =>
  import("@/pages/ActivityFeed").then((m) => ({ default: m.ActivityFeed })),
);
const Issues = lazy(() =>
  import("@/pages/Issues").then((m) => ({ default: m.Issues })),
);
const PullRequests = lazy(() =>
  import("@/pages/PullRequests").then((m) => ({ default: m.PullRequests })),
);
const Contributors = lazy(() =>
  import("@/pages/Contributors").then((m) => ({ default: m.Contributors })),
);

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, removeToken, refreshToken } = useGitHubToken();
  const { hasRepos } = useTrackedRepos();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [setupComplete, setSetupComplete] = useState(
    isAuthenticated && hasRepos,
  );
  // Show landing page first unless user has already authenticated (e.g. OAuth redirect)
  const [showLanding, setShowLanding] = useState(!isAuthenticated);

  const handleSetupComplete = useCallback(() => {
    // Re-sync token state from localStorage so isAuthenticated is up-to-date.
    // Setup and AppContent each have independent useGitHubToken() instances,
    // so the token saved during OAuth may not be reflected in App's state yet.
    refreshToken();
    // Invalidate all queries so collections refetch with the new token/repos
    queryClient.invalidateQueries();
    setSetupComplete(true);
  }, [refreshToken]);

  const handleLogout = useCallback(() => {
    removeToken();
    queryClient.clear();
    setSetupComplete(false);
    setShowLanding(true);
  }, [removeToken]);

  // Show landing page for new visitors
  if (showLanding && !setupComplete && !isAuthenticated) {
    return (
      <ErrorBoundary>
        <LandingPage onGetStarted={() => setShowLanding(false)} />
      </ErrorBoundary>
    );
  }

  // Show setup if not authenticated or no repos tracked yet
  if (!setupComplete || !isAuthenticated) {
    return (
      <ErrorBoundary>
        <Setup onComplete={handleSetupComplete} />
      </ErrorBoundary>
    );
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
              refreshToken();
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
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
      </ErrorBoundary>
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
