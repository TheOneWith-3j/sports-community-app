BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path TO extensions, public;

SELECT plan(49);

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

SET LOCAL ROLE authenticated;
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.communities', 'INSERT'),
  'authenticated users cannot bypass the atomic community creation RPC'
);
SELECT ok(
  NOT has_column_privilege('authenticated', 'public.communities', 'owner_id', 'UPDATE')
    AND has_column_privilege('authenticated', 'public.communities', 'name', 'UPDATE'),
  'community owners are immutable to clients while settings fields remain editable'
);
SELECT ok(
  has_function_privilege(
    'authenticated',
    'public.create_community(text,text,text,uuid)',
    'EXECUTE'
  )
    AND NOT has_function_privilege(
      'anon',
      'public.create_community(text,text,text,uuid)',
      'EXECUTE'
    ),
  'only authenticated users can call the community creation RPC'
);
SELECT ok(
  public.create_community(
    'M5 Test Community',
    'm5-test-community',
    'Database integration test',
    (SELECT id FROM public.activity_types WHERE slug = 'badminton')
  ) IS NOT NULL,
  'community creation returns the new community ID'
);
SELECT is(
  (
    SELECT c.owner_id
    FROM public.communities AS c
    WHERE c.slug = 'm5-test-community'
  ),
  public.current_profile_id(),
  'community ownership is derived from the verified caller profile'
);
SELECT is(
  (
    SELECT cm.role::TEXT
    FROM public.community_members AS cm
    JOIN public.communities AS c ON c.id = cm.community_id
    WHERE c.slug = 'm5-test-community'
      AND cm.profile_id = public.current_profile_id()
  ),
  'admin',
  'the creator is atomically added as a community admin'
);
UPDATE public.communities
SET description = 'Updated by community admin'
WHERE slug = 'm5-test-community';
SELECT is(
  (
    SELECT c.description
    FROM public.communities AS c
    WHERE c.slug = 'm5-test-community'
  ),
  'Updated by community admin',
  'community admins can update their community settings'
);
SELECT set_config(
  'test.community_id',
  (
    SELECT c.id::TEXT
    FROM public.communities AS c
    WHERE c.slug = 'm5-test-community'
  ),
  true
);
SELECT throws_ok(
  $$SELECT public.create_community(
      'Second Test Community',
      'second-test-community',
      NULL,
      (SELECT id FROM public.activity_types WHERE slug = 'badminton')
    )$$,
  'P0001',
  'Community limit reached',
  'a regular profile cannot create a second active community'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|non-admin","role":"authenticated"}',
  true
);
SELECT ok(
  public.ensure_current_profile() IS NOT NULL,
  'a separate authenticated player profile can be provisioned'
);
SELECT ok(
  NOT public.is_community_admin(current_setting('test.community_id')::UUID),
  'a non-admin player is not authorized to manage another community'
);
UPDATE public.communities
SET description = 'Unauthorized browser test change'
WHERE id = current_setting('test.community_id')::UUID;

RESET ROLE;
SELECT is(
  (
    SELECT c.description
    FROM public.communities AS c
    WHERE c.id = current_setting('test.community_id')::UUID
  ),
  'Updated by community admin',
  'RLS prevents a non-admin from changing community settings'
);
UPDATE public.profiles
SET platform_role = 'super_admin'
WHERE id = '00000000-0000-0000-0000-000000000099';
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|unrelated-user","role":"authenticated"}',
  true
);
SELECT throws_ok(
  $$SELECT public.create_community(
      'Duplicate Slug Community',
      'm5-test-community',
      NULL,
      (SELECT id FROM public.activity_types WHERE slug = 'badminton')
    )$$,
  '23505',
  NULL,
  'duplicate community slugs are rejected by the database constraint'
);

RESET ROLE;
SELECT set_config(
  'request.jwt.claims',
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|test-user","role":"authenticated","platform_role":"super_admin","name":"Test Player"}',
  true
);

SET LOCAL ROLE authenticated;
SELECT ok(
  NOT has_column_privilege('authenticated', 'public.events', 'created_by', 'INSERT')
    AND has_column_privilege('authenticated', 'public.events', 'title', 'INSERT'),
  'event creators cannot be supplied by clients but event fields are insertable'
);
SELECT ok(
  NOT has_column_privilege('authenticated', 'public.events', 'created_by', 'UPDATE')
    AND NOT has_column_privilege('authenticated', 'public.events', 'community_id', 'UPDATE')
    AND has_column_privilege('authenticated', 'public.events', 'title', 'UPDATE'),
  'event ownership and community binding are immutable to clients'
);
INSERT INTO public.events (
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
)
VALUES (
  (SELECT id FROM public.communities WHERE slug = 'm5-test-community'),
  (SELECT id FROM public.activity_types WHERE slug = 'badminton'),
  'M6 Event Regression',
  'Created under the authenticated role',
  now() + INTERVAL '2 hours',
  now() + INTERVAL '3 hours',
  12,
  'Community gym',
  'draft',
  'aB3_xY9-'
);
SELECT is(
  (
    SELECT e.created_by
    FROM public.events e
    WHERE e.share_slug = 'aB3_xY9-'
  ),
  public.current_profile_id(),
  'new events default their creator to the verified current profile'
);

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{}', true);
SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM public.events
    WHERE share_slug = 'aB3_xY9-'
  ),
  0,
  'anonymous users cannot read draft events'
);
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|test-user","role":"authenticated","platform_role":"super_admin","name":"Test Player"}',
  true
);
SELECT ok(
  has_column_privilege('authenticated', 'public.events', 'status', 'UPDATE'),
  'community admins can update event lifecycle status'
);
UPDATE public.events
SET title = 'M6 Event Updated'
WHERE share_slug = 'aB3_xY9-';
SELECT is(
  (
    SELECT e.title
    FROM public.events e
    WHERE e.share_slug = 'aB3_xY9-'
  ),
  'M6 Event Updated',
  'community admins can update event details'
);

RESET ROLE;
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
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '00000000-0000-0000-0000-000000000101',
    public.current_profile_id(),
    (SELECT id FROM public.activity_types WHERE slug = 'badminton'),
    'Cancelled community event',
    now() + INTERVAL '1 day',
    now() + INTERVAL '1 day 2 hours',
    2,
    'cancelled',
    'auth0-test-cancelled-event'
  ),
  (
    '00000000-0000-0000-0000-000000000204',
    '00000000-0000-0000-0000-000000000101',
    public.current_profile_id(),
    (SELECT id FROM public.activity_types WHERE slug = 'badminton'),
    'Past community event',
    now() - INTERVAL '3 hours',
    now() - INTERVAL '1 hour',
    2,
    'published',
    'auth0-test-past-event'
  );

RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{}', true);
SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM public.events
    WHERE id IN (
      '00000000-0000-0000-0000-000000000201',
      '00000000-0000-0000-0000-000000000202',
      '00000000-0000-0000-0000-000000000203'
    )
  ),
  1,
  'anonymous users can read published events but not draft or cancelled events'
);

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|non-admin","role":"authenticated"}',
  true
);
SELECT throws_ok(
  $$INSERT INTO public.events (
      community_id,
      activity_type_id,
      title,
      starts_at,
      ends_at,
      capacity,
      status,
      share_slug
    )
    VALUES (
      '00000000-0000-0000-0000-000000000101',
      (SELECT id FROM public.activity_types WHERE slug = 'badminton'),
      'Unauthorized member event',
      now() + INTERVAL '1 day',
      now() + INTERVAL '1 day 2 hours',
      2,
      'draft',
      'auth0-test-member-create'
    )$$,
  '42501',
  'new row violates row-level security policy for table "events"',
  'community members cannot create events'
);
SELECT set_config(
  'request.jwt.claims',
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|test-user","role":"authenticated","platform_role":"super_admin","name":"Test Player"}',
  true
);
SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM public.events
    WHERE id = '00000000-0000-0000-0000-000000000201'
  ),
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
SELECT throws_ok(
  $$SELECT public.join_event('00000000-0000-0000-0000-000000000201'::UUID)$$,
  'P0001',
  'User already joined this event',
  'an active participant cannot join the same event twice'
);
SELECT throws_ok(
  $$SELECT public.join_event('00000000-0000-0000-0000-000000000203'::UUID)$$,
  'P0001',
  'Event is not open for joining',
  'cancelled events cannot be joined'
);
SELECT throws_ok(
  $$SELECT public.join_event('00000000-0000-0000-0000-000000000204'::UUID)$$,
  'P0001',
  'Event has already started',
  'past events cannot be joined'
);
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{}', true);
SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM public.event_participants
    WHERE event_id = '00000000-0000-0000-0000-000000000201'
      AND status = 'confirmed'
  ),
  1,
  'anonymous users can read the confirmed participant count for a published event'
);
SELECT throws_ok(
  $$SELECT public.join_event('00000000-0000-0000-0000-000000000201'::UUID)$$,
  '42501',
  'permission denied for function join_event',
  'anonymous users cannot invoke the event join RPC'
);
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claims',
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|test-user","role":"authenticated","platform_role":"super_admin","name":"Test Player"}',
  true
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
  '{"iss":"https://sports-community-test.us.auth0.com/","sub":"google-oauth2|first-time-community-member","role":"authenticated","name":"First-time Member"}',
  true
);
SELECT public.ensure_current_profile();
SELECT is(
  (
    public.join_event('00000000-0000-0000-0000-000000000201'::UUID) ->> 'status'
  ),
  'confirmed',
  'a first-time community member joins through the atomic RPC'
);
SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM public.community_members
    WHERE community_id = '00000000-0000-0000-0000-000000000101'
      AND profile_id = public.current_profile_id()
      AND role = 'member'
  ),
  1,
  'joining an event enrolls the caller as a regular community member'
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
