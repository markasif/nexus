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
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: window.location.pathname }} replace />;
  }

  // Role-based access control
  if (requireAdmin && user?.role !== 'admin') {
    // Instead of auto-redirecting, show an access denied state. 
    // This helps debug why usage might be denied and provides better UX.
    return (
      <div className="flex min-h-screen bg-background">
        <AppSidebar collapsed={sidebarCollapsed} setCollapsed={handleSidebarCollapse} />
        <main className={`flex-1 flex items-center justify-center transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-destructive">Access Restricted</h2>
            <p className="text-muted-foreground">This area is reserved for Administrators.</p>
            <p className="text-sm text-gray-500">Current Role: {user?.role || 'Unknown'}</p>
            <a href="/dashboard" className="inline-block text-primary hover:underline">
              Return to Dashboard
            </a>
          </div>
        </main>
      </div>
    );
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
