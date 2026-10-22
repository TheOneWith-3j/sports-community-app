BEGIN;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.event_participants
  FROM anon, authenticated;

REVOKE DELETE ON TABLE public.attendance_records
  FROM anon, authenticated;

COMMIT;
