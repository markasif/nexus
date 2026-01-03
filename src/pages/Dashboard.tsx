import { useAuth } from '@/contexts/AuthContext';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { EmployeeRanking } from '@/components/dashboard/EmployeeRanking';
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
} from 'lucide-react';


function AdminDashboard() {
  const stats = useDashboardStats();

  return (
    <div className="space-y-8">
      {/* Creative Header */}
      <WelcomeBanner />

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
          <EmployeeRanking />
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
              highlight
            />
            <QuickActionCard
              title="Add Stock"
              description="Update inventory quantities"
              icon={<Package className="h-6 w-6" />}
              action="/inventory"
              actionLabel="Inventory"
            />
            <QuickActionCard
              title="View Reports"
              description="Access analytics & insights"
              icon={<TrendingUp className="h-6 w-6" />}
              action="/analytics"
              actionLabel="Analytics"
            />
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}




import { RequestLeaveDialog } from '@/components/dashboard/RequestLeaveDialog';
import { MyLeaveHistory } from '@/components/dashboard/MyLeaveHistory';
import { useState } from 'react';

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
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <AttendanceWidget />
            <EarningsWidget />
          </div>
          <div className="space-y-6">
            <MyLeaveHistory />
          </div>
        </div>
      </ScrollReveal>

      {/* Quick Actions */}
      <ScrollReveal width="100%">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div onClick={() => setShowLeaveDialog(true)}>
              <QuickActionCard
                title="Request Leave"
                description="Submit time off request"
                icon={<CalendarIcon className="h-6 w-6" />}
                action="#"
                actionLabel="Request"
                highlight
              />
            </div>
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
