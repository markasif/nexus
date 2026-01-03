-- HRM SETUP
-- Run this to create tables for Leaves and Payroll management

-- 1. EXTEND PROFILES (If not already present)
-- We add salary and employment details directly to profiles or a separate table.
-- For simplicity, let's keep it in profiles or a 1:1 'employee_details' table.
-- Let's stick to 'employee_details' to keep 'profiles' clean for auth.

CREATE TABLE IF NOT EXISTS public.employee_details (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    base_salary NUMERIC DEFAULT 0,
    commission_rate NUMERIC DEFAULT 0, -- percent
    department TEXT,
    job_title TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.employee_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read access for all auth" ON public.employee_details FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access" ON public.employee_details FOR ALL USING (is_admin());
-- Employees can read their own
CREATE POLICY "Self read" ON public.employee_details FOR SELECT USING (auth.uid() = id);


-- 2. LEAVES TABLE
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.profiles(id),
    type TEXT CHECK (type IN ('sick', 'vacation', 'personal', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON public.leaves FOR ALL USING (is_admin());
CREATE POLICY "Self read/insert" ON public.leaves FOR ALL USING (auth.uid() = employee_id);


-- 3. PAYROLL TABLE (Historical records)
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.profiles(id),
    month DATE NOT NULL, -- e.g., '2025-01-01'
    base_amount NUMERIC,
    commission_amount NUMERIC,
    total_amount NUMERIC,
    status TEXT DEFAULT 'processed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON public.payroll FOR ALL USING (is_admin());
CREATE POLICY "Self read" ON public.payroll FOR SELECT USING (auth.uid() = employee_id);


-- 4. DUMMY DATA GENERATION
-- We need to insert dummy details for existing profiles (like the admin or any user).
-- We'll try to insert for all profiles that don't have details.
INSERT INTO public.employee_details (id, base_salary, commission_rate, department, job_title)
SELECT id, 50000, 5, 'Sales', 'Representative'
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- Insert some dummy leaves
-- Link to first user found
WITH first_user AS (SELECT id FROM public.profiles LIMIT 1)
INSERT INTO public.leaves (employee_id, type, start_date, end_date, status, reason) VALUES
((SELECT id FROM first_user), 'vacation', CURRENT_DATE + 5, CURRENT_DATE + 10, 'pending', 'Summer break'),
((SELECT id FROM first_user), 'sick', CURRENT_DATE - 20, CURRENT_DATE - 19, 'approved', 'Flu'),
((SELECT id FROM first_user), 'personal', CURRENT_DATE + 20, CURRENT_DATE + 21, 'approved', 'Moving house');

-- Permissions
GRANT ALL ON TABLE public.employee_details TO anon, authenticated;
GRANT ALL ON TABLE public.leaves TO anon, authenticated;
GRANT ALL ON TABLE public.payroll TO anon, authenticated;
