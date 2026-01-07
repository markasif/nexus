import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Loader2,
    Package,
    DollarSign,
    Layers,
    AlertTriangle,
    Tag,
    Pencil
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { InventoryItem } from '@/types/inventory';

interface AddProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProductSaved: () => void;
    productToEdit?: InventoryItem | null;
}

const productSchema = z.object({
    sku: z.string().min(1, "SKU is required"),
    name: z.string().min(1, "Product name is required"),
    category: z.string().min(1, "Category is required"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    purchasePrice: z.coerce.number().min(0, "Cost cannot be negative").optional().default(0),
    stock: z.coerce.number().min(0, "Stock cannot be negative"),
    lowStock: z.coerce.number().min(0, "Low stock level cannot be negative"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function AddProductDialog({
    open,
    onOpenChange,
    onProductSaved,
    productToEdit
}: AddProductDialogProps) {
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);

    const textCategories = ['Electronics', 'Clothing', 'Accessories', 'Home', 'Office', 'Industrial', 'Hardware'];

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            sku: "",
            name: "",
            category: "",
            price: 0,
            purchasePrice: 0,
            stock: 0,
            lowStock: settings.low_stock_threshold || 5
        }
    });

    useEffect(() => {
        if (open) {
            if (productToEdit) {
                form.reset({
                    sku: productToEdit.sku,
                    name: productToEdit.name,
                    category: productToEdit.category,
                    price: productToEdit.price,
                    purchasePrice: productToEdit.purchase_price || 0,
                    stock: productToEdit.stock,
                    lowStock: productToEdit.lowStock
                });
            } else {
                form.reset({
                    sku: "",
                    name: "",
                    category: "",
                    price: 0,
                    purchasePrice: 0,
                    stock: 0,
                    lowStock: settings.low_stock_threshold || 5
                });
            }
        }
    }, [open, productToEdit, settings.low_stock_threshold, form]);

    const handleSubmit = async (data: ProductFormValues) => {
        setLoading(true);
        const dbPayload = {
            sku: data.sku,
            name: data.name,
            category: data.category,
            price: data.price,
            purchase_price: data.purchasePrice,
            stock: data.stock,
            low_stock: data.lowStock,
        };

        try {
            if (productToEdit) {
                const { error } = await supabase
                    .from('inventory')
                    .update(dbPayload)
                    .eq('sku', productToEdit.sku);

                if (error) throw error;
                toast.success('Product updated successfully');
            } else {
                const { error } = await supabase
                    .from('inventory')
                    .insert([dbPayload]);

                if (error) throw error;
                toast.success('Product added successfully');
            }

            onProductSaved();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error saving product:', error);
            toast.error(error.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] overflow-hidden p-0 gap-0 border-0 shadow-2xl">
                {/* Premium Header with Gradient */}
                <div className="relative bg-gradient-to-br from-nexus-dark to-nexus-primary px-6 py-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-20 w-20 rounded-full bg-black/20 blur-xl"></div>

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-inner">
                                {productToEdit ? <Pencil className="h-5 w-5 text-white" /> : <Package className="h-5 w-5 text-white" />}
                            </div>
                            <span className="tracking-tight">{productToEdit ? 'Edit Product' : 'Add New Product'}</span>
                        </DialogTitle>
                        <DialogDescription className="text-nexus-light/90 pt-1 text-base font-medium">
                            {productToEdit ? 'Update product details and stock levels.' : 'Add a new item to your inventory catalog.'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="px-6 py-6 space-y-5 bg-background">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5 text-nexus-primary" /> SKU Code
                            </Label>
                            <Input
                                id="sku"
                                placeholder="PROD-001"
                                disabled={!!productToEdit}
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40 disabled:opacity-70"
                                {...form.register("sku")}
                            />
                            {form.formState.errors.sku && <p className="text-xs text-destructive font-medium">{form.formState.errors.sku.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-nexus-primary" /> Product Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. Wireless Headphones"
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                {...form.register("name")}
                            />
                            {form.formState.errors.name && <p className="text-xs text-destructive font-medium">{form.formState.errors.name.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-nexus-primary" /> Category
                            </Label>
                            <Select
                                value={form.watch("category") || ""}
                                onValueChange={(value) => form.setValue("category", value)}
                            >
                                <SelectTrigger className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {textCategories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.category && <p className="text-xs text-destructive font-medium">{form.formState.errors.category.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-nexus-primary" /> Price
                            </Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</div>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    className="h-11 pl-7 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                    placeholder="0.00"
                                    {...form.register("price")}
                                />
                            </div>
                            {form.formState.errors.price && <p className="text-xs text-destructive font-medium">{form.formState.errors.price.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purchasePrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-nexus-primary" /> Purchase Cost
                        </Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</div>
                            <Input
                                id="purchasePrice"
                                type="number"
                                step="0.01"
                                className="h-11 pl-7 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                placeholder="0.00"
                                {...form.register("purchasePrice")}
                            />
                        </div>
                        {form.formState.errors.purchasePrice && <p className="text-xs text-destructive font-medium">{form.formState.errors.purchasePrice.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-nexus-primary" /> Current Stock
                            </Label>
                            <Input
                                id="stock"
                                type="number"
                                placeholder="0"
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                {...form.register("stock")}
                            />
                            {form.formState.errors.stock && <p className="text-xs text-destructive font-medium">{form.formState.errors.stock.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lowStock" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-nexus-primary" /> Low Stock Alert
                            </Label>
                            <Input
                                id="lowStock"
                                type="number"
                                placeholder="5"
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                {...form.register("lowStock")}
                            />
                            {form.formState.errors.lowStock && <p className="text-xs text-destructive font-medium">{form.formState.errors.lowStock.message}</p>}
                        </div>
                    </div>

                    <DialogFooter className="pt-6 border-t border-gray-100 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6 border-gray-200 hover:bg-gray-50 hover:text-nexus-dark font-medium transition-all">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="h-11 px-8 bg-nexus-dark hover:bg-nexus-primary text-white shadow-lg hover:shadow-nexus-primary/50 transition-all duration-300 font-semibold">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (productToEdit ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />)}
                            {productToEdit ? 'Save Changes' : 'Add Product'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
