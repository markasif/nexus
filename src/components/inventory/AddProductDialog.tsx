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

// Define the interface locally or import it if available. 
// Matching Inventory.tsx interface for consistency
export interface InventoryItem {
    sku: string;
    name: string;
    category: string;
    price: number;
    purchase_price: number;
    stock: number;
    lowStock: number;
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

interface AddProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onProductSaved: () => void;
    productToEdit?: InventoryItem | null;
}

export function AddProductDialog({
    open,
    onOpenChange,
    onProductSaved,
    productToEdit
}: AddProductDialogProps) {
    const { settings } = useSettings();
    const [loading, setLoading] = useState(false);

    // We need categories for the dropdown. 
    // In a real app, these might come from a separate table or be passed in.
    // For now, we'll hardcode common ones + what's in use, or just allow free text? 
    // Inventory.tsx had: ['Electronics', 'Clothing', 'Accessories', 'Home']
    const textCategories = ['Electronics', 'Clothing', 'Accessories', 'Home', 'Office', 'Industrial', 'Hardware'];

    const [formData, setFormData] = useState({
        sku: "",
        name: "",
        category: "",
        price: "",
        purchasePrice: "",
        stock: "",
        lowStock: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            if (productToEdit) {
                setFormData({
                    sku: productToEdit.sku,
                    name: productToEdit.name,
                    category: productToEdit.category,
                    price: productToEdit.price.toString(),
                    purchasePrice: (productToEdit.purchase_price || 0).toString(),
                    stock: productToEdit.stock.toString(),
                    lowStock: productToEdit.lowStock.toString()
                });
            } else {
                // Reset for new product
                setFormData({
                    sku: "",
                    name: "",
                    category: "",
                    price: "",
                    purchasePrice: "",
                    stock: "",
                    lowStock: settings.low_stock_threshold.toString()
                });
            }
            setErrors({});
        }
    }, [open, productToEdit, settings.low_stock_threshold]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.category) newErrors.category = 'Category is required';

        if (!formData.price) {
            newErrors.price = 'Price is required';
        } else if (parseFloat(formData.price) < 0) {
            newErrors.price = 'Price cannot be negative';
        }

        if (formData.purchasePrice && parseFloat(formData.purchasePrice) < 0) {
            newErrors.purchasePrice = 'Cost cannot be negative';
        }

        if (!formData.stock) {
            newErrors.stock = 'Stock is required';
        } else if (parseInt(formData.stock) < 0) {
            newErrors.stock = 'Stock cannot be negative';
        }

        if (!formData.lowStock) {
            newErrors.lowStock = 'Low stock level is required';
        } else if (parseInt(formData.lowStock) < 0) {
            newErrors.lowStock = 'Cannot be negative';
        } else if (formData.stock && parseInt(formData.lowStock) >= parseInt(formData.stock)) {
            // Warning but not blocking? Or blocking logic from Inventory.tsx
            // Inventory.tsx had: if (newProduct.stock && parseInt(newProduct.lowStock) >= parseInt(newProduct.stock))
            // It was blocking.
            newErrors.lowStock = 'Low stock level must be less than current stock';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        const stock = parseInt(formData.stock);
        const lowStock = parseInt(formData.lowStock) || 0;

        const dbPayload = {
            sku: formData.sku,
            name: formData.name,
            category: formData.category || 'Uncategorized',
            price: parseFloat(formData.price),
            purchase_price: parseFloat(formData.purchasePrice || '0'),
            stock: stock,
            low_stock: lowStock,
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

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5 bg-background">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="sku" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5 text-nexus-primary" /> SKU Code
                            </Label>
                            <Input
                                id="sku"
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                disabled={!!productToEdit}
                                placeholder="PROD-001"
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40 disabled:opacity-70"
                            />
                            {errors.sku && <p className="text-xs text-destructive font-medium">{errors.sku}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-nexus-primary" /> Product Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Wireless Headphones"
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                            {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-nexus-primary" /> Category
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                            {errors.category && <p className="text-xs text-destructive font-medium">{errors.category}</p>}
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
                                    className="h-11 pl-7 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            {errors.price && <p className="text-xs text-destructive font-medium">{errors.price}</p>}
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
                                className="h-11 pl-7 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                                value={formData.purchasePrice}
                                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>
                        {errors.purchasePrice && <p className="text-xs text-destructive font-medium">{errors.purchasePrice}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="stock" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-nexus-primary" /> Current Stock
                            </Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                placeholder="0"
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                            {errors.stock && <p className="text-xs text-destructive font-medium">{errors.stock}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lowStock" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-nexus-primary" /> Low Stock Alert
                            </Label>
                            <Input
                                id="lowStock"
                                type="number"
                                value={formData.lowStock}
                                onChange={(e) => setFormData({ ...formData, lowStock: e.target.value })}
                                placeholder="5"
                                className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white focus:border-nexus-primary/50 focus:ring-4 focus:ring-nexus-primary/10 transition-all font-medium placeholder:text-muted-foreground/40"
                            />
                            {errors.lowStock && <p className="text-xs text-destructive font-medium">{errors.lowStock}</p>}
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
