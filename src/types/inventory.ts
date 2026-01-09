export interface InventoryItem {
    sku: string;
    name: string;
    category: string;
    price: number;
    purchase_price: number;
    stock: number;
    lowStock: number;
    low_stock?: number; // Handling potential inconsistency
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
    archived?: boolean;
}
