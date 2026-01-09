import { Suspense, lazy, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { ReportsDialog } from '@/components/dashboard/ReportsDialog';
import { SystemActionsDialog } from '@/components/dashboard/SystemActionsDialog';
import { RequestLeaveDialog } from '@/components/dashboard/RequestLeaveDialog';
import {
  IndianRupee,
  Users,
  Package,
  AlertTriangle,
  Target,
  Clock,
  TrendingUp,
  Zap,
  Calendar as CalendarIcon,
} from 'lucide-react';

// Lazy Load Widgets (Optimized Bundle Splitting)
const RevenueChart = lazy(() => import('@/components/dashboard/RevenueChart').then(m => ({ default: m.RevenueChart })));
const EmployeeAttendanceStatus = lazy(() => import('@/components/dashboard/EmployeeAttendanceStatus').then(m => ({ default: m.EmployeeAttendanceStatus })));
const AttendanceWidget = lazy(() => import('@/components/dashboard/AttendanceWidget').then(m => ({ default: m.AttendanceWidget })));
const EarningsWidget = lazy(() => import('@/components/dashboard/EarningsWidget').then(m => ({ default: m.EarningsWidget })));
const AdminAnnouncementsWidget = lazy(() => import('@/components/dashboard/AdminAnnouncementsWidget').then(m => ({ default: m.AdminAnnouncementsWidget })));
const TaskListWidget = lazy(() => import('@/components/dashboard/TaskListWidget').then(m => ({ default: m.TaskListWidget })));
const AnnouncementsWidget = lazy(() => import('@/components/dashboard/AnnouncementsWidget').then(m => ({ default: m.AnnouncementsWidget })));
const MyLeaveHistory = lazy(() => import('@/components/dashboard/MyLeaveHistory').then(m => ({ default: m.MyLeaveHistory })));
const MyLeadsWidget = lazy(() => import('@/components/dashboard/MyLeadsWidget').then(m => ({ default: m.MyLeadsWidget })));

const WidgetSkeleton = () => (
  <div className="h-[350px] w-full animate-pulse rounded-xl bg-gray-100" />
);

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
            value={`₹${stats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            change={12.5}
            icon={<IndianRupee className="h-6 w-6" />}
            variant="primary"
            loading={stats.isLoading}
          />
          <KPICard
            title="Active Employees"
            value={stats.activeEmployees.toString()}
            icon={<Users className="h-6 w-6" />}
            loading={stats.isLoading}
          />
          <KPICard
            title="Total Inventory"
            value={stats.totalInventory.toLocaleString()}
            icon={<Package className="h-6 w-6" />}
            loading={stats.isLoading}
          />
          <KPICard
            title="Low Stock Alerts"
            value={stats.lowStockAlerts.toString()}
            icon={<AlertTriangle className="h-6 w-6" />}
            variant={stats.lowStockAlerts > 0 ? "destructive" : "warning"}
            loading={stats.isLoading}
          />
        </div>
      </ScrollReveal>

      {/* Charts Row */}
      <ScrollReveal width="100%">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<WidgetSkeleton />}>
              <RevenueChart />
            </Suspense>
          </div>
          <Suspense fallback={<WidgetSkeleton />}>
            <EmployeeAttendanceStatus />
          </Suspense>
        </div>
      </ScrollReveal>

      {/* Announcements Management Section */}
      <ScrollReveal width="100%">
        <div className="grid gap-6">
          <Suspense fallback={<WidgetSkeleton />}>
            <AdminAnnouncementsWidget />
          </Suspense>
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
          <Suspense fallback={<WidgetSkeleton />}><AttendanceWidget /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><EarningsWidget /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><MyLeaveHistory /></Suspense>
        </div>

        {/* Leads Section - High Priority */}
        <div className="mt-8">
          <Suspense fallback={<WidgetSkeleton />}><MyLeadsWidget /></Suspense>
        </div>

        {/* Tasks & Announcements Grid */}
        <div className="grid gap-6 md:grid-cols-2 mt-8">
          <Suspense fallback={<WidgetSkeleton />}><TaskListWidget /></Suspense>
          <Suspense fallback={<WidgetSkeleton />}><AnnouncementsWidget /></Suspense>
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
              icon={<IndianRupee className="h-6 w-6" />}
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
