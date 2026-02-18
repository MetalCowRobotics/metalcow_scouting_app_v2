-- Migrate user_roles to profiles table
-- Add role columns to profiles table

-- 1. Add columns to profiles table (if not already exists)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'scout', 'analyst', 'viewer')),
ADD COLUMN IF NOT EXISTS can_scout BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Copy data from user_roles to profiles if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        UPDATE public.profiles p
        SET 
            role = ur.role,
            can_scout = COALESCE(ur.can_scout, false),
            can_view_analytics = COALESCE(ur.can_view_analytics, false),
            can_manage_data = COALESCE(ur.can_manage_data, false),
            can_manage_users = COALESCE(ur.can_manage_users, false),
            role_updated_at = ur.updated_at
        FROM public.user_roles ur
        WHERE p.email = ur.email
        AND ur.role = (
            SELECT role FROM public.user_roles 
            WHERE email = ur.email 
            ORDER BY 
                CASE role 
                    WHEN 'admin' THEN 1 
                    WHEN 'analyst' THEN 2 
                    WHEN 'scout' THEN 3 
                    WHEN 'viewer' THEN 4 
                END 
            LIMIT 1
        );
        
        DROP TABLE IF EXISTS public.user_roles;
    END IF;
END $$;

-- 3. Update is_user_admin function to check profiles
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create index on profiles for role lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
