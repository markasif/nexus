import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

const employees = [
  { id: 1, name: 'James Cooper', deals: 28, revenue: 145000, trend: 12 },
  { id: 2, name: 'Emily Chen', deals: 24, revenue: 128000, trend: 8 },
  { id: 3, name: 'Michael Ross', deals: 22, revenue: 115000, trend: -3 },
  { id: 4, name: 'Sarah Kim', deals: 19, revenue: 98000, trend: 15 },
  { id: 5, name: 'David Park', deals: 17, revenue: 86000, trend: 5 },
];

export function EmployeeRanking() {
  return (
    <Card className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Top Performers</CardTitle>
        <Badge variant="nexus">This Month</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee, index) => (
            <div
              key={employee.id}
              className="flex items-center gap-4 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:border-primary/20"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium">{employee.name}</p>
                <p className="text-xs text-muted-foreground">
                  {employee.deals} deals · ${employee.revenue.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp
                  className={`h-4 w-4 ${employee.trend > 0 ? 'text-success' : 'text-destructive'}`}
                />
                <span
                  className={`text-sm font-medium ${
                    employee.trend > 0 ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {employee.trend > 0 ? '+' : ''}
                  {employee.trend}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
