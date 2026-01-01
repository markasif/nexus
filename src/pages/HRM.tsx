import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, MoreHorizontal, Clock, DollarSign } from 'lucide-react';

const employees = [
  {
    id: 1,
    name: 'James Cooper',
    email: 'james@nexus.com',
    role: 'Sales Rep',
    baseSalary: 50000,
    commission: 8,
    status: 'active',
    attendance: '98%',
  },
  {
    id: 2,
    name: 'Emily Chen',
    email: 'emily@nexus.com',
    role: 'Sales Rep',
    baseSalary: 52000,
    commission: 8,
    status: 'active',
    attendance: '95%',
  },
  {
    id: 3,
    name: 'Michael Ross',
    email: 'michael@nexus.com',
    role: 'Account Manager',
    baseSalary: 60000,
    commission: 10,
    status: 'active',
    attendance: '100%',
  },
  {
    id: 4,
    name: 'Sarah Kim',
    email: 'sarah@nexus.com',
    role: 'Sales Rep',
    baseSalary: 48000,
    commission: 8,
    status: 'inactive',
    attendance: '92%',
  },
  {
    id: 5,
    name: 'David Park',
    email: 'david@nexus.com',
    role: 'Junior Sales',
    baseSalary: 42000,
    commission: 6,
    status: 'active',
    attendance: '97%',
  },
];

export default function HRM() {
  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Employee Management</h1>
            <p className="text-muted-foreground">Manage your team, salaries, and attendance</p>
          </div>
          <Button variant="nexus">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Attendance</p>
                <p className="text-2xl font-bold">96.4%</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">$252,000</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Leaves</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Employees</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search employees..." className="pl-9 w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>${employee.baseSalary.toLocaleString()}</TableCell>
                    <TableCell>{employee.commission}%</TableCell>
                    <TableCell>{employee.attendance}</TableCell>
                    <TableCell>
                      <Badge variant={employee.status === 'active' ? 'active' : 'inactive'}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
