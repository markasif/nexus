-- FULL DATABASE SETUP SCRIPT
-- Run this in the Supabase SQL Editor to recreate the profiles table and security setup.

-- 1. CLEANUP (Drop existing objects if they exist to start fresh)
-- Be careful: This deletes all data in 'profiles'.
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 2. CREATE PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    base_salary NUMERIC DEFAULT 0,
    commission_percent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. CREATE HELPER FUNCTION (Anti-Recursion Fix)
-- This function allows checking admin status without triggering infinite RLS loops.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 5. CREATE RLS POLICIES

-- Policy: Users can see their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Admins can see ALL profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin());

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Admins can update ALL profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (is_admin());

-- Policy: Allow users to insert their own profile (useful for manual profile creation)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Service Role can do anything (backup/maintenance)
-- (Implicitly true for service role, but good documentation)

-- 6. AUTO-CREATE PROFILE ON SIGNUP (Optional but recommended)
-- This trigger automatically creates a profile row when a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'employee' -- Default role
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated;
-- GRANT ALL ON SEQUENCE public.profiles_id_seq TO anon, authenticated; -- REMOVED: No sequence for UUID PK

-- 8. (Optional) Make the first user an admin manually if needed
-- Instructions: Run this separate command if you want to force a specific user to be admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL@example.com';
-- ENABLE REALTIME FOR SETTINGS
-- Run this in Supabase SQL Editor

-- Add the table to the publication that Supabase Realtime listens to
alter publication supabase_realtime add table crm_settings;
-- MEDIA STORAGE SETUP
-- Run this in Supabase SQL Editor

-- 1. Create a new bucket for avatars
-- Note: Supabase Storage buckets are inserted into 'storage.buckets'
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects (Skipped: Usually enabled by default, and modifying it requires superuser)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policies for 'avatars' bucket

-- Policy: Public access to view avatars
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Policy: Authenticated users can upload their own avatar
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Policy: Users can update their own avatar (delete old, insert new usually, or overwrite)
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);

-- Policy: Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid() = owner
);
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
-- ADVANCED CRM SETUP
-- 1. SETTINGS & CONFIGURATION
CREATE TABLE IF NOT EXISTS public.crm_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    round_robin_enabled BOOLEAN DEFAULT FALSE,
    monthly_revenue_target NUMERIC DEFAULT 100000,
    stage_labels JSONB DEFAULT '{"new": "New", "qualified": "Qualified", "proposal": "Proposal", "negotiation": "Negotiation", "closed-won": "Closed Won", "closed-lost": "Closed Lost"}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Initialize default settings if not exists
INSERT INTO public.crm_settings (round_robin_enabled) 
SELECT FALSE WHERE NOT EXISTS (SELECT 1 FROM public.crm_settings);

-- 2. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.crm_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id),
    action_type TEXT NOT NULL, -- 'CREATED', 'UPDATED', 'STATUS_CHANGE', 'ASSIGNED'
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AUTOMATION: LOGGING TRIGGER
CREATE OR REPLACE FUNCTION log_lead_changes() RETURNS TRIGGER AS $$
DECLARE
    actor_id UUID;
BEGIN
    actor_id := auth.uid();
    
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.crm_activity_logs (lead_id, actor_id, action_type, details)
        VALUES (NEW.id, actor_id, 'CREATED', 'Created new lead: ' || NEW.name);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status IS DISTINCT FROM NEW.status) THEN
            INSERT INTO public.crm_activity_logs (lead_id, actor_id, action_type, details)
            VALUES (NEW.id, actor_id, 'STATUS_CHANGE', 'Moved status from ' || OLD.status || ' to ' || NEW.status);
        END IF;

        IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
             INSERT INTO public.crm_activity_logs (lead_id, actor_id, action_type, details)
            VALUES (NEW.id, actor_id, 'ASSIGNED', 'Reassigned lead');
        END IF;
        
        -- Generic update
        IF (OLD.value IS DISTINCT FROM NEW.value) THEN
             INSERT INTO public.crm_activity_logs (lead_id, actor_id, action_type, details)
            VALUES (NEW.id, actor_id, 'UPDATED', 'Updated deal value to $' || NEW.value);
        END IF;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_lead_changes ON public.leads;
CREATE TRIGGER trigger_log_lead_changes
AFTER INSERT OR UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION log_lead_changes();


-- 4. AUTOMATION: ROUND ROBIN ROUTING
-- Add tracking column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_lead_assigned_at TIMESTAMPTZ DEFAULT '2000-01-01';

CREATE OR REPLACE FUNCTION auto_assign_lead() RETURNS TRIGGER AS $$
DECLARE
    target_emp_id UUID;
    rr_enabled BOOLEAN;
BEGIN
    SELECT round_robin_enabled INTO rr_enabled FROM public.crm_settings LIMIT 1;
    
    -- Only run if enabled and currently unassigned
    IF (rr_enabled = TRUE AND NEW.assigned_to IS NULL) THEN
        -- Find employee with oldest assignment time
        SELECT id INTO target_emp_id 
        FROM public.profiles 
        WHERE role = 'employee' OR role = 'admin' -- inclusive
        ORDER BY last_lead_assigned_at ASC 
        LIMIT 1;

        IF (target_emp_id IS NOT NULL) THEN
            NEW.assigned_to := target_emp_id;
            -- Update their timestamp
            UPDATE public.profiles SET last_lead_assigned_at = NOW() WHERE id = target_emp_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_assign_lead ON public.leads;
CREATE TRIGGER trigger_auto_assign_lead
BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION auto_assign_lead();

-- 5. ANALYTICS RPCs
-- Get overall stats
CREATE OR REPLACE FUNCTION get_crm_stats()
RETURNS JSONB AS $$
DECLARE
    total_val NUMERIC;
    won_count INT;
    total_count INT;
    target_rev NUMERIC;
    negotiation_val NUMERIC;
    conversion_rate NUMERIC;
BEGIN
    SELECT COALESCE(SUM(value), 0) INTO total_val FROM leads;
    SELECT COUNT(*) INTO won_count FROM leads WHERE status = 'closed-won';
    SELECT COUNT(*) INTO total_count FROM leads;
    
    SELECT monthly_revenue_target INTO target_rev FROM crm_settings LIMIT 1;
    SELECT COALESCE(SUM(value), 0) INTO negotiation_val FROM leads WHERE status = 'negotiation';

    IF total_count > 0 THEN
        conversion_rate := round((won_count::numeric / total_count::numeric) * 100, 1);
    ELSE
        conversion_rate := 0;
    END IF;

    RETURN jsonb_build_object(
        'total_revenue', total_val,
        'monthly_target', target_rev,
        'conversion_rate', conversion_rate,
        'pipeline_forecast', negotiation_val * 0.7, -- Weighted forecast (70% of negotiation)
        'total_leads', total_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Leaderboard
CREATE OR REPLACE FUNCTION get_crm_leaderboard()
RETURNS TABLE (
    employee_id UUID,
    full_name TEXT,
    leads_count BIGINT,
    won_count BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        COUNT(l.id) as leads_count,
        COUNT(l.id) FILTER (WHERE l.status = 'closed-won') as won_count,
        COALESCE(SUM(l.value), 0) as total_revenue
    FROM public.profiles p
    LEFT JOIN public.leads l ON p.id = l.assigned_to
    WHERE p.role = 'employee' OR p.role = 'admin'
    GROUP BY p.id, p.full_name
    ORDER BY total_revenue DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for new tables
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage settings" ON public.crm_settings FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role='admin'));
CREATE POLICY "Everyone view settings" ON public.crm_settings FOR SELECT TO authenticated USING (true);

ALTER TABLE public.crm_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View logs" ON public.crm_activity_logs FOR SELECT TO authenticated USING (true); -- Employees can see timeline? Let's say yes for now.

GRANT ALL ON public.crm_settings TO authenticated;
GRANT ALL ON public.crm_activity_logs TO authenticated;
-- INVENTORY TABLE SETUP
-- Run this in the Supabase SQL Editor

-- 1. Create inventory_items table
CREATE TABLE public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Authenticated users can view inventory
CREATE POLICY "Authenticated users can view inventory"
ON public.inventory_items
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Admins can insert/update/delete inventory
-- Assumes 'is_admin()' function exists from previous setup
CREATE POLICY "Admins can manage inventory"
ON public.inventory_items
FOR ALL
USING (is_admin());

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
-- Create a table for inventory requests (Restock & Issues)
create table if not exists public.inventory_requests (
  id uuid default gen_random_uuid() primary key,
  sku text references public.inventory(sku) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  request_type text not null check (request_type in ('restock', 'issue')),
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.inventory_requests enable row level security;

-- Policies
-- 1. Employees can view their own requests, Admins can view all
create policy "Users can view their own requests, Admins view all"
  on public.inventory_requests for select
  using (
    auth.uid() = user_id or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 2. Authenticated users can insert requests
create policy "Authenticated users can create requests"
  on public.inventory_requests for insert
  with check (auth.uid() = user_id);

-- 3. Only Admins can update status
create policy "Admins can update request status"
  on public.inventory_requests for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4. Only Admins can delete requests
create policy "Admins can delete requests"
  on public.inventory_requests for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
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
-- Create leaves table if it doesn't exist
create table if not exists public.leaves (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  employee_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text
);

-- Enable RLS
alter table public.leaves enable row level security;

-- Policy: Employees can view their own leaves
create policy "Users can view their own leaves"
  on public.leaves for select
  using (auth.uid() = employee_id);

-- Policy: Employees can insert their own leaves
create policy "Users can insert their own leaves"
  on public.leaves for insert
  with check (auth.uid() = employee_id);

-- Policy: Admins can view all leaves
create policy "Admins can view all leaves"
  on public.leaves for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policy: Admins can update leaves (approve/reject)
create policy "Admins can update leaves"
  on public.leaves for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
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
-- ANALYTICS & INVENTORY SETUP
-- Run this to create tables for Dashboard Analytics (Revenue, Inventory, Employee Stats)

-- 1. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC DEFAULT 0,
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access for all authenticated users" ON public.inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for admins" ON public.inventory FOR ALL USING (is_admin());

-- Dummy Data for Inventory
INSERT INTO public.inventory (sku, name, category, price, stock, low_stock_threshold) VALUES
('SKU-001', 'Premium Widget Pro', 'Electronics', 299.99, 145, 20),
('SKU-002', 'Enterprise Server Rack', 'Hardware', 2499.99, 8, 10),
('SKU-003', 'Cloud License Bundle', 'Software', 599.99, 250, 50),
('SKU-004', 'Security Camera System', 'Electronics', 899.99, 3, 5),
('SKU-005', 'Networking Switch 48-Port', 'Hardware', 1299.99, 42, 15),
('SKU-006', 'SSD Storage Drive 1TB', 'Hardware', 149.99, 0, 25)
ON CONFLICT (sku) DO NOTHING;


-- 2. ORDERS TABLE (For Revenue & Employee Performance)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('completed', 'pending', 'cancelled')) DEFAULT 'completed',
    employee_id UUID REFERENCES public.profiles(id), -- Linked to the employee who closed the deal
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access for all authenticated users" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for admins" ON public.orders FOR ALL USING (is_admin());

-- Dummy Data for Orders (Generating some random past data for charts)
-- We attach these orders to the first found user (likely the admin/you) so Top Performers has data.
WITH first_user AS (SELECT id FROM public.profiles LIMIT 1)
INSERT INTO public.orders (amount, status, created_at, employee_id) VALUES
(5000, 'completed', NOW() - INTERVAL '1 day', (SELECT id FROM first_user)),
(12000, 'completed', NOW() - INTERVAL '3 days', (SELECT id FROM first_user)),
(3500, 'completed', NOW() - INTERVAL '5 days', (SELECT id FROM first_user)),
(8000, 'completed', NOW() - INTERVAL '1 month', (SELECT id FROM first_user)),
(15000, 'completed', NOW() - INTERVAL '1 month', (SELECT id FROM first_user)),
(45000, 'completed', NOW() - INTERVAL '2 months', (SELECT id FROM first_user)),
(62000, 'completed', NOW() - INTERVAL '3 months', (SELECT id FROM first_user));

-- 3. PERMISSIONS
GRANT ALL ON TABLE public.inventory TO anon, authenticated;
GRANT ALL ON TABLE public.orders TO anon, authenticated;
-- ADVANCED CRM & INVENTORY LOGIC (UPDATED WITH REAL-TIME LOCKING)
-- Run this script in Supabase SQL Editor

-- 1. ENHANCE INVENTORY & ORDERS (Idempotent)
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS profit NUMERIC DEFAULT 0;

-- 2. CREATE LEAD ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.lead_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    sku TEXT REFERENCES public.inventory(sku),
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC DEFAULT 0, -- The Negotiated Deal Price
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Separate command to ensure column exists if table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lead_items' AND column_name='unit_price') THEN
        ALTER TABLE public.lead_items ADD COLUMN unit_price NUMERIC DEFAULT 0;
    END IF;
END $$;

ALTER TABLE public.lead_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can manage lead items" ON public.lead_items;
CREATE POLICY "Authenticated users can manage lead items" ON public.lead_items FOR ALL USING (auth.role() = 'authenticated');
GRANT ALL ON TABLE public.lead_items TO anon, authenticated;

-- 3. CREATE ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    sku TEXT, 
    name TEXT,
    quantity INTEGER,
    price NUMERIC, 
    cost NUMERIC, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.order_items;
CREATE POLICY "Authenticated users can view order items" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
GRANT ALL ON TABLE public.order_items TO anon, authenticated;


-- ==============================================================================
-- 4. REAL-TIME STOCK LOCKING LOGIC (TRIGGERS)
-- ==============================================================================

-- Trigger Function: Reserve (Deduct) or Release (Add) Stock
CREATE OR REPLACE FUNCTION manage_stock_reservation()
RETURNS TRIGGER AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- ON INSERT: Deduct Stock (Lock it)
    IF (TG_OP = 'INSERT') THEN
        SELECT stock INTO current_stock FROM public.inventory WHERE sku = NEW.sku;
        
        IF current_stock < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for % (Available: %, Requested: %)', NEW.sku, current_stock, NEW.quantity;
        END IF;

        UPDATE public.inventory 
        SET stock = stock - NEW.quantity
        WHERE sku = NEW.sku;
        
        RETURN NEW;
    
    -- ON DELETE: Restore Stock (Unlock it)
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.inventory 
        SET stock = stock + OLD.quantity
        WHERE sku = OLD.sku;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply Trigger to lead_items
DROP TRIGGER IF EXISTS trg_stock_reservation ON public.lead_items;
CREATE TRIGGER trg_stock_reservation
AFTER INSERT OR DELETE ON public.lead_items
FOR EACH ROW EXECUTE FUNCTION manage_stock_reservation();


-- Trigger Function: Handle Closed-Lost (Restore Stock by clearing items)
CREATE OR REPLACE FUNCTION handle_lost_lead_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changes to 'closed-lost', delete items to trigger restoration
    IF NEW.status = 'closed-lost' AND OLD.status != 'closed-lost' THEN
        DELETE FROM public.lead_items WHERE lead_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Trigger to leads
DROP TRIGGER IF EXISTS trg_restore_stock_on_loss ON public.leads;
CREATE TRIGGER trg_restore_stock_on_loss
AFTER UPDATE OF status ON public.leads
FOR EACH ROW EXECUTE FUNCTION handle_lost_lead_stock();


-- ==============================================================================
-- 5. FUNCTION: CONFIRM ORDER (Simplified - Stock already deducted)
-- ==============================================================================
CREATE OR REPLACE FUNCTION confirm_lead_order(target_lead_id UUID, output_employee_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id UUID;
    total_revenue NUMERIC := 0;
    total_cost NUMERIC := 0;
    item RECORD;
BEGIN
    -- 1. Calculate Totals (Stock is already reserved, just calculating now)
    FOR item IN
        SELECT li.quantity, li.unit_price, i.price as list_price, i.purchase_price
        FROM lead_items li
        JOIN inventory i ON li.sku = i.sku
        WHERE li.lead_id = target_lead_id
    LOOP
        total_revenue := total_revenue + (COALESCE(item.unit_price, item.list_price) * item.quantity);
        total_cost := total_cost + (COALESCE(item.purchase_price, 0) * item.quantity);
    END LOOP;

    -- 2. Create Order
    INSERT INTO public.orders (amount, profit, status, employee_id, lead_id)
    VALUES (total_revenue, (total_revenue - total_cost), 'completed', output_employee_id, target_lead_id)
    RETURNING id INTO new_order_id;

    -- 3. Archive Items (Copy to order_items)
    INSERT INTO public.order_items (order_id, sku, name, quantity, price, cost)
    SELECT 
        new_order_id, 
        li.sku, 
        i.name, 
        li.quantity, 
        COALESCE(li.unit_price, i.price), 
        COALESCE(i.purchase_price, 0)
    FROM lead_items li
    JOIN inventory i ON li.sku = i.sku
    WHERE li.lead_id = target_lead_id;

    -- NOTE: We do NOT deduct stock here inside the loop. 
    -- Stock was deducted when items were inserted into lead_items (via trigger).
    -- We also do NOT delete lead_items here, we keep them as a record of the negotiation.
    -- (The stock trigger only restores on DELETE, so keeping them keeps stock deducted).

    RETURN new_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_lead_order TO authenticated;
-- Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- RLS Policies
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage all announcements" ON public.announcements 
FOR ALL 
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Employees can view active announcements
CREATE POLICY "Employees view active announcements" ON public.announcements 
FOR SELECT 
USING (is_active = TRUE);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
-- 1. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS POLICIES

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
ON public.tasks
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active announcements"
ON public.announcements FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
USING (is_admin());

-- 4. GRANT PERMISSIONS
GRANT ALL ON TABLE public.tasks TO authenticated;
GRANT ALL ON TABLE public.announcements TO authenticated;
-- ADD SYSTEM CONFIGURATION COLUMNS
-- Run this in Supabase SQL Editor

ALTER TABLE public.crm_settings
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS default_commission NUMERIC DEFAULT 8,
ADD COLUMN IF NOT EXISTS audit_logging BOOLEAN DEFAULT true;

-- Notify to refresh cache if using Realtime
NOTIFY pgrst, 'reload config';
-- ADD MISSING COLUMN
-- Run this in the Supabase SQL Editor

ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS low_stock INTEGER DEFAULT 0;

-- Refresh the schema cache (PostgREST sometimes needs this)
NOTIFY pgrst, 'reload config';
-- 1. ADD SOURCE COLUMN TO LEADS
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('website', 'linkedin', 'referral', 'cold-call', 'ad', 'other')) DEFAULT 'other';

-- 2. LEAD SOURCE ANALYTICS RPC
CREATE OR REPLACE FUNCTION get_lead_sources()
RETURNS TABLE (
    source TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.source,
        COUNT(l.id) as count
    FROM public.leads l
    GROUP BY l.source
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_lead_sources TO authenticated;
-- Add product column to leads table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'product') THEN
        ALTER TABLE public.leads ADD COLUMN product TEXT;
    END IF;
END $$;
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
-- Add admin_note to leaves table if it doesn't exist
ALTER TABLE public.leaves ADD COLUMN IF NOT EXISTS admin_note TEXT;
-- 1. REFINE LEADERBOARD (Employees Only)
CREATE OR REPLACE FUNCTION get_crm_leaderboard()
RETURNS TABLE (
    employee_id UUID,
    full_name TEXT,
    leads_count BIGINT,
    won_count BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.full_name,
        COUNT(l.id) as leads_count,
        COUNT(l.id) FILTER (WHERE l.status = 'closed-won') as won_count,
        COALESCE(SUM(l.value), 0) as total_revenue
    FROM public.profiles p
    LEFT JOIN public.leads l ON p.id = l.assigned_to
    WHERE p.role = 'employee' -- EXPLICITLY FILTER FOR EMPLOYEES ONLY
    GROUP BY p.id, p.full_name
    ORDER BY total_revenue DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. PRODUCT PERFORMANCE ANALYTICS
CREATE OR REPLACE FUNCTION get_product_performance()
RETURNS TABLE (
    sku TEXT,
    name TEXT,
    total_sold BIGINT,
    total_revenue NUMERIC,
    total_profit NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.sku,
        oi.name,
        SUM(oi.quantity)::BIGINT as total_sold,
        SUM(oi.quantity * oi.price) as total_revenue,
        SUM(oi.quantity * (oi.price - oi.cost)) as total_profit
    FROM public.order_items oi
    GROUP BY oi.sku, oi.name
    ORDER BY total_sold DESC -- Default sort by volume
    LIMIT 5; -- Top 5 products
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_product_performance TO authenticated;
-- 3. SALES FUNNEL ANALYTICS
CREATE OR REPLACE FUNCTION get_sales_funnel()
RETURNS TABLE (
    stage TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.stage,
        COALESCE(COUNT(l.id), 0) as count
    FROM (
        VALUES 
            ('new'), 
            ('qualified'), 
            ('proposal'), 
            ('negotiation'), 
            ('closed-won')
    ) as s(stage)
    LEFT JOIN public.leads l ON l.status = s.stage
    GROUP BY s.stage
    ORDER BY 
        CASE s.stage
            WHEN 'new' THEN 1
            WHEN 'qualified' THEN 2
            WHEN 'proposal' THEN 3
            WHEN 'negotiation' THEN 4
            WHEN 'closed-won' THEN 5
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. REVENUE TREND (Last 6 Months)
CREATE OR REPLACE FUNCTION get_revenue_trend()
RETURNS TABLE (
    month_label TEXT,
    revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT generate_series(
            date_trunc('month', NOW()) - INTERVAL '5 months',
            date_trunc('month', NOW()),
            '1 month'::interval
        ) as month_start
    )
    SELECT 
        to_char(m.month_start, 'Mon') as month_label,
        COALESCE(SUM(l.value), 0) as revenue
    FROM months m
    LEFT JOIN public.leads l ON 
        date_trunc('month', l.updated_at) = m.month_start 
        AND l.status = 'closed-won'
    GROUP BY m.month_start
    ORDER BY m.month_start ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_sales_funnel TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_trend TO authenticated;
-- UPDATE CRM SETTINGS TABLE
-- Run this in Supabase SQL Editor

-- Add Company Info columns if they don't exist
ALTER TABLE public.crm_settings 
ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'My Company',
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Refresh schema cache
NOTIFY pgrst, 'reload config';
CREATE OR REPLACE FUNCTION auto_assign_lead() RETURNS TRIGGER AS $$
DECLARE
    target_emp_id UUID;
    rr_enabled BOOLEAN;
BEGIN
    SELECT round_robin_enabled INTO rr_enabled FROM public.crm_settings LIMIT 1;
    
    -- Only run if enabled and currently unassigned
    IF (rr_enabled = TRUE AND NEW.assigned_to IS NULL) THEN
        -- Find employee with oldest assignment time (EXCLUDING ADMINS)
        SELECT id INTO target_emp_id 
        FROM public.profiles 
        WHERE role = 'employee' -- Changed from "role = 'employee' OR role = 'admin'"
        ORDER BY last_lead_assigned_at ASC 
        LIMIT 1;

        IF (target_emp_id IS NOT NULL) THEN
            NEW.assigned_to := target_emp_id;
            -- Update their timestamp
            UPDATE public.profiles SET last_lead_assigned_at = NOW() WHERE id = target_emp_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- FIX INVENTORY TABLE PERMISSIONS
-- Run this in the Supabase SQL Editor

-- 1. Enable RLS on the correct table 'inventory'
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS Policies for 'inventory'

-- Policy: Authenticated users can view inventory
DROP POLICY IF EXISTS "Authenticated users can view inventory" ON public.inventory;
CREATE POLICY "Authenticated users can view inventory"
ON public.inventory
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Admins can insert/update/delete inventory
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;
CREATE POLICY "Admins can manage inventory"
ON public.inventory
FOR ALL
USING (is_admin());

-- 3. Ensure columns exist (optional check, safe to run)
-- This adds columns if they are missing to match our frontend expectations
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS low_stock INTEGER DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
-- FIX SETTINGS TABLE PERMISSIONS
-- Run this in the Supabase SQL Editor

-- 0. Ensure helper function exists (matches setup_database.sql)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 1. Ensure table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.crm_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT DEFAULT 'My Company',
    company_email TEXT,
    tax_id TEXT,
    currency TEXT DEFAULT 'USD',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Authenticated users can view settings
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.crm_settings;
CREATE POLICY "Authenticated users can view settings"
ON public.crm_settings
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy: Admins can update settings
-- Using is_admin() if available, otherwise check metadata or allow authenticated for now if admin check is complex
-- Fallback: if is_admin() doesn't exist, this might fail. But based on inventory setup, it should exist.
DROP POLICY IF EXISTS "Admins can update settings" ON public.crm_settings;
CREATE POLICY "Admins can update settings"
ON public.crm_settings
FOR ALL
USING (is_admin());

-- Policy: Allow insert if table is empty (bootstrapping)
DROP POLICY IF EXISTS "Allow initial setup" ON public.crm_settings;
CREATE POLICY "Allow initial setup"
ON public.crm_settings
FOR INSERT
WITH CHECK (
    (SELECT count(*) FROM public.crm_settings) = 0
    OR is_admin()
);

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_crm_settings_updated_at ON public.crm_settings;
CREATE TRIGGER update_crm_settings_updated_at
    BEFORE UPDATE ON public.crm_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_settings_updated_at_column();
-- Fix Infinite Recursion in Profiles RLS Policy

-- 1. Create a secure function to check if a user is an admin
-- SECURITY DEFINER means this function runs with the privileges of the creator (postgres/superuser),
-- bypassing the RLS policies on the profiles table itself.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Drop existing policies to start fresh and avoid conflicts
-- We drop generic names and specific names just to be safe
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;

-- 3. Enable RLS (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create new, non-recursive policies

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (
  auth.uid() = id
);

-- Allow admins to view ALL profiles (uses the secure function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  is_admin()
);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Allow admins to update ALL profiles
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
USING (
  is_admin()
);

-- Allow users to insert their own profile (critical for registration)
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
);
