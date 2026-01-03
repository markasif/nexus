import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface RevenueData {
    month: string;
    revenue: number;
}

export interface PerformerData {
    id: string;
    name: string;
    deals: number;
    revenue: number;
    trend: number; // Placeholder or calculated
}

export function useRevenueHistory() {
    const [data, setData] = useState<RevenueData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRevenue() {
            try {
                const { data: orders } = await supabase
                    .from('orders')
                    .select('amount, created_at')
                    .order('created_at', { ascending: true });

                if (!orders) {
                    setData([]);
                    return;
                }

                // Group by Month
                const grouped = orders.reduce((acc, order) => {
                    const date = new Date(order.created_at);
                    const month = date.toLocaleString('default', { month: 'short' });

                    if (!acc[month]) {
                        acc[month] = 0;
                    }
                    acc[month] += Number(order.amount);
                    return acc;
                }, {} as Record<string, number>);

                // Format for Recharts
                const chartData = Object.entries(grouped).map(([month, revenue]) => ({
                    month,
                    revenue,
                }));

                setData(chartData);
            } catch (err) {
                console.error("Failed to fetch revenue history", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchRevenue();
    }, []);

    return { data, isLoading };
}

export function useTopPerformers() {
    const [performers, setPerformers] = useState<PerformerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchPerformers() {
            try {
                const { data: orders } = await supabase
                    .from('orders')
                    .select(`
            amount,
            employee_id,
            profiles:employee_id (
              id,
              name,
              email
            )
          `);

                if (!orders) {
                    setPerformers([]);
                    return;
                }

                const stats: Record<string, PerformerData> = {};

                orders.forEach((order: any) => {
                    if (!order.profiles) return; // Skip if no employee linked

                    const profile = order.profiles; // Since it's a join, might be an object or array depending on relation type (one-to-one/many)
                    // Actually supabase returns single object for foreign key usually.

                    // Defend against null profile or array
                    const p = Array.isArray(profile) ? profile[0] : profile;
                    if (!p) return;

                    if (!stats[p.id]) {
                        stats[p.id] = {
                            id: p.id,
                            name: p.name || p.email?.split('@')[0] || "Unknown",
                            deals: 0,
                            revenue: 0,
                            trend: Math.floor(Math.random() * 20) - 5, // Mock trend for now
                        };
                    }

                    stats[p.id].deals += 1;
                    stats[p.id].revenue += Number(order.amount);
                });

                const sorted = Object.values(stats).sort((a, b) => b.revenue - a.revenue);
                setPerformers(sorted.slice(0, 5)); // Top 5

            } catch (err) {
                console.error("Failed to fetch top performers", err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPerformers();
    }, []);

    return { performers, isLoading };
}
