
DROP POLICY IF EXISTS "Recados audio public read" ON storage.objects;

CREATE POLICY "Active users can list recado audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recados-audio'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_user_active(auth.uid()))
);
