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
import { useAuth } from '@/contexts/AuthContext';
import { useLeads, Lead } from '@/hooks/useLeads';
import { CreateLeadDialog } from '@/components/crm/CreateLeadDialog';
import { CRMSettingsDialog } from '@/components/crm/CRMSettingsDialog';
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

const stageColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "nexus" | "warning" | "success"> = {
  new: 'secondary',
  qualified: 'nexus',
  proposal: 'default',
  negotiation: 'warning',
  'closed-won': 'success',
  'closed-lost': 'destructive'
};

export default function CRM() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { leads, loading, employees, assignLead, updateStatus, fetchLeads } = useLeads();

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isAdmin ? 'Global CRM' : 'My Leads'}</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? 'Master control for leads, deals, and pipeline distribution'
                : 'Track and manage your assigned sales pipeline'}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Feature: Inventory Visibility Sync */}
            <Link to="/inventory">
              <Button variant="outline" size="sm">
                <Package className="mr-2 h-4 w-4" /> Check Stock
              </Button>
            </Link>

            {isAdmin && <CRMSettingsDialog />}

            <CreateLeadDialog onLeadCreated={fetchLeads} />
          </div>
        </div>

        {/* Admin Pro View with Tabs */}
        {isAdmin ? (
          <Tabs defaultValue="pipeline" className="space-y-6">
            <TabsList className="bg-white border">
              <TabsTrigger value="pipeline"><List className="h-4 w-4 mr-2" /> Pipeline</TabsTrigger>
              <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-2" /> Analytics & Insights</TabsTrigger>
            </TabsList>

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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
                {/* Leads List - Takes up 2/3 */}
                <div className="lg:col-span-2 h-full">
                  <Card className="h-full flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between flex-none">
                      <CardTitle>Active Leads</CardTitle>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search leads..." className="pl-9 w-64" />
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
                            {leads.map((lead) => (
                              <div
                                key={lead.id}
                                className="flex flex-col gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-lg">{lead.name}</h3>
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
                <div className="h-full">
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
        ) : (
          // Simple Employee View
          <div className="space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Assigned Leads</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search leads..." className="pl-9 w-64" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="flex flex-col gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/20 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <Badge variant={stageColors[lead.status] as any} className="capitalize">{lead.status}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{lead.company}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block"><p className="text-lg font-bold">${lead.value?.toLocaleString() || 0}</p></div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Update Status</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={lead.status} onValueChange={(val) => updateStatus(lead.id, val)}>
                                  {Object.keys(stageColors).map(status => (
                                    <DropdownMenuRadioItem key={status} value={status} className="capitalize">{status}</DropdownMenuRadioItem>
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
