-- ADD SYSTEM CONFIGURATION COLUMNS
-- Run this in Supabase SQL Editor

ALTER TABLE public.crm_settings
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS default_commission NUMERIC DEFAULT 8,
ADD COLUMN IF NOT EXISTS audit_logging BOOLEAN DEFAULT true;

-- Notify to refresh cache if using Realtime
NOTIFY pgrst, 'reload config';
