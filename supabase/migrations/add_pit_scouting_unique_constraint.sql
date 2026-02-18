-- Add unique constraint for pit_scouting
ALTER TABLE public.pit_scouting 
ADD CONSTRAINT pit_scouting_team_event_key_unique UNIQUE (team_number, event_key);
