CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  author_role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_created_at_idx ON public.messages (created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

CREATE POLICY "Active users and admins can read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (auth.uid() IS NOT NULL AND is_user_active(auth.uid()))
);

CREATE POLICY "Active users and admins can insert their own messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_user_active(auth.uid())
  )
);

CREATE POLICY "Authors or admins can delete messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Server-side validation: trim, length, and verify author_role against user_roles
CREATE OR REPLACE FUNCTION public.validate_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  real_role text;
BEGIN
  NEW.content := btrim(NEW.content);

  IF NEW.content IS NULL OR length(NEW.content) = 0 THEN
    RAISE EXCEPTION 'Recado vazio';
  END IF;

  IF length(NEW.content) > 500 THEN
    RAISE EXCEPTION 'Recado excede 500 caracteres';
  END IF;

  NEW.author_name := btrim(NEW.author_name);
  IF NEW.author_name IS NULL OR length(NEW.author_name) = 0 THEN
    RAISE EXCEPTION 'Nome do autor em falta';
  END IF;
  IF length(NEW.author_name) > 80 THEN
    NEW.author_name := substring(NEW.author_name from 1 for 80);
  END IF;

  -- Verify role against user_roles to prevent spoofing
  SELECT role::text INTO real_role
  FROM public.user_roles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  IF real_role IS NULL THEN
    RAISE EXCEPTION 'Utilizador sem papel atribuido';
  END IF;

  NEW.author_role := real_role;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_message() FROM anon, authenticated, public;

CREATE TRIGGER messages_validate_before_insert
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;