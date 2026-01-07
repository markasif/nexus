import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  UserPlus,
  Package,
  Activity,
  BarChart3,
  List
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { Lead } from '@/types/crm';
import { CreateLeadDialog } from '@/components/crm/CreateLeadDialog';
import { LeadDetailsDialog } from '@/components/crm/LeadDetailsDialog';
import { CRMSettingsDialog } from '@/components/crm/CRMSettingsDialog';
import { CheckStockDialog } from '@/components/crm/CheckStockDialog';
import { CRMAnalytics } from '@/components/crm/CRMAnalytics';
import { CRMLeaderboard } from '@/components/crm/CRMLeaderboard';
import { CRMActivityFeed } from '@/components/crm/CRMActivityFeed';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';
import { CRMKanbanBoard } from '@/components/crm/CRMKanbanBoard';
import { supabase } from '@/lib/supabase'; // Assuming supabase is imported or available

const stageColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "nexus" | "warning" | "success"> = {
  new: 'default',
  qualified: 'secondary',
  proposal: 'secondary',
  negotiation: 'warning',
  pending_verification: 'warning',
  'closed-won': 'success',
  'closed-lost': 'destructive',
};

export default function CRM() {
  const { user, isLoading: isAuthLoading } = useAuth(); // Renamed to avoid checking conflict if any
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [localLeads, setLocalLeads] = useState<Lead[]>([]); // Renamed to avoid conflict with useLeads
  const [localLoading, setLocalLoading] = useState(true); // Renamed to avoid conflict with useLeads

  // Derived state is immediate and prevents flash
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const { leads, loading, employees, assignLead, updateStatus, fetchLeads } = useLeads();

  // Effect only needed if we have other side effects, unrelated to role check
  useEffect(() => {
    // No-op for role check now
  }, [user]);

  // Prevent rendering until we know the user's role
  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-nexus-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Verifying Access...</p>
        </div>
      </div>
    );
  }

  const [isCheckStockOpen, setIsCheckStockOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleOpenReference = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const renderMobileWarning = () => (
    <div className="md:hidden p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
      <p className="font-bold">Desktop Recommended</p>
      <p>Advanced dashboard features are best viewed on a larger screen.</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <ScrollReveal width="100%">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{isAdmin ? 'Global CRM' : 'My Leads'}</h1>
              <p className="text-muted-foreground">
                {isAdmin
                  ? 'Master control for leads, deals, and pipeline distribution'
                  : 'Track and manage your assigned sales pipeline'}
              </p>
            </div>
            <div className="flex gap-3 items-center">
              {/* Secondary Actions Group */}
              <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border border-border/40 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCheckStockOpen(true)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Package className="mr-2 h-4 w-4" /> Check Stock
                </Button>


              </div>

              {/* Primary Action */}
              <CreateLeadDialog onLeadCreated={fetchLeads} />

              <CheckStockDialog
                open={isCheckStockOpen}
                onOpenChange={setIsCheckStockOpen}
              />

              <LeadDetailsDialog
                lead={selectedLead}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUpdate={fetchLeads}
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Admin Pro View with Tabs */}
        {isAdmin ? (
          <ScrollReveal width="100%">
            <Tabs defaultValue="pipeline" className="space-y-6">
              <div className="flex items-center justify-between h-10">
                <TabsList className="bg-white border h-10">
                  <TabsTrigger value="pipeline" className="h-9"><List className="h-4 w-4 mr-2" /> Pipeline</TabsTrigger>
                  <TabsTrigger value="analytics" className="h-9"><BarChart3 className="h-4 w-4 mr-2" /> Analytics & Insights</TabsTrigger>
                </TabsList>
                <div className="flex items-center h-10">
                  <CRMSettingsDialog />
                </div>
              </div>

              <TabsContent value="pipeline" className="space-y-6">
                {/* Standard Pipeline View */}
                {/* Pipeline Analytics (Basic) */}
                {!loading && (
                  <div className="grid gap-4 sm:grid-cols-5">
                    {['new', 'qualified', 'proposal', 'negotiation', 'closed-won'].map((stage) => {
                      const stageLeads = leads.filter((l) => l.status === stage);
                      const count = stageLeads.length;
                      const value = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);
                      return (
                        <Card key={stage} className="text-center hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <Badge variant={stageColors[stage] as any} className="mb-2 capitalize">
                              {stage}
                            </Badge>
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground">
                              ${value.toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Leads List - Takes up 2/3 */}
                  <div className="lg:col-span-2 h-[600px]">
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center justify-between flex-none">
                        <CardTitle>Active Leads</CardTitle>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search leads..."
                            className="pl-9 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 min-h-0 p-0">
                        {loading ? (
                          <div className="text-center py-8 text-muted-foreground">Loading pipeline...</div>
                        ) : leads.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">No leads found. Create one to get started!</div>
                        ) : (
                          <ScrollArea className="h-full">
                            <div className="space-y-4 p-6 pt-0">
                              {leads.filter(lead =>
                                lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
                              ).map((lead) => (
                                <div
                                  key={lead.id}
                                  className="flex flex-col gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 cursor-pointer hover:underline" onClick={() => handleOpenReference(lead)}>
                                      <h3 className="font-semibold text-lg text-nexus-dark">{lead.name}</h3>
                                      <Badge variant={stageColors[lead.status] as any} className="capitalize">
                                        {lead.status}
                                      </Badge>
                                      {!lead.assigned_to && (
                                        <Badge variant="destructive" className="animate-pulse">Unassigned</Badge>
                                      )}
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {lead.company || 'Individual'} · {lead.profiles?.full_name ? `Assigned to ${lead.profiles.full_name}` : 'No Agent'}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                      {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                      <p className="text-lg font-bold text-foreground">${lead.value?.toLocaleString() || 0}</p>
                                    </div>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSub>
                                          <DropdownMenuItem onClick={() => handleOpenReference(lead)}>
                                            <List className="h-4 w-4 mr-2" /> View Details & Products
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuSubTrigger><Activity className="h-4 w-4 mr-2" /> Update Status</DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent>
                                            <DropdownMenuRadioGroup value={lead.status} onValueChange={(val) => updateStatus(lead.id, val)}>
                                              {Object.keys(stageColors).map(status => (
                                                <DropdownMenuRadioItem key={status} value={status} className="capitalize">{status}</DropdownMenuRadioItem>
                                              ))}
                                            </DropdownMenuRadioGroup>
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSub>
                                          <DropdownMenuSubTrigger><UserPlus className="h-4 w-4 mr-2" /> Reassign Agent</DropdownMenuSubTrigger>
                                          <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                                            <DropdownMenuRadioGroup value={lead.assigned_to} onValueChange={(val) => assignLead(lead.id, val)}>
                                              {employees.map(emp => (
                                                <DropdownMenuRadioItem key={emp.id} value={emp.id}>{emp.full_name}</DropdownMenuRadioItem>
                                              ))}
                                            </DropdownMenuRadioGroup>
                                          </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Activity Feed - Side Panel */}
                  <div className="h-[600px]">
                    <CRMActivityFeed />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {renderMobileWarning()}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Chart Area */}
                  <div className="lg:col-span-2 space-y-6">
                    <CRMAnalytics />
                  </div>
                  {/* Leaderboard Area */}
                  <div>
                    <CRMLeaderboard />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollReveal>
        ) : (
          // Simple Employee View
          <ScrollReveal width="100%">
            <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">My Pipeline</h2>
                  <Badge variant="secondary" className="px-2 py-0.5 h-6">
                    {leads.length} Leads
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchLeads()} className="h-9">
                  <Activity className="h-4 w-4 mr-2" /> Refresh Board
                </Button>
              </div>

              <div className="flex-1 min-h-0 border rounded-xl bg-background/50 backdrop-blur-sm overflow-hidden">
                <CRMKanbanBoard
                  leads={leads}
                  onUpdateStatus={updateStatus}
                  onRefresh={fetchLeads}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </ScrollReveal>

        )}
      </div>
    </DashboardLayout >
  );
}
