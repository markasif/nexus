import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  Package,
  Settings,
  LogOut,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { ProfileDialog } from '@/components/profile/ProfileDialog';

const adminNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Employees', url: '/hrm', icon: Users },
  { title: 'CRM', url: '/crm', icon: Target },
  { title: 'Inventory', url: '/inventory', icon: Package },
  { title: 'Analytics', url: '/analytics', icon: TrendingUp },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const employeeNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'My Leads', url: '/crm', icon: Target },
  { title: 'Inventory', url: '/inventory', icon: Package },
  { title: 'Attendance', url: '/attendance', icon: Clock },
  { title: 'Earnings', url: '/earnings', icon: DollarSign },
];

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed, setCollapsed }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { settings } = useSettings();

  const navItems = user?.role === 'admin' ? adminNavItems : employeeNavItems;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
                <span className="text-sm font-bold text-sidebar-primary-foreground">
                  {settings.company_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-lg font-bold text-sidebar-foreground leading-tight">
                  {settings.company_name}
                </span>
                {settings.tax_id && (
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    Tax ID: {settings.tax_id}
                  </span>
                )}
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <span className="text-sm font-bold text-sidebar-primary-foreground">
                {settings.company_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          {!collapsed && user && (
            <ProfileDialog>
              <div className="mb-3 flex items-center gap-3 rounded-lg bg-sidebar-accent/30 px-3 py-2 cursor-pointer hover:bg-sidebar-accent/50 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
                  <p className="truncate text-xs capitalize text-sidebar-foreground/60">{user.role}</p>
                </div>
              </div>
            </ProfileDialog>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              collapsed && "justify-center px-0"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Sign Out</span>}
          </Button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md transition-colors hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </aside>
  );
}
