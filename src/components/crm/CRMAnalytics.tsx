
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

export function CRMAnalytics() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { data: statsData } = await supabase.rpc('get_crm_stats');
            const { data: productsData } = await supabase.rpc('get_product_performance');
            const { data: funnelData } = await supabase.rpc('get_sales_funnel');
            const { data: trendData } = await supabase.rpc('get_revenue_trend');
            const { data: sourceData } = await supabase.rpc('get_lead_sources');

            if (statsData) {
                setStats({
                    ...statsData,
                    top_products: productsData || [],
                    funnel: funnelData || [],
                    trend: trendData || [],
                    sources: sourceData || []
                });
            }
            setLoading(false);
        };
        fetchStats();
    }, []);

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
                        <div className="text-2xl font-bold">${stats?.total_revenue?.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {revenueProgress.toFixed(1)}% of ${stats?.monthly_target?.toLocaleString()} Goal
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
                        <div className="text-2xl font-bold">${stats?.pipeline_forecast?.toLocaleString()}</div>
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

            <div className="grid gap-4 md:grid-cols-2 lg:h-[450px]">
                {/* Left Column: Lead Sources */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Lead Sources</CardTitle>
                        <CardDescription>Where are your leads coming from?</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.sources}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="source"
                                >
                                    {stats?.sources?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name: any) => [value, name.charAt(0).toUpperCase() + name.slice(1)]} />
                                <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Right Column: Tabbed Analytics */}
                <Card className="h-full flex flex-col overflow-hidden">
                    <Tabs defaultValue="products" className="flex-1 flex flex-col">
                        <div className="px-6 pt-6 pb-2">
                            <TabsList className="w-full grid grid-cols-3">
                                <TabsTrigger value="products">Top Products</TabsTrigger>
                                <TabsTrigger value="funnel">Sales Funnel</TabsTrigger>
                                <TabsTrigger value="trend">Revenue Trend</TabsTrigger>
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
                                                <div className="font-bold">${product.total_revenue?.toLocaleString()}</div>
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
                                                    +${product.total_profit?.toLocaleString()}
                                                </Badge>
                                            </div>
                                        ))
                                    ) : <div className="text-xs text-muted-foreground py-2">No profit data</div>}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Sales Funnel Tab */}
                        <TabsContent value="funnel" className="flex-1 p-6 pt-2 m-0 mt-0 h-full">
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
                        <TabsContent value="trend" className="flex-1 p-6 pt-2 m-0 mt-0 h-full">
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
                                    <YAxis tickFormatter={(val) => val >= 1000 ? `$${val / 1000}k` : `$${val}`} />
                                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
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
