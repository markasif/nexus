import { useAuth } from '@/contexts/AuthContext';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { EmployeeAttendanceStatus } from '@/components/dashboard/EmployeeAttendanceStatus';
import { AttendanceWidget } from '@/components/dashboard/AttendanceWidget';
import { EarningsWidget } from '@/components/dashboard/EarningsWidget';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  Target,
  Clock,
  TrendingUp,
  Search,
  Calendar as CalendarIcon,
  Zap,
} from 'lucide-react';


import { useState } from 'react';
import { ReportsDialog } from '@/components/dashboard/ReportsDialog';
import { SystemActionsDialog } from '@/components/dashboard/SystemActionsDialog';
import { AdminAnnouncementsWidget } from '@/components/dashboard/AdminAnnouncementsWidget';
import { TaskListWidget } from '@/components/dashboard/TaskListWidget';
import { AnnouncementsWidget } from '@/components/dashboard/AnnouncementsWidget';
import { RequestLeaveDialog } from '@/components/dashboard/RequestLeaveDialog';
import { MyLeaveHistory } from '@/components/dashboard/MyLeaveHistory';
import { MyLeadsWidget } from '@/components/dashboard/MyLeadsWidget';

function AdminDashboard() {
  const stats = useDashboardStats();
  const [showReports, setShowReports] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="space-y-8">
      {/* Creative Header */}
      <WelcomeBanner
        onViewReports={() => setShowReports(true)}
        onNewAction={() => setShowActions(true)}
      />

      {/* KPI Grid */}
      <ScrollReveal width="100%">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Revenue"
            value={stats.isLoading ? "..." : `$${stats.revenue.toLocaleString()}`}
            change={12.5}
            icon={<DollarSign className="h-6 w-6" />}
            variant="primary"
          />
          <KPICard
            title="Active Employees"
            value={stats.isLoading ? "..." : stats.activeEmployees.toString()}
            change={8.3}
            icon={<Users className="h-6 w-6" />}
          />
          <KPICard
            title="Total Inventory"
            value={stats.isLoading ? "..." : stats.totalInventory.toLocaleString()}
            change={-2.1}
            icon={<Package className="h-6 w-6" />}
          />
          <KPICard
            title="Low Stock Alerts"
            value={stats.isLoading ? "..." : stats.lowStockAlerts.toString()}
            icon={<AlertTriangle className="h-6 w-6" />}
            variant={stats.lowStockAlerts > 0 ? "destructive" : "warning"}
          />
        </div>
      </ScrollReveal>

      {/* Charts Row */}
      <ScrollReveal width="100%">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <EmployeeAttendanceStatus />
        </div>
      </ScrollReveal>

      {/* Announcements Management Section */}
      <ScrollReveal width="100%">
        <div className="grid gap-6">
          <AdminAnnouncementsWidget />
        </div>
      </ScrollReveal>

      {/* Quick Actions */}
      <ScrollReveal width="100%">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title="Add Employee"
              description="Onboard a new team member"
              icon={<Users className="h-6 w-6" />}
              action="/hrm"
              actionLabel="Go to HRM"
            />
            <QuickActionCard
              title="New Lead"
              description="Create a new sales lead"
              icon={<Target className="h-6 w-6" />}
              action="/crm"
              actionLabel="Open CRM"
            />
            <QuickActionCard
              title="New Action"
              description="System tasks & broadcasts"
              icon={<Zap className="h-6 w-6" />}
              action="#"
              actionLabel="Run Action"
              onClick={() => setShowActions(true)}
            />
            <QuickActionCard
              title="View Reports"
              description="Access analytics & insights"
              icon={<TrendingUp className="h-6 w-6" />}
              action="#"
              actionLabel="Generate"
              onClick={() => setShowReports(true)}

            />
          </div>
        </div>
      </ScrollReveal >

      <ReportsDialog open={showReports} onOpenChange={setShowReports} />
      <SystemActionsDialog open={showActions} onOpenChange={setShowActions} />
    </div >
  );
}






function EmployeeDashboard() {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal>
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Track your work and earnings.</p>
        </div>
      </ScrollReveal>




      {/* Main Grid */}
      <ScrollReveal width="100%">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AttendanceWidget />
          <EarningsWidget />
          <MyLeaveHistory />
        </div>

        {/* Leads Section - High Priority */}
        <div className="mt-8">
          <MyLeadsWidget />
        </div>

        {/* Tasks & Announcements Grid */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <TaskListWidget />
          <AnnouncementsWidget />
        </div>
      </ScrollReveal>

      {/* Quick Actions */}
      <ScrollReveal width="100%">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              title="Request Leave"
              description="Submit time off request"
              icon={<CalendarIcon className="h-6 w-6" />}
              action="#"
              actionLabel="Request"
              highlight
              onClick={() => setShowLeaveDialog(true)}
            />
            <QuickActionCard
              title="My Leads"
              description="Manage your assigned leads"
              icon={<Target className="h-6 w-6" />}
              action="/crm"
              actionLabel="View Leads"
            />
            <QuickActionCard
              title="Attendance"
              description="View attendance history"
              icon={<Clock className="h-6 w-6" />}
              action="/attendance"
              actionLabel="History"
            />
            <QuickActionCard
              title="My Earnings"
              description="Commission & payslips"
              icon={<DollarSign className="h-6 w-6" />}
              action="/earnings"
              actionLabel="Details"
            />
          </div>
        </div>
      </ScrollReveal>

      <RequestLeaveDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog} />
    </div>
  );
}


export default function Dashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {user?.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
    </DashboardLayout>
  );
}
