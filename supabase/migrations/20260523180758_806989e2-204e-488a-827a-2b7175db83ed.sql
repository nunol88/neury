
-- Add audio columns to messages
ALTER TABLE public.messages
  ADD COLUMN audio_url text,
  ADD COLUMN audio_duration numeric,
  ALTER COLUMN content DROP NOT NULL;

-- Update validate_message to allow audio-only messages
CREATE OR REPLACE FUNCTION public.validate_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  real_role text;
BEGIN
  IF NEW.content IS NOT NULL THEN
    NEW.content := btrim(NEW.content);
    IF length(NEW.content) = 0 THEN
      NEW.content := NULL;
    ELSIF length(NEW.content) > 500 THEN
      RAISE EXCEPTION 'Recado excede 500 caracteres';
    END IF;
  END IF;

  IF NEW.content IS NULL AND NEW.audio_url IS NULL THEN
    RAISE EXCEPTION 'Recado vazio';
  END IF;

  NEW.author_name := btrim(NEW.author_name);
  IF NEW.author_name IS NULL OR length(NEW.author_name) = 0 THEN
    RAISE EXCEPTION 'Nome do autor em falta';
  END IF;
  IF length(NEW.author_name) > 80 THEN
    NEW.author_name := substring(NEW.author_name from 1 for 80);
  END IF;

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
$function$;

DROP TRIGGER IF EXISTS validate_message_trigger ON public.messages;
CREATE TRIGGER validate_message_trigger
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_message();

-- Storage bucket for audio recados
INSERT INTO storage.buckets (id, name, public)
VALUES ('recados-audio', 'recados-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Recados audio public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'recados-audio');

CREATE POLICY "Active users can upload own recado audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recados-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_user_active(auth.uid()))
);

CREATE POLICY "Authors or admins can delete recado audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recados-audio'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role))
);
