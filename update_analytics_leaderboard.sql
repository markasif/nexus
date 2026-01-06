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
