
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Search, AlertCircle, Loader2, FileText, XCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AllLeaveRequestsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AllLeaveRequestsDialog({ open, onOpenChange }: AllLeaveRequestsDialogProps) {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (open && user) {
            fetchLeaves();
        }
    }, [open, user]);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leaves')
                .select('*')
                .eq('employee_id', user?.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setLeaves(data);
            }
        } catch (error) {
            console.error("Error fetching leaves:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeaves = leaves.filter(leave =>
        leave.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden gap-0 border-0 shadow-2xl">
                {/* Premium Header */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <span className="tracking-tight">Request History</span>
                        </DialogTitle>
                        <DialogDescription className="text-nexus-light/90 pt-1 text-base font-medium text-blue-100">
                            A complete history of your leave applications.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Search */}
                <div className="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by type or reason..."
                            className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="bg-background min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Loading records...</p>
                        </div>
                    ) : filteredLeaves.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-2">
                            <FileText className="h-10 w-10 opacity-20" />
                            <p>No records found.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[500px] p-2">
                            <div className="space-y-2 p-2">
                                {filteredLeaves.map((leave) => (
                                    <div key={leave.id} className="group flex flex-col sm:flex-row sm:items-start justify-between p-4 rounded-xl border border-transparent hover:border-border hover:bg-secondary/30 transition-all">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    leave.status === 'approved' ? 'success' :
                                                        leave.status === 'rejected' ? 'destructive' : 'secondary'
                                                } className="uppercase text-[10px] h-5 px-2">
                                                    {leave.status}
                                                </Badge>
                                                <span className="font-semibold text-base capitalize">{leave.type}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>
                                                    {new Date(leave.start_date).toLocaleDateString()}
                                                    <span className="mx-1">→</span>
                                                    {new Date(leave.end_date).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-foreground/70">
                                                    {(new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 3600 * 24) + 1} days
                                                </span>
                                            </div>

                                            {leave.reason && (
                                                <p className="text-sm text-foreground/80 leading-relaxed max-w-md pt-1">
                                                    "{leave.reason}"
                                                </p>
                                            )}
                                        </div>

                                        {/* Status Icon / Info */}
                                        <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-col items-end gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                Requested on {new Date(leave.created_at).toLocaleDateString()}
                                            </span>

                                            {leave.status === 'rejected' && leave.admin_note && (
                                                <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg flex items-start gap-2 max-w-[200px]">
                                                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                    <span>
                                                        <span className="font-semibold block mb-0.5">Note:</span>
                                                        {leave.admin_note}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
