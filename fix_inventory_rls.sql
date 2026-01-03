-- FIX INVENTORY TABLE PERMISSIONS
-- Run this in the Supabase SQL Editor

-- 1. Enable RLS on the correct table 'inventory'
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS Policies for 'inventory'

-- Policy: Authenticated users can view inventory
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON public.inventory;
CREATE POLICY "Authenticated users can view inventory"
ON public.inventory
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Admins can insert/update/delete inventory
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
CREATE POLICY "Admins can manage inventory"
ON public.inventory
FOR ALL
USING (is_admin());

-- 3. Ensure columns exist (optional check, safe to run)
-- This adds columns if they are missing to match our frontend expectations
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS low_stock INTEGER DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
