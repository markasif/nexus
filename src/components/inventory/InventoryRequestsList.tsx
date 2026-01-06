import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { AlertTriangle, Box, CheckCircle2, XCircle, User, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Request {
    id: string;
    sku: string;
    request_type: 'restock' | 'issue';
    status: 'pending' | 'resolved' | 'dismissed';
    note: string;
    created_at: string;
    user_id: string;
    inventory: { name: string; category: string } | null;
    profiles: { full_name: string } | null;
}

export function InventoryRequestsList() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        // 1. Fetch requests
        const { data: requestsData, error: requestError } = await supabase
            .from('inventory_requests')
            .select(`
                *,
                inventory (name, category)
            `)
            .order('created_at', { ascending: false });

        if (requestError) {
            console.error(requestError);
            toast.error("Failed to load requests");
            setLoading(false);
            return;
        }

        // 2. Extract user IDs
        const userIds = Array.from(new Set(requestsData.map((r: any) => r.user_id).filter(Boolean)));

        // 3. Fetch profiles manually
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds);

            if (profilesData) {
                profilesMap = profilesData.reduce((acc: any, profile: any) => {
                    acc[profile.id] = profile;
                    return acc;
                }, {});
            }
        }

        // 4. Merge data
        const mergedRequests = requestsData.map((r: any) => ({
            ...r,
            profiles: profilesMap[r.user_id] || { full_name: 'Unknown User' }
        }));

        setRequests(mergedRequests);
        setLoading(false);
    };

    const handleUpdateStatus = async (id: string, newStatus: 'resolved' | 'dismissed') => {
        const { error } = await supabase
            .from('inventory_requests')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            toast.error("Failed to update status");
        } else {
            toast.success(`Request marked as ${newStatus}`);
            fetchRequests();
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const historyRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="space-y-6">
            {/* Pending Requests Section */}
            <Card className="border-l-4 border-l-blue-500 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        Pending Requests
                        {pendingRequests.length > 0 &&
                            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">{pendingRequests.length}</Badge>
                        }
                    </CardTitle>
                    <CardDescription>New restock requests and issue reports requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic">No pending requests</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Requested By</TableHead>
                                    <TableHead>Note</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingRequests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            {req.request_type === 'restock' ? (
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 flex w-fit gap-1">
                                                    <Box className="h-3 w-3" /> Restock
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0 flex w-fit gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> Issue
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {req.inventory?.name || req.sku}
                                            <div className="text-xs text-muted-foreground">{req.inventory?.category}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <User className="h-3 w-3 text-gray-500" />
                                                </div>
                                                <span className="text-sm">{req.profiles?.full_name || 'Unknown'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-muted-foreground" title={req.note}>
                                            {req.note || '-'}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(req.created_at), 'MMM d, h:mm a')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus(req.id, 'dismissed')} title="Dismiss">
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-500 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdateStatus(req.id, 'resolved')} title="Mark Resolved">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* History Section */}
            {historyRequests.length > 0 && (
                <div className="opacity-80">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider ml-1">Request History</h3>
                    <ScrollArea className="h-[300px] rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>By</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {historyRequests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <span className={req.request_type === 'restock' ? 'text-blue-600 text-xs font-semibold' : 'text-orange-600 text-xs font-semibold'}>
                                                {req.request_type.toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm">{req.inventory?.name}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{req.profiles?.full_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={req.status === 'resolved' ? 'text-green-600 border-green-200 bg-green-50' : 'text-gray-500'}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(new Date(req.created_at), 'MMM d, p')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}
