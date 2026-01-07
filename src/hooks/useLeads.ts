import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

import { Lead } from '@/types/crm';

export function useLeads() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<{ id: string, full_name: string }[]>([]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            // 1. Fetch Leads with Assignee Details
            let query = supabase
                .from('leads')
                .select(`
                    *,
                    profiles:assigned_to (full_name, email)
                `)
                .order('created_at', { ascending: false });

            // If not admin, RLS policies will handle restriction, 
            // but we can explicitly filter for UI speed if needed.

            const { data, error } = await query;
            if (error) throw error;
            setLeads(data || []);

            // 2. Fetch Employees for Assignment Dropdown (Admin only)
            if (user?.role === 'admin') {
                const { data: empData } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('role', 'employee');
                setEmployees(empData || []);
            }

        } catch (error: any) {
            toast({ title: "Error", description: "Failed to load leads", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchLeads();
    }, [user]);

    const assignLead = async (leadId: string, employeeId: string) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ assigned_to: employeeId })
                .eq('id', leadId);

            if (error) throw error;

            toast({ title: "Lead Assigned", description: "Agent updated successfully." });
            fetchLeads(); // Refresh list
        } catch (error) {
            toast({ title: "Error", description: "Failed to assign lead", variant: "destructive" });
        }
    };

    const updateStatus = async (leadId: string, newStatus: string) => {
        try {
            // 1. If moving to "Closed Won", we must confirm the order (generate Order record)
            // Stock is already deducted by triggers during negotiation, so this just creates the official Order.
            if (newStatus === 'closed-won') {
                // Fetch the lead first to get the assigned employee
                const { data: leadData } = await supabase
                    .from('leads')
                    .select('assigned_to')
                    .eq('id', leadId)
                    .single();

                const { error: rpcError } = await supabase.rpc('confirm_lead_order', {
                    target_lead_id: leadId,
                    // Use the assigned employee ID if available, otherwise fallback to current user
                    output_employee_id: leadData?.assigned_to || user?.id
                });
                if (rpcError) throw rpcError;

                toast({
                    title: "Deal Won!",
                    description: "Order has been created and finalized for the assigned agent.",
                    variant: "default",
                    className: "bg-green-500 text-white border-none"
                });
            }

            // 2. Update the Lead Status
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus })
                .eq('id', leadId);

            if (error) throw error;

            fetchLeads();
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.message || "Failed to update status",
                variant: "destructive"
            });
        }
    };

    return { leads, loading, employees, fetchLeads, assignLead, updateStatus };
}
