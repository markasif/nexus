-- Add admin_note to leaves table if it doesn't exist
ALTER TABLE public.leaves ADD COLUMN IF NOT EXISTS admin_note TEXT;
