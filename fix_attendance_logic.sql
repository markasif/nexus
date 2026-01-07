-- FUNCTION: Calculate Working Days between two dates (excluding Sat/Sun)
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

-- FUNCTION: Get aggregated HRM stats for all employees
-- This replaces inefficient frontend aggregation
CREATE OR REPLACE FUNCTION get_hrm_stats_aggregated()
RETURNS TABLE (
  id UUID,
  name TEXT, -- remapped from full_name for frontend consistency
  email TEXT,
  role TEXT,
  status TEXT,
  department TEXT,
  base_salary NUMERIC,
  attendance_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    COALESCE(p.full_name, split_part(p.email, '@', 1)) as name,
    p.email,
    p.role,
    p.status,
    COALESCE(ed.department, '-'),
    COALESCE(ed.base_salary, 0),
    (
      CASE 
        WHEN calculate_working_days(COALESCE(ed.start_date, p.created_at::date), CURRENT_DATE) > 0 THEN
          ROUND(
            (
              (SELECT COUNT(DISTINCT a.date)::numeric
               FROM public.attendance a
               WHERE a.employee_id = p.id
               AND a.status IN ('present', 'late', 'half-day')
              )
              /
              calculate_working_days(COALESCE(ed.start_date, p.created_at::date), CURRENT_DATE)::numeric
            ) * 100
          , 0)
        ELSE 0 
      END
    ) as attendance_pct
  FROM public.profiles p
  LEFT JOIN public.employee_details ed ON p.id = ed.id
  WHERE p.role = 'employee'
  ORDER BY name ASC;
END;
$$ LANGUAGE plpgsql;
