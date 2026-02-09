import { type ReactNode, useState } from "react";
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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-bg-secondary">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
