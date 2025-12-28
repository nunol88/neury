-- Add input validation to has_role function to prevent role enumeration attacks
-- and ensure proper null handling
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate inputs - return FALSE for NULL values
  IF _user_id IS NULL OR _role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Only allow checking the authenticated user's own roles
  -- This prevents role enumeration attacks where someone could
  -- check if arbitrary user IDs have certain roles
  IF _user_id != auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Add input validation to get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Validate input
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Only allow fetching the authenticated user's own role
  -- This prevents role enumeration attacks
  IF _user_id != auth.uid() THEN
    RETURN NULL;
  END IF;
  
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  RETURN user_role;
END;
$$;