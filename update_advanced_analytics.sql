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
