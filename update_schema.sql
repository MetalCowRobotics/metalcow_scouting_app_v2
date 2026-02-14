-- Drop old view first
DROP VIEW IF EXISTS team_stats;

-- Update Pit Scouting table with new specialized fields
ALTER TABLE public.pit_scouting 
ADD COLUMN IF NOT EXISTS fuel_capacity INTEGER,
ADD COLUMN IF NOT EXISTS top_speed NUMERIC,
ADD COLUMN IF NOT EXISTS fuel_per_second NUMERIC,
ADD COLUMN IF NOT EXISTS primary_role TEXT CHECK (primary_role IN ('Offense', 'Defense')),
ADD COLUMN IF NOT EXISTS climb_level INTEGER CHECK (climb_level IN (1, 2, 3)),
ADD COLUMN IF NOT EXISTS climbs_in_auto BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS obstacle_handling TEXT CHECK (obstacle_handling IN ('Trench', 'Bump', 'Both', 'None'));

-- Ensure Match Scouting has the required fields for analytics
-- (These already exist based on previous edits, but ensuring types)
-- auto_fuel_scored, teleop_fuel_scored, defense_rating

-- Recreate a more complex team_stats view for the Analytics Dashboard
-- Joining Pit and Match data
CREATE OR REPLACE VIEW hybrid_team_stats AS
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
    COUNT(m.id) as matches_played,
    AVG(m.auto_fuel_scored + m.teleop_fuel_scored) as avg_actual_score,
    -- Actual FPS: (Total Fuel Scored) / (Matches * Teleop Duration in seconds approx)
    -- Assuming a standard match has ~135s of teleop
    AVG((m.auto_fuel_scored + m.teleop_fuel_scored) / 150.0) as actual_fps, 
    AVG(m.defense_rating) as avg_defense_rating,
    SUM(CASE WHEN m.auto_climb OR m.teleop_descended_from_auto THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(m.id), 0) as climb_success_rate
FROM public.pit_scouting p
LEFT JOIN public.match_scouting m ON p.team_number = m.team_number AND p.event_key = m.event_key
GROUP BY p.team_number, p.event_key, p.robot_weight, p.fuel_capacity, p.top_speed, p.fuel_per_second, p.primary_role, p.climb_level, p.climbs_in_auto, p.obstacle_handling, p.drive_train_type;
