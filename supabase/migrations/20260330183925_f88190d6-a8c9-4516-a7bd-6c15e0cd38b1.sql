
-- Create user_activity_logs table
CREATE TABLE public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.user_activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view all activity logs"
  ON public.user_activity_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own logs
CREATE POLICY "Users can view own activity logs"
  ON public.user_activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert own activity logs"
  ON public.user_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert any logs
CREATE POLICY "Admins can insert any activity logs"
  ON public.user_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
