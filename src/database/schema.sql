-- Nexus ERP - Consolidated Database Schema
-- This file contains table definitions and policies.

-- 1. Create SALES table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT CHECK (status IN ('completed', 'cancelled', 'refunded')) DEFAULT 'completed',
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create COMMISSIONS table
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Or profiles(id)
    deal_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    rate_applied NUMERIC,
    status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- 4. Policies
-- Sales
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sales;
CREATE POLICY "Enable read access for authenticated users" ON sales FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sales;
CREATE POLICY "Enable insert for authenticated users" ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON sales;
CREATE POLICY "Enable update for authenticated users" ON sales FOR UPDATE USING (auth.role() = 'authenticated');

-- Commissions
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON commissions;
CREATE POLICY "Enable read access for authenticated users" ON commissions FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON commissions;
CREATE POLICY "Enable insert for authenticated users" ON commissions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON commissions;
CREATE POLICY "Enable update for authenticated users" ON commissions FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Indexes (Performance)
CREATE INDEX IF NOT EXISTS idx_sales_lead_id ON sales(lead_id);
CREATE INDEX IF NOT EXISTS idx_commissions_employee_id ON commissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_commissions_deal_id ON commissions(deal_id);

-- 6. Realtime Publication Setup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'crm_activity_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE crm_activity_logs;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
