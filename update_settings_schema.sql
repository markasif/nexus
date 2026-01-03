-- UPDATE CRM SETTINGS TABLE
-- Run this in Supabase SQL Editor

-- Add Company Info columns if they don't exist
ALTER TABLE public.crm_settings 
ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'My Company',
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
