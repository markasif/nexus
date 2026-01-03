
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CreateEmployeeDialog } from '@/components/hrm/CreateEmployeeDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, MoreHorizontal, Clock, DollarSign, Users } from 'lucide-react';
import { useHRMStats } from '@/hooks/useHRMStats';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Ban, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

import { EditEmployeeDialog } from '@/components/hrm/EditEmployeeDialog';
import { useState } from 'react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Check, X, Building, Calendar } from 'lucide-react';
import { RejectLeaveDialog } from '@/components/hrm/RejectLeaveDialog';

export default function HRM() {
  const { employees, leaves, stats, refetch } = useHRMStats();
  const { toast } = useToast();

  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Employee has been marked as ${newStatus}.`,
        variant: "default"
      });
      refetch();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!confirm("Are you sure? This action cannot be undone and will remove all employee data.")) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;

      toast({ title: "Employee Deleted", description: "The employee record has been permanently removed." });
      refetch();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not delete employee. They may have related data.", variant: "destructive" });
    }
  };




  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const handleLeaveAction = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected') {
      setRejectDialog({ open: true, id });
      return;
    }

    try {
      const { error } = await supabase
        .from('leaves')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Request Updated", description: `Leave request marked as ${status}.` });
      refetch();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update request", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-8">
        {/* Header */}
        <ScrollReveal width="100%">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Employee Management</h1>
              <p className="text-muted-foreground">Manage your team, salaries, and attendance</p>
            </div>
            <CreateEmployeeDialog onEmployeeCreated={refetch} />
          </div>
        </ScrollReveal>

        {/* Edit Dialog - Rendered conditionally */}
        <EditEmployeeDialog
          open={!!editingEmployee}
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          employee={editingEmployee}
          onEmployeeUpdated={refetch}
        />

        <RejectLeaveDialog
          open={rejectDialog.open}
          onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}
          leaveId={rejectDialog.id || ""}
          onSuccess={refetch}
        />

        {/* Stats */}
        <ScrollReveal width="100%">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card variant="kpi" className="animate-slide-up">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Attendance</p>
                  <p className="text-2xl font-bold">{stats.isLoading ? "..." : stats.avgAttendance}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="kpi" className="animate-slide-up delay-100">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payroll</p>
                  <p className="text-2xl font-bold">{stats.isLoading ? "..." : `$${stats.totalPayroll.toLocaleString()}`}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="kpi" className="animate-slide-up delay-200">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Leaves</p>
                  <p className="text-2xl font-bold">{stats.isLoading ? "..." : stats.pendingLeaves}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="employees">All Employees</TabsTrigger>
            <TabsTrigger value="leaves" className="relative">
              Leave Requests
              {stats.pendingLeaves > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">
                  {stats.pendingLeaves}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            {/* Employee Table */}
            <ScrollReveal width="100%">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>All Employees</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search employees..." className="pl-9 w-64" />
                  </div>
                </CardHeader>
                <CardContent>
                  {stats.isLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Loading employees...</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Base Salary</TableHead>
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
                            <TableCell className="capitalize">{employee.role}</TableCell>
                            <TableCell>{employee.details?.department || '-'}</TableCell>
                            <TableCell>${(employee.details?.base_salary || 0).toLocaleString()}</TableCell>
                            <TableCell>{employee.attendance}</TableCell>
                            <TableCell>
                              <Badge variant={employee.status === 'active' ? 'success' : 'secondary'}>
                                {employee.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => setEditingEmployee(employee)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toggleStatus(employee.id, employee.status)}>
                                    {employee.status === 'active' ? (
                                      <>
                                        <Ban className="mr-2 h-4 w-4 text-orange-500" />
                                        <span>Deactivate</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                        <span>Activate</span>
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteEmployee(employee.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                        {employees.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No employees found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </TabsContent>

          <TabsContent value="leaves">
            <ScrollReveal width="100%">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Leave Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {leaves && leaves.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaves.map((leave) => (
                          <TableRow key={leave.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{leave.profiles?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{leave.profiles?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize">
                              <Badge variant="outline">{leave.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                              {leave.reason}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleLeaveAction(leave.id, 'approved')}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleLeaveAction(leave.id, 'rejected')}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Calendar className="h-10 w-10 mb-2 opacity-20" />
                      <p>No pending leave requests</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

