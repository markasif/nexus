
-- 1. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.profiles(id),
    date DATE DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    total_hours NUMERIC GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600
    ) STORED,
    status TEXT DEFAULT 'present', -- 'present', 'half-day', 'absent'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS POLICIES
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Allow employees to read their own attendance
CREATE POLICY "Employees can see their own attendance"
ON public.attendance FOR SELECT
USING (auth.uid() = employee_id);

-- Allow employees to insert their own attendance (Clock In)
CREATE POLICY "Employees can clock in"
ON public.attendance FOR INSERT
WITH CHECK (auth.uid() = employee_id);

-- Allow employees to update their own attendance (Clock Out)
CREATE POLICY "Employees can clock out"
ON public.attendance FOR UPDATE
USING (auth.uid() = employee_id);

-- Allow admins to view all attendance
CREATE POLICY "Admins can view all attendance"
ON public.attendance FOR ALL
USING (is_admin());

-- 3. PERMISSIONS
GRANT ALL ON TABLE public.attendance TO anon, authenticated;
