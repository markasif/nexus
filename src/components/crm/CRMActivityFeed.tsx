import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import {
    Activity,
    UserPlus,
    CheckCircle2,
    ArrowRightLeft,
    FileText,
    History
} from "lucide-react";

type Log = {
    id: string;
    details: string;
    action_type: string;
    created_at: string;
    profiles: { full_name: string };
};

const iconMap: Record<string, any> = {
    'CREATED': UserPlus,
    'STATUS_CHANGE': Activity,
    'ASSIGNED': ArrowRightLeft,
    'UPDATED': FileText,
};

const colorMap: Record<string, string> = {
    'CREATED': "text-blue-500 bg-blue-50",
    'STATUS_CHANGE': "text-amber-500 bg-amber-50",
    'ASSIGNED': "text-purple-500 bg-purple-50",
    'UPDATED': "text-gray-500 bg-gray-50",
};

export function CRMActivityFeed() {
    const [logs, setLogs] = useState<Log[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data } = await supabase
                .from('crm_activity_logs')
                .select(`
                    *,
                    profiles:actor_id (full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (data) setLogs(data);
        };
        fetchLogs();
    }, []);

    return (
        <Card className="h-full border-l-4 border-l-nexus-primary/20 shadow-sm flex flex-col">
            <CardHeader className="pb-3 flex-none">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="h-5 w-5 text-muted-foreground" />
                    Activity Feed
                </CardTitle>
                <CardDescription>
                    Recent updates and changes
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 flex-1 min-h-0">
                <ScrollArea className="h-full w-full px-6">
                    <div className="space-y-8 pb-6">
                        {logs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">No recent activity found.</div>
                        ) : logs.map((log) => {
                            const Icon = iconMap[log.action_type] || Activity;
                            const colorClass = colorMap[log.action_type] || "text-gray-500";

                            return (
                                <div key={log.id} className="flex gap-4 relative group">
                                    {/* Connector Line */}
                                    <div className="absolute left-[1.15rem] top-9 bottom-[-2.5rem] w-px bg-gray-200 last:hidden group-hover:bg-nexus-primary/30 transition-colors"></div>

                                    <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm ${colorClass} group-hover:scale-110 transition-transform`}>
                                        <Icon className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 space-y-1 bg-muted/30 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-foreground">
                                                {log.profiles?.full_name || 'System'}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {log.details}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
