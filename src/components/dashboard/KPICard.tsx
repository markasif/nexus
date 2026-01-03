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
}

export function KPICard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon,
  variant = 'default',
}: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

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
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1.5">
                {isPositive && <TrendingUp className="h-4 w-4 text-success" />}
                {isNegative && <TrendingDown className="h-4 w-4 text-destructive" />}
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
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
