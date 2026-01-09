import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Lead } from '@/types/crm';

export function useLeads() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 1. Fetch Leads Query
    const { data: leads = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['leads', user?.id], // Cache key unique to user
        queryFn: async () => {
            const { data, error } = await supabase
                .from('leads')
                .select(`
                    *,
                    profiles:assigned_to (full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Client-side sort: Pending Verification first
            const sortedData = (data || []).sort((a: any, b: any) => {
                const isAPending = a.status === 'pending-verification' || a.status === 'pending_verification';
                const isBPending = b.status === 'pending-verification' || b.status === 'pending_verification';

                if (isAPending && !isBPending) return -1;
                if (!isAPending && isBPending) return 1;
                return 0;
            });

            return sortedData;
        },
        enabled: !!user, // Only run if user exists
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    // 2. Fetch Employees Query (Admin only)
    const { data: employees = [] } = useQuery({
        queryKey: ['employees_list'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('role', 'employee');

            if (error) throw error;
            return data || [];
        },
        enabled: user?.role === 'admin',
        staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    });

    // 3. Mutations
    const assignMutation = useMutation({
        mutationFn: async ({ leadId, employeeId }: { leadId: string, employeeId: string }) => {
            const { error } = await supabase
                .from('leads')
                .update({ assigned_to: employeeId })
                .eq('id', leadId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast({ title: "Lead Assigned", description: "Agent updated successfully." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to assign lead", variant: "destructive" });
        }
    });

    const statusMutation = useMutation({
        mutationFn: async ({ leadId, newStatus }: { leadId: string, newStatus: string }) => {
            // Special logic for closed-won
            if (newStatus === 'closed-won') {
                const { data: leadData } = await supabase
                    .from('leads')
                    .select('assigned_to')
                    .eq('id', leadId)
                    .single();

                const { error: rpcError } = await supabase.rpc('confirm_lead_order', {
                    target_lead_id: leadId,
                    output_employee_id: leadData?.assigned_to || user?.id
                });
                if (rpcError) throw rpcError;
            }

            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus })
                .eq('id', leadId);
            if (error) throw error;
            return newStatus;
        },
        onSuccess: (newStatus) => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            if (newStatus === 'closed-won') {
                toast({
                    title: "Deal Won!",
                    description: "Order has been created and finalized for the assigned agent.",
                    variant: "default",
                    className: "bg-green-500 text-white border-none"
                });
            }
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update status",
                variant: "destructive"
            });
        }
    });

    return {
        leads,
        loading,
        employees,
        fetchLeads: refetch,
        assignLead: (leadId: string, employeeId: string) => assignMutation.mutate({ leadId, employeeId }),
        updateStatus: (leadId: string, newStatus: string) => statusMutation.mutate({ leadId, newStatus })
    };
}
