import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ReportIssueDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sku: string;
    productName: string;
    onSuccess?: () => void;
}

export function ReportIssueDialog({ open, onOpenChange, sku, productName, onSuccess }: ReportIssueDialogProps) {
    const { user } = useAuth();
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!note.trim()) {
            toast.error("Please describe the issue.");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('inventory_requests')
                .insert({
                    sku,
                    user_id: user?.id,
                    request_type: 'issue',
                    note: note.trim(),
                    status: 'pending'
                });

            if (error) throw error;

            toast.success("Issue reported successfully.");
            setNote("");
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Error reporting issue:", error);
            toast.error("Failed to report issue.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden [&>button]:text-white [&>button]:opacity-70 [&>button]:hover:opacity-100 [&>button]:hover:text-white">
                <div className="relative bg-gradient-to-br from-orange-600 to-red-600 px-6 py-6 text-white shrink-0 mb-4">
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                            <AlertTriangle className="h-5 w-5" />
                            Report Issue
                        </DialogTitle>
                        <DialogDescription className="text-white/80">
                            Flag a problem with {productName}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="grid gap-4 px-6 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="issue-note">Description</Label>
                        <Textarea
                            id="issue-note"
                            placeholder="e.g. Broken packaging, expired, missing components..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="resize-none h-32"
                        />
                    </div>
                </div>

                <DialogFooter className="px-6 pb-6">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
