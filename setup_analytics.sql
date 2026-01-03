-- ANALYTICS & INVENTORY SETUP
-- Run this to create tables for Dashboard Analytics (Revenue, Inventory, Employee Stats)

-- 1. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access for all authenticated users" ON public.inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for admins" ON public.inventory FOR ALL USING (is_admin());

-- Dummy Data for Inventory
INSERT INTO public.inventory (sku, name, category, price, stock, low_stock_threshold) VALUES
('SKU-001', 'Premium Widget Pro', 'Electronics', 299.99, 145, 20),
('SKU-002', 'Enterprise Server Rack', 'Hardware', 2499.99, 8, 10),
('SKU-003', 'Cloud License Bundle', 'Software', 599.99, 250, 50),
('SKU-004', 'Security Camera System', 'Electronics', 899.99, 3, 5),
('SKU-005', 'Networking Switch 48-Port', 'Hardware', 1299.99, 42, 15),
('SKU-006', 'SSD Storage Drive 1TB', 'Hardware', 149.99, 0, 25)
ON CONFLICT (sku) DO NOTHING;


-- 2. ORDERS TABLE (For Revenue & Employee Performance)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('completed', 'pending', 'cancelled')) DEFAULT 'completed',
    employee_id UUID REFERENCES public.profiles(id), -- Linked to the employee who closed the deal
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access for all authenticated users" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for admins" ON public.orders FOR ALL USING (is_admin());

-- Dummy Data for Orders (Generating some random past data for charts)
-- We attach these orders to the first found user (likely the admin/you) so Top Performers has data.
WITH first_user AS (SELECT id FROM public.profiles LIMIT 1)
INSERT INTO public.orders (amount, status, created_at, employee_id) VALUES
(5000, 'completed', NOW() - INTERVAL '1 day', (SELECT id FROM first_user)),
(12000, 'completed', NOW() - INTERVAL '3 days', (SELECT id FROM first_user)),
(3500, 'completed', NOW() - INTERVAL '5 days', (SELECT id FROM first_user)),
(8000, 'completed', NOW() - INTERVAL '1 month', (SELECT id FROM first_user)),
(15000, 'completed', NOW() - INTERVAL '1 month', (SELECT id FROM first_user)),
(45000, 'completed', NOW() - INTERVAL '2 months', (SELECT id FROM first_user)),
(62000, 'completed', NOW() - INTERVAL '3 months', (SELECT id FROM first_user));

-- 3. PERMISSIONS
GRANT ALL ON TABLE public.inventory TO anon, authenticated;
GRANT ALL ON TABLE public.orders TO anon, authenticated;
