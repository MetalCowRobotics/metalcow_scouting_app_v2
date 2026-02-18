-- User Roles and Permissions System
-- Allows admins to manage user permissions from the admin panel

-- 1. User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'scout' CHECK (role IN ('admin', 'scout', 'analyst', 'viewer')),
    can_scout BOOLEAN DEFAULT true,
    can_view_analytics BOOLEAN DEFAULT false,
    can_manage_data BOOLEAN DEFAULT false,
    can_manage_users BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(email, role)
);

-- 2. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Policies for user_roles
DROP POLICY IF EXISTS "Anyone can view user_roles" ON public.user_roles;
CREATE POLICY "Anyone can view user_roles" ON public.user_roles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage user_roles" ON public.user_roles;
CREATE POLICY "Only admins can manage user_roles" ON public.user_roles 
    USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

DROP POLICY IF EXISTS "Admins can insert user_roles" ON public.user_roles;
CREATE POLICY "Admins can insert user_roles" ON public.user_roles FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can update user_roles" ON public.user_roles;
CREATE POLICY "Admins can update user_roles" ON public.user_roles FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admins can delete user_roles" ON public.user_roles;
CREATE POLICY "Admins can delete user_roles" ON public.user_roles FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 4. Function to check if user is admin (for RLS)
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON public.user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
