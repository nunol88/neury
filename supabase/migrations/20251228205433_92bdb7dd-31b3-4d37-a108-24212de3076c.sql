-- Add unique constraint on client name (case-insensitive)
CREATE UNIQUE INDEX clients_nome_unique ON public.clients (LOWER(TRIM(nome)));