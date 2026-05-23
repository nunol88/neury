ALTER TABLE public.extras 
ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'receita';

ALTER TABLE public.extras
DROP CONSTRAINT IF EXISTS extras_tipo_check;

ALTER TABLE public.extras
ADD CONSTRAINT extras_tipo_check CHECK (tipo IN ('receita', 'despesa'));