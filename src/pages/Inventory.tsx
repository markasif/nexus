import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  MoreHorizontal,
  Tag,
  DollarSign,
  Box,
  AlertOctagon,
  Layers,
  Loader2,
  Trash2,
  Pencil
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  'in-stock': 'success',
  'low-stock': 'warning',
  'out-of-stock': 'destructive',
};

const statusLabel: Record<string, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
};

interface InventoryItem {
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const { settings, currencySymbol } = useSettings();

  const [newProduct, setNewProduct] = useState({
    sku: '',
    name: '',
    category: '',
    price: '',
    stock: '',
    lowStock: settings.low_stock_threshold.toString(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedItems = data.map(item => {
          let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
          if (item.stock === 0) status = 'out-of-stock';
          else if (item.stock <= item.low_stock) status = 'low-stock';

          return {
            sku: item.sku,
            name: item.name,
            category: item.category || 'Uncategorized',
            price: parseFloat(item.price),
            stock: item.stock,
            lowStock: item.low_stock || 0,
            status: status,
          };
        });
        setItems(formattedItems);
      }
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!newProduct.sku.trim()) newErrors.sku = 'SKU is required';
    if (!newProduct.name.trim()) newErrors.name = 'Product name is required';
    if (!newProduct.category) newErrors.category = 'Category is required';

    if (!newProduct.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(newProduct.price) < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (!newProduct.stock) {
      newErrors.stock = 'Stock is required';
    } else if (parseInt(newProduct.stock) < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    if (!newProduct.lowStock) {
      newErrors.lowStock = 'Low stock level is required';
    } else if (parseInt(newProduct.lowStock) < 0) {
      newErrors.lowStock = 'Cannot be negative';
    } else if (newProduct.stock && parseInt(newProduct.lowStock) >= parseInt(newProduct.stock)) {
      newErrors.lowStock = 'Low stock level must be less than current stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) return;

    const stock = parseInt(newProduct.stock);
    const lowStock = parseInt(newProduct.lowStock) || 0;

    // Construct DB payload (snake_case)
    const dbPayload = {
      sku: newProduct.sku,
      name: newProduct.name,
      category: newProduct.category || 'Uncategorized',
      price: parseFloat(newProduct.price),
      stock: stock,
      low_stock: lowStock, // Map camelCase to snake_case for DB
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('inventory')
          .update(dbPayload)
          .eq('sku', newProduct.sku);

        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([dbPayload]);

        if (error) throw error;
        toast.success('Product added successfully');
      }

      // Refresh inventory to get latest state (including any DB triggers/defaults)
      await fetchInventory();
      resetForm();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };


  const handleDeleteProduct = async (sku: string) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('sku', sku);

      if (error) throw error;

      setItems(items.filter(item => item.sku !== sku));
      toast.success('Product deleted successfully');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleEditProduct = (item: InventoryItem) => {
    setNewProduct({
      sku: item.sku,
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      stock: item.stock.toString(),
      lowStock: item.lowStock.toString(),
    });
    setIsEditing(true);
    setIsAddProductOpen(true);
  };

  const resetForm = () => {
    setNewProduct({
      sku: '',
      name: '',
      category: '',
      price: '',
      stock: '',
      lowStock: settings.low_stock_threshold.toString(),
    });
    setErrors({});
    setIsEditing(false);
    setIsAddProductOpen(false);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' ||
      (statusFilter === 'Low Stock' && item.status === 'low-stock') ||
      (statusFilter === 'Out of Stock' && item.status === 'out-of-stock') ||
      (statusFilter === 'In Stock' && item.status === 'in-stock');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(items.map((item) => item.category)));

  const inStockCount = items.filter((i) => i.status === 'in-stock').length;
  const lowStockCount = items.filter((i) => i.status === 'low-stock').length;
  const outOfStockCount = items.filter((i) => i.status === 'out-of-stock').length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">Manage your products and stock levels</p>
          </div>
          {isAdmin && (
            <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsAddProductOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  <DialogDescription>
                    {isEditing ? 'Make changes to the product here.' : 'Add a new product to your inventory.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                        disabled={isEditing}
                        placeholder="PROD-001"
                      />
                      {errors.sku && <p className="text-sm text-destructive">{errors.sku}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="Product Name"
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                          {['Electronics', 'Clothing', 'Accessories', 'Home'].map((cat) => (
                            !categories.includes(cat) && <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          className="pl-8"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        placeholder="0"
                      />
                      {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lowStock">Low Stock Alert</Label>
                      <Input
                        id="lowStock"
                        type="number"
                        value={newProduct.lowStock}
                        onChange={(e) => setNewProduct({ ...newProduct, lowStock: e.target.value })}
                        placeholder="5"
                      />
                      {errors.lowStock && <p className="text-sm text-destructive">{errors.lowStock}</p>}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProduct}>
                    {isEditing ? 'Save Changes' : 'Add Product'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
          }
        </div >

        {/* Stats */}
        < div className="grid gap-6 sm:grid-cols-4" >
          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total SKUs</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-bold">{inStockCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">{outOfStockCount}</p>
              </div>
            </CardContent>
          </Card>
        </div >

        {/* Inventory Table */}
        < Card >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Product Catalog</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  {isAdmin && <TableHead>Price</TableHead>}
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    {isAdmin && <TableCell>${item.price.toLocaleString()}</TableCell>}
                    <TableCell>
                      <span
                        className={
                          item.stock <= item.lowStock
                            ? 'font-semibold text-warning'
                            : ''
                        }
                      >
                        {item.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[item.status]}>
                        {statusLabel[item.status]}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditProduct(item)} className="cursor-pointer">
                              <Pencil className="mr-2 h-4 w-4" /> Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteProduct(item.sku)} className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card >
      </div >
    </DashboardLayout >
  );
}
