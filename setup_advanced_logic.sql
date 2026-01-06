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
