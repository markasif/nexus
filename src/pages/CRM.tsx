import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const leads = [
  {
    id: 1,
    name: 'Acme Corporation',
    contact: 'John Smith',
    email: 'john@acme.com',
    phone: '+1 555-0123',
    stage: 'qualified',
    value: 45000,
    assignee: 'James Cooper',
    lastContact: '2 days ago',
  },
  {
    id: 2,
    name: 'Tech Solutions Inc',
    contact: 'Sarah Johnson',
    email: 'sarah@techsol.com',
    phone: '+1 555-0456',
    stage: 'proposal',
    value: 72000,
    assignee: 'James Cooper',
    lastContact: '1 day ago',
  },
  {
    id: 3,
    name: 'Global Industries',
    contact: 'Mike Brown',
    email: 'mike@global.com',
    phone: '+1 555-0789',
    stage: 'negotiation',
    value: 120000,
    assignee: 'Emily Chen',
    lastContact: 'Today',
  },
  {
    id: 4,
    name: 'StartUp Hub',
    contact: 'Lisa Wang',
    email: 'lisa@startup.com',
    phone: '+1 555-0321',
    stage: 'new',
    value: 28000,
    assignee: 'James Cooper',
    lastContact: '5 days ago',
  },
  {
    id: 5,
    name: 'Enterprise Co',
    contact: 'David Lee',
    email: 'david@enterprise.com',
    phone: '+1 555-0654',
    stage: 'closed-won',
    value: 95000,
    assignee: 'Michael Ross',
    lastContact: '1 week ago',
  },
];

const stageColors: Record<string, 'muted' | 'nexus' | 'warning' | 'success' | 'default'> = {
  new: 'muted',
  qualified: 'nexus',
  proposal: 'default',
  negotiation: 'warning',
  'closed-won': 'success',
};

const stageLabels: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  'closed-won': 'Closed Won',
};

export default function CRM() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Filter leads for employees
  const displayLeads = isAdmin
    ? leads
    : leads.filter((lead) => lead.assignee === 'James Cooper');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{isAdmin ? 'CRM' : 'My Leads'}</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? 'Manage leads, deals, and sales pipeline'
                : 'Track and manage your assigned leads'}
            </p>
          </div>
          <Button variant="nexus">
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </div>

        {/* Pipeline Stats */}
        <div className="grid gap-4 sm:grid-cols-5">
          {['new', 'qualified', 'proposal', 'negotiation', 'closed-won'].map((stage) => {
            const count = displayLeads.filter((l) => l.stage === stage).length;
            const value = displayLeads
              .filter((l) => l.stage === stage)
              .reduce((sum, l) => sum + l.value, 0);
            return (
              <Card key={stage} variant="interactive" className="text-center">
                <CardContent className="p-4">
                  <Badge variant={stageColors[stage]} className="mb-2">
                    {stageLabels[stage]}
                  </Badge>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">
                    ${value.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Leads List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Leads</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search leads..." className="pl-9 w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col gap-4 rounded-xl border border-border p-4 transition-all hover:border-primary/20 hover:shadow-card sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{lead.name}</h3>
                      <Badge variant={stageColors[lead.stage]}>
                        {stageLabels[lead.stage]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lead.contact} · {isAdmin && `Assigned to ${lead.assignee}`}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {lead.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {lead.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {lead.lastContact}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold">${lead.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Deal Value</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
