-- 1. Add commission_percentage to crm_settings table if not exists
DO $$ 
BEGIN 
    ALTER TABLE public.crm_settings ADD COLUMN commission_percentage NUMERIC(5, 2) DEFAULT 10.00; 
EXCEPTION 
    WHEN duplicate_column THEN NULL; 
END $$;

-- 2. Update the handle_deal_won trigger function to use the dynamic setting
CREATE OR REPLACE FUNCTION public.handle_deal_won()
RETURNS TRIGGER AS $$
DECLARE
    config_rate DECIMAL;
    commission_val NUMERIC(10, 2);
BEGIN
    -- Ensure at least one row exists
    INSERT INTO public.crm_settings (round_robin_enabled, monthly_revenue_target, commission_percentage)
    SELECT FALSE, 100000, 10.00
    WHERE NOT EXISTS (SELECT 1 FROM public.crm_settings);

    -- Check if status changed to 'closed-won'
    IF NEW.status = 'closed-won' AND (OLD.status IS NULL OR OLD.status <> 'closed-won') THEN
        
        -- Fetch commission percentage from settings (default to 10 if missing)
        SELECT COALESCE(commission_percentage, 10.00) INTO config_rate 
        FROM public.crm_settings 
        LIMIT 1;
        
        -- Calculate commission (Rate is percentage, e.g. 5 for 5%)
        -- value * (rate / 100)
        commission_val := COALESCE(NEW.value, 0) * (config_rate / 100.0);
        
        -- Insert into commissions table
        -- Only if assigned_to is set
        IF NEW.assigned_to IS NOT NULL THEN
            INSERT INTO public.commissions (employee_id, deal_id, amount, status, date)
            VALUES (
                NEW.assigned_to, 
                NEW.id, 
                commission_val, 
                'pending', 
                NOW()
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
