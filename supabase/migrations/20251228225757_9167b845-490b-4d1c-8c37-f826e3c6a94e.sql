-- Fix: Restrict clients table SELECT access to admins only
-- This protects sensitive personal information (phone, address) from non-admin users

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;

-- Create a restrictive SELECT policy that only allows admins to view clients
CREATE POLICY "Only admins can view clients" 
ON public.clients 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));