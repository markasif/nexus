import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Loader2, Send } from "lucide-react";
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        Request Leave
                    </DialogTitle>
                    <DialogDescription>
                        Submit a leave request for admin approval.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="type">Leave Type</Label>
                        <select
                            id="type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="vacation">Vacation</option>
                            <option value="sick">Sick Leave</option>
                            <option value="personal">Personal</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start">Start Date</Label>
                            <Input
                                id="start"
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end">End Date</Label>
                            <Input
                                id="end"
                                type="date"
                                required
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="Briefly describe why you are requesting leave..."
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="min-h-[100px]"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
