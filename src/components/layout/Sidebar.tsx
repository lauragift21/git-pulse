import {
  LayoutDashboard,
  Activity,
  GitPullRequest,
  CircleDot,
  Users,
  Settings,
  LogOut,
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
}

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-100 cursor-pointer ${
        active
          ? "bg-white/10 text-white"
          : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
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
    <aside className="flex h-screen w-56 flex-col bg-bg-sidebar border-r border-white/5">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-blue">
          <Activity size={14} className="text-white" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">
          GitPulse
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 mt-2">
        {navItems.map((item) => (
          <NavItem
            key={item.page}
            icon={item.icon}
            label={item.label}
            active={currentPage === item.page}
            onClick={() => onNavigate(item.page)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 px-3 py-3 space-y-0.5">
        <NavItem
          icon={<Settings size={18} />}
          label="Settings"
          active={currentPage === "settings"}
          onClick={() => onNavigate("settings")}
        />
        <NavItem
          icon={<LogOut size={18} />}
          label="Sign Out"
          active={false}
          onClick={onLogout}
        />
      </div>
    </aside>
  );
}
