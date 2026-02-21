-- Add UPDATE policy for pit_scouting to enable upsert operations
DROP POLICY IF EXISTS "Scouters can update pit data" ON public.pit_scouting;
CREATE POLICY "Scouters can update pit data" ON public.pit_scouting 
FOR UPDATE USING (auth.role() = 'authenticated');
