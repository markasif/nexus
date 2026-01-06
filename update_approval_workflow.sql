-- 1. Update constraint if it exists (using a safe approach)
-- We'll try to drop the constraint if it has a common name, or just trust the app if text.
-- But to be safe and "Pro", let's ensure the status column accepts our new value.
-- If it's a simple TEXT column without constraints (common in Supabase starters unless specified), we are good.
-- If there is a check constraint, we need to alter it.
DO $$ 
BEGIN 
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check; 
EXCEPTION 
    WHEN undefined_object THEN NULL; 
END $$;

ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost', 'pending_verification'));

-- 2. Update the Stage Labels Setting (for the frontend to potentially read)
UPDATE public.crm_settings 
SET stage_labels = '{"new": "New", "qualified": "Qualified", "proposal": "Proposal", "negotiation": "Negotiation", "pending_verification": "Pending Verification", "closed-won": "Closed Won", "closed-lost": "Closed Lost"}'::jsonb
WHERE id IS NOT NULL;

-- 3. Verify Trigger Logic 
-- The existing handle_deal_won trigger ALREADY checks "IF NEW.status = 'closed-won'".
-- So, if an employee moves it to 'pending_verification', the trigger will NOT fire.
-- This is exactly what we want. The commission will only fire when the ADMIN later moves it to 'closed-won'.
-- No trigger update needed unless we want to be extra safe, but the current logic holds:
-- "IF NEW.status = 'closed-won' AND ..." -> Only fires on final approval.
