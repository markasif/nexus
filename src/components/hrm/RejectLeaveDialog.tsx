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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface RejectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leaveId: string;
    onSuccess: () => void;
}

export function RejectLeaveDialog({ open, onOpenChange, leaveId, onSuccess }: RejectDialogProps) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleReject = async () => {
        if (!reason.trim()) {
            toast({ title: "Reason Required", description: "Please provide a reason for rejection.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('leaves')
                .update({
                    status: 'rejected',
                    admin_note: reason
                })
                .eq('id', leaveId);

            if (error) throw error;

            toast({ title: "Leave Rejected", description: "The request has been rejected." });
            onSuccess();
            onOpenChange(false);
            setReason("");
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] overflow-hidden p-0 gap-0 border-0 shadow-2xl">
                {/* Premium Header with Warning Gradient */}
                <div className="relative bg-gradient-to-br from-red-600 to-red-400 px-6 py-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-black/10 blur-xl"></div>

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
                                <XCircle className="h-5 w-5 text-white" />
                            </div>
                            <span className="tracking-tight">Reject Request</span>
                        </DialogTitle>
                        <DialogDescription className="text-white/90 pt-1 text-base font-medium">
                            Provide a reason for rejecting this leave request.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="px-6 py-6 space-y-5 bg-background">
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                            Rejection Reason
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g. Critical project deadline conflicts with these dates..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[120px] border-gray-200 bg-gray-50/50 focus:bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all font-medium placeholder:text-muted-foreground/40 resize-none"
                        />
                    </div>
                </div>
                <DialogFooter className="px-6 pb-6 pt-2">
                    <div className="flex w-full gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1 h-11 border-gray-200 hover:bg-gray-50">
                            Cancel
                        </Button>
                        <Button onClick={handleReject} disabled={loading} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 transition-all">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Confirm Rejection"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
