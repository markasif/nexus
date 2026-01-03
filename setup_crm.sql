-- CRM SETUP
-- 1. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- Contact Name
    company TEXT,
    email TEXT,
    phone TEXT,
    value NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('new', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost')) DEFAULT 'new',
    assigned_to UUID REFERENCES public.profiles(id),
    last_contact TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS POLICIES
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Admins: Full Access
CREATE POLICY "Admins full access on leads" 
ON public.leads FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Employees: View Assigned + View Created by them (if unassigned) + View All? 
-- Usually sales teams have visibility, but let's stick to "Assigned Only" for strict control, or "All" for open.
-- User asked for "Global Leads View" for Admin, implying restricted for others.
-- Let's allow Employees to see leads assigned to them.
CREATE POLICY "Employees view assigned leads" 
ON public.leads FOR SELECT 
USING (auth.uid() = assigned_to);

CREATE POLICY "Employees update assigned leads" 
ON public.leads FOR UPDATE 
USING (auth.uid() = assigned_to);

CREATE POLICY "Employees insert leads" 
ON public.leads FOR INSERT 
WITH CHECK (true); -- Anyone can create a lead

-- 3. PERMISSIONS
GRANT ALL ON TABLE public.leads TO anon, authenticated;

-- 4. DUMMY DATA
-- Insert some leads for testing
INSERT INTO public.leads (name, company, email, phone, value, status, assigned_to)
SELECT 'John Doe', 'Acme Corp', 'john@acme.com', '+1234567890', 5000, 'new', id
FROM public.profiles 
WHERE role = 'employee' 
LIMIT 1;
