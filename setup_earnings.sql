-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Cleanup old incompatible tables (We are switching to relational deal_id instead of text deal_name)
DROP TABLE IF EXISTS public.commissions CASCADE;
DROP TABLE IF EXISTS public.payroll CASCADE;

-- 1. Create Commissions Table
CREATE TABLE public.commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.leads(id) ON DELETE SET NULL, -- specific deal source
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'paid', 'rejected')) DEFAULT 'pending',
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Payroll Table
CREATE TABLE public.payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- First day of the month, e.g., '2023-10-01'
    base_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10, 2) GENERATED ALWAYS AS (base_amount + commission_amount) STORED,
    status TEXT CHECK (status IN ('processing', 'processed', 'paid')) DEFAULT 'processing',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Employees can view their own commissions
CREATE POLICY "Employees can view own commissions" ON public.commissions
    FOR SELECT USING (auth.uid() = employee_id);

-- Employees can view their own payroll
CREATE POLICY "Employees can view own payroll" ON public.payroll
    FOR SELECT USING (auth.uid() = employee_id);

-- Admins can view all
CREATE POLICY "Admins can manage all commissions" ON public.commissions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

CREATE POLICY "Admins can manage all payroll" ON public.payroll
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
    );

-- 5. Trigger: Auto-create commission when Deal is Won
CREATE OR REPLACE FUNCTION public.handle_deal_won()
RETURNS TRIGGER AS $$
DECLARE
    config_rate DECIMAL;
    commission_val NUMERIC(10, 2);
BEGIN
    -- Check if status changed to 'closed-won'
    IF NEW.status = 'closed-won' AND (OLD.status IS NULL OR OLD.status <> 'closed-won') THEN
        
        -- Fetch commission percentage from settings (default to 10 if missing)
        -- Ensure crm_settings exists
        BEGIN
            SELECT COALESCE(commission_percentage, 10.00) INTO config_rate 
            FROM public.crm_settings 
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            config_rate := 10.00;
        END;

        -- Fallback if table empty
        IF config_rate IS NULL THEN config_rate := 10.00; END IF;

        -- Calculate commission
        commission_val := COALESCE(NEW.value, 0) * (config_rate / 100.0);
        
        -- Insert into commissions table
        -- Only if assigned_to is set
        IF NEW.assigned_to IS NOT NULL THEN
            INSERT INTO public.commissions (employee_id, deal_id, amount, status, date)
            VALUES (
                NEW.assigned_to, 
                NEW.id, 
                commission_val, 
                'paid', 
                NOW()
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_deal_won ON public.leads;

CREATE TRIGGER on_deal_won
AFTER UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.handle_deal_won();

-- 6. Backfill commissions for existing Won deals using the SETTING
DO $$
DECLARE
    current_rate DECIMAL;
BEGIN
    -- Get current rate
    BEGIN
        SELECT COALESCE(commission_percentage, 10.00) INTO current_rate 
        FROM public.crm_settings 
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        current_rate := 10.00;
    END;
    
    IF current_rate IS NULL THEN current_rate := 10.00; END IF;

    INSERT INTO public.commissions (employee_id, deal_id, amount, status, date)
    SELECT 
        l.assigned_to,
        l.id,
        COALESCE(l.value, 0) * (current_rate / 100.0),
        'paid',
        l.updated_at
    FROM public.leads l
    WHERE l.status = 'closed-won' 
      AND l.assigned_to IS NOT NULL;
END $$;

-- 7. Seed Payroll Data for Current Month (Mock/Initial) for all employees
INSERT INTO public.payroll (employee_id, month, base_amount, commission_amount, status)
SELECT 
    id, 
    DATE_TRUNC('month', CURRENT_DATE), 
    5000.00, -- Default Base Salary
    0.00,   -- Calculated later or updated
    'processing'
FROM public.profiles
WHERE role = 'employee';
