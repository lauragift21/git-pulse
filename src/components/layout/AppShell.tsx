import type { ReactNode } from "react";
import { Sidebar, type Page } from "./Sidebar";

interface AppShellProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  children: ReactNode;
}

export function AppShell({
  currentPage,
  onNavigate,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-secondary">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
