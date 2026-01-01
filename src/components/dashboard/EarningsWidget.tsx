import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp } from 'lucide-react';

export function EarningsWidget() {
  const baseSalary = 50000 / 12;
  const commissionEarned = 2840;
  const commissionPending = 1250;
  const totalEarnings = baseSalary + commissionEarned;

  return (
    <Card className="animate-slide-up">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">My Earnings</CardTitle>
        <Badge variant="nexus">This Month</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary to-nexus-primary p-4 text-primary-foreground">
            <div>
              <p className="text-sm opacity-80">Total Earnings</p>
              <p className="text-3xl font-bold">${totalEarnings.toLocaleString()}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Base Salary</p>
              <p className="text-xl font-semibold">${baseSalary.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Commission (8%)</p>
              <p className="text-xl font-semibold text-success">${commissionEarned.toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-lg border-2 border-dashed border-warning/50 bg-warning/5 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-warning">Pending Commission</p>
            </div>
            <p className="mt-1 text-xl font-semibold">${commissionPending.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Awaiting deal approval</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
