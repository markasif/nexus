-- 1. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS POLICIES

-- Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
ON public.tasks
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active announcements"
ON public.announcements FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage announcements"
ON public.announcements FOR ALL
USING (is_admin());

-- 4. GRANT PERMISSIONS
GRANT ALL ON TABLE public.tasks TO authenticated;
GRANT ALL ON TABLE public.announcements TO authenticated;
