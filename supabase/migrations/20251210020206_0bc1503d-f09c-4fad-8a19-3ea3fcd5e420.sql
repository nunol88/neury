-- Drop the restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can view agendamentos" ON public.agendamentos;

-- Create a proper PERMISSIVE policy for SELECT
CREATE POLICY "Authenticated users can view agendamentos"
ON public.agendamentos
FOR SELECT
TO authenticated
USING (true);