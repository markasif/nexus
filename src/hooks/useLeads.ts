import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export type Lead = {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    value: number;
    status: string;
    assigned_to: string;
    last_contact: string;
    profiles?: { full_name: string; email: string }; // Joined assignee data
};

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
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus })
                .eq('id', leadId);

            if (error) throw error;
            fetchLeads();
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    return { leads, loading, employees, fetchLeads, assignLead, updateStatus };
}
