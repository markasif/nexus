import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface RevenueData {
    month: string;
    revenue: number;
}

export interface DealsData {
    month: string;
    deals: number;
}

export interface CategoryData {
    name: string;
    value: number;
}

export interface PerformerData {
    id: string;
    name: string;
    deals: number;
    revenue: number;
    trend: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function useRevenueHistory() {
    const [data, setData] = useState<RevenueData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchRevenue() {
            try {
                // Fetch completed orders from the last 6 months
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                const { data: orders } = await supabase
                    .from('orders')
                    .select('amount, created_at')
                    .eq('status', 'completed')
                    .gte('created_at', sixMonthsAgo.toISOString())
                    .order('created_at', { ascending: true });

                const grouped = (orders || []).reduce((acc, order) => {
                    const date = new Date(order.created_at);
                    const month = date.toLocaleString('default', { month: 'short' });
                    acc[month] = (acc[month] || 0) + Number(order.amount);
                    return acc;
                }, {} as Record<string, number>);

                // Ensure all relevant months are present (optional, but good for charts)
                // For now, just mapping existing data
                const chartData = Object.entries(grouped).map(([month, revenue]) => ({
                    month,
                    revenue,
                }));

                // Sort by month index if needed, but 'created_at' order usually handles it roughly
                // Better to rely on the data returned order if we want chronological

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

export function useMonthlyDeals() {
    const [data, setData] = useState<DealsData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDeals() {
            try {
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                const { data: orders } = await supabase
                    .from('orders')
                    .select('created_at')
                    .eq('status', 'completed')
                    .gte('created_at', sixMonthsAgo.toISOString())
                    .order('created_at', { ascending: true });

                const grouped = (orders || []).reduce((acc, order) => {
                    const date = new Date(order.created_at);
                    const month = date.toLocaleString('default', { month: 'short' });
                    acc[month] = (acc[month] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const chartData = Object.entries(grouped).map(([month, deals]) => ({
                    month,
                    deals,
                }));

                setData(chartData);
            } catch (err) {
                console.error("Failed to fetch monthly deals", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchDeals();
    }, []);

    return { data, isLoading };
}

export function useCategoryDistribution() {
    const [data, setData] = useState<CategoryData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCategories() {
            try {
                const { data: items } = await supabase
                    .from('inventory')
                    .select('category, price, stock');

                const grouped = (items || []).reduce((acc, item) => {
                    const category = (item.category || 'Uncategorized').trim();
                    // Ensure robust parsing considering Supabase might return numbers or strings
                    const price = typeof item.price === 'string' ? parseFloat(item.price.replace(/,/g, '')) : Number(item.price);
                    const stock = typeof item.stock === 'string' ? parseFloat(item.stock.replace(/,/g, '')) : Number(item.stock);

                    if (isNaN(price) || isNaN(stock)) return acc;

                    const value = price * stock;
                    acc[category] = (acc[category] || 0) + value;
                    return acc;
                }, {} as Record<string, number>);

                const chartData = Object.entries(grouped)
                    .map(([name, value]) => ({
                        name,
                        value,
                    }))
                    .sort((a, b) => b.value - a.value); // Sort by value descending

                setData(chartData);
            } catch (err) {
                console.error("Failed to fetch category distribution", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCategories();
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
              full_name,
              email
            )
          `)
                    .eq('status', 'completed');

                if (!orders) {
                    setPerformers([]);
                    return;
                }

                const stats: Record<string, PerformerData> = {};

                orders.forEach((order: any) => {
                    if (!order.profiles) return;

                    // Handle single object from join
                    const p = Array.isArray(order.profiles) ? order.profiles[0] : order.profiles;
                    if (!p) return;

                    if (!stats[p.id]) {
                        stats[p.id] = {
                            id: p.id,
                            name: p.full_name || p.email?.split('@')[0] || "Unknown",
                            deals: 0,
                            revenue: 0,
                            trend: 0,
                        };
                    }

                    stats[p.id].deals += 1;
                    stats[p.id].revenue += Number(order.amount);
                });

                const sorted = Object.values(stats).sort((a, b) => b.revenue - a.revenue);
                setPerformers(sorted.slice(0, 5));

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
