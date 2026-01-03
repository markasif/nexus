import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { EmployeeRanking } from '@/components/dashboard/EmployeeRanking';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useMonthlyDeals, useCategoryDistribution } from '@/hooks/useAnalytics';
import { useSettings } from '@/hooks/useSettings';

const COLORS = ['hsl(213, 95%, 28%)', 'hsl(200, 100%, 36%)', 'hsl(191, 100%, 43%)', 'hsl(170, 70%, 40%)', 'hsl(150, 60%, 45%)'];

export default function Analytics() {
  const { data: monthlyDeals, isLoading: dealsLoading } = useMonthlyDeals();
  const { data: categoryData, isLoading: categoryLoading } = useCategoryDistribution();
  const { formatCurrency } = useSettings();

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Deals Closed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {dealsLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyDeals}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(187, 50%, 80%)" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(220, 40%, 40%)', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(220, 40%, 40%)', fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(187, 50%, 80%)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar
                        dataKey="deals"
                        fill="hsl(191, 100%, 43%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Inventory Value by Category</CardTitle>
              <Badge variant="nexus">Current</Badge>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {categoryLoading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(0, 0%, 100%)',
                          border: '1px solid hsl(187, 50%, 80%)',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [
                          formatCurrency(value),
                          'Value'
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4 space-y-2">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <EmployeeRanking />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
