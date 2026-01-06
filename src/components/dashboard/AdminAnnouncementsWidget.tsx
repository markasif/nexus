import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { Megaphone, Send, Trash2 } from "lucide-react";

export function AdminAnnouncementsWidget() {
    const { announcements, addAnnouncement, deleteAnnouncement, loading } = useAnnouncements();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsPublishing(true);
        const success = await addAnnouncement(title, content);
        setIsPublishing(false);

        if (success) {
            setTitle("");
            setContent("");
        }
    };

    return (
        <Card className="h-full flex flex-col animate-slide-up">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Company Announcements
                </CardTitle>
                <CardDescription>Broadcast updates to all employee dashboards.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                {/* Create Form */}
                <form onSubmit={handlePublish} className="space-y-4 rounded-lg border bg-muted/40 p-4 h-full">
                    <div className="space-y-2">
                        <Input
                            placeholder="Announcement Title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="bg-background"
                        />
                        <Textarea
                            placeholder="Write your message here..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="bg-background min-h-[80px]"
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={isPublishing}>
                            <Send className="mr-2 h-4 w-4" />
                            {isPublishing ? "Publishing..." : "Publish Now"}
                        </Button>
                    </div>
                </form>

                {/* History List */}
                <div className="border rounded-md bg-background flex flex-col">
                    <div className="p-3 border-b bg-muted/40">
                        <h4 className="text-sm font-semibold">Recent Broadcasts</h4>
                    </div>
                    <ScrollArea className="h-[200px]">
                        <div className="divide-y">
                            {announcements.map((item) => (
                                <div key={item.id} className="p-3 flex items-start justify-between group hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{item.title}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{item.content}</p>
                                        <p className="text-[10px] text-muted-foreground/70">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                                        onClick={() => deleteAnnouncement(item.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    );
}
