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
    currentSalary: number;
    commissionPendingCount: number;
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
        commissionPendingCount: 0,
        thisMonthEarnings: 0,
        currentSalary: 0
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

                // 3. Fetch Employee Details & Global Settings (Hierarchy)
                const { data: empDetails, error: empError } = await supabase
                    .from('employee_details')
                    .select('base_salary, commission_rate')
                    .eq('id', user?.id)
                    .single();

                const { data: globalSettings } = await supabase
                    .from('crm_settings')
                    .select('default_commission')
                    .limit(1)
                    .single();

                // 4. Fetch Pending Verification Leads (Deals waiting for approval)
                const { data: pendingLeads, error: leadsError } = await supabase
                    .from('leads')
                    .select('value')
                    .eq('assigned_to', user?.id)
                    .in('status', ['pending-verification', 'pending_verification']);

                // 5. Calculate Stats
                // Hierarchy: Employee Rate > Global Rate > 0
                const globalRate = globalSettings?.default_commission || 0;
                const empRate = empDetails?.commission_rate;
                // If empRate is explicitly null/0, should we fallback? 
                // Usually yes, unless 0 is a valid "no commission" override.
                // Assuming null means "use default", and 0 means "0%". 
                // However, previous code was `|| 0`, implying null/0 are treated same.
                // Let's implement: Use Employee Rate if defined (non-null), else Global.
                const commRate = (empRate !== null && empRate !== undefined) ? empRate : globalRate;

                // Established Pending Commissions (from commissions table)
                const pendingComms = comms.filter(c => c.status === 'pending');
                const existingPendingTotal = pendingComms.reduce((sum, c) => sum + Number(c.amount), 0);

                // Estimated Pending from Leads (waiting verification)
                // If lead has a value, calculate projected commission
                const estimatedPendingFromLeads = (pendingLeads || []).reduce((sum, lead) => {
                    return sum + (Number(lead.value || 0) * (commRate / 100));
                }, 0);

                const commissionPending = existingPendingTotal + estimatedPendingFromLeads;

                // Total Count: Existing Pending Commissions + Leads waiting approval
                // Note: A lead might be in 'pending-verification' but NOT yet in 'commissions'
                // We assume if it's in 'commissions', it's already "won" but pending payout.
                // 'pending-verification' leads are PRE-won.
                const commissionPendingCount = pendingComms.length + (pendingLeads?.length || 0);

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
                    commissionPendingCount,
                    thisMonthEarnings,
                    currentSalary: empDetails?.base_salary || 0
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
