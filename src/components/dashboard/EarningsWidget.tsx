import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, IndianRupee, TrendingUp, Loader2 } from 'lucide-react';
import { useEarnings } from '@/hooks/useEarnings';

export function EarningsWidget() {
  const { stats, loading } = useEarnings();

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">My Earnings</CardTitle>
          <div className="h-5 w-24 animate-pulse rounded-full bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Big Card Skeleton */}
            <div className="flex items-center justify-between rounded-xl bg-gray-100 p-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-3 w-24 bg-gray-300 rounded" />
                <div className="h-8 w-32 bg-gray-300 rounded" />
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-300" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Bottom Box Skeleton */}
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fallbacks if stats are empty (e.g. new user)
  const baseSalary = stats.baseSalaryYTD || 0;
  const commissionEarned = stats.commissionEarnedYTD || 0;
  const commissionPending = stats.commissionPending || 0;
  const totalEarnings = stats.totalEarnings || 0;
  // Note: Total Earnings usually implies YTD in this context, or we can use thisMonthEarnings if the widget title says "This Month"
  // The original widget had "This Month" badge but calculated totals. Let's stick to Totals for the big number, maybe clarify label.
  // Actually, if it says "This Month" badge, maybe the big number should be this month? 
  // Let's assume the user wants the "Card" to represent their financial status generally, but highlighted for current context.
  // I will use Total YTD for the main big number as it's more impressive/useful usually, or clarify.
  // The original code: totalEarnings = base + commission. 
  // Let's use YTD for the big number.

  return (
    <Card className="animate-slide-up h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">My Earnings</CardTitle>
        <Badge variant="nexus">YTD Overview</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-primary to-nexus-primary p-4 text-primary-foreground">
            <div>
              <p className="text-sm opacity-80">Total Earnings (YTD)</p>
              <p className="text-3xl font-bold">₹{totalEarnings.toLocaleString()}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Base Salary</p>
              <p className="text-xl font-semibold">₹{baseSalary.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Commission</p>
              <p className="text-xl font-semibold text-success">₹{commissionEarned.toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-lg border-2 border-dashed border-warning/50 bg-warning/5 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-warning">Pending Commission</p>
            </div>
            <p className="mt-1 text-xl font-semibold">₹{commissionPending.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Awaiting deal approval</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
