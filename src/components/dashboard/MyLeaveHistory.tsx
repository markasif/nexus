import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function MyLeaveHistory() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Leave History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground/50 text-sm">
                    <Calendar className="h-8 w-8 mb-2 opacity-20" />
                    No leave requests found.
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">Recent Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {leaves.map((leave) => (
                    <div key={leave.id} className="flex items-start justify-between border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant={
                                    leave.status === 'approved' ? 'success' :
                                        leave.status === 'rejected' ? 'destructive' : 'secondary'
                                } className="uppercase text-[10px] h-5">
                                    {leave.status}
                                </Badge>
                                <span className="text-sm font-medium capitalize">{leave.type}</span>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                            </p>

                            {/* Rejection Reason display */}
                            {leave.status === 'rejected' && leave.admin_note && (
                                <div className="mt-2 bg-red-50 text-red-600 text-xs p-2 rounded-md flex items-start gap-2">
                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                    <span>
                                        <span className="font-semibold block mb-0.5">Rejection Reason:</span>
                                        {leave.admin_note}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
