import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { DollarSign, FileText, TrendingUp, Clock, Calendar, AlertCircle, Download } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useEarnings } from '@/hooks/useEarnings';
import { Button } from '@/components/ui/button';

export default function Earnings() {
    const { commissions, payslips, stats, loading } = useEarnings();

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 pb-10">
                {/* Header */}
                <ScrollReveal width="100%">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
                            <p className="text-muted-foreground mt-1">Track your earnings, commissions, and payouts.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" /> Download Report
                            </Button>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Stats Grid */}
                <ScrollReveal width="100%">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Total Earnings Card */}
                        <Card className="bg-primary text-primary-foreground border-none shadow-lg relative overflow-hidden">
                            <div className="absolute right-0 top-0 h-32 w-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
                            <CardHeader className="pb-2 relative z-10">
                                <CardTitle className="text-primary-foreground/80 font-medium text-sm">Total Earnings (YTD)</CardTitle>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold">{formatCurrency(stats.totalEarnings)}</span>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-primary-foreground/70 text-sm">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>+12% from last year</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Details Card */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="font-medium text-sm text-muted-foreground">Income Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Base Salary</p>
                                                <p className="text-xs text-muted-foreground">Recurring</p>
                                            </div>
                                        </div>
                                        <span className="font-bold">{formatCurrency(stats.baseSalaryYTD)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Commissions</p>
                                                <p className="text-xs text-muted-foreground">Performance</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-green-600">{formatCurrency(stats.commissionEarnedYTD)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Card */}
                        <Card className="border-l-4 border-l-yellow-500">
                            <CardHeader className="pb-2">
                                <CardTitle className="font-medium text-sm text-muted-foreground">Pending Payouts</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col h-full justify-between">
                                    <div>
                                        <span className="text-3xl font-bold text-foreground">{formatCurrency(stats.commissionPending)}</span>
                                        <p className="text-sm text-muted-foreground mt-1">Expected to process by month end</p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-sm font-medium">
                                        <Clock className="h-4 w-4" />
                                        <span>3 deals processing</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollReveal>

                {/* Main Content Tabs */}
                <ScrollReveal width="100%">
                    <Tabs defaultValue="commissions" className="h-full space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList className="bg-white border w-full max-w-[400px] grid grid-cols-2">
                                <TabsTrigger value="commissions" className="h-9">Commissions</TabsTrigger>
                                <TabsTrigger value="payslips" className="h-9">Payslips</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Commissions Tab */}
                        <TabsContent value="commissions" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Commission History</CardTitle>
                                    <CardDescription>
                                        Detailed log of all commissions earned from closed deals.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="py-8 text-center text-muted-foreground">Loading data...</div>
                                    ) : commissions.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                                            <div className="bg-muted rounded-full p-4 mb-4">
                                                <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            <p className="text-lg font-medium text-foreground">No commissions yet</p>
                                            <p className="text-sm">Close more deals to start earning!</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Deal Name</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {commissions.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">
                                                            <div>
                                                                {item.deal_name}
                                                                <div className="text-xs text-muted-foreground hidden sm:block">Deal Value: {formatCurrency(item.leads?.value || 0)}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(item.date).toLocaleDateString()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={
                                                                item.status === 'paid' ? 'success' :
                                                                    item.status === 'rejected' ? 'destructive' :
                                                                        'warning'
                                                            } className="capitalize shadow-none">
                                                                {item.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-success">
                                                            +{formatCurrency(item.amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Payslips Tab */}
                        <TabsContent value="payslips" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Payslips</CardTitle>
                                    <CardDescription>
                                        Monthly salary details and earnings statements.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="py-8 text-center text-muted-foreground">Loading data...</div>
                                    ) : payslips.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                                            <div className="bg-muted rounded-full p-4 mb-4">
                                                <FileText className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            <p className="text-lg font-medium text-foreground">No payslips available</p>
                                            <p className="text-sm">Check back at the end of the month.</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Month</TableHead>
                                                    <TableHead>Base</TableHead>
                                                    <TableHead>Comm.</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Total Net</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {payslips.map((slip) => (
                                                    <TableRow key={slip.id}>
                                                        <TableCell className="font-medium">
                                                            {new Date(slip.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                        </TableCell>
                                                        <TableCell>{formatCurrency(slip.base_amount)}</TableCell>
                                                        <TableCell className="text-green-600">+{formatCurrency(slip.commission_amount)}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={slip.status === 'processed' || slip.status === 'paid' ? 'success' : 'secondary'} className="capitalize shadow-none">
                                                                {slip.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            {formatCurrency(slip.total_amount)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Download className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </ScrollReveal>
            </div>
        </DashboardLayout>
    );
}
