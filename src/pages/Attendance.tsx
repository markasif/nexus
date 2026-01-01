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
import { Clock, Calendar, TrendingUp } from 'lucide-react';

const attendanceHistory = [
  { date: 'Dec 30, 2025', clockIn: '09:02 AM', clockOut: '05:45 PM', hours: '8h 43m', status: 'present' },
  { date: 'Dec 29, 2025', clockIn: '08:55 AM', clockOut: '06:00 PM', hours: '9h 5m', status: 'present' },
  { date: 'Dec 28, 2025', clockIn: '09:10 AM', clockOut: '05:30 PM', hours: '8h 20m', status: 'present' },
  { date: 'Dec 27, 2025', clockIn: '-', clockOut: '-', hours: '-', status: 'leave' },
  { date: 'Dec 26, 2025', clockIn: '08:45 AM', clockOut: '05:50 PM', hours: '9h 5m', status: 'present' },
  { date: 'Dec 25, 2025', clockIn: '-', clockOut: '-', hours: '-', status: 'holiday' },
];

const statusColors: Record<string, 'success' | 'warning' | 'muted'> = {
  present: 'success',
  leave: 'warning',
  holiday: 'muted',
};

export default function Attendance() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track your work hours and attendance history</p>
        </div>

        {/* Stats and Clock */}
        <div className="grid gap-6 lg:grid-cols-3">
          <AttendanceWidget />
          
          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Hours/Day</p>
                <p className="text-2xl font-bold">8.5h</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance History */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Attendance History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceHistory.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{record.date}</TableCell>
                    <TableCell>{record.clockIn}</TableCell>
                    <TableCell>{record.clockOut}</TableCell>
                    <TableCell>{record.hours}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[record.status]} className="capitalize">
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
