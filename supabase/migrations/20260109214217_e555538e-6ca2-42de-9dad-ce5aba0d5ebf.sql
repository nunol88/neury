-- Add column to track who marked the task as completed
ALTER TABLE public.agendamentos 
ADD COLUMN completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN completed_by_role text;