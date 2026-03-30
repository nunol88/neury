CREATE TABLE public.carris_schedules (
  stop_id text NOT NULL,
  entries text[] NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (stop_id)
);

ALTER TABLE public.carris_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.carris_schedules
  FOR SELECT TO anon, authenticated
  USING (true);