BEGIN;

GRANT SELECT (id, display_name, avatar_url) ON TABLE public.profiles TO anon, authenticated;

DROP POLICY IF EXISTS profiles_select_published_participants ON public.profiles;
CREATE POLICY profiles_select_published_participants ON public.profiles FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.event_participants AS ep
      JOIN public.events AS e ON e.id = ep.event_id
      WHERE ep.profile_id = profiles.id
        AND ep.status = 'confirmed'
        AND e.status = 'published'
        AND e.deleted_at IS NULL
    )
  );

COMMIT;
