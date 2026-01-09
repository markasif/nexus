import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
    revenue: number;
    activeEmployees: number;
    totalInventory: number;
    lowStockAlerts: number;
    isLoading: boolean;
}

export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats>({
        revenue: 0,
        activeEmployees: 0,
        totalInventory: 0,
        lowStockAlerts: 0,
        isLoading: true,
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                const { data, error } = await supabase.rpc('get_dashboard_stats');

                if (error) throw error;

                if (data) {
                    setStats({
                        revenue: data.revenue || 0,
                        activeEmployees: data.active_employees || 0,
                        totalInventory: data.total_inventory || 0,
                        lowStockAlerts: data.low_stock_alerts || 0,
                        isLoading: false,
                    });
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                setStats(prev => ({ ...prev, isLoading: false }));
            }
        }

        fetchStats();
    }, []);

    return stats;
}
