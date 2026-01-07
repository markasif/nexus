import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users } from 'lucide-react';
import { useTopPerformers } from '@/hooks/useAnalytics';

export function EmployeeRanking() {
  const { performers, isLoading } = useTopPerformers();

  if (isLoading) {
    return (
      <Card className="animate-slide-up h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-slide-up h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Top Performers</CardTitle>
        <Badge variant="nexus">All Time</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-50" />
              <p>No performance data yet</p>
            </div>
          ) : (
            performers.map((employee, index) => (
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
                    className={`h-4 w-4 ${employee.trend >= 0 ? 'text-success' : 'text-destructive'}`}
                  />
                  <span
                    className={`text-sm font-medium ${employee.trend >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                  >
                    {employee.trend > 0 ? '+' : ''}
                    {employee.trend}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
