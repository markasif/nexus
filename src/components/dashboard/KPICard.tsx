import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon,
  variant = 'default',
  loading,
}: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  if (loading) {
    return (
      <Card variant="kpi" className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 w-full">
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
              <div className="h-8 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-xl shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="kpi"
      className={cn(
        "animate-slide-up transition-all duration-300 ease-out hover:shadow-card-hover hover:-translate-y-1",
        variant === 'primary' && "border-l-nexus-primary bg-nexus-surface/30",
        variant === 'success' && "border-l-success",
        variant === 'warning' && "border-l-warning",
        variant === 'destructive' && "border-l-destructive",
        variant === 'default' && "hover:border-nexus-highlight/50"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-3xl font-bold tracking-tight truncate" title={String(value)}>{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {isPositive && <TrendingUp className="h-4 w-4 text-success shrink-0" />}
                {isNegative && <TrendingDown className="h-4 w-4 text-destructive shrink-0" />}
                <span
                  className={cn(
                    "text-sm font-medium",
                    isPositive && "text-success",
                    isNegative && "text-destructive",
                    !isPositive && !isNegative && "text-muted-foreground"
                  )}
                >
                  {isPositive && '+'}
                  {change}%
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{changeLabel}</span>
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
