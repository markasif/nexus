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
