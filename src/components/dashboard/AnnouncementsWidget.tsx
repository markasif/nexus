import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Bell } from "lucide-react";
import { useAnnouncements } from "@/hooks/useAnnouncements";

export function AnnouncementsWidget() {
    const { announcements, loading } = useAnnouncements();

    // Filter only active announcements for employees if needed, 
    // currently DB policy handles it, or we filter in Hook.
    // Assuming hook returns relevant ones.

    return (
        <Card className="h-full flex flex-col animate-slide-up border-l-4 border-l-nexus-primary">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-nexus-primary" />
                    Announcements
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-[250px] pr-4">
                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Checking for updates...</p>
                        ) : announcements.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <Bell className="h-8 w-8 mb-2 opacity-20" />
                                <p>No new announcements.</p>
                            </div>
                        ) : (
                            announcements.map((item) => (
                                <div key={item.id} className="relative pl-4 border-l-2 border-border pb-1 last:pb-0">
                                    <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-nexus-primary ring-4 ring-background" />
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-semibold">{item.title}</h4>
                                        <span className="text-[10px] text-muted-foreground">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {item.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
