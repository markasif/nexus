import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AttendanceWidget } from '@/components/dashboard/AttendanceWidget';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, Calendar, TrendingUp, Plus } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { RequestLeaveDialog } from '@/components/dashboard/RequestLeaveDialog';
import { MyLeaveHistory } from '@/components/dashboard/MyLeaveHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Attendance() {
  const { totalDurationHours, stats, dailyStats, leaveBalances } = useAttendance();
  const [requestLeaveOpen, setRequestLeaveOpen] = useState(false);

  // Calculate weekly data from dailyStats (last 7 records)
  // Calculate weekly data (Last 7 Days Dynamic)
  const weeklyData = (() => {
    const days = [];
    const today = new Date();
    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = format(d, 'yyyy-MM-dd');

      // Find stats for this day
      const dayStat = dailyStats?.find(s => s.date === dateStr);
      days.push({
        day: format(d, 'EEE'),
        hours: dayStat ? dayStat.totalHours : 0
      });
    }
    return days;
  })();

  const formatDuration = (totalHours: number) => {
    if (!totalHours) return "0h 0m";
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col pb-4">
        {/* Page Header with Stats */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground">Manage your work hours and leaves</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            {/* Key Metrics Cards (Moved to Header) */}
            <div className="grid grid-cols-2 gap-4 flex-1 sm:flex-none">
              <div className="bg-card border rounded-xl px-5 py-2 shadow-sm flex flex-col justify-center min-w-[140px]">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Weekly Progress</span>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-lg font-bold">{stats?.percentage || 0}%</span>
                    <span className="text-[10px] text-muted-foreground leading-none">{stats?.totalPresent?.toFixed(1) || 0} / 40h</span>
                  </div>
                </div>
              </div>
              <div className="bg-card border rounded-xl px-5 py-2 shadow-sm flex flex-col justify-center min-w-[140px]">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Time Bank</span>
                <div className="flex items-center gap-2 mt-1">
                  <TrendingUp className={`h-4 w-4 ${stats?.onTimePercentage >= 0 ? 'text-green-600' : 'text-red-500'}`} />
                  <span className={`text-lg font-bold ${stats?.onTimePercentage >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {stats?.onTimePercentage > 0 ? '+' : ''}{stats?.onTimePercentage?.toFixed(2) || '0.00'}h
                  </span>
                </div>
              </div>
            </div>

            <Button onClick={() => setRequestLeaveOpen(true)} className="gap-2 shadow-sm h-auto py-2 px-6">
              <Plus className="h-4 w-4" />
              Request Leave
            </Button>
          </div>
        </div>

        {/* Main Grid Content - Stretches to fill height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch grow pb-4">
          {/* Left Sidebar: Clock & Expanded Leave Balance (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            {/* 1. Clock In/Out Widget */}
            <ScrollReveal width="100%" className="shrink-0">
              <AttendanceWidget />
            </ScrollReveal>

            {/* 2. Leave Balance Summary (Expanded to fill space) */}
            <ScrollReveal width="100%" className="grow flex flex-col">
              <LeaveBalanceCard className="h-full" balances={leaveBalances} />
            </ScrollReveal>
          </div>

          {/* Right Main Panel: Data Tabs & Weekly Chart (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full">

            {/* 1. Main Data Tabs (Auto height) */}
            <ScrollReveal width="100%" className="grow min-h-0">
              <Card className="border shadow-sm flex flex-col h-full overflow-hidden">
                <Tabs defaultValue="status" className="flex flex-col h-full">
                  <div className="px-6 py-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white shrink-0 gap-4 sm:gap-0">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Attendance History
                    </h3>
                    <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                      <TabsTrigger value="status">Daily Status</TabsTrigger>
                      <TabsTrigger value="logs">Time Logs</TabsTrigger>
                      <TabsTrigger value="leaves">Requests</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-0 h-[500px] flex flex-col min-h-0 bg-slate-50/50">
                    <TabsContent value="status" className="h-full m-0 data-[state=active]:flex flex-col min-h-0">
                      <div className="grow overflow-auto p-0">
                        <DailyStatusTable data={dailyStats || []} />
                      </div>
                    </TabsContent>

                    <TabsContent value="logs" className="h-full m-0 data-[state=active]:flex flex-col min-h-0">
                      <div className="grow overflow-auto p-0">
                        <HistoryTable />
                      </div>
                    </TabsContent>

                    <TabsContent value="leaves" className="h-full m-0 data-[state=active]:flex flex-col">
                      <div className="grow overflow-auto p-6">
                        <MyLeaveHistory />
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </ScrollReveal>

            {/* 2. Weekly Activity Chart (Fixed height at bottom) */}
            <ScrollReveal width="100%" className="shrink-0">
              <Card className="border shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 sm:gap-0">
                  <div>
                    <h3 className="text-lg font-semibold">Weekly Activity</h3>
                    <p className="text-sm text-muted-foreground">Your work hours over the past 7 days</p>
                  </div>
                  <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20 shrink-0">
                    Target: 40h / Week
                  </Badge>
                </div>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <XAxis
                        dataKey="day"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#64748b' }}
                        dy={10}
                      />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9', radius: 4 }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={50}>
                        {weeklyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.hours >= 8 ? '#22c55e' : entry.hours >= 4 ? '#3b82f6' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </ScrollReveal>

          </div>
        </div>

        <RequestLeaveDialog open={requestLeaveOpen} onOpenChange={setRequestLeaveOpen} />
      </div>
    </DashboardLayout>
  );
}

// Sub-component for cleaner code
function HistoryTable() {
  const { history, loading } = useAttendance();

  if (loading && history.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Loading history...</div>
  }

  if (history.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No attendance records found.</div>
  }

  return (
    <Table>
      <TableHeader className="bg-muted/10">
        <TableRow>
          <TableHead className="pl-6">Date</TableHead>
          <TableHead>Clock In</TableHead>
          <TableHead>Clock Out</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right pr-6">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((record) => {
          if (!record.clock_in) return null; // unexpected data

          const start = new Date(record.clock_in);
          if (isNaN(start.getTime())) return null; // invalid date check

          const end = record.clock_out ? new Date(record.clock_out) : null;
          if (end && isNaN(end.getTime())) return null; // invalid end date

          const duration = end
            ? (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            : 0;

          const hours = Math.floor(duration);
          const minutes = Math.floor((duration - hours) * 60);
          const durationStr = end ? `${hours}h ${minutes}m` : 'Active';

          return (
            <TableRow key={record.id} className="hover:bg-muted/20 transition-colors border-b-muted/40">
              <TableCell className="font-medium pl-6 py-4">
                {(() => {
                  const dateObj = new Date(record.date);
                  return isNaN(dateObj.getTime()) ? '-' : format(dateObj, 'MMM d, yyyy');
                })()}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(start, 'hh:mm a')}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {end ? format(end, 'hh:mm a') : '-'}
              </TableCell>
              <TableCell>
                <span className={`font-mono text-xs px-2 py-1 rounded-md ${!end ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                  {durationStr}
                </span>
              </TableCell>
              <TableCell className="text-right pr-6">
                <Badge
                  variant="secondary"
                  className={`capitalize font-semibold ${record.clock_out
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                >
                  {record.clock_out ? 'Completed' : 'Working'}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Sub-component for Leave Balance
function LeaveBalanceCard({ className, balances }: { className?: string; balances?: any }) {
  // Defaults if not loaded yet
  const safeBalances = balances || { casual: 12, sick: 10, privilege: 15 };

  // Static Totals (Policy)
  const limits = { casual: 12, sick: 10, privilege: 15 };
  return (
    <Card className={`border shadow-sm animate-slide-up bg-gradient-to-br from-white to-slate-50 flex flex-col ${className}`}>
      <CardHeader className="pb-3 border-b shrink-0 bg-white/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          Leave Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 grid gap-6 grow content-start">
        {/* Leave Items with Progress Bars */}
        <div className="grid gap-5">
          {[
            {
              label: 'Casual Leave',
              balance: safeBalances.casual,
              total: limits.casual,
              color: 'bg-blue-600',
              track: 'bg-blue-100'
            },
            {
              label: 'Sick Leave',
              balance: safeBalances.sick,
              total: limits.sick,
              color: 'bg-red-600',
              track: 'bg-red-100'
            },
            {
              label: 'Privilege Leave',
              balance: safeBalances.privilege,
              total: limits.privilege,
              color: 'bg-purple-600',
              track: 'bg-purple-100'
            }
          ].map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-bold text-foreground">
                  {item.balance} <span className="text-muted-foreground/60 font-medium">/ {item.total}</span>
                </span>
              </div>
              <div className={`h-2.5 w-full rounded-full ${item.track}`}>
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-500 ease-out`}
                  style={{ width: `${Math.min(100, Math.max(0, (item.balance / item.total) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Separator / Divider */}
        <div className="border-t border-dashed border-slate-200 mt-2"></div>

        {/* Upcoming Holidays Section to fill space */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Upcoming Holidays</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded text-xs mb-1">
                JAN 26
              </div>
              <div className="text-xs font-medium text-slate-700 text-center">Republic Day</div>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded text-xs mb-1">
                MAR 29
              </div>
              <div className="text-xs font-medium text-slate-700 text-center">Good Friday</div>
            </div>
          </div>
        </div>

        <div className="pt-2 mt-auto">
          <Button variant="outline" className="w-full text-xs h-9 hover:bg-primary/5 hover:text-primary transition-colors" size="sm">
            View Full Leave Policy
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Sub-component for Daily Status
function DailyStatusTable({ data }: { data: any[] }) {
  if (data.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No records found.</div>
  }

  return (
    <Table>
      <TableHeader className="bg-muted/10">
        <TableRow>
          <TableHead className="pl-6">Date</TableHead>
          <TableHead>Total Hours</TableHead>
          <TableHead className="text-right pr-6">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((record) => (
          <TableRow key={record.date} className="hover:bg-muted/20 transition-colors border-b-muted/40">
            <TableCell className="font-medium pl-6 py-4">
              {format(new Date(record.date), 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {record.totalHours.toFixed(1)} hrs
            </TableCell>
            <TableCell className="text-right pr-6">
              <Badge
                variant="secondary"
                className={`capitalize font-semibold ${record.status === 'Overtime'
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : record.status === 'Regular'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200' // Short
                  }`}
              >
                {record.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
