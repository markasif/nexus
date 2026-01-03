-- FIX SETTINGS TABLE PERMISSIONS
-- Run this in the Supabase SQL Editor

-- 0. Ensure helper function exists (matches setup_database.sql)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 1. Ensure table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.crm_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT DEFAULT 'My Company',
    company_email TEXT,
    tax_id TEXT,
    currency TEXT DEFAULT 'USD',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Authenticated users can view settings
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.crm_settings;
CREATE POLICY "Authenticated users can view settings"
ON public.crm_settings
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Admins can update settings
-- Using is_admin() if available, otherwise check metadata or allow authenticated for now if admin check is complex
-- Fallback: if is_admin() doesn't exist, this might fail. But based on inventory setup, it should exist.
DROP POLICY IF EXISTS "Admins can update settings" ON public.crm_settings;
CREATE POLICY "Admins can update settings"
ON public.crm_settings
FOR ALL
USING (is_admin());

-- Policy: Allow insert if table is empty (bootstrapping)
DROP POLICY IF EXISTS "Allow initial setup" ON public.crm_settings;
CREATE POLICY "Allow initial setup"
ON public.crm_settings
FOR INSERT
WITH CHECK (
    (SELECT count(*) FROM public.crm_settings) = 0
    OR is_admin()
);

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_crm_settings_updated_at ON public.crm_settings;
CREATE TRIGGER update_crm_settings_updated_at
    BEFORE UPDATE ON public.crm_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_settings_updated_at_column();
