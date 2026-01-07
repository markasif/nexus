import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddProductDialog } from '@/components/inventory/AddProductDialog';
import { InventoryItem } from '@/types/inventory';
import { ReportIssueDialog } from '@/components/inventory/ReportIssueDialog';
import { InventoryRequestsList } from '@/components/inventory/InventoryRequestsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ScrollReveal } from '@/components/ui/ScrollReveal';
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

  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [activeTab, setActiveTab] = useState("catalog");

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
            purchase_price: parseFloat(item.purchase_price || 0),
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
    setEditingProduct(item);
    setIsEditing(true);
    setIsAddProductOpen(true);
  };



  const handleRequestRestock = async (item: InventoryItem) => {
    try {
      const { error } = await supabase
        .from('inventory_requests')
        .insert({
          sku: item.sku,
          user_id: user?.id,
          request_type: 'restock',
          status: 'pending'
        });

      if (error) throw error;
      toast.success(`Restock requested for ${item.name}`);
    } catch (error) {
      console.error('Error requesting restock:', error);
      toast.error('Failed to request restock');
    }
  };

  const [issueDialogState, setIssueDialogState] = useState<{ open: boolean, sku: string, name: string }>({
    open: false,
    sku: '',
    name: ''
  });

  const handleReportIssue = (item: InventoryItem) => {
    setIssueDialogState({
      open: true,
      sku: item.sku,
      name: item.name
    });
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

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsEditing(false);
    setIsAddProductOpen(true);
  };

  const inStockCount = items.filter((i) => i.status === 'in-stock').length;
  const lowStockCount = items.filter((i) => i.status === 'low-stock').length;
  const outOfStockCount = items.filter((i) => i.status === 'out-of-stock').length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <ScrollReveal width="100%">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Inventory</h1>
              <p className="text-muted-foreground">Manage your products and stock levels</p>
            </div>

            <div className="flex items-center gap-3">
              {isAdmin && (
                <Button variant="nexus" className="shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => { setIsEditing(false); setIsAddProductOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              )}
            </div>

            <AddProductDialog
              open={isAddProductOpen}
              onOpenChange={setIsAddProductOpen}
              onProductSaved={() => {
                fetchInventory();
                setIsAddProductOpen(false);
              }}
              productToEdit={editingProduct}
            />

            <ReportIssueDialog
              open={issueDialogState.open}
              onOpenChange={(open) => setIssueDialogState(prev => ({ ...prev, open }))}
              sku={issueDialogState.sku}
              productName={issueDialogState.name}
            />
          </div>
        </ScrollReveal>

        <Tabs defaultValue="catalog" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          {isAdmin && (
            <ScrollReveal width="100%">
              <TabsList className="bg-white border w-full max-w-[400px] grid grid-cols-2">
                <TabsTrigger value="catalog" className="h-9">
                  Product Catalog
                </TabsTrigger>
                <TabsTrigger value="requests" className="h-9">
                  Requests & Issues
                </TabsTrigger>
              </TabsList>
            </ScrollReveal>
          )}

          <TabsContent value="catalog" className="space-y-8 mt-8">
            {/* Stats */}
            <ScrollReveal width="100%">
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
            </ScrollReveal>

            {/* Inventory Table */}
            <ScrollReveal width="100%">
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
                        <TableHead className="text-right">Actions</TableHead>
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
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>

                                {isAdmin ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleEditProduct(item)} className="cursor-pointer">
                                      <Pencil className="mr-2 h-4 w-4" /> Edit Product
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDeleteProduct(item.sku)} className="text-destructive focus:text-destructive cursor-pointer">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete Product
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem onClick={() => handleRequestRestock(item)} className="cursor-pointer text-blue-600 focus:text-blue-700">
                                      <Box className="mr-2 h-4 w-4" /> Request Restock
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleReportIssue(item)} className="cursor-pointer text-orange-600 focus:text-orange-700">
                                      <AlertTriangle className="mr-2 h-4 w-4" /> Report Issue
                                    </DropdownMenuItem>
                                  </>
                                )}

                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card >
            </ScrollReveal>
          </TabsContent>

          <TabsContent value="requests" className="space-y-6 mt-8">
            <ScrollReveal width="100%">
              <InventoryRequestsList />
            </ScrollReveal>
          </TabsContent>
        </Tabs>
      </div >
    </DashboardLayout >
  );
}
