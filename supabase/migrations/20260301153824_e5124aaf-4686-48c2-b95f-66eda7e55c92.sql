
-- Add is_active column to user_roles
ALTER TABLE public.user_roles ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create a security definer function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_active FROM public.user_roles WHERE user_id = _user_id LIMIT 1),
    false
  )
$$;

-- Allow admins to view all user_roles (for management page)
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update user_roles (to toggle is_active)
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update agendamentos policies to check is_active for non-admin writes
-- Drop the existing status update policy and recreate with active check
DROP POLICY IF EXISTS "Users can update agendamento status" ON public.agendamentos;

CREATE POLICY "Users can update agendamento status"
ON public.agendamentos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (auth.uid() IS NOT NULL AND is_user_active(auth.uid()))
);
