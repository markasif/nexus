-- ADD MISSING COLUMN
-- Run this in the Supabase SQL Editor

ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS low_stock INTEGER DEFAULT 0;

-- Refresh the schema cache (PostgREST sometimes needs this)
NOTIFY pgrst, 'reload config';
