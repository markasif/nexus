import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Commission {
    id: string;
    deal_name: string;
    amount: number;
    status: 'paid' | 'pending' | 'rejected';
    date: string;
    leads?: {
        name: string;
        value: number;
    };
}

export interface Payslip {
    id: string;
    month: string;
    base_amount: number;
    commission_amount: number;
    total_amount: number;
    status: string;
}

export interface EarningsStats {
    totalEarnings: number;
    baseSalaryYTD: number;
    commissionEarnedYTD: number;
    commissionPending: number;
    thisMonthEarnings: number;
}

export function useEarnings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [stats, setStats] = useState<EarningsStats>({
        totalEarnings: 0,
        baseSalaryYTD: 0,
        commissionEarnedYTD: 0,
        commissionPending: 0,
        thisMonthEarnings: 0
    });

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            setLoading(true);
            try {
                // 1. Fetch Commissions with Deal Info
                const { data: commsData, error: commsError } = await supabase
                    .from('commissions')
                    .select('*, leads(name, value)')
                    .eq('employee_id', user?.id)
                    .order('date', { ascending: false });

                if (commsError) throw commsError;

                // 2. Fetch Payroll
                const { data: payrollData, error: payrollError } = await supabase
                    .from('payroll')
                    .select('*')
                    .eq('employee_id', user?.id)
                    .order('month', { ascending: false });

                if (payrollError) throw payrollError;

                const comms = (commsData || []).map((c: any) => ({
                    ...c,
                    deal_name: c.leads?.name || 'Unknown Deal' // Fallback or direct access
                })) as Commission[];

                const pays = payrollData as Payslip[] || [];

                setCommissions(comms);
                setPayslips(pays);

                // 3. Calculate Stats
                const commissionPending = comms
                    .filter(c => c.status === 'pending')
                    .reduce((sum, c) => sum + Number(c.amount), 0);

                const commissionEarnedYTD = comms
                    .filter(c => c.status === 'paid')
                    .reduce((sum, c) => sum + Number(c.amount), 0);

                // Calculate from Payslips for robust totals
                const baseSalaryYTD = pays.reduce((sum, p) => sum + Number(p.base_amount), 0);
                const totalEarnings = baseSalaryYTD + commissionEarnedYTD; // Use sum of actual parts

                // Identify this month's earnings
                const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
                const thisMonthSlip = pays.find(p => p.month.startsWith(currentMonth));
                const thisMonthEarnings = thisMonthSlip ? Number(thisMonthSlip.total_amount) : 0;

                setStats({
                    totalEarnings,
                    baseSalaryYTD,
                    commissionEarnedYTD,
                    commissionPending,
                    thisMonthEarnings
                });

            } catch (error) {
                console.error("Error fetching earnings:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [user]);

    return { commissions, payslips, stats, loading };
}
