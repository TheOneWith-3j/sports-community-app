BEGIN;

GRANT SELECT ON TABLE public.event_participants TO authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;

GRANT INSERT (
  participant_id,
  event_id,
  status,
  marked_by
) ON TABLE public.attendance_records TO authenticated;
GRANT UPDATE (
  status,
  marked_by
) ON TABLE public.attendance_records TO authenticated;

COMMIT;
