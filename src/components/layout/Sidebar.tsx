import {
  LayoutDashboard,
  Activity,
  GitPullRequest,
  CircleDot,
  Users,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import type { ReactNode } from "react";

export type Page =
  | "dashboard"
  | "activity"
  | "pull-requests"
  | "issues"
  | "contributors"
  | "settings";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

function NavItem({ icon, label, active, onClick, collapsed }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-100 cursor-pointer ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-black/10 text-text-primary dark:bg-white/10 dark:text-white"
          : "text-text-tertiary hover:bg-black/5 hover:text-text-primary dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-200"
      }`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

export function Sidebar({
  currentPage,
  onNavigate,
  onLogout,
  collapsed,
  onToggle,
}: SidebarProps) {
  const navItems: { page: Page; icon: ReactNode; label: string }[] = [
    {
      page: "dashboard",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
    },
    { page: "activity", icon: <Activity size={18} />, label: "Activity" },
    {
      page: "pull-requests",
      icon: <GitPullRequest size={18} />,
      label: "Pull Requests",
    },
    { page: "issues", icon: <CircleDot size={18} />, label: "Issues" },
    {
      page: "contributors",
      icon: <Users size={18} />,
      label: "Contributors",
    },
  ];

  return (
    <aside
      className={`flex h-screen flex-col bg-bg-sidebar border-r border-border-primary transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center ${collapsed ? "justify-center px-3" : "gap-2.5 px-5"} py-5`}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black dark:bg-white">
          <Activity size={14} className="text-white dark:text-black" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-text-primary tracking-tight">
            GitPulse
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-0.5 ${collapsed ? "px-2" : "px-3"} mt-2`}>
        {navItems.map((item) => (
          <NavItem
            key={item.page}
            icon={item.icon}
            label={item.label}
            active={currentPage === item.page}
            onClick={() => onNavigate(item.page)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div
        className={`border-t border-border-primary ${collapsed ? "px-2" : "px-3"} py-3 space-y-0.5`}
      >
        <NavItem
          icon={<Settings size={18} />}
          label="Settings"
          active={currentPage === "settings"}
          onClick={() => onNavigate("settings")}
          collapsed={collapsed}
        />
        <NavItem
          icon={<LogOut size={18} />}
          label="Sign Out"
          active={false}
          onClick={onLogout}
          collapsed={collapsed}
        />

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-100 cursor-pointer justify-center text-text-tertiary hover:bg-black/5 hover:text-text-primary dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-200 mt-1"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <PanelLeftClose size={18} />
          )}
          {!collapsed && <span className="flex-1 text-left">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
