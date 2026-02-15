-- ==========================================
-- 🐮 METAL COW ROBOTICS: STRATEGIC BACKEND 🐮
-- Purpose: Complete Supabase Database Blueprint
-- Includes: Tables, Security (RLS), Analytics, and Automation
-- ==========================================

-- 1. 🛠️ CORE EXTENSIONS
-- Required for high-performance UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 👤 USER ARCHITECTURE (Profiles)
-- Automatically synced with Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 🤖 Profile Sync Automation
-- Ensures a profile exists the moment a scouter signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 🕵️ PIT SCOUTING (Robot Blueprints)
-- Stores static robot interview data
CREATE TABLE IF NOT EXISTS public.pit_scouting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    team_number INTEGER NOT NULL,
    event_key TEXT NOT NULL,
    scout_name TEXT NOT NULL,
    team_name TEXT,
    
    -- Mechanical Intelligence
    robot_weight NUMERIC,
    drive_train_type TEXT,
    top_speed NUMERIC, -- Feet per second
    fuel_capacity INTEGER,
    fuel_per_second NUMERIC, -- Theoretical cycle speed
    
    -- Strategic Blueprint
    climb_level INTEGER CHECK (climb_level IN (1, 2, 3)),
    climbs_in_auto BOOLEAN DEFAULT FALSE,
    obstacle_handling TEXT CHECK (obstacle_handling IN ('Trench', 'Bump', 'Both', 'None')),
    primary_role TEXT CHECK (primary_role IN ('Offense', 'Defense')),
    comments TEXT,

    -- Ensure we only have one profile per team per event
    UNIQUE(team_number, event_key)
);

-- 4. 🏎️ MATCH SCOUTING (Live Performance)
-- Captures granular action data from the heat of match play
CREATE TABLE IF NOT EXISTS public.match_scouting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    match_number INTEGER NOT NULL,
    team_number INTEGER NOT NULL,
    event_key TEXT NOT NULL,
    alliance TEXT CHECK (alliance IN ('Red', 'Blue')),
    scout_name TEXT NOT NULL,
    team_name TEXT,
    is_practice_match BOOLEAN DEFAULT FALSE,

    -- ⚡ Autonomous Intelligence
    start_position TEXT,
    auto_preloaded BOOLEAN DEFAULT FALSE,
    auto_active BOOLEAN DEFAULT FALSE,
    auto_fuel_scored INTEGER DEFAULT 0,
    auto_fuel_pickup_location TEXT DEFAULT 'None',
    auto_climb BOOLEAN DEFAULT FALSE,
    auto_climb_location TEXT DEFAULT 'None',

    -- 🕹️ Teleop & Endgame Analysis
    teleop_fuel_scored INTEGER DEFAULT 0,
    teleop_zone_control TEXT DEFAULT 'Neutral' CHECK (teleop_zone_control IN ('Alliance', 'Neutral', 'Opposing')),
    teleop_descended_from_auto BOOLEAN DEFAULT FALSE,
    teleop_pickup_locations TEXT[], -- Array of field harvest locations

    -- 📉 Performance Scoring
    defense_rating INTEGER CHECK (defense_rating >= 1 AND defense_rating <= 5),
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    ranking_points_contributed INTEGER DEFAULT 0,
    robot_status TEXT DEFAULT 'Functional' CHECK (robot_status IN ('Functional', 'Partially Functional', 'Broken')),
    comments TEXT
);

-- 5. 📊 STRATEGIC ANALYTICS (Hybrid View)
-- Merges Pit specs with Match performance for the Analytics Dashboard
DROP VIEW IF EXISTS public.hybrid_team_stats;
CREATE OR REPLACE VIEW public.hybrid_team_stats AS
SELECT 
    p.team_number,
    p.event_key,
    p.robot_weight,
    p.fuel_capacity,
    p.top_speed,
    p.fuel_per_second as theoretical_fps,
    p.primary_role,
    p.climb_level,
    p.climbs_in_auto,
    p.obstacle_handling,
    p.drive_train_type,
    
    -- Competition Metrics
    COUNT(m.id) as matches_played,
    AVG(m.auto_fuel_scored + m.teleop_fuel_scored) as avg_actual_score,
    -- Actual Cycles: Scored units per match duration (approx 150s)
    AVG((m.auto_fuel_scored + m.teleop_fuel_scored) / 150.0) as actual_fps, 
    AVG(m.defense_rating) as avg_defense_rating,
    
    -- Efficiency Metrics
    (SUM(CASE WHEN m.auto_climb OR m.teleop_descended_from_auto THEN 1 ELSE 0 END)::FLOAT / 
     NULLIF(COUNT(m.id), 0)) * 100 as climb_success_rate
FROM public.pit_scouting p
LEFT JOIN public.match_scouting m ON p.team_number = m.team_number AND p.event_key = m.event_key
GROUP BY 
    p.team_number, p.event_key, p.robot_weight, p.fuel_capacity, 
    p.top_speed, p.fuel_per_second, p.primary_role, p.climb_level, 
    p.climbs_in_auto, p.obstacle_handling, p.drive_train_type;

-- 6. 🔐 SECURITY (Row Level Security - RLS)
-- Protects the strategic data stream from unauthorized access

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pit_scouting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scouting ENABLE ROW LEVEL SECURITY;

-- 👤 Profile Policy: Users can view all profiles but only edit their own
DROP POLICY IF EXISTS "Public profiles are viewable by anyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by anyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 🤖 Scouting Policy: Authenticated scouters can read/write. Deletion restricted.
DROP POLICY IF EXISTS "Scouters can view data" ON public.match_scouting;
CREATE POLICY "Scouters can view data" ON public.match_scouting FOR SELECT USING (true);

DROP POLICY IF EXISTS "Scouters can submit matches" ON public.match_scouting;
CREATE POLICY "Scouters can submit matches" ON public.match_scouting FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can delete matches" ON public.match_scouting;
CREATE POLICY "Admins can delete matches" ON public.match_scouting FOR DELETE 
USING (auth.jwt() ->> 'email' LIKE '%@metalcowrobotics.org' OR auth.jwt() ->> 'email' = 'jai.mokashi@gmail.com');

DROP POLICY IF EXISTS "Scouters can view pit data" ON public.pit_scouting;
CREATE POLICY "Scouters can view pit data" ON public.pit_scouting FOR SELECT USING (true);

DROP POLICY IF EXISTS "Scouters can lock in pit data" ON public.pit_scouting;
CREATE POLICY "Scouters can lock in pit data" ON public.pit_scouting FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can delete pit data" ON public.pit_scouting;
CREATE POLICY "Admins can delete pit data" ON public.pit_scouting FOR DELETE 
USING (auth.jwt() ->> 'email' LIKE '%@metalcowrobotics.org' OR auth.jwt() ->> 'email' = 'jai.mokashi@gmail.com');

-- 7. 🚀 PERFORMANCE OPTIMIZATIONS (Indexes)
-- Ensures the dashboard remains lightning-fast under pressure
CREATE INDEX IF NOT EXISTS idx_match_scouting_team ON public.match_scouting(team_number, event_key);
CREATE INDEX IF NOT EXISTS idx_pit_scouting_team ON public.pit_scouting(team_number, event_key);
CREATE INDEX IF NOT EXISTS idx_match_scouter ON public.match_scouting(scout_name);

-- 🐮 BACKEND DEPLOYMENT COMPLETE 🐮