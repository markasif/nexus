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
                // 1. Fetch Profiles + Details
                const { data: profiles, error } = await supabase
                    .from('profiles')
                    .select(`
            *,
            employee_details (*)
          `);

                if (error) throw error;

                // 2. Fetch Pending Leaves with Details
                const { data: leavesData, count: pendingCount, error: tasksError } = await supabase
                    .from('leaves')
                    .select(`
                        *,
                        profiles:employee_id (full_name, email)
                    `, { count: 'exact' })
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true });

                if (tasksError) throw tasksError;

                // 3. Fetch Attendance for Current Month
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

                const { data: attendanceData } = await supabase
                    .from('attendance')
                    .select('employee_id, status')
                    .gte('date', startOfMonthStr);

                // Calculate working days passed in current month (Mon-Fri)
                let workingDaysPassed = 0;
                const tempDate = new Date(startOfMonth);
                const today = new Date();

                while (tempDate <= today) {
                    const day = tempDate.getDay();
                    if (day !== 0 && day !== 6) { // 0=Sun, 6=Sat
                        workingDaysPassed++;
                    }
                    tempDate.setDate(tempDate.getDate() + 1);
                }

                // Map attendance counts (Unique Days only)
                const empAttendanceDays: Record<string, Set<string>> = {};
                attendanceData?.forEach((record: any) => {
                    if (record.status === 'present' || record.status === 'late') {
                        if (!empAttendanceDays[record.employee_id]) {
                            empAttendanceDays[record.employee_id] = new Set();
                        }
                        empAttendanceDays[record.employee_id].add(record.date);
                    }
                });

                if (!profiles) return;

                // Transform Data & Filter out current user
                const mappedEmployees: Employee[] = profiles
                    .filter((p: any) => p.id !== user?.id) // Filter out logged-in user
                    .map((p: any) => {
                        const uniqueDaysPresent = empAttendanceDays[p.id]?.size || 0;

                        // Cap at 100% and handle division by zero
                        let attendancePct = 0;
                        if (workingDaysPassed > 0) {
                            attendancePct = Math.round((uniqueDaysPresent / workingDaysPassed) * 100);
                            if (attendancePct > 100) attendancePct = 100;
                        }

                        return {
                            id: p.id,
                            name: p.full_name || p.email?.split('@')[0],
                            email: p.email,
                            role: p.role,
                            status: p.status || 'active',
                            details: p.employee_details,
                            attendance: `${attendancePct}%`,
                        };
                    });

                setEmployees(mappedEmployees);
                setLeaves(leavesData || []);

                // Calculate Payroll
                const totalPayroll = mappedEmployees.reduce((sum, emp) => sum + (Number(emp.details?.base_salary) || 0), 0);

                // Calculate Average Attendance of the team
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
