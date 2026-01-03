
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    Line
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Target, Users } from "lucide-react";

export function CRMAnalytics() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const { data, error } = await supabase.rpc('get_crm_stats');
            if (data) setStats(data);
            setLoading(false);
        };
        fetchStats();
    }, []);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-nexus-primary" /></div>;

    const data = [
        { name: "Won", value: Number(stats?.conversion_rate || 0), fill: "#10b981" }, // Green
        { name: "Lost", value: 100 - Number(stats?.conversion_rate || 0), fill: "#ef4444" }, // Red
    ];

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

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Conversion Overview</CardTitle>
                        <CardDescription>Ratio of Won vs Lost deals</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="flex flex-col justify-center items-center p-6 text-center text-muted-foreground border-dashed">
                    <TrendingUp className="h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold">More Charts Coming</h3>
                    <p className="text-sm">Data will populate as more deals are closed.</p>
                </Card>
            </div>
        </div>
    );
}
