
CREATE OR REPLACE FUNCTION public.handle_google_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email IN ('godoi.may@gmail.com', 'mayaracsg@hotmail.com', 'nunoleitao@me.com', 'srqmyqn58b@privaterelay.appleid.com') THEN
    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES (NEW.id, 'admin', true)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;
