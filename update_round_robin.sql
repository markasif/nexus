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
