import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EarningsWidget } from '@/components/dashboard/EarningsWidget';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, FileText, TrendingUp } from 'lucide-react';

const commissionHistory = [
  { deal: 'Acme Corporation', amount: 3600, date: 'Dec 28, 2025', status: 'paid' },
  { deal: 'Tech Solutions Inc', amount: 5760, date: 'Dec 22, 2025', status: 'paid' },
  { deal: 'Global Industries', amount: 1250, date: 'Dec 30, 2025', status: 'pending' },
  { deal: 'StartUp Hub', amount: 2240, date: 'Dec 15, 2025', status: 'paid' },
  { deal: 'Enterprise Co', amount: 7600, date: 'Dec 10, 2025', status: 'paid' },
];

const payslips = [
  { period: 'December 2025', base: 4166.67, commission: 2840, total: 7006.67, status: 'pending' },
  { period: 'November 2025', base: 4166.67, commission: 3200, total: 7366.67, status: 'paid' },
  { period: 'October 2025', base: 4166.67, commission: 2560, total: 6726.67, status: 'paid' },
];

export default function Earnings() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Earnings</h1>
          <p className="text-muted-foreground">Track your salary, commissions, and payslips</p>
        </div>

        {/* Earnings Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <EarningsWidget />
          </div>
          
          <Card variant="kpi">
            <CardContent className="flex flex-col items-center justify-center gap-4 p-6 text-center h-full">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">YTD Earnings</p>
                <p className="text-3xl font-bold">$84,520</p>
                <p className="text-sm text-success">+12% vs last year</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission History */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>Commission History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionHistory.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{record.deal}</TableCell>
                    <TableCell className="text-success font-semibold">
                      ${record.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'paid' ? 'success' : 'warning'}>
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payslips */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Payslips</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((slip, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{slip.period}</TableCell>
                    <TableCell>${slip.base.toLocaleString()}</TableCell>
                    <TableCell className="text-success">${slip.commission.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">${slip.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={slip.status === 'paid' ? 'success' : 'warning'}>
                        {slip.status}
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
