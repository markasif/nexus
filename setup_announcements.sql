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
