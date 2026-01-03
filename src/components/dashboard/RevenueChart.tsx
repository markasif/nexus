import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRevenueHistory } from '@/hooks/useAnalytics';

export function RevenueChart() {
  const { data, isLoading } = useRevenueHistory();

  if (isLoading) {
    return (
      <Card className="animate-slide-up h-full flex flex-col justify-center items-center">
        <p className="text-muted-foreground">Loading chart...</p>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up transition-shadow duration-300 hover:shadow-card-hover h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg text-nexus-dark">Revenue Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="h-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--nexus-primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--nexus-primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--nexus-surface))" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--nexus-dark))', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--nexus-dark))', fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid hsl(var(--nexus-bg-tint))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.1)',
                }}
                itemStyle={{ color: 'hsl(var(--nexus-dark))' }}
                cursor={{ stroke: 'hsl(var(--nexus-soft))', strokeWidth: 1 }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--nexus-primary))"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--nexus-secondary))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
