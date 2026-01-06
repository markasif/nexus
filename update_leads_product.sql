-- Add product column to leads table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'product') THEN
        ALTER TABLE public.leads ADD COLUMN product TEXT;
    END IF;
END $$;
