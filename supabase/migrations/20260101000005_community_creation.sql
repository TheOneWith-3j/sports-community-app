BEGIN;

INSERT INTO public.activity_types (name, slug, icon)
VALUES
  ('Badminton', 'badminton', 'shuttlecock'),
  ('Pickleball', 'pickleball', 'circle-dot'),
  ('General', 'general', 'users')
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_community(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT,
  p_activity_type_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_profile_id UUID := public.current_profile_id();
  v_platform_role public.platform_role;
  v_community_id UUID;
BEGIN
  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT p.platform_role
  INTO v_platform_role
  FROM public.profiles AS p
  WHERE p.id = v_profile_id
    AND p.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF v_platform_role <> 'super_admin' AND EXISTS (
    SELECT 1
    FROM public.communities AS c
    WHERE c.owner_id = v_profile_id
      AND c.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Community limit reached' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.communities (
    name,
    slug,
    description,
    activity_type_id,
    owner_id
  )
  VALUES (
    p_name,
    p_slug,
    NULLIF(p_description, ''),
    p_activity_type_id,
    v_profile_id
  )
  RETURNING id INTO v_community_id;

  INSERT INTO public.community_members (community_id, profile_id, role)
  VALUES (v_community_id, v_profile_id, 'admin');

  RETURN v_community_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_community(TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_community(TEXT, TEXT, TEXT, UUID)
  TO authenticated;
REVOKE INSERT ON TABLE public.communities FROM anon, authenticated;

COMMIT;
