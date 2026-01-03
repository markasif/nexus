-- FULL DATABASE SETUP SCRIPT
-- Run this in the Supabase SQL Editor to recreate the profiles table and security setup.

-- 1. CLEANUP (Drop existing objects if they exist to start fresh)
-- Be careful: This deletes all data in 'profiles'.
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 2. CREATE PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    base_salary NUMERIC DEFAULT 0,
    commission_percent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. CREATE HELPER FUNCTION (Anti-Recursion Fix)
-- This function allows checking admin status without triggering infinite RLS loops.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 5. CREATE RLS POLICIES

-- Policy: Users can see their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Admins can see ALL profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin());

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Admins can update ALL profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (is_admin());

-- Policy: Allow users to insert their own profile (useful for manual profile creation)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Service Role can do anything (backup/maintenance)
-- (Implicitly true for service role, but good documentation)

-- 6. AUTO-CREATE PROFILE ON SIGNUP (Optional but recommended)
-- This trigger automatically creates a profile row when a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'employee' -- Default role
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated;
-- GRANT ALL ON SEQUENCE public.profiles_id_seq TO anon, authenticated; -- REMOVED: No sequence for UUID PK

-- 8. (Optional) Make the first user an admin manually if needed
-- Instructions: Run this separate command if you want to force a specific user to be admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL@example.com';
