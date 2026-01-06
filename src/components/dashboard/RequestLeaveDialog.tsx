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

export function RequestLeaveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: "vacation",
        startDate: "",
        endDate: "",
        reason: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from('leaves')
                .insert({
                    employee_id: user.id,
                    type: formData.type,
                    start_date: formData.startDate,
                    end_date: formData.endDate,
                    reason: formData.reason,
                    status: 'pending'
                });

            if (error) throw error;

            toast({
                title: "Request Sent",
                description: "Your leave request has been submitted for approval.",
                variant: "default",
            });

            onOpenChange(false);
            setFormData({ type: "vacation", startDate: "", endDate: "", reason: "" });

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
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0 border-0 shadow-2xl">
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
                        <select
                            id="type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        >
                            <option value="vacation">Vacation</option>
                            <option value="sick">Sick Leave</option>
                            <option value="personal">Personal</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="start" className="text-sm font-medium text-foreground/80">Start Date</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="start"
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="pl-9 bg-card border-input focus-visible:ring-primary/20 rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end" className="text-sm font-medium text-foreground/80">End Date</Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="end"
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="pl-9 bg-card border-input focus-visible:ring-primary/20 rounded-lg"
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
