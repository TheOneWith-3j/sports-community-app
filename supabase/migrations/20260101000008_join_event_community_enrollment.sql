BEGIN;

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

  INSERT INTO public.community_members (community_id, profile_id, role)
  VALUES (v_event.community_id, v_user_id, 'member')
  ON CONFLICT (community_id, profile_id) DO NOTHING;

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

COMMIT;
