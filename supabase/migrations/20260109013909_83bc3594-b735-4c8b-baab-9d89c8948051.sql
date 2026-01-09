-- Add payment tracking columns to agendamentos
ALTER TABLE public.agendamentos 
ADD COLUMN pago BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.agendamentos 
ADD COLUMN data_pagamento TIMESTAMP WITH TIME ZONE;