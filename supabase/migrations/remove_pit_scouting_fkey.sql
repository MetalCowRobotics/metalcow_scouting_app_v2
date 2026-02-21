-- Remove foreign key constraint from pit_scouting that was added directly to Supabase
ALTER TABLE public.pit_scouting DROP CONSTRAINT IF EXISTS pit_scouting_team_number_fkey;
    