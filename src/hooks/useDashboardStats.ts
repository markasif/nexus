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
                // 1. Fetch Revenue (Sum of all orders)
                // Note: For large datasets, use a dedicated RPC function or summary table.
                // Here we fetch all purely for demonstration/MVP. 
                // Optimized approach: .select('amount') then reduce.
                const { data: orders } = await supabase.from('orders').select('amount');
                const revenue = orders?.reduce((sum, order) => sum + (Number(order.amount) || 0), 0) || 0;

                // 2. Fetch Active Employees
                const { count: employeeCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'employee')
                    .eq('status', 'active');

                // 3. Fetch Inventory Stats
                // We need all inventory items to check stock levels
                // Fix: use 'low_stock' column based on other components
                const { data: inventory } = await supabase.from('inventory').select('stock, low_stock');

                const totalInventoryInfo = await supabase
                    .from('inventory')
                    .select('*', { count: 'exact', head: true });

                const totalItems = totalInventoryInfo.count || 0;

                // Calculate Low Stock
                const lowStockCount = inventory?.filter(
                    item => (item.stock || 0) <= (item.low_stock ?? 10)
                ).length || 0;

                setStats({
                    revenue,
                    activeEmployees: employeeCount || 0,
                    totalInventory: totalItems,
                    lowStockAlerts: lowStockCount,
                    isLoading: false,
                });

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
                setStats(prev => ({ ...prev, isLoading: false }));
            }
        }

        fetchStats();
    }, []);

    return stats;
}
