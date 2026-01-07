import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

import { Employee } from '@/types/hrm';
import { useAuth } from '@/contexts/AuthContext';

export interface HRMStats {
    avgAttendance: string;
    totalPayroll: number;
    pendingLeaves: number;
    isLoading: boolean;
}

export function useHRMStats() {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [stats, setStats] = useState<HRMStats>({
        avgAttendance: "...",
        totalPayroll: 0,
        pendingLeaves: 0,
        isLoading: true,
    });
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        async function fetchData() {
            setStats(prev => ({ ...prev, isLoading: true }));
            try {
                // 1. Fetch Aggregated Stats via RPC (SQL function)
                // This handles the "Total Present / Total Working Days" logic efficiently in DB.
                const { data: employeeStats, error: rpcError } = await supabase
                    .rpc('get_hrm_stats_aggregated');

                if (rpcError) throw rpcError;

                // 2. Fetch Pending Leaves count
                const { data: leavesData, count: pendingCount, error: tasksError } = await supabase
                    .from('leaves')
                    .select(`
                        *,
                        profiles:employee_id (full_name, email)
                    `, { count: 'exact' })
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true });

                if (tasksError) throw tasksError;

                // Transform RPC result to Employee type
                // RPC returns: id, name, email, role, status, department, base_salary, attendance_pct
                const mappedEmployees: Employee[] = (employeeStats || [])
                    .map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        email: p.email,
                        role: p.role,
                        status: p.status || 'active',
                        details: {
                            department: p.department,
                            base_salary: p.base_salary,
                            // other details might be missing in RPC return, strictly typing needed?
                            // flexible for list view.
                        },
                        attendance: `${p.attendance_pct}%`,
                    }));

                setEmployees(mappedEmployees);
                setLeaves(leavesData || []);

                // Calculate Totals form the aggregated data
                const totalPayroll = mappedEmployees.reduce((sum, emp) => sum + (Number(emp.details?.base_salary) || 0), 0);

                const totalAvgAttendance = mappedEmployees.reduce((sum, emp) => sum + parseInt(emp.attendance), 0);
                const avgAttendanceStr = mappedEmployees.length > 0
                    ? `${Math.round(totalAvgAttendance / mappedEmployees.length)}%`
                    : '0%';

                setStats({
                    avgAttendance: avgAttendanceStr,
                    totalPayroll,
                    pendingLeaves: pendingCount || 0,
                    isLoading: false,
                });

            } catch (err) {
                console.error("Error fetching HRM data:", err);
                setStats(prev => ({ ...prev, isLoading: false }));
            }
        }

        fetchData();
    }, [refreshTrigger, user?.id]);

    const refetch = () => setRefreshTrigger(prev => prev + 1);

    return { employees, leaves, stats, refetch };
}
