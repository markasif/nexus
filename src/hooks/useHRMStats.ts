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
                // 1. Fetch Profiles & Employee Details
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select(`
                        id, full_name, email, role, status,
                        employee_details (department, base_salary, commission_rate, job_title)
                    `)
                    .eq('role', 'employee');

                if (profilesError) throw profilesError;

                // 2. Fetch Attendance for Current Week (Flexible Model Alignment)
                const today = new Date();
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
                const startOfWeek = new Date(today);
                startOfWeek.setDate(diff);
                startOfWeek.setHours(0, 0, 0, 0);

                const { data: attendanceData, error: attError } = await supabase
                    .from('attendance')
                    .select('employee_id, clock_in, clock_out')
                    .gte('clock_in', startOfWeek.toISOString());

                if (attError) throw attError;

                // 3. Fetch Pending Leaves count
                const { data: leavesData, count: pendingCount, error: tasksError } = await supabase
                    .from('leaves')
                    .select(`
                        *,
                        profiles:employee_id (full_name, email)
                    `, { count: 'exact' })
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true });

                if (tasksError) throw tasksError;

                // 4. Calculate Stats per Employee (Weekly Time Bank)
                // Calculate working days passed THIS WEEK (Mon -> Today)
                let weeklyWorkingDaysPassed = 0;
                let loopDate = new Date(startOfWeek);
                const compareToday = new Date();
                compareToday.setHours(23, 59, 59, 999);

                while (loopDate <= compareToday) {
                    const d = loopDate.getDay();
                    if (d !== 0 && d !== 6) weeklyWorkingDaysPassed++;
                    loopDate.setDate(loopDate.getDate() + 1);
                }

                // Target: 8h per working day passed
                const expectedHours = Math.max(0, weeklyWorkingDaysPassed * 8);

                const mappedEmployees: Employee[] = (profiles || []).map((p: any) => {
                    // Filter attendance for this employee
                    const empAtt = attendanceData?.filter(a => a.employee_id === p.id) || [];

                    // Sum hours
                    const totalHours = empAtt.reduce((sum, r) => {
                        if (!r.clock_in) return sum;
                        const start = new Date(r.clock_in).getTime();
                        const end = r.clock_out ? new Date(r.clock_out).getTime() : new Date().getTime();
                        return sum + ((end - start) / (1000 * 60 * 60));
                    }, 0);

                    // Time Bank Logic
                    const timeBank = totalHours - expectedHours;
                    const sign = timeBank > 0 ? '+' : '';
                    const timeBankStr = `${sign}${timeBank.toFixed(1)}h`;

                    return {
                        id: p.id,
                        name: p.full_name,
                        email: p.email,
                        role: p.role,
                        status: p.status || 'active',
                        details: {
                            department: p.employee_details?.[0]?.department || p.employee_details?.department || '-',
                            base_salary: p.employee_details?.[0]?.base_salary || p.employee_details?.base_salary || 0,
                            commission_rate: p.employee_details?.[0]?.commission_rate || p.employee_details?.commission_rate || 0,
                            job_title: p.employee_details?.[0]?.job_title || p.employee_details?.job_title || 'Employee',
                        },
                        attendance: timeBankStr,
                    };
                });

                setEmployees(mappedEmployees);
                setLeaves(leavesData || []);

                // Calculate Totals
                const totalPayroll = mappedEmployees.reduce((sum, emp) => sum + (Number(emp.details?.base_salary) || 0), 0);

                // For Avg Attendance KPI card, effectively showing Average Time Bank isn't typical "85%" style.
                // But for consistency let's show an average deviation or maybe just a text label? 
                // Let's summing up total deviation:
                const totalDeviation = mappedEmployees.reduce((sum, emp) => {
                    return sum + parseFloat(emp.attendance.replace('h', ''));
                }, 0);
                const avgDeviation = mappedEmployees.length > 0 ? totalDeviation / mappedEmployees.length : 0;
                const avgSign = avgDeviation > 0 ? '+' : '';
                const avgAttendanceStr = `${avgSign}${avgDeviation.toFixed(1)}h`;

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
