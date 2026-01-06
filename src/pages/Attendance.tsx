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

export default function Attendance() {
  const { totalDurationHours } = useAttendance();
  const [requestLeaveOpen, setRequestLeaveOpen] = useState(false);

  const formatDuration = (totalHours: number) => {
    if (!totalHours) return "0h 0m";
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Compact Stats */}
        <ScrollReveal width="100%">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
              <p className="text-muted-foreground">Manage your work hours</p>
            </div>

            <div className="flex gap-4 items-center w-full md:w-auto">
              {/* Compact Stats Bar */}
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-card border rounded-xl p-3 px-5 flex flex-col justify-center shadow-sm">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Today's Hours</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xl font-bold">
                      {formatDuration(totalDurationHours || 0)}
                    </span>
                  </div>
                </div>
                <div className="bg-card border rounded-xl p-3 px-5 flex flex-col justify-center shadow-sm">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Attendance Rate</span>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xl font-bold">98%</span>
                  </div>
                </div>
              </div>

              <Button onClick={() => setRequestLeaveOpen(true)} className="h-14 px-6 rounded-xl shadow-md hidden md:flex">
                <Plus className="mr-2 h-5 w-5" />
                Request Leave
              </Button>
            </div>
          </div>
          {/* Mobile Button */}
          <Button onClick={() => setRequestLeaveOpen(true)} className="w-full h-12 rounded-xl shadow-md md:hidden mt-4">
            <Plus className="mr-2 h-5 w-5" />
            Request Leave
          </Button>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch h-full">
          {/* ... (keep existing AttendanceWidget and HistoryTable) ... */}
          {/* We need to restructure slightly to put MyLeaveHistory below or alongside */}
          {/* For now, let's keep the top grid and add MyLeaveHistory as a new full-width section below */}
        </div>

        {/* Main Grid: Clock & History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Main Action Widget */}
          <div className="lg:col-span-1 h-full">
            <ScrollReveal width="100%" className="h-full">
              <AttendanceWidget />
            </ScrollReveal>
          </div>

          {/* Live History List */}
          <div className="lg:col-span-2 h-full">
            <ScrollReveal width="100%" className="h-full">
              <Card className="h-full border-none shadow-md overflow-hidden flex flex-col">
                <CardHeader className="bg-muted/30 pb-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* ... (keep header content) */}
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Recent Activity</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 grow overflow-hidden">
                  <div className="h-[400px] overflow-y-auto"> {/* Fixed height for consistency */}
                    <HistoryTable />
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>

        {/* Leave History Section */}
        <ScrollReveal width="100%">
          <div className="pt-4">
            <h2 className="text-xl font-semibold mb-4">Leave Requests</h2>
            <div className="h-[400px]">
              <MyLeaveHistory />
            </div>
          </div>
        </ScrollReveal>

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

