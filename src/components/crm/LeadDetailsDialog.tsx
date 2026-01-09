import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lead } from "@/types/crm";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import {
    Activity, ArrowRight, BarChart3, Building2, Calendar, CalendarDays, CheckCircle, ChevronDown, Clock, CreditCard, DollarSign, FileText, LayoutDashboard, Loader2, Mail, MoreHorizontal, Package, Phone, Plus, Save, ShoppingCart, Tag, Trash2, User, Shield, Pencil
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
    // Fix: Local state to show real-time value updates without closing dialog
    const [dynamicValue, setDynamicValue] = useState(lead?.value || 0);
    const [status, setStatus] = useState(lead?.status || 'new');

    useEffect(() => {
        if (lead) {
            setNotes(lead.notes || "");
            setDynamicValue(lead.value || 0); // Reset when opening a different lead
            setStatus(lead.status); // Fix: Sync status
            fetchActivities(lead.id);
            fetchLeadItems(lead.id);
            fetchInventory(); // Always fetch to get fresh data and correct sorting
        }
    }, [lead]);

    const fetchInventory = async () => {
        const { data } = await supabase
            .from('inventory')
            .select('*')
            .eq('archived', false)
            .order('stock', { ascending: true }); // Show low stock first
        if (data) setInventory(data);
    };

    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    const handleProductSelect = (sku: string) => {
        setNewItemSku(sku);
        const product = inventory.find(i => i.sku === sku);
        if (product) {
            // Only auto-set price if NOT editing (so we don't overwrite custom price)
            if (!editingItemId) {
                setNewItemPrice(product.price.toString());
            }
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

    const handleEditItem = (item: any) => {
        setEditingItemId(item.id);
        setNewItemSku(item.sku);
        setNewItemPrice(item.unit_price.toString());
        setNewItemQty(item.quantity);

        // Scroll to form
        const formElement = document.getElementById('product-form-section');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    // Helper: Pure calculation of remaining stock
    const calculateRemainingStock = (sku: string, currentInputQty: number, excludeItemId: string | null = null): { remaining: number; isValid: boolean } => {
        const product = inventory.find(i => i.sku === sku);
        if (!product) return { remaining: 0, isValid: false };

        // Logic:
        // Global Reserved = product.reserved
        // My Reserved In DB = leadItems for this SKU (sum)
        const myTotalInDb = leadItems
            .filter(item => item.sku === sku)
            .reduce((acc, item) => acc + item.quantity, 0);

        const reservedByOthers = (product.reserved || 0) - myTotalInDb;
        const availableLimit = product.stock - reservedByOthers;

        // My Requested Need = OtherItemsCart + NewInput
        const myOtherItemsQty = leadItems.reduce((acc, item) => {
            if (item.sku === sku && item.id !== excludeItemId) {
                return acc + item.quantity;
            }
            return acc;
        }, 0);

        const totalRequestedByMe = myOtherItemsQty + currentInputQty;
        const remaining = availableLimit - totalRequestedByMe;

        return {
            remaining,
            isValid: totalRequestedByMe <= availableLimit
        };
    };

    // Helper: Validates stock and triggers toast if invalid
    const checkStockAvailability = (sku: string, qty: number, excludeItemId: string | null = null): boolean => {
        const product = inventory.find(i => i.sku === sku);
        if (!product) return false;

        const { isValid, remaining } = calculateRemainingStock(sku, qty, excludeItemId);

        if (!isValid) {
            // Calculate how many are actually available to add
            const existingInCart = leadItems.reduce((acc, item) => {
                if (item.sku === sku && item.id !== excludeItemId) {
                    return acc + item.quantity;
                }
                return acc;
            }, 0);

            const myQty = leadItems.filter(i => i.sku === sku).reduce((a, b) => a + b.quantity, 0);
            const avail = product.stock - ((product.reserved || 0) - myQty);
            toast({
                title: "Stock Limit Exceeded",
                description: `Only ${avail} units available (Stock: ${product.stock}, Reserved: ${product.reserved || 0}).`,
                variant: "destructive"
            });
            return false;
        }
        return true;
    };

    const handleUpdateItem = async () => {
        if (!editingItemId || !newItemSku) return;

        const product = inventory.find(i => i.sku === newItemSku);
        if (!product) return; // Should not happen

        if (!checkStockAvailability(newItemSku, newItemQty, editingItemId)) return;

        const dealPrice = parseFloat(newItemPrice);
        if (dealPrice < (product.purchase_price || 0)) {
            toast({ title: "Pricing Error", description: "Deal Price cannot be lower than Purchase Cost.", variant: "destructive" });
            return;
        }

        const { error } = await supabase.from('lead_items').update({
            sku: newItemSku,
            quantity: newItemQty,
            unit_price: dealPrice
        }).eq('id', editingItemId);

        if (error) {
            toast({ title: "Error", description: "Failed to update item.", variant: "destructive" });
        } else {
            toast({ title: "Item Updated", description: "Cart updated successfully" });
            fetchLeadItems(lead.id);
            fetchInventory(); // Update stock/reserved display
            resetForm();
            updateLeadValue();
        }
    };

    const resetForm = () => {
        setEditingItemId(null);
        setNewItemSku("");
        setNewItemPrice("");
        setNewItemQty(1);
    }

    const handleAddItem = async () => {
        if (!lead || !newItemSku) return;

        // If editing, redirect to update
        if (editingItemId) {
            await handleUpdateItem();
            return;
        }

        const product = inventory.find(i => i.sku === newItemSku);
        if (!product) return;

        if (!checkStockAvailability(newItemSku, newItemQty)) return;

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
            // ... existing error handling
            toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
        } else {
            toast({ title: "Item Added", description: "Product added to lead cart" });
            fetchLeadItems(lead.id);
            fetchInventory(); // Update stock/reserved display
            resetForm();
            setTimeout(() => updateLeadValue(), 100);
        }
    };

    // Calculate total cart value and update lead value
    const updateLeadValue = async () => {
        const { data: items } = await supabase
            .from('lead_items')
            .select('quantity, unit_price, inventory(price)')
            .eq('lead_id', lead.id);

        if (items) {
            const totalValue = items.reduce((sum, item: any) => {
                const price = item.unit_price || item.inventory?.price || 0;
                return sum + (price * item.quantity);
            }, 0);

            await supabase.from('leads').update({ value: totalValue }).eq('id', lead.id);
            setDynamicValue(totalValue); // Update local UI immediately
            onUpdate(); // Refresh main list
        }
    };

    const handleRemoveItem = async (itemId: string) => {
        const { error } = await supabase.from('lead_items').delete().eq('id', itemId);
        if (!error) {
            // Optimistic update for list could be good, but fetch is safer
            fetchLeadItems(lead!.id);
            fetchInventory(); // Update stock/reserved display
            toast({ title: "Removed", description: "Item removed from cart" });
            setTimeout(() => updateLeadValue(), 100); // Sync value
        }
    };

    const handleConvertToOrder = async () => {
        if (!lead) return;
        setConverting(true);
        try {
            // Use standard confirm_lead_order (handles inventory & commission)
            const { data, error } = await supabase.rpc('confirm_lead_order', {
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

            <DialogContent className="fixed left-[50%] top-[50%] z-[200] flex flex-col w-[90vw] max-w-[1000px] h-[75vh] sm:h-[85vh] -translate-x-1/2 -translate-y-1/2 gap-0 border-0 shadow-2xl p-0 overflow-hidden rounded-xl bg-background ring-0 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
                {/* Premium Header */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-black/20 blur-xl"></div>

                    <DialogHeader className="relative z-10 pt-2">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
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
                                            className={`ml-2 text-white border-0 cursor-pointer px-2 h-5 sm:h-6 gap-0.5 sm:gap-1 text-[9px] sm:text-xs whitespace-nowrap ${(status === 'pending-verification' || status === 'pending_verification') ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/50' : 'bg-white/10 hover:bg-white/20'}`}
                                        >
                                            <span className="sm:hidden">{(status.includes('verification')) ? 'PENDING' : status.replace('-', ' ').replace('_', ' ').toUpperCase()}</span>
                                            <span className="hidden sm:inline">{status.replace('-', ' ').replace('_', ' ').toUpperCase()}</span>
                                            <ChevronDown className="h-3 w-3 opacity-70" />
                                        </Badge>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {['new', 'qualified', 'proposal', 'negotiation', 'pending-verification', 'closed-won', 'closed-lost']
                                            .filter(stage => {
                                                // Security Filter:
                                                // 1. Employees cannot set 'closed-won' directly
                                                if (user?.role !== 'admin' && stage === 'closed-won') return false;
                                                // 2. 'pending-verification' is mainly for employees to select, or admins to see
                                                return true;
                                            })
                                            .map((stage) => (
                                                <DropdownMenuItem
                                                    key={stage}
                                                    onClick={() => {
                                                        const doUpdate = async () => {
                                                            if (stage === 'closed-won') {
                                                                // If admin selects closed-won directly (bypass verification)
                                                                const { error: rpcError } = await supabase.rpc('confirm_lead_order', {
                                                                    target_lead_id: lead.id,
                                                                    output_employee_id: user?.id
                                                                });
                                                                if (rpcError) {
                                                                    console.error(rpcError);
                                                                    toast({
                                                                        title: "Error",
                                                                        description: rpcError.message || "Failed to confirm order",
                                                                        variant: "destructive"
                                                                    });
                                                                    return;
                                                                }
                                                                toast({ title: "Deal Won!", description: "Order finalized.", className: "bg-green-600 border-none text-white" });
                                                            } else if (stage === 'pending-verification') {
                                                                toast({ title: "Approval Requested", description: "Lead sent to admin for verification." });
                                                            }

                                                            const { error } = await supabase.from('leads').update({ status: stage }).eq('id', lead.id);
                                                            if (!error) {
                                                                setStatus(stage); // Update local UI immediately
                                                                onUpdate();
                                                                fetchInventory(); // Refresh stock in case of reversal
                                                            }
                                                        };
                                                        doUpdate();
                                                    }}
                                                    disabled={status === stage}
                                                >
                                                    {stage === 'pending-verification' ? 'REQUEST APPROVAL' : stage.replace('-', ' ').replace('_', ' ').toUpperCase()}
                                                </DropdownMenuItem>
                                            ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Admin Verification Banner */}
                        {(status === 'pending-verification' || status === 'pending_verification') && user?.role === 'admin' && (
                            <div className="mt-6 -mb-2 bg-amber-50/10 border border-amber-200/20 rounded-xl p-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between backdrop-blur-md">
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-200 shrink-0">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-100">
                                            <span className="sm:hidden">Verify Deal</span>
                                            <span className="hidden sm:inline">Deal Verification Request</span>
                                        </p>
                                        <p className="text-xs text-amber-200/70 hidden sm:block">Review details before approving.</p>
                                        <div className="hidden sm:flex items-center gap-3 mt-1 text-xs text-amber-100/90 font-medium">
                                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {lead.profiles?.full_name || "Unknown Agent"}</span>
                                            <span className="w-1 h-1 rounded-full bg-amber-500/50" />
                                            <span className="flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> {leadItems.length} Items</span>
                                            <span className="w-1 h-1 rounded-full bg-amber-500/50" />
                                            <span className="flex items-center gap-1"><span className="text-sm">₹</span> {dynamicValue?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 w-full gap-2 sm:flex sm:w-auto">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={async () => {
                                            // UI Optimistic Update
                                            setStatus('negotiation');

                                            const { error: rejectError } = await supabase.rpc('revert_lead_to_negotiation', {
                                                target_lead_id: lead.id
                                            });

                                            if (rejectError) {
                                                console.error(rejectError);
                                                toast({
                                                    title: "Reject Failed",
                                                    description: rejectError.message || rejectError.details || "Failed to revert deal.",
                                                    variant: "destructive"
                                                });
                                                // Rollback (simplified)
                                                // fetchLeadDetails();
                                            } else {
                                                toast({ title: "Rejected", description: "Returned to negotiation stage. Inventory restored." });
                                                onUpdate();
                                                fetchInventory();
                                            }
                                        }}
                                        className="h-8 bg-black/20 border-white/10 text-white hover:bg-white/10 hover:text-white"
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={async () => {
                                            const { error: rpcError } = await supabase.rpc('confirm_lead_order', {
                                                target_lead_id: lead.id,
                                                output_employee_id: user?.id
                                            });
                                            if (!rpcError) {
                                                await supabase.from('leads').update({ status: 'closed-won' }).eq('id', lead.id);
                                                setStatus('closed-won');
                                                toast({ title: "Approved!", description: "Deal finalized and order created.", className: "bg-green-600 text-white border-none" });
                                                onUpdate();
                                                fetchInventory();
                                            } else {
                                                console.error(rpcError);
                                                toast({
                                                    title: "Approval Failed",
                                                    description: rpcError.message || rpcError.details || "Failed to create order.",
                                                    variant: "destructive"
                                                });
                                            }
                                        }}
                                        className="h-8 bg-amber-500 hover:bg-amber-600 text-black font-bold border-none"
                                    >
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        )}
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
                                    <ShoppingCart className="h-4 w-4 shrink-0" />
                                    <span className="truncate sm:hidden">Cart</span>
                                    <span className="hidden sm:inline">Cart & Products</span>
                                </TabsTrigger>
                            )}
                            <TabsTrigger
                                value="details"
                                className="relative h-16 bg-transparent border-b-2 border-transparent data-[state=active]:border-nexus-primary rounded-none px-1 pb-0 text-slate-500 data-[state=active]:text-nexus-primary font-semibold transition-all hover:text-slate-800 flex items-center gap-2"
                            >
                                <LayoutDashboard className="h-4 w-4 shrink-0" />
                                <span className="truncate sm:hidden">Details</span>
                                <span className="hidden sm:inline">Deal Details</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="timeline"
                                className="relative h-16 bg-transparent border-b-2 border-transparent data-[state=active]:border-nexus-primary rounded-none px-1 pb-0 text-slate-500 data-[state=active]:text-nexus-primary font-semibold transition-all hover:text-slate-800 hidden sm:flex items-center gap-2"
                            >
                                <Activity className="h-4 w-4" />
                                <span>Timeline</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>



                    {(lead.status === 'proposal' || lead.status === 'negotiation' || lead.status === 'negotiating') && (
                        <TabsContent value="products" className="p-4 sm:p-8 space-y-6 overflow-y-auto mt-0">

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Product Selection */}
                                <div className="lg:col-span-3 xl:col-span-3 space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-nexus-primary/5 rounded-full blur-2xl -mr-10 -mt-10"></div>

                                        <div className="relative space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                                <div className="space-y-2.5 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-slate-500 text-xs font-bold uppercase tracking-wider pl-1">
                                                            {editingItemId ? (
                                                                <span className="text-nexus-primary animate-pulse">Editing Item</span>
                                                            ) : (
                                                                "Select Product"
                                                            )}
                                                        </Label>
                                                        {editingItemId && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={resetForm}
                                                                className="h-5 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 px-2 -mr-1"
                                                            >
                                                                Cancel Edit
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <Select value={newItemSku} onValueChange={handleProductSelect} disabled={!!editingItemId}>
                                                        <SelectTrigger className={`border-slate-200 h-12 rounded-xl focus:ring-nexus-primary/20 text-base font-medium ${editingItemId ? 'bg-blue-50/50 text-slate-500' : 'bg-slate-50'}`}>
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

                                                <Button
                                                    onClick={handleAddItem}
                                                    disabled={!newItemSku || !newItemPrice}
                                                    className={`h-12 rounded-xl text-white transition-all font-semibold shadow-lg disabled:opacity-50 disabled:shadow-none w-full md:w-auto px-8 ${editingItemId ? 'bg-nexus-primary hover:bg-nexus-dark shadow-nexus-primary/25 ring-2 ring-nexus-primary/20 ring-offset-2' : 'bg-slate-900 hover:bg-nexus-primary shadow-slate-900/10 hover:shadow-nexus-primary/25'}`}
                                                >
                                                    {editingItemId ? <Save className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                                                    {editingItemId ? 'Save Changes' : 'Add Item to Deal'}
                                                </Button>
                                            </div>



                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                                                <div className={`space-y-2 p-3 rounded-xl border ${newItemSku ? (calculateRemainingStock(newItemSku, newItemQty, editingItemId).isValid ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-red-50/50 border-red-100/50') : 'bg-slate-50/50 border-slate-100/50'}`}>
                                                    <Label className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Remaining Stock</Label>
                                                    <div className={`text-sm font-semibold ${newItemSku ? (calculateRemainingStock(newItemSku, newItemQty, editingItemId).isValid ? 'text-emerald-700' : 'text-red-600') : 'text-slate-700'}`}>
                                                        {newItemSku ? (() => {
                                                            const { remaining, isValid } = calculateRemainingStock(newItemSku, newItemQty, editingItemId);
                                                            return isValid ? `${remaining} units left` : `Over limit by ${Math.abs(remaining)}`;
                                                        })() : '-'}
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

                                                <div className={`space-y-2 p-3 rounded-xl border shadow-sm ring-1 ring-nexus-primary/5 ${editingItemId ? 'bg-blue-50/30 border-nexus-primary/20' : 'bg-white border-nexus-primary/20'}`}>
                                                    <Label className="text-nexus-primary text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">Deal Price ($)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newItemPrice}
                                                        onChange={(e) => setNewItemPrice(e.target.value)}
                                                        className="h-7 -ml-2 -mt-1 border-0 bg-transparent focus-visible:ring-0 text-base font-bold text-nexus-primary placeholder:text-nexus-primary/20 px-2"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className={`space-y-2 p-3 rounded-xl border shadow-sm ${editingItemId ? 'bg-blue-50/30 border-slate-200' : 'bg-white border-slate-200'}`}>
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

                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="cart-section">
                                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                            {/* ... header ... */}
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table className="w-[600px] sm:w-full">
                                                <TableHeader>
                                                    {/* ... header row ... */}
                                                </TableHeader>
                                                <TableBody>
                                                    {leadItems.length === 0 ? (
                                                        // ... empty state ...
                                                        <TableRow><TableCell>Empty</TableCell></TableRow>
                                                    ) : (
                                                        leadItems.map(item => (
                                                            <TableRow key={item.id} className={`hover:bg-slate-50 border-slate-100 group ${editingItemId === item.id ? 'bg-blue-50/50' : ''}`}>
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
                                                                <TableCell className="px-2 text-right whitespace-nowrap">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)} className="h-8 w-8 text-slate-400 hover:text-nexus-primary hover:bg-blue-50 rounded-full">
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
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
                                    {dynamicValue?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || "$0.00"}
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

                        {/* Legacy Product/Value Editing removed - Use Cart & Products tab instead */}
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
