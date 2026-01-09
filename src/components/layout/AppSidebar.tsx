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
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { ProfileDialog } from '@/components/profile/ProfileDialog';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect } from 'react';

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

interface SidebarNavContentProps {
  collapsed: boolean;
  isMobile: boolean;
  user: any;
  settings: any;
  navItems: typeof adminNavItems;
  currentPath: string;
  onNavClick: () => void;
  onLogout: () => void;
  setCollapsed?: (collapsed: boolean) => void;
}

function SidebarNavContent({
  collapsed,
  isMobile,
  user,
  settings,
  navItems,
  currentPath,
  onNavClick,
  onLogout,
  setCollapsed
}: SidebarNavContentProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-4", collapsed && !isMobile ? "justify-center" : "justify-between")}>
        {(!collapsed || isMobile) && (
          <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden" onClick={onNavClick}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
              <span className="text-sm font-bold text-sidebar-primary-foreground">
                {settings.company_name?.charAt(0).toUpperCase() || "N"}
              </span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-lg font-bold text-sidebar-foreground leading-tight">
                {settings.company_name || "Nexus ERP"}
              </span>
              {settings.tax_id && (
                <span className="truncate text-xs text-sidebar-foreground/60">
                  Tax ID: {settings.tax_id}
                </span>
              )}
            </div>
          </Link>
        )}
        {(collapsed && !isMobile) && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-sm font-bold text-sidebar-primary-foreground">
              {settings.company_name?.charAt(0).toUpperCase() || "N"}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.url;
          return (
            <Link
              key={item.title}
              to={item.url}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                (collapsed && !isMobile) && "justify-center px-0"
              )}
              title={collapsed && !isMobile ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {(!collapsed || isMobile) && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        {(!collapsed || isMobile) && user && (
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
            "w-full text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            (!collapsed || isMobile) ? "justify-start" : "justify-center px-0"
          )}
          onClick={onLogout}
          title={collapsed && !isMobile ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5" />
          {(!collapsed || isMobile) && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>

      {/* Collapse toggle (Desktop only) */}
      {!isMobile && setCollapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md transition-colors hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
}

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function AppSidebar({ collapsed, setCollapsed }: AppSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { settings } = useSettings();
  const [openMobile, setOpenMobile] = useState(false);

  const navItems = user?.role === 'admin' ? adminNavItems : employeeNavItems;

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Sidebar (Sheet) - Visible only on mobile */}
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetTrigger asChild>
          <div className="fixed top-4 left-4 z-50 md:hidden">
            <Button variant="outline" size="icon" className="bg-background shadow-sm">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-sidebar w-72 md:hidden">
          <SidebarNavContent
            collapsed={false}
            isMobile={true}
            user={user}
            settings={settings}
            navItems={navItems}
            currentPath={location.pathname}
            onNavClick={handleNavClick}
            onLogout={logout}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar (Fixed Aside) - Hidden on mobile */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 border-r border-sidebar-border flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarNavContent
          collapsed={collapsed}
          isMobile={false}
          user={user}
          settings={settings}
          navItems={navItems}
          currentPath={location.pathname}
          onNavClick={() => { }} // No-op on desktop
          onLogout={logout}
          setCollapsed={setCollapsed}
        />
      </aside>
    </>
  );
}
