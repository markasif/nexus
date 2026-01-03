-- Fix Infinite Recursion in Profiles RLS Policy

-- 1. Create a secure function to check if a user is an admin
-- SECURITY DEFINER means this function runs with the privileges of the creator (postgres/superuser),
-- bypassing the RLS policies on the profiles table itself.
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

-- 2. Drop existing policies to start fresh and avoid conflicts
-- We drop generic names and specific names just to be safe
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;

-- 3. Enable RLS (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create new, non-recursive policies

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (
  auth.uid() = id
);

-- Allow admins to view ALL profiles (uses the secure function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  is_admin()
);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Allow admins to update ALL profiles
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
USING (
  is_admin()
);

-- Allow users to insert their own profile (critical for registration)
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id
);
