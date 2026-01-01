import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Package, AlertTriangle, TrendingUp, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const inventory = [
  {
    sku: 'SKU-001',
    name: 'Premium Widget Pro',
    category: 'Electronics',
    price: 299.99,
    stock: 145,
    lowStock: 20,
    status: 'in-stock',
  },
  {
    sku: 'SKU-002',
    name: 'Enterprise Server Rack',
    category: 'Hardware',
    price: 2499.99,
    stock: 8,
    lowStock: 10,
    status: 'low-stock',
  },
  {
    sku: 'SKU-003',
    name: 'Cloud License Bundle',
    category: 'Software',
    price: 599.99,
    stock: 250,
    lowStock: 50,
    status: 'in-stock',
  },
  {
    sku: 'SKU-004',
    name: 'Security Camera System',
    category: 'Electronics',
    price: 899.99,
    stock: 3,
    lowStock: 5,
    status: 'low-stock',
  },
  {
    sku: 'SKU-005',
    name: 'Networking Switch 48-Port',
    category: 'Hardware',
    price: 1299.99,
    stock: 42,
    lowStock: 15,
    status: 'in-stock',
  },
  {
    sku: 'SKU-006',
    name: 'SSD Storage Drive 1TB',
    category: 'Hardware',
    price: 149.99,
    stock: 0,
    lowStock: 25,
    status: 'out-of-stock',
  },
];

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
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const inStockCount = inventory.filter((i) => i.status === 'in-stock').length;
  const lowStockCount = inventory.filter((i) => i.status === 'low-stock').length;
  const outOfStockCount = inventory.filter((i) => i.status === 'out-of-stock').length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? 'Manage products, stock levels, and pricing'
                : 'Search and check product availability'}
            </p>
          </div>
          {isAdmin && (
            <Button variant="nexus">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-6 sm:grid-cols-4">
          <Card variant="kpi">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total SKUs</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
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
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Product Catalog</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-9 w-64" />
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
                {inventory.map((item) => (
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
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
