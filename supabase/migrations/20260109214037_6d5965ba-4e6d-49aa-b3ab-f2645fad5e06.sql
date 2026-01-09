-- Allow authenticated users (not just admins) to update the status field on agendamentos
CREATE POLICY "Authenticated users can update agendamento status" 
ON public.agendamentos 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);