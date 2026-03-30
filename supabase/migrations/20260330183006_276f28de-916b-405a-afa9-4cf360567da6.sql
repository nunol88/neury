
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('ef88edd4-99c5-4dae-be77-a8ce85f8140e', 'admin', true)
ON CONFLICT DO NOTHING;
