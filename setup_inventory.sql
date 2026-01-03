-- INVENTORY TABLE SETUP
-- Run this in the Supabase SQL Editor

-- 1. Create inventory_items table
CREATE TABLE public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Authenticated users can view inventory
CREATE POLICY "Authenticated users can view inventory"
ON public.inventory_items
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Admins can insert/update/delete inventory
-- Assumes 'is_admin()' function exists from previous setup
CREATE POLICY "Admins can manage inventory"
ON public.inventory_items
FOR ALL
USING (is_admin());

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
