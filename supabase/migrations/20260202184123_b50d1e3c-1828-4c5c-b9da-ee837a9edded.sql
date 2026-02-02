-- Add recibo_verde column to clients table
ALTER TABLE public.clients 
ADD COLUMN recibo_verde BOOLEAN NOT NULL DEFAULT false;