BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path TO extensions, public;

SELECT plan(22);

SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{}', true);
SELECT is(
  public.current_profile_id(),
  NULL::UUID,
  'anonymous requests do not resolve to an application profile'
);
SELECT ok(
  NOT has_function_privilege('anon', 'public.ensure_current_profile()', 'EXECUTE'),
  'anonymous users cannot provision profiles'
);

RESET ROLE;
INSERT INTO public.profiles (id, auth_issuer, auth_subject, display_name)
VALUES (
  '00000000-0000-0000-0000-000000000099',
  'https://sports-community-test.us.auth0.com/',
  'google-oauth2|unrelated-user',
  'Unrelated Player'
);
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|test-user","role":"authenticated","platform_role":"super_admin","name":"Test Player"}',
  true
);
SELECT is(
  public.current_profile_id(),
  NULL::UUID,
  'an authenticated identity has no profile before provisioning'
);
SELECT ok(
  public.ensure_current_profile() IS NOT NULL,
  'the verified identity can provision an internal profile'
);
SELECT is(
  public.ensure_current_profile(),
  public.current_profile_id(),
  'repeated profile provisioning returns the same internal UUID'
);
SELECT is(
  public.current_profile_id(),
  (
    SELECT p.id
    FROM public.profiles AS p
    WHERE p.auth_issuer = 'https://sports-community-test.us.auth0.com/'
      AND p.auth_subject = 'google-oauth2|test-user'
  ),
  'profile lookup resolves Auth0 issuer and subject to the internal UUID'
);
SELECT is(
  (SELECT COUNT(*)::INTEGER FROM public.profiles),
  1,
  'RLS does not expose an unrelated profile even when the token claims super_admin'
);
SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM public.profiles AS p
    WHERE p.auth_issuer = 'https://sports-community-test.us.auth0.com/'
      AND p.auth_subject = 'google-oauth2|test-user'
  ),
  1,
  'repeated profile provisioning is idempotent'
);
SELECT is(
  (
    SELECT p.display_name
    FROM public.profiles AS p
    WHERE p.id = public.current_profile_id()
  ),
  'Test Player',
  'profile name comes from the verified ID token'
);
SELECT is(
  (
    SELECT p.onboarding_completed
    FROM public.profiles AS p
    WHERE p.id = public.current_profile_id()
  ),
  FALSE,
  'new Auth0 profiles require onboarding even when the token includes a name'
);
SELECT is(
  (
    SELECT p.platform_role::TEXT
    FROM public.profiles AS p
    WHERE p.id = public.current_profile_id()
  ),
  'member',
  'new profiles receive only the least-privilege member role'
);
SELECT is(
  public.auth_user_id(),
  public.current_profile_id(),
  'legacy caller helper resolves to the internal profile UUID'
);
SELECT ok(
  NOT has_column_privilege('authenticated', 'public.profiles', 'platform_role', 'UPDATE'),
  'authenticated users cannot update their platform role'
);
SELECT ok(
  NOT has_column_privilege('authenticated', 'public.profiles', 'auth_issuer', 'UPDATE')
    AND NOT has_column_privilege('authenticated', 'public.profiles', 'auth_subject', 'UPDATE'),
  'authenticated users cannot change the identity binding'
);
SELECT ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'),
  'authenticated users can update allowed profile fields'
);
SELECT ok(
  NOT has_function_privilege('authenticated', 'public.promote_waitlisted(uuid)', 'EXECUTE'),
  'waitlist promotion is not directly callable by users'
);

RESET ROLE;
INSERT INTO public.activity_types (name, slug, icon)
VALUES ('Badminton', 'badminton', 'shuttlecock')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.communities (id, name, slug, activity_type_id, owner_id)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    'Mapped profile community',
    'auth0-test-mapped',
    (SELECT id FROM public.activity_types WHERE slug = 'badminton'),
    public.current_profile_id()
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Unrelated profile community',
    'auth0-test-unrelated',
    (SELECT id FROM public.activity_types WHERE slug = 'badminton'),
    '00000000-0000-0000-0000-000000000099'
  );
INSERT INTO public.community_members (community_id, profile_id, role)
VALUES
  (
    '00000000-0000-0000-0000-000000000101',
    public.current_profile_id(),
    'admin'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000099',
    'admin'
  );
INSERT INTO public.events (
  id,
  community_id,
  created_by,
  activity_type_id,
  title,
  starts_at,
  ends_at,
  capacity,
  status,
  share_slug
)
VALUES
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    public.current_profile_id(),
    (SELECT id FROM public.activity_types WHERE slug = 'badminton'),
    'Mapped community event',
    now() + INTERVAL '1 day',
    now() + INTERVAL '1 day 2 hours',
    2,
    'published',
    'auth0-test-mapped-event'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000099',
    (SELECT id FROM public.activity_types WHERE slug = 'badminton'),
    'Unrelated private event',
    now() + INTERVAL '1 day',
    now() + INTERVAL '1 day 2 hours',
    2,
    'draft',
    'auth0-test-unrelated-event'
  );

SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT COUNT(*)::INTEGER FROM public.events),
  1,
  'RLS exposes the caller community event and hides an unrelated draft event'
);
SELECT throws_ok(
  $$INSERT INTO public.event_participants (event_id, profile_id, status)
    VALUES (
      '00000000-0000-0000-0000-000000000201',
      public.current_profile_id(),
      'confirmed'
    )$$,
  '42501',
  'new row violates row-level security policy for table "event_participants"',
  'authenticated users cannot bypass join_event with a direct insert'
);
SELECT is(
  (
    public.join_event('00000000-0000-0000-0000-000000000201'::UUID) ->> 'status'
  ),
  'confirmed',
  'join_event uses the mapped internal profile for an authorized member'
);
SELECT is(
  (
    public.leave_event('00000000-0000-0000-0000-000000000201'::UUID) ->> 'status'
  ),
  'cancelled',
  'leave_event uses the same mapped internal profile'
);

SELECT set_config(
  'request.jwt.claims',
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|role-mismatch","role":"anon","platform_role":"super_admin"}',
  true
);
SELECT is(
  public.current_profile_id(),
  NULL::UUID,
  'tokens without the Supabase authenticated database role do not resolve a profile'
);
SELECT throws_ok(
  $$SELECT public.ensure_current_profile()$$,
  '42501',
  'Authenticated identity required',
  'profile provisioning rejects tokens without the Supabase authenticated role'
);

SELECT * FROM finish();
ROLLBACK;
