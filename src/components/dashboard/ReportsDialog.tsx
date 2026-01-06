import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BarChart3, FileText, Download, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function ReportsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState("revenue");

    const handleDownload = () => {
        setLoading(true);
        // Simulate PDF generation
        setTimeout(() => {
            setLoading(false);
            toast.success("Report generated successfully", {
                description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report_${format(new Date(), 'yyyy-MM-dd')}.pdf has been downloaded.`
            });
            onOpenChange(false);
        }, 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md border-0 shadow-2xl p-0 gap-0 overflow-hidden rounded-xl">
                <div className="relative bg-gradient-to-br from-indigo-900 to-indigo-700 px-6 py-6 text-white overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-black/20 blur-xl"></div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Export Reports
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100/80">
                            Select a report type to generate detailed analytics.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 bg-background space-y-6">
                    <RadioGroup defaultValue="revenue" onValueChange={setReportType} className="grid grid-cols-1 gap-4">
                        <div className={`flex items-center space-x-4 rounded-xl border p-4 transition-all cursor-pointer ${reportType === 'revenue' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="revenue" id="revenue" className="border-indigo-600 text-indigo-600" />
                            <Label htmlFor="revenue" className="flex-1 cursor-pointer">
                                <span className="font-semibold text-foreground block">Revenue & Sales</span>
                                <span className="text-xs text-muted-foreground">Detailed breakdown of income sources and trends.</span>
                            </Label>
                            <BarChart3 className={`h-5 w-5 ${reportType === 'revenue' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        </div>

                        <div className={`flex items-center space-x-4 rounded-xl border p-4 transition-all cursor-pointer ${reportType === 'inventory' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="inventory" id="inventory" className="border-indigo-600 text-indigo-600" />
                            <Label htmlFor="inventory" className="flex-1 cursor-pointer">
                                <span className="font-semibold text-foreground block">Inventory Valuation</span>
                                <span className="text-xs text-muted-foreground">Current stock levels, low stock alerts, and value.</span>
                            </Label>
                            <FileText className={`h-5 w-5 ${reportType === 'inventory' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        </div>

                        <div className={`flex items-center space-x-4 rounded-xl border p-4 transition-all cursor-pointer ${reportType === 'employee' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="employee" id="employee" className="border-indigo-600 text-indigo-600" />
                            <Label htmlFor="employee" className="flex-1 cursor-pointer">
                                <span className="font-semibold text-foreground block">Employee Performance</span>
                                <span className="text-xs text-muted-foreground">Sales targets, attendance, and commission data.</span>
                            </Label>
                            <Calendar className={`h-5 w-5 ${reportType === 'employee' ? 'text-indigo-600' : 'text-slate-400'}`} />
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter className="p-6 pt-0 bg-background">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="mr-2">Cancel</Button>
                    <Button onClick={handleDownload} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Download PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
