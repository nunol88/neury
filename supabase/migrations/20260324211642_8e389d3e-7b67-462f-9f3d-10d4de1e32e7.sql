
-- Create extras table for extra income entries
CREATE TABLE public.extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valor numeric(10,2) NOT NULL,
  data date NOT NULL,
  observacoes text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mes_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all extras
CREATE POLICY "Authenticated users can view extras"
  ON public.extras FOR SELECT TO authenticated
  USING (true);

-- Users can insert their own extras
CREATE POLICY "Users can insert own extras"
  ON public.extras FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own extras, admins can delete any
CREATE POLICY "Users can delete own extras or admin"
  ON public.extras FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert extras for anyone
CREATE POLICY "Admins can insert any extras"
  ON public.extras FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
