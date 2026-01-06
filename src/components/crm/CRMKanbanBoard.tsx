import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/hooks/useLeads";
import { DollarSign, Phone, Mail, AlertCircle, Briefcase, Calendar, User, Clock } from "lucide-react";
import { LeadDetailsDialog } from './LeadDetailsDialog';
import confetti from 'canvas-confetti';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { useMemo, useState } from 'react';

// Column definitions with clearer colors
const columns = [
    { id: 'new', title: 'New Leads', color: 'border-l-4 border-blue-500 bg-blue-100 dark:bg-blue-900/30' },
    { id: 'qualified', title: 'Qualified', color: 'border-l-4 border-purple-500 bg-purple-50/50 dark:bg-purple-900/10' },
    { id: 'proposal', title: 'Proposal', color: 'border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' },
    { id: 'negotiation', title: 'Negotiation', color: 'border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' },
    { id: 'pending_verification', title: 'Pending Approval', color: 'border-l-4 border-orange-500 bg-orange-50/50 dark:bg-orange-900/10' },
    { id: 'closed-won', title: 'Won', color: 'border-l-4 border-green-500 bg-green-50/50 dark:bg-green-900/10' },
];

const statusBorderColors: Record<string, string> = {
    new: 'border-blue-500',
    qualified: 'border-purple-500',
    proposal: 'border-indigo-500',
    negotiation: 'border-yellow-500',
    pending_verification: 'border-orange-500',
    'closed-won': 'border-green-500',
    'closed-lost': 'border-red-500'
};

interface KanbanBoardProps {
    leads: Lead[];
    onUpdateStatus: (id: string, status: string) => Promise<void>;
    onRefresh: () => void;
    isAdmin?: boolean; // New prop to check permissions
}

// -- Sortable Item Component --
function LeadCard({ lead, onClick, isAdmin }: { lead: Lead, onClick: () => void, isAdmin?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id, data: { ...lead } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isStagnant = useMemo(() => {
        const lastUpdate = lead.updated_at ? new Date(lead.updated_at) : new Date(lead.created_at || Date.now());
        const days = differenceInDays(new Date(), lastUpdate);
        return days > 14 && lead.status !== 'closed-won' && lead.status !== 'closed-lost';
    }, [lead]);

    const daysSinceUpdate = differenceInDays(new Date(), new Date(lead.updated_at || lead.created_at || Date.now()));

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
            <Card
                className={`
            cursor-grab active:cursor-grabbing group bg-card shadow-sm hover:shadow-md transition-all duration-200
            ${isStagnant ? 'ring-1 ring-destructive/40' : 'hover:ring-1 hover:ring-primary/20'}
            border-l-[4px] ${statusBorderColors[lead.status] || 'border-border'}
            relative overflow-hidden
        `}
                onClick={onClick}
            >
                {/* Approval Banner for Admins */}
                {lead.status === 'pending_verification' && isAdmin && (
                    <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] font-bold px-3 py-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Request from: {lead.profiles?.full_name || 'Agent'}
                        </span>
                        <Badge variant="outline" className="border-orange-500/50 text-orange-600 h-5 px-1 bg-white/50">
                            Action Needed
                        </Badge>
                    </div>
                )}

                <CardContent className="p-4 pt-3">
                    <div className="flex justify-between items-start mb-2 gap-2">
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {lead.name}
                        </h4>
                        {isStagnant && (
                            <div className="flex-shrink-0 flex items-center text-[10px] text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded-full">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {daysSinceUpdate}d
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">{lead.company || "Individual"}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
                        <Badge variant="outline" className="text-xs font-semibold px-2 py-0 h-6 border-transparent bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                            <DollarSign className="h-3 w-3 mr-0.5" />{lead.value?.toLocaleString()}
                        </Badge>

                        <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()}>
                            {lead.phone && (
                                <a href={`tel:${lead.phone}`} className="h-7 w-7 flex items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm" title="Call">
                                    <Phone className="h-3.5 w-3.5" />
                                </a>
                            )}
                            {lead.email && (
                                <a href={`mailto:${lead.email}`} className="h-7 w-7 flex items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-sm" title="Email">
                                    <Mail className="h-3.5 w-3.5" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 justify-between items-center min-h-[20px]">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(lead.created_at || Date.now()), { addSuffix: true })}
                        </p>

                        {/* Employee View: Status Indicator */}
                        {lead.status === 'pending_verification' && !isAdmin && (
                            <Badge variant="secondary" className="text-[10px] h-5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-200 hover:bg-orange-200 border border-orange-200 dark:border-orange-800">
                                <Clock className="h-3 w-3 mr-1" /> Pending
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// -- Main Board --
export function CRMKanbanBoard({ leads, onUpdateStatus, onRefresh, isAdmin = false }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }), // Added TouchSensor
    );

    const leadsByStatus = useMemo(() => {
        const grouped: Record<string, Lead[]> = {};
        columns.forEach(col => grouped[col.id] = []);
        leads.forEach(lead => {
            const status = grouped[lead.status] ? lead.status : 'new';
            grouped[status].push(lead);
        });
        return grouped;
    }, [leads]);

    const columnTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        columns.forEach(col => {
            totals[col.id] = leadsByStatus[col.id]?.reduce((sum, l) => sum + (l.value || 0), 0) || 0;
        });
        return totals;
    }, [leadsByStatus]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeLead = leads.find(l => l.id === active.id);
        if (!activeLead) return;

        let newStatus = over.id as string;
        const isColumn = columns.some(c => c.id === newStatus);
        if (!isColumn) {
            const overLead = leads.find(l => l.id === over.id);
            if (overLead) {
                newStatus = overLead.status;
            } else {
                return;
            }
        }

        // --- APPROVAL WORKFLOW ENFORCEMENT ---
        // If Non-Admin tries to move to 'closed-won', force them to 'pending_verification'
        // Or if they try to skip steps, we could enforce that too, but let's stick to the request.
        if (newStatus === 'closed-won' && !isAdmin) {
            // Option: Redirect to pending_verification automatically or just block?
            // "Employee closed-won a lead ... admin need to verify"
            // So practically, when an employee drags to "Won" (or what they think is Won), it should go to Pending.
            // But visually, it's better if they drag TO Pending.
            // Let's block direct drag to Won if not admin.
            // Actually, let's treat 'closed-won' as Admin Only Zone.
            // If they drop it there, we can alert them or just re-route to 'pending_verification'?
            // Re-routing is user friendly.
            newStatus = 'pending_verification';
            // Ideally show a toast here: "Submitted for Approval"
        }
        // -------------------------------------

        if (activeLead.status !== newStatus) {
            if (newStatus === 'closed-won') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#2662d9', '#eab308', '#22c55e']
                });
            }
            await onUpdateStatus(activeLead.id, newStatus);
        }
    };

    const activeLeadData = leads.find(l => l.id === activeId);

    return (
        <div className="h-full flex flex-col bg-background/50 rounded-xl overflow-hidden">
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex h-full w-full gap-3 p-2 pb-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        {columns.map(col => {
                            // OPTIONAL: Hide 'closed-won' from employees if we strictly want them to use Pending.
                            // But usually, they want to SEE what they won. They just can't drag TO it.
                            // Let's keep it visible.
                            return (
                                <div key={col.id} className="flex-1 min-w-[160px] max-w-[300px] flex flex-col h-full">
                                    {/* Column Header */}
                                    <div className={`
                                p-3 mb-2 rounded-xl flex flex-col gap-2 shadow-sm
                                ${col.color} border border-border/10
                            `}>
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-xs text-foreground/80 uppercase tracking-wider truncate">{col.title}</h3>
                                            <Badge variant="secondary" className="font-bold bg-white dark:bg-black/20 text-foreground shadow-sm h-5 px-1.5 text-[10px]">
                                                {leadsByStatus[col.id]?.length || 0}
                                            </Badge>
                                        </div>
                                        <div className="h-1 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/50 w-full rounded-full opacity-50" />
                                        </div>
                                        {columnTotals[col.id] > 0 ? (
                                            <div className="flex items-center text-xs font-semibold text-muted-foreground">
                                                Total: <span className="text-foreground ml-auto">${columnTotals[col.id].toLocaleString()}</span>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-transparent select-none">Placeholder</div>
                                        )}
                                    </div>

                                    {/* Droppable Area */}
                                    <ScrollArea className="flex-1 -mx-2 px-2">
                                        <SortableContext
                                            items={leadsByStatus[col.id]?.map(l => l.id) || []}
                                            strategy={verticalListSortingStrategy}
                                            id={col.id}
                                        >
                                            <DroppableColumn id={col.id}>
                                                {leadsByStatus[col.id]?.length === 0 && (
                                                    <div className="h-24 border-2 border-dashed border-muted/50 rounded-xl flex items-center justify-center text-muted-foreground/50 text-sm italic">
                                                        {col.id === 'closed-won' && !isAdmin ? "Admin Approval Needed" : "No leads here"}
                                                    </div>
                                                )}
                                                {leadsByStatus[col.id]?.map(lead => (
                                                    <LeadCard
                                                        key={lead.id}
                                                        lead={lead}
                                                        isAdmin={isAdmin}
                                                        onClick={() => {
                                                            setSelectedLead(lead);
                                                            setDetailsOpen(true);
                                                        }}
                                                    />
                                                ))}
                                            </DroppableColumn>
                                        </SortableContext>
                                    </ScrollArea>
                                </div>
                            );
                        })}

                        <DragOverlay>
                            {activeLeadData ? (
                                <div className="opacity-90 rotate-3 cursor-grabbing w-[260px]">
                                    <Card className="bg-card shadow-2xl border-primary ring-2 ring-primary/20">
                                        <CardContent className="p-4">
                                            <h4 className="font-bold text-sm mb-1">{activeLeadData.name}</h4>
                                            <p className="text-xs text-muted-foreground mb-2">{activeLeadData.company}</p>
                                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                Move to {activeLeadData.status === 'qualified' ? 'Proposal' : 'Next Stage'}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            <LeadDetailsDialog
                lead={selectedLead}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                onUpdate={onRefresh}
            />
        </div>
    );
}

function DroppableColumn({ id, children }: { id: string, children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className="min-h-[150px] h-full pb-4">
            {children}
        </div>
    );
}
