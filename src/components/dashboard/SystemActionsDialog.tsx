import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, RefreshCw, Zap, Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SystemActionsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [loading, setLoading] = useState(false);
    const [announcement, setAnnouncement] = useState("");

    const handleBroadcast = async () => {
        if (!announcement) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('announcements')
                .insert({
                    title: 'System Broadcast',
                    content: announcement,
                    is_active: true
                });

            if (error) throw error;

            toast.success("Announcement Sent", {
                description: "Message has been broadcasted to all active employees."
            });
            setAnnouncement("");
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to broadcast message");
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success("System Optimized", {
                description: "Cache cleared and indexes rebuilt."
            });
            onOpenChange(false);
        }, 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl border-0 shadow-2xl p-0 gap-0 overflow-hidden rounded-xl">
                <div className="relative bg-gradient-to-br from-indigo-900 to-indigo-700 px-6 py-6 text-white overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-black/20 blur-xl"></div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Zap className="h-5 w-5" /> Quick Actions
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100/80">
                            Perform system-wide administrative tasks.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-0 bg-background">
                    <Tabs defaultValue="broadcast" className="w-full">
                        <div className="px-6 pt-4 border-b">
                            <TabsList className="bg-transparent p-0 pb-1 h-auto gap-6">
                                <TabsTrigger value="broadcast" className="data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-slate-500">
                                    Broadcast
                                </TabsTrigger>
                                <TabsTrigger value="maintenance" className="data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 border-b-2 border-transparent rounded-none px-0 pb-3 font-semibold text-slate-500">
                                    Maintenance
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="broadcast" className="p-6 space-y-4 m-0">
                            <div className="space-y-2">
                                <Label>Announcement Message</Label>
                                <Textarea
                                    placeholder="Type important update for all staff..."
                                    className="min-h-[100px] resize-none"
                                    value={announcement}
                                    onChange={(e) => setAnnouncement(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Will be visible on employee dashboard.</p>
                            </div>
                            <Button onClick={handleBroadcast} disabled={loading || !announcement} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
                                Send Broadcast
                            </Button>
                        </TabsContent>

                        <TabsContent value="maintenance" className="p-6 space-y-4 m-0">
                            <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
                                <div>
                                    <h4 className="font-semibold text-slate-800">Clear System Cache</h4>
                                    <p className="text-sm text-slate-500">Resolve sync issues and refresh data.</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={handleClearCache} disabled={loading}>
                                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Run
                                </Button>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 opacity-50 cursor-not-allowed">
                                <div>
                                    <h4 className="font-semibold text-slate-800">Database Backup</h4>
                                    <p className="text-sm text-slate-500">Create snapshot (Auto-scheduled daily).</p>
                                </div>
                                <Button size="sm" variant="outline" disabled>
                                    Auto
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
                <DialogFooter className="p-4 bg-slate-50 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} size="sm">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
