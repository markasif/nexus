import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface InventoryItem {
    sku: string;
    name: string;
    stock: number;
    low_stock: number;
    price: number;
}

interface CheckStockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CheckStockDialog({ open, onOpenChange }: CheckStockDialogProps) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (open) {
            fetchInventory();
        }
    }, [open]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('sku, name, stock, low_stock, price')
                .eq('archived', false);

            if (error) throw error;

            if (data) {
                // Client-side sort to prioritize "Action Needed" items
                const sorted = [...data].sort((a, b) => {
                    const aLow = a.low_stock || 5;
                    const bLow = b.low_stock || 5;

                    const aStatus = a.stock === 0 ? 0 : (a.stock <= aLow ? 1 : 2);
                    const bStatus = b.stock === 0 ? 0 : (b.stock <= bLow ? 1 : 2);

                    // 1. Sort by Status (Out > Low > Normal)
                    if (aStatus !== bStatus) return aStatus - bStatus;

                    // 2. Sort by Stock (Low to High within category)
                    if (a.stock !== b.stock) return a.stock - b.stock;

                    // 3. Sort by Name (A-Z)
                    return a.name.localeCompare(b.name);
                });
                setItems(sorted);
            }
        } catch (err) {
            console.error("Error fetching inventory:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed left-[50%] top-[10%] z-[200] grid w-[90vw] max-w-lg translate-x-[-50%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%] gap-4 border bg-background p-0 shadow-2xl duration-200 rounded-xl overflow-hidden border-0 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[2%] sm:data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[2%] sm:data-[state=open]:slide-in-from-top-[48%] max-h-[96vh] overflow-y-auto">
                {/* Header - Premium Gradient */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden">
                    {/* Background pattern equivalent - simplified for now */}
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <span className="tracking-tight">Check Stock</span>
                        </DialogTitle>
                        <DialogDescription className="text-nexus-light/90 pt-1 text-base font-medium text-blue-100">
                            Quickly view product availability.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10 w-full">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search product name or SKU..."
                            className="pl-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {/* List Content */}
                <div className="bg-background min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Loading inventory...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-2">
                            <Package className="h-10 w-10 opacity-20" />
                            <p>No products found.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px] p-2">
                            <div className="space-y-1">
                                {filteredItems.map((item) => {
                                    const isLowStock = item.stock <= (item.low_stock || 5);
                                    const isOutOfStock = item.stock === 0;

                                    return (
                                        <div key={item.sku} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors group border border-transparent hover:border-border/50">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold ${isOutOfStock ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                                    {item.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.sku}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-2 mb-1">
                                                    {isLowStock && !isOutOfStock && (
                                                        <AlertTriangle className="h-3 w-3 text-warning animate-pulse" />
                                                    )}
                                                    <span className={`text-sm font-bold ${isOutOfStock ? 'text-destructive' : isLowStock ? 'text-warning' : 'text-success'}`}>
                                                        {item.stock} in stock
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">${item.price.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
