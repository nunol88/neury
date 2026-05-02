
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS dias_preferidos integer[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS frequencia_preferida text NOT NULL DEFAULT 'semanal',
  ADD COLUMN IF NOT EXISTS periodo_preferido text,
  ADD COLUMN IF NOT EXISTS hora_preferida text,
  ADD COLUMN IF NOT EXISTS duracao_preferida_horas numeric NOT NULL DEFAULT 3;

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_frequencia_preferida_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_frequencia_preferida_check
  CHECK (frequencia_preferida IN ('semanal', 'quinzenal'));

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_periodo_preferido_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_periodo_preferido_check
  CHECK (periodo_preferido IS NULL OR periodo_preferido IN ('manha', 'tarde', 'noite'));
