-- Nexus ERP - Consolidated Database Functions & Logic
-- This file serves as the Single Source of Truth for database logic.

-- ==========================================
-- I. SCHEMA & CONSTRAINTS UPDATES
-- ==========================================

-- 1. Commission Status Constraint
DO $$
BEGIN
    ALTER TABLE commissions DROP CONSTRAINT IF EXISTS commissions_status_check;
    ALTER TABLE commissions ADD CONSTRAINT commissions_status_check 
    CHECK (status IN ('pending', 'paid', 'cancelled'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Inventory Reserved Column
DO $$
BEGIN
    ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved INTEGER DEFAULT 0;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Leave Type Constraint (Flexible)
DO $$
BEGIN
    -- Drop restrictive constraint if exists
    ALTER TABLE public.leaves DROP CONSTRAINT IF EXISTS leaves_type_check;
    
    -- Normalize existing data to 'casual' if invalid
    UPDATE public.leaves
    SET type = 'casual'
    WHERE type NOT IN ('casual', 'sick', 'privilege', 'Casual Leave', 'Sick Leave', 'Privilege Leave');

    -- Add flexible constraint
    ALTER TABLE public.leaves 
    ADD CONSTRAINT leaves_type_check 
    CHECK (type IN ('casual', 'sick', 'privilege', 'Casual Leave', 'Sick Leave', 'Privilege Leave'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Inventory Archived Column
DO $$
BEGIN
    ALTER TABLE inventory ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 5. CRM Settings - Monthly Target & Currency
DO $$
BEGIN
    -- Monthly Target
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_settings' AND column_name = 'monthly_target') THEN
        ALTER TABLE crm_settings ADD COLUMN monthly_target NUMERIC DEFAULT 500000;
    END IF;
    
    -- Currency Default
    ALTER TABLE crm_settings ALTER COLUMN currency SET DEFAULT 'INR';
    UPDATE crm_settings SET currency = 'INR' WHERE currency IS NULL OR currency != 'INR';
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- II. HELPER FUNCTIONS (Getters / Calcs)
-- ==========================================

-- 1. Get Lead Sources
CREATE OR REPLACE FUNCTION get_lead_sources()
RETURNS TABLE (source TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(NULLIF(l.source, ''), 'Unknown') as source,
        COUNT(*) as count
    FROM leads l
    WHERE l.status != 'archived'
    GROUP BY 1
    ORDER BY 2 DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Get Product Performance
CREATE OR REPLACE FUNCTION get_product_performance()
RETURNS TABLE (name TEXT, total_sold BIGINT, total_revenue NUMERIC, total_profit NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.name,
        SUM(li.quantity) as total_sold,
        SUM(li.quantity * li.price) as total_revenue,
        SUM(li.quantity * (li.price - COALESCE(i.purchase_price, 0))) as total_profit
    FROM lead_items li
    JOIN inventory i ON li.sku = i.sku
    JOIN leads l ON li.lead_id = l.id
    WHERE l.status = 'closed-won'
    GROUP BY i.name
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Get CRM Stats (Revenue, Pipeline, Conversion)
CREATE OR REPLACE FUNCTION get_crm_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_revenue', COALESCE(SUM(value) FILTER (WHERE status = 'closed-won'), 0),
        'monthly_target', 500000, -- Updated target for rupee scale
        'pipeline_forecast', COALESCE(SUM(value) FILTER (WHERE status IN ('proposal', 'negotiation', 'qualified')), 0),
        'conversion_rate', (
            CASE WHEN COUNT(*) > 0 THEN
                ROUND((COUNT(*) FILTER (WHERE status = 'closed-won')::numeric / COUNT(*)::numeric) * 100, 1)
            ELSE 0 END
        )
    ) INTO result
    FROM leads
    WHERE status != 'archived';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Get Dashboard Stats (High Level Overview)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json AS $$
DECLARE
    result json;
    v_target NUMERIC;
BEGIN
    -- Get target from settings, default to 5L if missing
    SELECT monthly_target INTO v_target FROM crm_settings LIMIT 1;
    IF v_target IS NULL THEN
        v_target := 500000;
    END IF;

    SELECT json_build_object(
        'revenue', (SELECT COALESCE(SUM(value), 0) FROM leads WHERE status = 'closed-won' AND status != 'archived'), 
        'active_employees', (SELECT COUNT(*) FROM profiles WHERE role = 'employee' AND status = 'active'),
        'total_inventory', (SELECT COUNT(*) FROM inventory WHERE (archived IS NULL OR archived = FALSE)),
        'low_stock_alerts', (SELECT COUNT(*) FROM inventory WHERE stock <= low_stock AND (archived IS NULL OR archived = FALSE)),
        'monthly_target', v_target
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Get Effective Commission Rate
CREATE OR REPLACE FUNCTION get_effective_commission_rate(emp_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    emp_rate NUMERIC;
    global_rate NUMERIC;
BEGIN
    -- 1. Employee specific
    SELECT commission_rate INTO emp_rate FROM employee_details WHERE id = emp_id;
    IF emp_rate IS NOT NULL THEN RETURN emp_rate; END IF;

    -- 2. Global setting
    SELECT default_commission INTO global_rate FROM crm_settings ORDER BY created_at DESC LIMIT 1;
    
    -- 3. Default
    RETURN COALESCE(global_rate, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Get HRM Stats Aggregated (Attendance)
CREATE OR REPLACE FUNCTION get_hrm_stats_aggregated()
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    status TEXT,
    department TEXT,
    base_salary NUMERIC,
    attendance_pct NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH monthly_hours AS (
        SELECT 
            employee_id,
            SUM(EXTRACT(EPOCH FROM (COALESCE(clock_out, NOW()) - clock_in)) / 3600) as total_hours
        FROM attendance
        WHERE clock_in >= date_trunc('month', CURRENT_DATE)
        GROUP BY employee_id
    ),
    working_days AS (
        SELECT count(*) as days
        FROM generate_series(date_trunc('month', CURRENT_DATE), CURRENT_DATE, '1 day'::interval) date_s
        WHERE extract(ISODOW FROM date_s) < 6
    )
    SELECT 
        p.id,
        p.full_name as name,
        p.email,
        p.role,
        p.status,
        (ed.department)::TEXT as department,
        (ed.base_salary)::NUMERIC as base_salary,
        COALESCE(
            ROUND((COALESCE(mh.total_hours, 0) / NULLIF((SELECT days FROM working_days) * 8, 0)) * 100, 1), 
            0
        ) as attendance_pct
    FROM profiles p
    LEFT JOIN employee_details ed ON p.id = ed.id
    LEFT JOIN monthly_hours mh ON p.id = mh.employee_id
    WHERE p.role = 'employee' OR p.role = 'admin';
END;
$$;

-- ==========================================
-- III. CORE LOGIC FUNCTIONS
-- ==========================================

-- 1. Recalculate Reservations (Maintenance Utility)
CREATE OR REPLACE FUNCTION recalc_all_reservations()
RETURNS VOID AS $$
BEGIN
    UPDATE inventory SET reserved = 0;
    UPDATE inventory i
    SET reserved = sub.total_qty
    FROM (
        SELECT li.sku, SUM(li.quantity) as total_qty
        FROM lead_items li
        JOIN leads l ON li.lead_id = l.id
        WHERE l.status IN ('proposal', 'negotiation', 'pending-verification')
        GROUP BY li.sku
    ) sub
    WHERE i.sku = sub.sku;
END;
$$ LANGUAGE plpgsql;

-- 2. Manual Deduct Inventory (Legacy / Manual usage)
CREATE OR REPLACE FUNCTION deduct_inventory_for_lead(target_lead_id UUID)
RETURNS VOID AS $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN SELECT sku, quantity FROM lead_items WHERE lead_id = target_lead_id LOOP
        UPDATE inventory SET stock = stock - item.quantity WHERE sku = item.sku;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Manual Restore Inventory (Legacy / Manual usage)
CREATE OR REPLACE FUNCTION restore_inventory_for_lead(target_lead_id UUID)
RETURNS VOID AS $$
DECLARE
    item RECORD;
BEGIN
    FOR item IN SELECT sku, quantity FROM lead_items WHERE lead_id = target_lead_id LOOP
        UPDATE inventory SET stock = stock + item.quantity WHERE sku = item.sku;
    END LOOP;
    UPDATE commissions SET status = 'cancelled' WHERE deal_id = target_lead_id;
    UPDATE sales SET status = 'cancelled' WHERE lead_id = target_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- IV. TRIGGERS & HANDLERS
-- ==========================================

-- 1. Leave Approval Handler
CREATE OR REPLACE FUNCTION handle_leave_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
        IF NEW.type IN ('casual', 'Casual Leave') THEN
            UPDATE public.profiles SET leave_balance_casual = leave_balance_casual - COALESCE(NEW.days, 1) WHERE id = NEW.employee_id;
        ELSIF NEW.type IN ('sick', 'Sick Leave') THEN
            UPDATE public.profiles SET leave_balance_sick = leave_balance_sick - COALESCE(NEW.days, 1) WHERE id = NEW.employee_id;
        ELSIF NEW.type IN ('privilege', 'Privilege Leave') THEN
            UPDATE public.profiles SET leave_balance_privilege = leave_balance_privilege - COALESCE(NEW.days, 1) WHERE id = NEW.employee_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Cart Reservation Handler
CREATE OR REPLACE FUNCTION manage_cart_reservation()
RETURNS TRIGGER AS $$
DECLARE
    lead_status TEXT;
    target_lead_id UUID;
    delta INTEGER;
BEGIN
    target_lead_id := COALESCE(NEW.lead_id, OLD.lead_id);
    SELECT status INTO lead_status FROM leads WHERE id = target_lead_id;

    IF lead_status IN ('proposal', 'negotiation', 'pending-verification', 'pending_verification') THEN
        IF (TG_OP = 'INSERT') THEN
            UPDATE inventory SET reserved = reserved + NEW.quantity WHERE sku = NEW.sku;
        ELSIF (TG_OP = 'DELETE') THEN
            UPDATE inventory SET reserved = reserved - OLD.quantity WHERE sku = OLD.sku;
        ELSIF (TG_OP = 'UPDATE') THEN
            delta := NEW.quantity - OLD.quantity;
            IF OLD.sku != NEW.sku THEN
                UPDATE inventory SET reserved = reserved - OLD.quantity WHERE sku = OLD.sku;
                UPDATE inventory SET reserved = reserved + NEW.quantity WHERE sku = NEW.sku;
            ELSE
                UPDATE inventory SET reserved = reserved + delta WHERE sku = NEW.sku;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_manage_cart_reservation ON lead_items;
CREATE TRIGGER tr_manage_cart_reservation
AFTER INSERT OR UPDATE OR DELETE ON lead_items
FOR EACH ROW
EXECUTE FUNCTION manage_cart_reservation();

-- 3. Lead Status Reservation Handler (The Smart Trigger)
CREATE OR REPLACE FUNCTION handle_lead_status_reservation()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- A: Proposal/Neg -> Won (COMMIT)
    IF (OLD.status IN ('proposal', 'negotiation', 'pending-verification') AND NEW.status = 'closed-won') THEN
        FOR item IN SELECT sku, quantity FROM lead_items WHERE lead_id = NEW.id LOOP
            UPDATE inventory 
            SET stock = stock - item.quantity, 
                reserved = reserved - item.quantity 
            WHERE sku = item.sku;
        END LOOP;

    -- B: Won -> Proposal/Neg (ROLLBACK)
    ELSIF (OLD.status = 'closed-won' AND NEW.status IN ('proposal', 'negotiation')) THEN
         FOR item IN SELECT sku, quantity FROM lead_items WHERE lead_id = NEW.id LOOP
            UPDATE inventory 
            SET stock = stock + item.quantity, 
                reserved = reserved + item.quantity 
            WHERE sku = item.sku;
        END LOOP;
        
        UPDATE commissions SET status = 'cancelled' WHERE deal_id = NEW.id;
        UPDATE sales SET status = 'cancelled' WHERE lead_id = NEW.id;

    -- C: Proposal/Neg -> Lost (RELEASE)
    ELSIF (OLD.status IN ('proposal', 'negotiation', 'pending-verification') AND NEW.status = 'closed-lost') THEN
        FOR item IN SELECT sku, quantity FROM lead_items WHERE lead_id = NEW.id LOOP
            UPDATE inventory SET reserved = reserved - item.quantity WHERE sku = item.sku;
        END LOOP;
        
    -- D: Lost -> Proposal/Neg (RE-RESERVE)
    ELSIF (OLD.status = 'closed-lost' AND NEW.status IN ('proposal', 'negotiation')) THEN
        FOR item IN SELECT sku, quantity FROM lead_items WHERE lead_id = NEW.id LOOP
            UPDATE inventory SET reserved = reserved + item.quantity WHERE sku = item.sku;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_lead_status_reservation ON leads;
DROP TRIGGER IF EXISTS on_lead_reopen ON leads;

CREATE TRIGGER tr_lead_status_reservation
AFTER UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION handle_lead_status_reservation();

-- ==========================================
-- V. RPCS (COMPLEX OPERATIONS)
-- ==========================================

-- 1. Confirm Lead Order
-- Relies on 'tr_lead_status_reservation' to handle inventory.
-- Relies on 'get_effective_commission_rate' for calculation.
CREATE OR REPLACE FUNCTION confirm_lead_order(
    target_lead_id UUID,
    output_employee_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    l_assigned_to UUID;
    l_val NUMERIC;
    effective_rate NUMERIC;
    comm_amount NUMERIC;
BEGIN
    SELECT assigned_to, value INTO l_assigned_to, l_val FROM leads WHERE id = target_lead_id FOR UPDATE;

    IF l_assigned_to IS NULL THEN
        RAISE EXCEPTION 'Lead has no assigned agent';
    END IF;

    -- Commission Logic
    effective_rate := get_effective_commission_rate(l_assigned_to);
    comm_amount := l_val * (effective_rate / 100);

    INSERT INTO sales (lead_id, amount, closed_at, status)
    VALUES (target_lead_id, l_val, NOW(), 'completed');

    INSERT INTO commissions (employee_id, amount, deal_id, rate_applied, status, date)
    VALUES (l_assigned_to, comm_amount, target_lead_id, effective_rate, 'pending', NOW());

    -- Update Status -> Fires Trigger -> Updates Stock & Reserved
    UPDATE leads SET status = 'closed-won' WHERE id = target_lead_id;

    RETURN jsonb_build_object('success', true, 'commission', comm_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Revert Lead to
-- (Existing code...)

-- ==========================================
-- VI. UTILITIES & HELPERS (Added during Consolidation)
-- ==========================================

-- 1. Calculate Working Days (Excludes Sat/Sun)
CREATE OR REPLACE FUNCTION calculate_working_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    days_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO days_count
    FROM generate_series(start_date::timestamp, end_date::timestamp, '1 day') AS d(day_date)
    WHERE extract(isodow from d.day_date) < 6; -- 1=Mon .. 5=Fri
    
    RETURN days_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Get Single Employee Attendance Stats (Self-View)
CREATE OR REPLACE FUNCTION get_my_attendance_stats(target_employee_id UUID)
RETURNS TABLE (
  attendance_pct NUMERIC,
  total_present INTEGER,
  total_working_days INTEGER
) AS $$
DECLARE
  start_date DATE;
  present_count INTEGER;
  working_days INTEGER;
BEGIN
  -- 1. Get Start Date
  SELECT COALESCE(ed.start_date, p.created_at::date, CURRENT_DATE)
  INTO start_date
  FROM public.profiles p
  LEFT JOIN public.employee_details ed ON p.id = ed.id
  WHERE p.id = target_employee_id;

  -- 2. Count Present Days
  SELECT COUNT(DISTINCT date)::INTEGER
  INTO present_count
  FROM public.attendance
  WHERE employee_id = target_employee_id
  AND status IN ('present', 'late', 'half-day');

  -- 3. Calculate Working Days
  IF start_date > CURRENT_DATE THEN
      working_days := 0;
  ELSE
      working_days := calculate_working_days(start_date, CURRENT_DATE);
  END IF;

  RETURN QUERY SELECT
    CASE 
      WHEN working_days > 0 THEN ROUND((present_count::numeric / working_days::numeric) * 100, 1)
      ELSE 0::numeric
    END as attendance_pct,
    present_count,
    working_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- VII. LEGACY / REVERT HELPERS
-- ==========================================

-- 2. Revert Lead to Negotiation
CREATE OR REPLACE FUNCTION revert_lead_to_negotiation(
    target_lead_id UUID
) RETURNS JSONB AS $$
BEGIN
    -- Update Status -> Fires Trigger -> Updates Stock & Reserved (Rollback)
    UPDATE leads SET status = 'negotiation' WHERE id = target_lead_id;
    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
