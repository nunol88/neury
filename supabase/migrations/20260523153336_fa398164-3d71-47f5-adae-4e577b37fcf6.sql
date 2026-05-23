ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS arrived_at timestamptz,
  ADD COLUMN IF NOT EXISTS left_at timestamptz;