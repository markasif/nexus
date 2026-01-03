import { ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function DashboardLayout({ children, requireAdmin = false }: DashboardLayoutProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Initialize from localStorage to persist state across navigation/reloads
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Wrapper to save to localStorage when state changes
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Role-based access control
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar collapsed={sidebarCollapsed} setCollapsed={handleSidebarCollapse} />
      <main
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
      >
        <div className="p-4 pt-4 md:p-8 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
