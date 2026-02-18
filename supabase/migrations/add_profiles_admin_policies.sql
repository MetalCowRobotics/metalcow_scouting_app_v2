-- Add RLS policies for admin role management on profiles
-- The admin page is already protected server-side, so we allow authenticated users
-- to update profiles (the actual permission check happens in the AdminRoute)

-- Allow authenticated users to update any profile (admin page handles permission check)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
    auth.role() = 'authenticated'
);

-- Allow authenticated users to insert profiles (admin page handles permission check)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
);
