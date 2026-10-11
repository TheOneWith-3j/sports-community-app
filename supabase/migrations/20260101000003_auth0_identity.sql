BEGIN;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ADD COLUMN auth_issuer TEXT,
  ADD COLUMN auth_subject TEXT;

CREATE UNIQUE INDEX profiles_auth_identity_unique
  ON public.profiles (auth_issuer, auth_subject);

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.id
  FROM public.profiles AS p
  WHERE p.auth_issuer = NULLIF(auth.jwt() ->> 'iss', '')
    AND p.auth_subject = NULLIF(auth.jwt() ->> 'sub', '')
    AND auth.jwt() ->> 'role' = 'authenticated'
    AND p.deleted_at IS NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_profile_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.ensure_current_profile()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_claims JSONB := auth.jwt();
  v_issuer TEXT;
  v_subject TEXT;
  v_profile_id UUID;
  v_deleted_at TIMESTAMPTZ;
BEGIN
  IF v_claims ->> 'role' <> 'authenticated' THEN
    RAISE EXCEPTION 'Authenticated identity required'
      USING ERRCODE = '42501';
  END IF;

  v_issuer := NULLIF(v_claims ->> 'iss', '');
  v_subject := NULLIF(v_claims ->> 'sub', '');

  IF v_issuer IS NULL OR v_subject IS NULL THEN
    RAISE EXCEPTION 'Auth0 issuer and subject claims are required'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.profiles (auth_issuer, auth_subject, display_name)
  VALUES (
    v_issuer,
    v_subject,
    COALESCE(NULLIF(BTRIM(v_claims ->> 'name'), ''), 'New member')
  )
  ON CONFLICT (auth_issuer, auth_subject) DO NOTHING;

  SELECT p.id, p.deleted_at
  INTO v_profile_id, v_deleted_at
  FROM public.profiles AS p
  WHERE p.auth_issuer = v_issuer
    AND p.auth_subject = v_subject;

  IF v_profile_id IS NULL OR v_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Application profile is unavailable'
      USING ERRCODE = '42501';
  END IF;

  RETURN v_profile_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_current_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_current_profile() TO authenticated;

REVOKE UPDATE ON TABLE public.profiles FROM anon, authenticated;
GRANT UPDATE (display_name, avatar_url, phone)
  ON TABLE public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT public.current_profile_id();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS p
    WHERE p.id = public.current_profile_id()
      AND p.platform_role = 'super_admin'
      AND p.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_community_admin(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members AS cm
    JOIN public.profiles AS p ON p.id = cm.profile_id
    WHERE cm.community_id = p_community_id
      AND cm.profile_id = public.current_profile_id()
      AND cm.role = 'admin'
      AND p.deleted_at IS NULL
  ) OR public.is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.is_community_member(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members AS cm
    WHERE cm.community_id = p_community_id
      AND cm.profile_id = public.current_profile_id()
  ) OR public.is_super_admin();
$$;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_community_peers ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_super_admin_all ON public.profiles;
DROP POLICY IF EXISTS communities_select_member ON public.communities;
DROP POLICY IF EXISTS communities_insert_authenticated ON public.communities;
DROP POLICY IF EXISTS communities_update_admin ON public.communities;
DROP POLICY IF EXISTS communities_soft_delete_admin ON public.communities;
DROP POLICY IF EXISTS community_members_select ON public.community_members;
DROP POLICY IF EXISTS community_members_insert_admin ON public.community_members;
DROP POLICY IF EXISTS community_members_update_admin ON public.community_members;
DROP POLICY IF EXISTS community_members_delete_admin ON public.community_members;
DROP POLICY IF EXISTS activity_types_select_all ON public.activity_types;
DROP POLICY IF EXISTS activity_types_manage_super ON public.activity_types;
DROP POLICY IF EXISTS events_public_select ON public.events;
DROP POLICY IF EXISTS events_member_select ON public.events;
DROP POLICY IF EXISTS events_insert_admin ON public.events;
DROP POLICY IF EXISTS events_update_admin ON public.events;
DROP POLICY IF EXISTS event_participants_select ON public.event_participants;
DROP POLICY IF EXISTS attendance_select_admin ON public.attendance_records;
DROP POLICY IF EXISTS attendance_select_own ON public.attendance_records;
DROP POLICY IF EXISTS attendance_insert_admin ON public.attendance_records;
DROP POLICY IF EXISTS attendance_update_admin ON public.attendance_records;
DROP POLICY IF EXISTS audit_logs_select_super ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_admin ON public.audit_logs;

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT
  USING (id = public.current_profile_id() AND deleted_at IS NULL);

CREATE POLICY profiles_select_community_peers ON public.profiles FOR SELECT
  USING (
    deleted_at IS NULL AND (
      id = public.current_profile_id()
      OR EXISTS (
        SELECT 1
        FROM public.community_members AS cm1
        JOIN public.community_members AS cm2 ON cm1.community_id = cm2.community_id
        WHERE cm1.profile_id = public.current_profile_id()
          AND cm2.profile_id = profiles.id
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE
  USING (id = public.current_profile_id() AND deleted_at IS NULL)
  WITH CHECK (id = public.current_profile_id());

CREATE POLICY profiles_super_admin_all ON public.profiles FOR ALL
  USING (public.is_super_admin());

CREATE POLICY communities_select_member ON public.communities FOR SELECT
  USING (deleted_at IS NULL AND (public.is_community_member(id) OR public.is_super_admin()));

CREATE POLICY communities_insert_authenticated ON public.communities FOR INSERT
  WITH CHECK (
    public.current_profile_id() IS NOT NULL
    AND owner_id = public.current_profile_id()
  );

CREATE POLICY communities_update_admin ON public.communities FOR UPDATE
  USING (public.is_community_admin(id) AND deleted_at IS NULL);

CREATE POLICY communities_soft_delete_admin ON public.communities FOR UPDATE
  USING (public.is_community_admin(id))
  WITH CHECK (true);

CREATE POLICY community_members_select ON public.community_members FOR SELECT
  USING (public.is_community_member(community_id) OR public.is_super_admin());

CREATE POLICY community_members_insert_admin ON public.community_members FOR INSERT
  WITH CHECK (public.is_community_admin(community_id) OR public.is_super_admin());

CREATE POLICY community_members_update_admin ON public.community_members FOR UPDATE
  USING (public.is_community_admin(community_id) OR public.is_super_admin());

CREATE POLICY community_members_delete_admin ON public.community_members FOR DELETE
  USING (public.is_community_admin(community_id) OR public.is_super_admin());

CREATE POLICY activity_types_select_all ON public.activity_types FOR SELECT USING (true);

CREATE POLICY activity_types_manage_super ON public.activity_types FOR ALL
  USING (public.is_super_admin());

CREATE POLICY events_public_select ON public.events FOR SELECT
  USING (deleted_at IS NULL AND status = 'published');

CREATE POLICY events_member_select ON public.events FOR SELECT
  USING (deleted_at IS NULL AND (public.is_community_member(community_id) OR public.is_super_admin()));

CREATE POLICY events_insert_admin ON public.events FOR INSERT
  WITH CHECK (
    public.is_community_admin(community_id)
    AND created_by = public.current_profile_id()
  );

CREATE POLICY events_update_admin ON public.events FOR UPDATE
  USING (public.is_community_admin(community_id) AND deleted_at IS NULL);

CREATE POLICY event_participants_select ON public.event_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.events AS e
      WHERE e.id = event_participants.event_id
        AND e.deleted_at IS NULL
        AND (
          e.status = 'published'
          OR public.is_community_member(e.community_id)
          OR public.is_super_admin()
        )
    )
    AND (
      status = 'confirmed'
      OR profile_id = public.current_profile_id()
      OR public.is_community_admin(
        (SELECT community_id FROM public.events WHERE id = event_participants.event_id)
      )
      OR public.is_super_admin()
    )
  );

CREATE POLICY attendance_select_admin ON public.attendance_records FOR SELECT
  USING (
    public.is_community_admin(
      (SELECT community_id FROM public.events WHERE id = attendance_records.event_id)
    )
    OR public.is_super_admin()
  );

CREATE POLICY attendance_select_own ON public.attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.event_participants AS ep
      WHERE ep.id = attendance_records.participant_id
        AND ep.profile_id = public.current_profile_id()
    )
  );

CREATE POLICY attendance_insert_admin ON public.attendance_records FOR INSERT
  WITH CHECK (
    public.is_community_admin(
      (SELECT community_id FROM public.events WHERE id = event_id)
    )
  );

CREATE POLICY attendance_update_admin ON public.attendance_records FOR UPDATE
  USING (
    public.is_community_admin(
      (SELECT community_id FROM public.events WHERE id = event_id)
    )
  );

CREATE POLICY audit_logs_select_super ON public.audit_logs FOR SELECT
  USING (public.is_super_admin());

CREATE POLICY audit_logs_insert_admin ON public.audit_logs FOR INSERT
  WITH CHECK (public.current_profile_id() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.join_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := public.current_profile_id();
  v_event RECORD;
  v_confirmed_count INTEGER;
  v_waitlist_position INTEGER;
  v_status public.participant_status;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id AND deleted_at IS NULL
  FOR UPDATE;

  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF v_event.status <> 'published' THEN
    RAISE EXCEPTION 'Event is not open for joining';
  END IF;

  IF v_event.starts_at <= now() THEN
    RAISE EXCEPTION 'Event has already started';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_participants
    WHERE event_id = p_event_id
      AND profile_id = v_user_id
      AND status IN ('confirmed', 'waitlisted')
  ) THEN
    RAISE EXCEPTION 'User already joined this event';
  END IF;

  IF NOT public.is_community_member(v_event.community_id) THEN
    RAISE EXCEPTION 'User is not a member of this community';
  END IF;

  SELECT COUNT(*) INTO v_confirmed_count
  FROM public.event_participants
  WHERE event_id = p_event_id AND status = 'confirmed';

  IF v_confirmed_count < v_event.capacity THEN
    INSERT INTO public.event_participants (event_id, profile_id, status)
    VALUES (p_event_id, v_user_id, 'confirmed')
    RETURNING status INTO v_status;

    RETURN jsonb_build_object('status', v_status, 'waitlist_position', NULL);
  END IF;

  SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_position
  FROM public.event_participants
  WHERE event_id = p_event_id AND status = 'waitlisted';

  INSERT INTO public.event_participants (event_id, profile_id, status, waitlist_position)
  VALUES (p_event_id, v_user_id, 'waitlisted', v_waitlist_position)
  RETURNING status, waitlist_position INTO v_status, v_waitlist_position;

  RETURN jsonb_build_object('status', v_status, 'waitlist_position', v_waitlist_position);
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_waitlisted(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event RECORD;
  v_waitlisted RECORD;
BEGIN
  SELECT * INTO v_event
  FROM public.events
  WHERE id = p_event_id AND deleted_at IS NULL
  FOR UPDATE;

  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF (
    SELECT COUNT(*)
    FROM public.event_participants
    WHERE event_id = p_event_id AND status = 'confirmed'
  ) >= v_event.capacity THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_waitlisted
  FROM public.event_participants
  WHERE event_id = p_event_id AND status = 'waitlisted'
  ORDER BY waitlist_position ASC, joined_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_waitlisted IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.event_participants
  SET status = 'confirmed', waitlist_position = NULL, updated_at = now()
  WHERE id = v_waitlisted.id;

  UPDATE public.event_participants
  SET waitlist_position = waitlist_position - 1, updated_at = now()
  WHERE event_id = p_event_id
    AND status = 'waitlisted'
    AND waitlist_position > v_waitlisted.waitlist_position;

  RETURN v_waitlisted.profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := public.current_profile_id();
  v_participant RECORD;
  v_promoted UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_participant
  FROM public.event_participants
  WHERE event_id = p_event_id
    AND profile_id = v_user_id
    AND status IN ('confirmed', 'waitlisted')
  FOR UPDATE;

  IF v_participant IS NULL THEN
    RAISE EXCEPTION 'Participation not found';
  END IF;

  UPDATE public.event_participants
  SET status = 'cancelled', cancelled_at = now(), updated_at = now()
  WHERE id = v_participant.id;

  IF v_participant.status = 'confirmed' THEN
    SELECT public.promote_waitlisted(p_event_id) INTO v_promoted;
  ELSE
    v_promoted := NULL;

    UPDATE public.event_participants
    SET waitlist_position = waitlist_position - 1, updated_at = now()
    WHERE event_id = p_event_id
      AND status = 'waitlisted'
      AND waitlist_position > v_participant.waitlist_position;
  END IF;

  RETURN jsonb_build_object('status', 'cancelled', 'promoted_profile_id', v_promoted);
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_participant(p_participant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_participant RECORD;
  v_promoted UUID;
  v_actor_id UUID := public.current_profile_id();
BEGIN
  SELECT ep.*, e.community_id INTO v_participant
  FROM public.event_participants AS ep
  JOIN public.events AS e ON e.id = ep.event_id
  WHERE ep.id = p_participant_id
  FOR UPDATE;

  IF v_participant IS NULL THEN
    RAISE EXCEPTION 'Participant not found';
  END IF;

  IF NOT public.is_community_admin(v_participant.community_id) THEN
    RAISE EXCEPTION 'Only community admins can remove participants'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.event_participants
  SET status = 'cancelled', cancelled_at = now(), updated_at = now()
  WHERE id = p_participant_id;

  IF v_participant.status = 'confirmed' THEN
    SELECT public.promote_waitlisted(v_participant.event_id) INTO v_promoted;
  ELSE
    v_promoted := NULL;

    UPDATE public.event_participants
    SET waitlist_position = waitlist_position - 1, updated_at = now()
    WHERE event_id = v_participant.event_id
      AND status = 'waitlisted'
      AND waitlist_position > v_participant.waitlist_position;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_actor_id,
    'participant.removed',
    'event_participants',
    p_participant_id,
    jsonb_build_object('event_id', v_participant.event_id, 'promoted_profile_id', v_promoted)
  );

  RETURN jsonb_build_object('status', 'cancelled', 'promoted_profile_id', v_promoted);
END;
$$;

REVOKE ALL ON FUNCTION public.join_event(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_event(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_participant(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.promote_waitlisted(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.join_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_participant(UUID) TO authenticated;

COMMIT;
