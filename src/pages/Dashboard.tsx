import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KPICard } from '@/components/dashboard/KPICard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { EmployeeRanking } from '@/components/dashboard/EmployeeRanking';
import { AttendanceWidget } from '@/components/dashboard/AttendanceWidget';
import { EarningsWidget } from '@/components/dashboard/EarningsWidget';
import {
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  Target,
  Clock,
  TrendingUp,
  Search,
} from 'lucide-react';

function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value="$316,000"
          change={12.5}
          icon={<DollarSign className="h-6 w-6" />}
          variant="primary"
        />
        <KPICard
          title="Active Employees"
          value="24"
          change={8.3}
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard
          title="Total Inventory"
          value="1,847"
          change={-2.1}
          icon={<Package className="h-6 w-6" />}
        />
        <KPICard
          title="Low Stock Alerts"
          value="7"
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <EmployeeRanking />
      </div>

      {/* Quick Actions */}
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
    </div>
  );
}

function EmployeeDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Track your work and earnings.</p>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <AttendanceWidget />
        <div className="lg:col-span-2">
          <EarningsWidget />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            title="My Leads"
            description="Manage your assigned leads"
            icon={<Target className="h-6 w-6" />}
            action="/crm"
            actionLabel="View Leads"
            highlight
          />
          <QuickActionCard
            title="Stock Search"
            description="Check product availability"
            icon={<Search className="h-6 w-6" />}
            action="/inventory"
            actionLabel="Search"
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
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      {user?.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
    </DashboardLayout>
  );
}
