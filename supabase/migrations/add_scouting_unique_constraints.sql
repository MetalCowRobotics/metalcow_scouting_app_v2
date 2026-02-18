-- Add unique constraints for pit_scouting and match_scouting

-- For pit_scouting: unique team per event
ALTER TABLE public.pit_scouting 
ADD CONSTRAINT pit_scouting_team_event_key_unique UNIQUE (team_number, event_key);

-- For match_scouting: unique entry per team/match/scout
ALTER TABLE public.match_scouting 
ADD CONSTRAINT match_scouting_team_event_match_scout_unique UNIQUE (team_number, event_key, match_number, scout_name);
