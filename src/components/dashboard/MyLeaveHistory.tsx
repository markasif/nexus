import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, ChevronRight, History } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AllLeaveRequestsDialog } from "./AllLeaveRequestsDialog";

export function MyLeaveHistory() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAllDialog, setShowAllDialog] = useState(false);

    useEffect(() => {
        if (!user) return;

        async function fetchLeaves() {
            const { data, error } = await supabase
                .from('leaves')
                .select('*')
                .eq('employee_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!error && data) {
                setLeaves(data);
            }
            setLoading(false);
        }

        fetchLeaves();
    }, [user]);

    if (loading) return <div className="text-sm text-muted-foreground">Loading history...</div>;

    if (leaves.length === 0) return (
        <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Recent Requests
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50 text-sm">
                    <Calendar className="h-10 w-10 mb-2 opacity-20" />
                    No leave requests found.
                </div>
            </CardContent>
        </Card>
    );

    return (
        <>
            <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 border-b border-border/40 bg-secondary/10">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" />
                            Recent Requests
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-normal">
                            Last 5 Items
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0">
                    <ScrollArea className="h-[250px]">
                        <div className="divide-y divide-border/50">
                            {leaves.map((leave) => (
                                <div key={leave.id} className="p-4 hover:bg-secondary/20 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    leave.status === 'approved' ? 'success' :
                                                        leave.status === 'rejected' ? 'destructive' : 'secondary'
                                                } className="uppercase text-[10px] h-5 px-1.5">
                                                    {leave.status}
                                                </Badge>
                                                <span className="text-sm font-medium capitalize text-foreground/90">{leave.type}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                            </p>

                                            {/* Rejection Reason display */}
                                            {leave.status === 'rejected' && leave.admin_note && (
                                                <div className="mt-2 bg-red-50 text-red-600 text-xs p-2 rounded-md flex items-start gap-2 border border-red-100">
                                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                    <span>
                                                        <span className="font-semibold block mb-0.5">Reason:</span>
                                                        {leave.admin_note}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-3 border-t bg-secondary/5">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-between"
                        onClick={() => setShowAllDialog(true)}
                    >
                        View Full History
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                </CardFooter>
            </Card>

            <AllLeaveRequestsDialog open={showAllDialog} onOpenChange={setShowAllDialog} />
        </>
    );
}
