import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lead } from "@/hooks/useLeads";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import {
    Activity, ArrowRight, BarChart3, Building2, Calendar, CalendarDays, CheckCircle, ChevronDown, Clock, CreditCard, DollarSign, FileText, LayoutDashboard, Loader2, Mail, MoreHorizontal, Package, Phone, Plus, Save, ShoppingCart, Tag, Trash2, User
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabsContent as TabsContentPrimitive } from "@radix-ui/react-tabs";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LeadDetailsDialogProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export function LeadDetailsDialog({ lead, open, onOpenChange, onUpdate }: LeadDetailsDialogProps) {
    const { toast } = useToast();
    const [notes, setNotes] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const { user } = useAuth();

    // Product Cart State
    const [leadItems, setLeadItems] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [newItemSku, setNewItemSku] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");
    const [newItemQty, setNewItemQty] = useState(1);
    const [loadingItems, setLoadingItems] = useState(false);
    const [converting, setConverting] = useState(false);

    useEffect(() => {
        if (lead) {
            setNotes(lead.notes || "");
            fetchActivities(lead.id);
            fetchLeadItems(lead.id);
            if (inventory.length === 0) fetchInventory();
        }
    }, [lead]);

    const fetchInventory = async () => {
        const { data } = await supabase.from('inventory').select('*').order('name');
        if (data) setInventory(data);
    };

    const handleProductSelect = (sku: string) => {
        setNewItemSku(sku);
        const product = inventory.find(i => i.sku === sku);
        if (product) {
            setNewItemPrice(product.price.toString());
        }
    };

    const fetchLeadItems = async (leadId: string) => {
        setLoadingItems(true);
        const { data, error } = await supabase
            .from('lead_items')
            .select('*, inventory(name, price, purchase_price, stock)')
            .eq('lead_id', leadId);

        if (!error && data) {
            setLeadItems(data);
        }
        setLoadingItems(false);
    };

    const handleAddItem = async () => {
        if (!lead || !newItemSku) return;

        const product = inventory.find(i => i.sku === newItemSku);
        if (!product) return;

        // Validation 1: Stock Check
        if (newItemQty > product.stock) {
            toast({ title: "Stock Error", description: `Cannot add ${newItemQty} items. Only ${product.stock} in stock.`, variant: "destructive" });
            return;
        }

        // Validation 2: Profit Check (Deal Price >= Unit Cost)
        const dealPrice = parseFloat(newItemPrice);
        const costPrice = product.purchase_price || 0;

        if (dealPrice < costPrice) {
            toast({
                title: "Pricing Error",
                description: `Deal Price ($${dealPrice}) cannot be lower than Purchase Cost ($${costPrice}).`,
                variant: "destructive"
            });
            return;
        }

        const { error } = await supabase.from('lead_items').insert({
            lead_id: lead.id,
            sku: newItemSku,
            quantity: newItemQty,
            unit_price: dealPrice
        });

        if (error) {
            console.error("Error adding item:", error);
            // Check if it's a trigger error (custom Postgres exception)
            if (error.message.includes('Insufficient stock')) {
                toast({
                    title: "Stock Reservation Failed",
                    description: error.message.split('P0001:')[1] || "Not enough stock available for this product.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to add item to deal.",
                    variant: "destructive"
                });
            }
        } else {
            toast({ title: "Item Added", description: "Product added to lead cart" });
            fetchLeadItems(lead.id);
            setNewItemSku("");
            setNewItemPrice("");
            setNewItemQty(1);
            updateLeadValue();
        }
    };

    // Calculate total cart value and update lead value
    const updateLeadValue = async () => {
        // We need to re-fetch items first to get the latest list, 
        // OR calculate locally. Fetching is safer.
        // But fetchLeadItems is async and updates state.
        // Let's rely on a separate calc after state update? 
        // Better: Do a DB query to sum it up.

        const { data: items } = await supabase
            .from('lead_items')
            .select('quantity, unit_price, inventory(price)')
            .eq('lead_id', lead.id);

        if (items) {
            const totalValue = items.reduce((sum, item) => {
                const price = item.unit_price || item.inventory?.price || 0;
                return sum + (price * item.quantity);
            }, 0);

            await supabase.from('leads').update({ value: totalValue }).eq('id', lead.id);
            onUpdate(); // Refresh main list
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        const { error } = await supabase.from('lead_items').delete().eq('id', itemId);
        if (!error) {
            fetchLeadItems(lead!.id);
            toast({ title: "Removed", description: "Item removed from cart" });
            setTimeout(() => updateLeadValue(), 500); // Sync value
        }
    };

    const handleConvertToOrder = async () => {
        if (!lead) return;
        setConverting(true);
        try {
            const { data, error } = await supabase.rpc('convert_lead_to_order', {
                target_lead_id: lead.id,
                output_employee_id: user?.id
            });

            if (error) throw error;

            toast({ title: "Success!", description: "Lead converted to Order (Closed Won)", variant: "default" });
            onUpdate(); // Refresh parent list
            onOpenChange(false); // Close dialog
        } catch (error: any) {
            console.error(error);
            toast({ title: "Conversion Failed", description: error.message || "Could not convert lead", variant: "destructive" });
        } finally {
            setConverting(false);
        }
    };

    const fetchActivities = async (leadId: string) => {
        setLoadingActivities(true);
        try {
            const { data, error } = await supabase
                .from('crm_activity_logs')
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setActivities(data);
            } else {
                setActivities([]);
            }
        } catch (e) {
            console.log("Activity logs not available");
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!lead) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('leads')
                .update({ notes: notes })
                .eq('id', lead.id);

            if (error) throw error;

            toast({ title: "Notes Updated", description: "Lead notes saved successfully." });
            onUpdate();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save notes.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (!lead) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>

            <DialogContent className="sm:max-w-6xl max-h-[85vh] p-0 gap-0 flex flex-col border-0 shadow-2xl overflow-hidden rounded-xl [&>button]:text-white [&>button]:opacity-70 [&>button]:hover:opacity-100 [&>button]:hover:text-white ring-0">
                {/* Premium Header */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-black/20 blur-xl"></div>

                    <DialogHeader className="relative z-10 pt-2">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm shadow-inner">
                                    <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <span className="tracking-tight">{lead.name}</span>
                            </DialogTitle>

                            <div className="flex items-center gap-3 ml-[52px]">
                                <DialogDescription className="text-nexus-light/90 text-base font-medium flex items-center gap-2">
                                    {lead.company || "No Company Specified"}
                                </DialogDescription>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Badge
                                            variant="outline"
                                            className="ml-2 bg-white/10 text-white border-0 hover:bg-white/20 cursor-pointer pl-2 pr-1 h-6 gap-1"
                                        >
                                            {lead.status.toUpperCase()} <ChevronDown className="h-3 w-3 opacity-70" />
                                        </Badge>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {['new', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'].map((stage) => (
                                            <DropdownMenuItem
                                                key={stage}
                                                onClick={() => {
                                                    // useLeads hook is not directly available here props-wise for updateStatus
                                                    // but we passed onUpdate. We need to actually perform the update.
                                                    // Wait, this component doesn't have the update function passed to it?
                                                    // It receives onUpdate, but that's a refresh callback.
                                                    // I should use the Supabase client directly here just like handleSaveNotes.

                                                    const doUpdate = async () => {
                                                        if (stage === 'closed-won') {
                                                            const { error: rpcError } = await supabase.rpc('confirm_lead_order', {
                                                                target_lead_id: lead.id,
                                                                output_employee_id: user?.id
                                                            });
                                                            if (rpcError) {
                                                                toast({ title: "Error", description: "Failed to confirm order", variant: "destructive" });
                                                                return;
                                                            }
                                                            toast({ title: "Deal Won!", description: "Order finalized.", className: "bg-green-600 border-none text-white" });
                                                        }

                                                        await supabase.from('leads').update({ status: stage }).eq('id', lead.id);
                                                        onUpdate();
                                                    };
                                                    doUpdate();
                                                }}
                                                disabled={lead.status === stage}
                                            >
                                                {stage.replace('-', ' ').toUpperCase()}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="details" className="flex flex-col bg-background overflow-hidden">
                    <div className="px-8 pt-0 border-b bg-white sticky top-0 z-20 shadow-sm">
                        <TabsList className="w-full justify-start h-16 p-0 bg-transparent border-b-0 gap-8">
                            {(lead.status === 'proposal' || lead.status === 'negotiation' || lead.status === 'negotiating') && (
                                <TabsTrigger
                                    value="products"
                                    className="relative h-16 bg-transparent border-b-2 border-transparent data-[state=active]:border-nexus-primary rounded-none px-1 pb-0 text-slate-500 data-[state=active]:text-nexus-primary font-semibold transition-all hover:text-slate-800 flex items-center gap-2"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    <span>Cart & Products</span>
                                </TabsTrigger>
                            )}
                            <TabsTrigger
                                value="details"
                                className="relative h-16 bg-transparent border-b-2 border-transparent data-[state=active]:border-nexus-primary rounded-none px-1 pb-0 text-slate-500 data-[state=active]:text-nexus-primary font-semibold transition-all hover:text-slate-800 flex items-center gap-2"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                <span>Deal Details</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="timeline"
                                className="relative h-16 bg-transparent border-b-2 border-transparent data-[state=active]:border-nexus-primary rounded-none px-1 pb-0 text-slate-500 data-[state=active]:text-nexus-primary font-semibold transition-all hover:text-slate-800 flex items-center gap-2"
                            >
                                <Activity className="h-4 w-4" />
                                <span>Timeline</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>



                    {(lead.status === 'proposal' || lead.status === 'negotiation' || lead.status === 'negotiating') && (
                        <TabsContent value="products" className="p-8 space-y-6 overflow-y-auto mt-0">

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Product Selection */}
                                <div className="lg:col-span-3 xl:col-span-3 space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>

                                        <div className="relative space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                                <div className="space-y-2.5 flex-1">
                                                    <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider pl-1">Select Product</Label>
                                                    <Select value={newItemSku} onValueChange={handleProductSelect}>
                                                        <SelectTrigger className="bg-slate-50 border-slate-200 h-12 rounded-xl focus:ring-nexus-primary/20 text-base font-medium">
                                                            <SelectValue placeholder="Search inventory..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-[300px]">
                                                            {inventory.map(item => (
                                                                <SelectItem key={item.sku} value={item.sku} className="cursor-pointer py-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-semibold text-slate-800 text-base">{item.name}</span>
                                                                        <span className="text-xs text-slate-400">SKU: {item.sku} • Stock: {item.stock}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button onClick={handleAddItem} disabled={!newItemSku || !newItemPrice} className="h-12 rounded-xl bg-slate-900 text-white hover:bg-nexus-primary transition-all font-semibold shadow-lg shadow-slate-900/10 hover:shadow-nexus-primary/25 disabled:opacity-50 disabled:shadow-none w-full md:w-auto px-8">
                                                    <Plus className="h-5 w-5 mr-2" /> Add Item to Deal
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
                                                <div className="space-y-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                                    <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Available Stock</Label>
                                                    <div className="text-sm font-semibold text-slate-700">
                                                        {newItemSku ? `${inventory.find(i => i.sku === newItemSku)?.stock} units` : '-'}
                                                    </div>
                                                </div>
                                                <div className="space-y-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                                    <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Cost Price</Label>
                                                    <div className="text-sm font-semibold text-slate-700">
                                                        {newItemSku ? `$${inventory.find(i => i.sku === newItemSku)?.purchase_price}` : '-'}
                                                    </div>
                                                </div>
                                                <div className="space-y-2 p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                                                    <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">List Price</Label>
                                                    <div className="text-sm font-semibold text-slate-700">
                                                        {newItemSku ? `$${inventory.find(i => i.sku === newItemSku)?.price}` : '-'}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 p-3 bg-white rounded-xl border border-nexus-primary/20 shadow-sm ring-1 ring-nexus-primary/5">
                                                    <Label className="text-nexus-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">Deal Price ($)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newItemPrice}
                                                        onChange={(e) => setNewItemPrice(e.target.value)}
                                                        className="h-7 -ml-2 -mt-1 border-0 bg-transparent focus-visible:ring-0 text-base font-bold text-nexus-primary placeholder:text-nexus-primary/20 px-2"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                    <Label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Quantity</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={newItemQty}
                                                        onChange={(e) => setNewItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                        className="h-7 -ml-2 -mt-1 border-0 bg-transparent focus-visible:ring-0 text-base font-bold text-slate-800 px-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                                <ShoppingCart className="h-4 w-4 text-slate-400" /> Current Cart
                                            </h3>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                                                {leadItems.length} Items
                                            </Badge>
                                        </div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent border-slate-100">
                                                    <TableHead className="pl-6 h-12 text-slate-500 font-semibold text-xs uppercase tracking-wider">Product</TableHead>
                                                    <TableHead className="h-12 text-slate-500 font-semibold text-xs uppercase tracking-wider text-right">Price</TableHead>
                                                    <TableHead className="h-12 text-slate-500 font-semibold text-xs uppercase tracking-wider text-right">Qty</TableHead>
                                                    <TableHead className="h-12 text-slate-500 font-semibold text-xs uppercase tracking-wider text-right pr-6">Total</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {leadItems.length === 0 ? (
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableCell colSpan={5} className="text-center py-12">
                                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                                <ShoppingCart className="h-12 w-12" />
                                                                <p className="font-medium">No items in the deal cart yet</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    leadItems.map(item => (
                                                        <TableRow key={item.id} className="hover:bg-slate-50 border-slate-100 group">
                                                            <TableCell className="pl-6 py-4 font-medium text-slate-700">
                                                                {item.inventory?.name || item.sku}
                                                            </TableCell>
                                                            <TableCell className="text-right py-4">
                                                                <div className="flex flex-col items-end gap-0.5">
                                                                    <span className="font-bold text-slate-700">${item.unit_price || item.inventory?.price}</span>
                                                                    {(item.unit_price < item.inventory?.price) && (
                                                                        <Badge variant="outline" className="text-[10px] px-1 h-4 border-green-200 text-green-700 bg-green-50">-{Math.round((1 - item.unit_price / item.inventory.price) * 100)}%</Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-4 text-slate-600">{item.quantity}</TableCell>
                                                            <TableCell className="text-right pr-6 py-4 font-bold text-nexus-primary text-base">
                                                                ${((item.unit_price || item.inventory?.price || 0) * item.quantity).toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="px-2">
                                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all rounded-full">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    )}

                    <TabsContent value="details" className="p-8 m-0 overflow-y-auto space-y-8 bg-background mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Lead Info Cards with Glassmorphism */}
                            <div className="space-y-1.5 p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute right-0 top-0 h-24 w-24 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-blue-500/10 transition-colors"></div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
                                    <Mail className="h-3.5 w-3.5 text-nexus-primary" /> Email Contact
                                </Label>
                                <div className="text-sm font-semibold text-slate-800 break-all relative z-10">
                                    {lead.email || <span className="text-slate-400 italic">Not provided</span>}
                                </div>
                            </div>

                            <div className="space-y-1.5 p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute right-0 top-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-indigo-500/10 transition-colors"></div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
                                    <Phone className="h-3.5 w-3.5 text-nexus-primary" /> Phone Number
                                </Label>
                                <div className="text-sm font-semibold text-slate-800 relative z-10">
                                    {lead.phone || <span className="text-slate-400 italic">Not provided</span>}
                                </div>
                            </div>

                            <div className="space-y-1.5 p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute right-0 top-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors"></div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
                                    <CreditCard className="h-3.5 w-3.5 text-nexus-primary" /> Deal Value
                                </Label>
                                <div className="text-lg font-bold text-slate-800 flex items-center gap-1 text-emerald-600 relative z-10">
                                    {lead.value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || "$0.00"}
                                </div>
                            </div>

                            <div className="space-y-1.5 p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute right-0 top-0 h-24 w-24 bg-purple-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-purple-500/10 transition-colors"></div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
                                    <User className="h-3.5 w-3.5 text-nexus-primary" /> Deal Owner
                                </Label>
                                <div className="text-sm font-medium text-slate-800 flex items-center gap-2 relative z-10">
                                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-nexus-primary to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                        {lead.profiles?.full_name?.charAt(0) || "U"}
                                    </div>
                                    {lead.profiles?.full_name || "Unassigned"}
                                </div>
                            </div>

                            <div className="space-y-1.5 p-5 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="absolute right-0 top-0 h-24 w-24 bg-orange-500/5 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-orange-500/10 transition-colors"></div>
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
                                    <Package className="h-3.5 w-3.5 text-nexus-primary" /> Product Interest
                                </Label>
                                <div className="text-sm font-bold text-slate-800 relative z-10">
                                    {lead.product || "General Inquiry"}
                                </div>
                            </div>
                        </div>

                        {/* Order/Deal Summary - Visible if items exist */}
                        {leadItems.length > 0 && (
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <div className={`p-1.5 rounded-lg ${lead.status === 'closed-won' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                                            {lead.status === 'closed-won' ? <CheckCircle className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                                        </div>
                                        {lead.status === 'closed-won' ? 'Finalized Order Summary' : 'Draft Deal Summary'}
                                    </Label>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-slate-50/50">
                                                <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-slate-500 pl-6">Product</TableHead>
                                                <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Qty</TableHead>
                                                <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Deal Price</TableHead>
                                                <TableHead className="h-10 text-xs font-bold uppercase tracking-wider text-slate-500 text-right pr-6">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {leadItems.map(item => (
                                                <TableRow key={item.id} className="hover:bg-slate-50">
                                                    <TableCell className="font-medium py-3 text-slate-700 pl-6">
                                                        {item.inventory?.name || item.sku}
                                                    </TableCell>
                                                    <TableCell className="text-right py-3 text-slate-600">{item.quantity}</TableCell>
                                                    <TableCell className="text-right py-3 font-mono text-slate-600">${item.unit_price || item.inventory?.price}</TableCell>
                                                    <TableCell className="text-right py-3 font-bold text-slate-800 pr-6">
                                                        ${((item.unit_price || item.inventory?.price || 0) * item.quantity).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-slate-50/80 font-bold border-t border-slate-200">
                                                <TableCell colSpan={3} className="text-right py-4 text-xs uppercase tracking-wider text-slate-500">Total Order Value:</TableCell>
                                                <TableCell className="text-right py-4 text-nexus-primary text-lg pr-6">
                                                    ${leadItems.reduce((sum, item) => sum + ((item.unit_price || item.inventory?.price || 0) * item.quantity), 0).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 pt-4 border-t border-slate-200">
                            <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <div className="p-1.5 rounded-lg bg-nexus-primary/10">
                                    <FileText className="h-4 w-4 text-nexus-primary" />
                                </div>
                                Private Notes
                            </Label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-nexus-primary to-purple-600 rounded-xl opacity-0 group-focus-within:opacity-20 transition duration-500 blur-md"></div>
                                <Textarea
                                    placeholder="Add notes about this deal, customer preferences, or next steps..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="relative min-h-[150px] resize-none bg-white border-slate-200 focus:border-nexus-primary/50 transition-all p-5 text-sm leading-relaxed shadow-sm rounded-xl focus:ring-0"
                                />
                                <div className="absolute bottom-4 right-4 z-10">
                                    <Button
                                        size="sm"
                                        onClick={handleSaveNotes}
                                        disabled={isSaving}
                                        className="h-9 px-4 bg-slate-900 hover:bg-nexus-primary text-white shadow-lg shadow-black/10 transition-all rounded-lg font-medium"
                                    >
                                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                                        Save Notes
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Product & Value Editing (Visible in Proposal/Negotiation) */}
                        {['proposal', 'negotiation'].includes(lead.status) && (
                            <div className="space-y-3 pt-4 border-t border-slate-200">
                                <Label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    Deal Configuration
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase">Product / Service</Label>
                                        <Select
                                            value={lead.product || "CRM System"} // Default fallback if null
                                            onValueChange={async (val) => {
                                                // Instant update
                                                await supabase.from('leads').update({ product: val }).eq('id', lead.id);
                                                toast({ title: "Product Updated", description: `Deal now for: ${val}` });
                                                onUpdate();
                                            }}
                                        >
                                            <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50">
                                                <SelectValue placeholder="Select product..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CRM System">CRM System</SelectItem>
                                                <SelectItem value="ERP Solution">ERP Solution</SelectItem>
                                                <SelectItem value="Website Development">Website Development</SelectItem>
                                                <SelectItem value="Mobile App">Mobile App</SelectItem>
                                                <SelectItem value="SEO Service">SEO Service</SelectItem>
                                                <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase">Deal Value ($)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                type="number"
                                                defaultValue={lead.value}
                                                onBlur={async (e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (val !== lead.value) {
                                                        await supabase.from('leads').update({ value: val }).eq('id', lead.id);
                                                        toast({ title: "Value Updated", description: "New deal value saved." });
                                                        onUpdate();
                                                    }
                                                }}
                                                className="pl-9 h-10 border-slate-200 bg-slate-50/50 font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                    <TabsContent
                        value="timeline"
                        className="p-0 m-0 overflow-hidden flex flex-col"
                    >

                        <ScrollArea className="h-[500px] p-6">

                            {loadingActivities ? (
                                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2 opacity-30" />
                                    <p className="text-sm">Loading activity history...</p>
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-muted m-2">
                                    <Activity className="h-10 w-10 mb-3 opacity-20" />
                                    <p className="font-medium text-sm">No recorded activity yet</p>
                                    <p className="text-xs opacity-70">Activities will appear here as the deal progresses.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 relative pl-2">
                                    <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-border/50 via-border/30 to-transparent" />

                                    {activities.map((log, i) => (
                                        <div key={log.id} className="relative pl-8 group">
                                            <div className="absolute left-[15px] top-[5px] h-2.5 w-2.5 rounded-full bg-nexus-primary ring-4 ring-background shadow-sm z-10 group-hover:scale-110 transition-transform" />
                                            <div className="bg-card p-4 rounded-xl border shadow-sm group-hover:shadow-md transition-all">
                                                <div className="flex items-start justify-between gap-4">
                                                    <p className="text-sm font-medium text-foreground leading-snug">{log.details}</p>
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-muted/30 border-0 shrink-0">
                                                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 bg-muted/20 px-2 py-1 rounded-md">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {format(new Date(log.created_at), 'PPPP')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent >
        </Dialog >
    );
}
