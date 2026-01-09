import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLeads } from "@/hooks/useLeads";
import { ChevronRight, Target, Phone, Mail, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stageColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "nexus" | "warning" | "success"> = {
    new: 'secondary',
    qualified: 'nexus',
    proposal: 'default',
    negotiation: 'warning',
    'closed-won': 'success',
    'closed-lost': 'destructive'
};

import { Link } from "react-router-dom";

export function MyLeadsWidget() {
    const { leads, loading } = useLeads();

    // Filter for active leads (excluding closed ones if desired, or just show all)
    // Showing all for now sorted by recent
    const recentLeads = leads.slice(0, 5);

    return (
        <Card className="animate-slide-up h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        My Active Leads
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {leads.length} leads assigned to you
                    </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/crm">
                        View All <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-[250px] pr-4">
                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-4 pt-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex flex-col gap-3 rounded-lg border border-border/50 p-3 animate-pulse">
                                        <div className="flex items-center justify-between">
                                            <div className="h-5 w-32 bg-gray-200 rounded" />
                                            <div className="h-5 w-16 bg-gray-100 rounded" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="h-4 w-24 bg-gray-100 rounded" />
                                            <div className="h-4 w-12 bg-gray-100 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentLeads.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No assigned leads yet.</p>
                                <Button variant="link" className="mt-2" asChild>
                                    <Link to="/crm">Explore CRM</Link>
                                </Button>
                            </div>
                        ) : (
                            recentLeads.map((lead) => (
                                <div key={lead.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold">{lead.name}</div>
                                        <Badge variant={stageColors[lead.status] as any} className="capitalize text-xs">
                                            {lead.status}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span className="truncate max-w-[150px]">{lead.company}</span>
                                        <div className="flex items-center gap-1 text-foreground font-medium">
                                            <DollarSign className="h-3 w-3" />
                                            {lead.value?.toLocaleString() || "0"}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-1">
                                        {lead.phone && (
                                            <a href={`tel:${lead.phone}`} className="p-1.5 rounded-md bg-secondary/30 hover:bg-secondary/50 text-foreground transition-colors" title="Call">
                                                <Phone className="h-3 w-3" />
                                            </a>
                                        )}
                                        {lead.email && (
                                            <a href={`mailto:${lead.email}`} className="p-1.5 rounded-md bg-secondary/30 hover:bg-secondary/50 text-foreground transition-colors" title="Email">
                                                <Mail className="h-3 w-3" />
                                            </a>
                                        )}
                                        <div className="ml-auto text-xs text-muted-foreground">
                                            {new Date(lead.last_contact || new Date()).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
