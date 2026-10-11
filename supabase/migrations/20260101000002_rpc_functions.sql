BEGIN;

CREATE OR REPLACE FUNCTION join_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_event RECORD;
  v_confirmed_count INTEGER;
  v_waitlist_position INTEGER;
  v_status participant_status;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id
    AND deleted_at IS NULL
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
    FROM event_participants
    WHERE event_id = p_event_id
      AND profile_id = v_user_id
      AND status IN ('confirmed', 'waitlisted')
  ) THEN
    RAISE EXCEPTION 'User already joined this event';
  END IF;

  IF NOT is_community_member(v_event.community_id) THEN
    RAISE EXCEPTION 'User is not a member of this community';
  END IF;

  SELECT COUNT(*) INTO v_confirmed_count
  FROM event_participants
  WHERE event_id = p_event_id
    AND status = 'confirmed';

  IF v_confirmed_count < v_event.capacity THEN
    INSERT INTO event_participants (event_id, profile_id, status)
    VALUES (p_event_id, v_user_id, 'confirmed')
    RETURNING status INTO v_status;

    RETURN jsonb_build_object(
      'status', v_status,
      'waitlist_position', NULL
    );
  END IF;

  SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_position
  FROM event_participants
  WHERE event_id = p_event_id
    AND status = 'waitlisted';

  INSERT INTO event_participants (event_id, profile_id, status, waitlist_position)
  VALUES (p_event_id, v_user_id, 'waitlisted', v_waitlist_position)
  RETURNING status, waitlist_position INTO v_status, v_waitlist_position;

  RETURN jsonb_build_object(
    'status', v_status,
    'waitlist_position', v_waitlist_position
  );
END;
$$;

CREATE OR REPLACE FUNCTION promote_waitlisted(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_waitlisted RECORD;
BEGIN
  SELECT * INTO v_event
  FROM events
  WHERE id = p_event_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF (SELECT COUNT(*) FROM event_participants WHERE event_id = p_event_id AND status = 'confirmed') >= v_event.capacity THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_waitlisted
  FROM event_participants
  WHERE event_id = p_event_id
    AND status = 'waitlisted'
  ORDER BY waitlist_position ASC, joined_at ASC
  LIMIT 1
  FOR UPDATE;

  IF v_waitlisted IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE event_participants
  SET status = 'confirmed',
      waitlist_position = NULL,
      updated_at = now()
  WHERE id = v_waitlisted.id;

  UPDATE event_participants
  SET waitlist_position = waitlist_position - 1,
      updated_at = now()
  WHERE event_id = p_event_id
    AND status = 'waitlisted'
    AND waitlist_position > v_waitlisted.waitlist_position;

  RETURN v_waitlisted.profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION leave_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_participant RECORD;
  v_promoted UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_participant
  FROM event_participants
  WHERE event_id = p_event_id
    AND profile_id = v_user_id
    AND status IN ('confirmed', 'waitlisted')
  FOR UPDATE;

  IF v_participant IS NULL THEN
    RAISE EXCEPTION 'Participation not found';
  END IF;

  UPDATE event_participants
  SET status = 'cancelled',
      cancelled_at = now(),
      updated_at = now()
  WHERE id = v_participant.id;

  IF v_participant.status = 'confirmed' THEN
    SELECT promote_waitlisted(p_event_id) INTO v_promoted;
  ELSE
    v_promoted := NULL;

    UPDATE event_participants
    SET waitlist_position = waitlist_position - 1,
        updated_at = now()
    WHERE event_id = p_event_id
      AND status = 'waitlisted'
      AND waitlist_position > v_participant.waitlist_position;
  END IF;

  RETURN jsonb_build_object(
    'status', 'cancelled',
    'promoted_profile_id', v_promoted
  );
END;
$$;

CREATE OR REPLACE FUNCTION remove_participant(p_participant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participant RECORD;
  v_event RECORD;
  v_promoted UUID;
BEGIN
  SELECT ep.*, e.community_id INTO v_participant
  FROM event_participants ep
  JOIN events e ON e.id = ep.event_id
  WHERE ep.id = p_participant_id
  FOR UPDATE;

  IF v_participant IS NULL THEN
    RAISE EXCEPTION 'Participant not found';
  END IF;

  IF NOT is_community_admin(v_participant.community_id) THEN
    RAISE EXCEPTION 'Only community admins can remove participants';
  END IF;

  UPDATE event_participants
  SET status = 'cancelled',
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_participant_id;

  IF v_participant.status = 'confirmed' THEN
    SELECT promote_waitlisted(v_participant.event_id) INTO v_promoted;
  ELSE
    v_promoted := NULL;

    UPDATE event_participants
    SET waitlist_position = waitlist_position - 1,
        updated_at = now()
    WHERE event_id = v_participant.event_id
      AND status = 'waitlisted'
      AND waitlist_position > v_participant.waitlist_position;
  END IF;

  INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(),
    'participant.removed',
    'event_participants',
    p_participant_id,
    jsonb_build_object('event_id', v_participant.event_id, 'promoted_profile_id', v_promoted)
  );

  RETURN jsonb_build_object(
    'status', 'cancelled',
    'promoted_profile_id', v_promoted
  );
END;
$$;

COMMIT;
