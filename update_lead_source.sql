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
