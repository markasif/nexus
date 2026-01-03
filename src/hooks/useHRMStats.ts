import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    details?: {
        base_salary: number;
        commission_rate: number;
        job_title: string;
        department: string;
    };
    attendance: string; // Formatting purpose for now
}

export interface HRMStats {
    avgAttendance: string;
    totalPayroll: number;
    pendingLeaves: number;
    isLoading: boolean;
}

import { useAuth } from '@/contexts/AuthContext';

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

                if (!profiles) return;

                // Transform Data & Filter out current user
                const mappedEmployees: Employee[] = profiles
                    .filter((p: any) => p.id !== user?.id) // Filter out logged-in user
                    .map((p: any) => ({
                        id: p.id,
                        name: p.full_name || p.email?.split('@')[0],
                        email: p.email,
                        role: p.role,
                        status: p.status || 'active',
                        details: p.employee_details,
                        attendance: (90 + Math.floor(Math.random() * 10)) + '%',
                    }));

                setEmployees(mappedEmployees);
                setLeaves(leavesData || []);

                // Calculate Payroll
                const totalPayroll = mappedEmployees.reduce((sum, emp) => sum + (Number(emp.details?.base_salary) || 0), 0);

                setStats({
                    avgAttendance: '96.4%',
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
