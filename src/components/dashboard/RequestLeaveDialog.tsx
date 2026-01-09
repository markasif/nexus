import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Loader2, Send, FilePlus, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function RequestLeaveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: "casual",
        startDate: "",
        endDate: "",
        reason: ""
    });

    // Calculate days
    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 1;
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 1;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!user) throw new Error("Not authenticated");

            const days = calculateDays(formData.startDate, formData.endDate);

            const { error } = await supabase
                .from('leaves')
                .insert({
                    employee_id: user.id,
                    type: formData.type,
                    start_date: formData.startDate,
                    end_date: formData.endDate,
                    reason: formData.reason,
                    status: 'pending',
                    days: days
                });

            if (error) throw error;

            toast({
                title: "Request Sent",
                description: `Your request for ${days} day(s) has been submitted.`,
                variant: "default",
            });

            onOpenChange(false);
            setFormData({ type: "casual", startDate: "", endDate: "", reason: "" });

        } catch (error: any) {
            console.error("Error submitting leave:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit request",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed left-[5vw] top-[40%] z-[200] grid w-[90vw] translate-x-0 gap-0 border-0 p-0 shadow-2xl overflow-hidden rounded-xl bg-background outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-[5%] data-[state=closed]:slide-out-to-top-[30%] data-[state=open]:slide-in-from-left-[5%] data-[state=open]:slide-in-from-top-[30%] max-h-[60vh] overflow-y-auto sm:fixed sm:left-[50%] sm:top-[50%] sm:z-50 sm:grid sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:gap-4 sm:border-0 sm:bg-background sm:p-0 sm:shadow-2xl sm:duration-200 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%] sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl sm:max-h-none sm:overflow-visible">
                {/* Premium Header */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-nexus-secondary/20 blur-lg"></div>

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
                                <FilePlus className="h-5 w-5 text-white" />
                            </div>
                            <span className="tracking-tight">Request Leave</span>
                        </DialogTitle>
                        <DialogDescription className="text-nexus-light/90 pt-1 text-base font-medium text-blue-100">
                            Submit a new time-off request for review.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-background">


                    <div className="space-y-2">
                        <Label htmlFor="type" className="text-sm font-medium text-foreground/80">Leave Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                            <SelectTrigger className="w-full h-10 bg-card border-input">
                                <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                            <SelectContent className="z-[300]">
                                <SelectItem value="casual">Casual Leave</SelectItem>
                                <SelectItem value="sick">Sick Leave</SelectItem>
                                <SelectItem value="privilege">Privilege Leave</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="start" className="text-sm font-medium text-foreground/80">Start Date</Label>

                            {/* Mobile Date Picker (Overlay) */}
                            <div className="relative h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-primary/20 sm:hidden">
                                <div className="flex items-center gap-2 h-full text-muted-foreground">
                                    <CalendarIcon className="h-4 w-4 shrink-0" />
                                    <span className={formData.startDate ? "text-foreground" : ""}>
                                        {formData.startDate || "Select date"}
                                    </span>
                                </div>
                                <Input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                                />
                            </div>

                            {/* Desktop Date Picker (Standard) */}
                            <div className="relative hidden sm:block">
                                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="start"
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    onClick={(e) => e.currentTarget.showPicker()}
                                    className="pl-9 bg-card border-input focus-visible:ring-primary/20 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end" className="text-sm font-medium text-foreground/80">End Date</Label>

                            {/* Mobile Date Picker (Overlay) */}
                            <div className="relative h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-primary/20 sm:hidden">
                                <div className="flex items-center gap-2 h-full text-muted-foreground">
                                    <CalendarIcon className="h-4 w-4 shrink-0" />
                                    <span className={formData.endDate ? "text-foreground" : ""}>
                                        {formData.endDate || "Select date"}
                                    </span>
                                </div>
                                <Input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                                />
                            </div>

                            {/* Desktop Date Picker (Standard) */}
                            <div className="relative hidden sm:block">
                                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                <Input
                                    id="end"
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    onClick={(e) => e.currentTarget.showPicker()}
                                    className="pl-9 bg-card border-input focus-visible:ring-primary/20 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-medium text-foreground/80">Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="Briefly describe why you are requesting leave..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="min-h-[100px] resize-none bg-card border-input focus-visible:ring-primary/20 rounded-lg"
                            required
                        />
                    </div>

                    <DialogFooter className="pt-2 gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-lg h-11">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="rounded-lg h-11 px-6 shadow-lg shadow-primary/20">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
