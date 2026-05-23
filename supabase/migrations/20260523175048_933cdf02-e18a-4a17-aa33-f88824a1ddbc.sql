-- 1. Fix extras SELECT policy: restrict to owner or admin
DROP POLICY IF EXISTS "Authenticated users can view extras" ON public.extras;

CREATE POLICY "Users can view own extras or admin"
ON public.extras
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix agendamentos UPDATE policy: remove USING true, require active user
DROP POLICY IF EXISTS "Users can update agendamento status" ON public.agendamentos;

CREATE POLICY "Active users can update agendamento status"
ON public.agendamentos
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() IS NOT NULL AND is_user_active(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() IS NOT NULL AND is_user_active(auth.uid()))
);

-- 3. Revoke EXECUTE from anon/authenticated on internal SECURITY DEFINER helpers.
-- RLS policies invoke these server-side and don't require EXECUTE grants to API roles.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_user_active(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_status_only_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_google_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;