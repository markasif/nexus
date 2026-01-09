
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    LabelList,
    PieChart,
    Pie,
    Legend
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Target, Users } from "lucide-react";

export function CRMAnalytics({ lastUpdated }: { lastUpdated?: number }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { data: statsData } = await supabase.rpc('get_crm_stats');
            const { data: productsData } = await supabase.rpc('get_product_performance');
            const { data: funnelData } = await supabase.rpc('get_sales_funnel');
            const { data: trendData } = await supabase.rpc('get_revenue_trend');

            // Manual fetch for sources to bypass potential old RPC versions
            const { data: leadsData } = await supabase
                .from('leads')
                .select('source')
                .neq('status', 'archived');

            // Standardize Keys (matching CreateLeadDialog values)
            const PREDEFINED_MAP: Record<string, string> = {
                'website': 'Website',
                'linkedin': 'LinkedIn',
                'referral': 'Referral',
                'cold-call': 'Cold Call',
                'ad': 'Advertisement',
                'other': 'Other'
            };

            // Initialize counts for all predefined sources
            const sourceCounts: Record<string, number> = {
                'Website': 0,
                'LinkedIn': 0,
                'Referral': 0,
                'Cold Call': 0,
                'Advertisement': 0,
                'Other': 0
            };

            (leadsData || []).forEach(l => {
                let s = (l.source || 'Other').toLowerCase().trim();

                // Map common variations
                if (s === 'ad' || s === 'ads') s = 'ad';
                if (s === 'advertisement') s = 'ad';

                // Find matching Label
                let label = 'Other';

                // 1. Try exact key match
                let matchingKey = Object.keys(PREDEFINED_MAP).find(k => k === s);

                // 2. Try value match (e.g. if DB has 'Advertisement' instead of 'ad') (Case insensitive)
                if (!matchingKey) {
                    matchingKey = Object.keys(PREDEFINED_MAP).find(k => PREDEFINED_MAP[k].toLowerCase() === s);
                }

                if (matchingKey) {
                    label = PREDEFINED_MAP[matchingKey];
                } else {
                    // Capitalize custom sources
                    label = s.charAt(0).toUpperCase() + s.slice(1);
                    if (!sourceCounts[label]) sourceCounts[label] = 0;
                }

                sourceCounts[label] = (sourceCounts[label] || 0) + 1;
            });

            // Convert to array
            const manualSourceData = Object.entries(sourceCounts)
                .map(([name, value]) => ({ source: name, count: value }))
                .sort((a, b) => b.count - a.count);

            if (statsData) {
                setStats({
                    ...statsData,
                    top_products: productsData || [],
                    funnel: funnelData || [],
                    trend: trendData || [],
                    sources: manualSourceData || []
                });
            }
            setLoading(false);
        };
        fetchStats();
    }, [lastUpdated]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-nexus-primary" /></div>;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const revenueProgress = (stats?.total_revenue / stats?.monthly_target) * 100;



    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.total_revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {revenueProgress.toFixed(1)}% of ₹{stats?.monthly_target?.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Goal
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                            <div
                                className="bg-nexus-primary h-1.5 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(revenueProgress, 100)}%` }}
                            ></div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Forecast</CardTitle>
                        <Target className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats?.pipeline_forecast?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Projected from open negotiations
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.conversion_rate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Leads converted to won deals
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:h-[600px]">
                {/* Left Column: Lead Sources */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Lead Sources</CardTitle>
                        <CardDescription>Where are your leads coming from?</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px] flex flex-col p-4">
                        <div className="flex-1 min-h-[200px] -mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats?.sources}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="source"
                                        stroke="none"
                                    >
                                        {stats?.sources?.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name: any) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Breakdown List - Refined Design */}
                        <div className="mt-2 space-y-2 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                            {stats?.sources?.map((source: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs group hover:bg-slate-50 p-1.5 rounded-md transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <span className="font-medium text-slate-600 group-hover:text-slate-900">{source.source}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400 font-medium">{source.count}</span>
                                        <span className="font-bold w-10 text-right text-slate-700">
                                            {stats.sources.reduce((acc: any, curr: any) => acc + curr.count, 0) > 0
                                                ? ((source.count / stats.sources.reduce((acc: any, curr: any) => acc + curr.count, 0)) * 100).toFixed(0) + '%'
                                                : '0%'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Tabbed Analytics */}
                <Card className="h-full flex flex-col overflow-hidden">
                    <Tabs defaultValue="products" className="flex-1 flex flex-col">
                        <div className="px-6 pt-6 pb-2">
                            <TabsList className="w-full flex overflow-x-auto sm:grid sm:grid-cols-3 no-scrollbar">
                                <TabsTrigger value="products" className="min-w-[120px]">Top Products</TabsTrigger>
                                <TabsTrigger value="funnel" className="min-w-[120px]">Sales Funnel</TabsTrigger>
                                <TabsTrigger value="trend" className="min-w-[120px]">Revenue Trend</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Top Products Tab */}
                        <TabsContent value="products" className="flex-1 p-6 pt-2 m-0 mt-0 overflow-y-auto">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground">Top Selling</h4>
                                    {stats?.top_products?.length > 0 ? (
                                        stats.top_products.slice(0, 3).map((product: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{product.total_sold} units sold</p>
                                                </div>
                                                <div className="font-bold">₹{product.total_revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                                            </div>
                                        ))
                                    ) : <div className="text-xs text-muted-foreground py-2">No sales data</div>}
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground">Highest Margin</h4>
                                    {stats?.top_products?.length > 0 ? (
                                        [...stats.top_products].sort((a: any, b: any) => b.total_profit - a.total_profit).slice(0, 3).map((product: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">{product.name}</p>
                                                    <p className="text-xs text-emerald-600 font-medium">+{((product.total_profit / product.total_revenue) * 100).toFixed(0)}% margin</p>
                                                </div>
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    +₹{product.total_profit?.toLocaleString()}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : <div className="text-xs text-muted-foreground py-2">No profit data</div>}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Sales Funnel Tab */}
                        <TabsContent value="funnel" className="flex-1 p-6 pt-2 m-0 mt-0 h-full min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.funnel} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="stage" type="category" width={80} tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)} />
                                    <Tooltip formatter={(value) => [value, 'Leads']} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                                        <LabelList dataKey="count" position="right" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </TabsContent>

                        {/* Revenue Trend Tab */}
                        <TabsContent value="trend" className="flex-1 p-6 pt-2 m-0 mt-0 h-full min-h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.trend}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month_label" />
                                    <YAxis tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : `₹${val}`} />
                                    <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
