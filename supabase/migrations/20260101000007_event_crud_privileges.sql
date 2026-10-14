BEGIN;

ALTER TABLE public.events
  ALTER COLUMN created_by SET DEFAULT public.current_profile_id();

REVOKE INSERT, UPDATE ON TABLE public.events FROM anon, authenticated;
GRANT INSERT (
  community_id,
  activity_type_id,
  title,
  description,
  starts_at,
  ends_at,
  capacity,
  location,
  status,
  share_slug
) ON TABLE public.events TO authenticated;
GRANT UPDATE (
  activity_type_id,
  title,
  description,
  starts_at,
  ends_at,
  capacity,
  location,
  status,
  share_slug,
  deleted_at
) ON TABLE public.events TO authenticated;

COMMIT;
