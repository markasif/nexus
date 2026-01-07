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
                // Fetch closed-won leads instead of orders to accurately reflect assignment
                const { data: leads } = await supabase
                    .from('leads')
                    .select(`
                        value,
                        assigned_to,
                        profiles:assigned_to (
                            id,
                            full_name,
                            email,
                            role
                        )
                    `)
                    .eq('status', 'closed-won');

                if (!leads) {
                    setPerformers([]);
                    return;
                }

                const stats: Record<string, PerformerData> = {};

                leads.forEach((lead: any) => {
                    if (!lead.profiles) return;

                    // Handle single object from join
                    const p = Array.isArray(lead.profiles) ? lead.profiles[0] : lead.profiles;
                    if (!p) return;

                    // Filter out admins (optional, derived from requirements)
                    if (p.role === 'admin' || p.role === 'owner' || p.role === 'super_admin') return;

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
                    stats[p.id].revenue += Number(lead.value);
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

export function useSalesFunnel() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchFunnel() {
            try {
                const { data: leads } = await supabase
                    .from('leads')
                    .select('status, value');

                const counts: Record<string, number> = {
                    'new': 0,
                    'qualified': 0,
                    'proposal': 0,
                    'negotiation': 0,
                    'closed-won': 0
                };

                (leads || []).forEach(lead => {
                    if (counts.hasOwnProperty(lead.status)) {
                        counts[lead.status]++;
                    }
                });

                // Transform to chart format
                const funnelData = [
                    { name: 'Leads', value: counts['new'], fill: '#94a3b8' },
                    { name: 'Qualified', value: counts['qualified'], fill: '#60a5fa' },
                    { name: 'Proposal', value: counts['proposal'], fill: '#818cf8' },
                    { name: 'Negotiation', value: counts['negotiation'], fill: '#fbbf24' },
                    { name: 'Won', value: counts['closed-won'], fill: '#22c55e' }
                ];

                setData(funnelData);
            } catch (err) {
                console.error("Error fetching funnel", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchFunnel();
    }, []);

    return { data, isLoading };
}

export function useLeadSources() {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSources() {
            try {
                const { data: leads } = await supabase
                    .from('leads')
                    .select('source');

                const counts: Record<string, number> = {};

                (leads || []).forEach(lead => {
                    // Normalize source (default to 'Direct' if missing)
                    const source = lead.source || 'Direct';
                    counts[source] = (counts[source] || 0) + 1;
                });

                let chartData = Object.entries(counts).map(([name, value]) => ({
                    name,
                    value,
                })).sort((a, b) => b.value - a.value);

                // Mock data if empty
                if (chartData.length === 0) {
                    chartData = [
                        { name: 'Website', value: 45 },
                        { name: 'LinkedIn', value: 30 },
                        { name: 'Referral', value: 25 },
                        { name: 'Cold Call', value: 15 },
                        { name: 'Events', value: 10 },
                    ];
                }

                setData(chartData);
            } catch (err) {
                console.error("Error fetching lead sources", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSources();
    }, []);

    return { data, isLoading };
}

export function useAttendanceAnalytics() {
    const [stats, setStats] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAttendance() {
            try {
                // Get today's attendance
                const today = new Date().toISOString().split('T')[0];

                // 1. Get all employees count
                const { count: totalEmployees } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'employee');

                // 2. Get today's attendance records
                const { data: attendance } = await supabase
                    .from('attendance')
                    .select('clock_in, clock_out')
                    .eq('date', today);

                const presentCount = attendance?.length || 0;

                // Calculate absent (Total - Present)
                const absentCount = Math.max(0, (totalEmployees || 0) - presentCount);

                const chartData = [
                    { name: 'Present', value: presentCount, fill: '#22c55e' },
                    { name: 'Absent', value: absentCount, fill: '#ef4444' },
                    { name: 'On Leave', value: 0, fill: '#eab308' }, // Placeholder
                    { name: 'Late', value: 0, fill: '#f97316' }, // Placeholder
                ];

                // If no data (dev mode), Show something interesting so it's not empty
                if (!totalEmployees && presentCount === 0) {
                    setStats([
                        { name: 'Present', value: 42, fill: '#22c55e' },
                        { name: 'Absent', value: 3, fill: '#ef4444' },
                        { name: 'On Leave', value: 5, fill: '#eab308' },
                        { name: 'Late', value: 2, fill: '#f97316' },
                    ]);
                } else {
                    setStats(chartData);
                }

            } catch (err) {
                console.error("Error fetching attendance analytics", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAttendance();
    }, []);

    return { stats, isLoading };
}
