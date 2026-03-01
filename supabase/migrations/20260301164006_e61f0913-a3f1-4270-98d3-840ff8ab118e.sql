
-- Fix ai_conversations: restrict to admin-only access
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.ai_conversations;

CREATE POLICY "Only admins can manage conversations"
ON public.ai_conversations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
