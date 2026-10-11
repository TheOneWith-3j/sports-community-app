BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE platform_role AS ENUM ('member', 'super_admin');
CREATE TYPE community_role AS ENUM ('member', 'admin');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE participant_status AS ENUM ('confirmed', 'waitlisted', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'no_show');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  platform_role platform_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  activity_type_id UUID NOT NULL REFERENCES activity_types (id),
  owner_id UUID NOT NULL REFERENCES profiles (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities (id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  role community_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (community_id, profile_id)
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities (id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles (id),
  activity_type_id UUID NOT NULL REFERENCES activity_types (id),
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  location TEXT,
  status event_status NOT NULL DEFAULT 'draft',
  share_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT events_end_after_start CHECK (ends_at > starts_at),
  UNIQUE (share_slug) WHERE (deleted_at IS NULL)
);

CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  status participant_status NOT NULL,
  waitlist_position INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL UNIQUE REFERENCES event_participants (id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  marked_by UUID NOT NULL REFERENCES profiles (id),
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles (id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_platform_role ON profiles (platform_role) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_communities_slug ON communities (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_communities_owner ON communities (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_community_members_profile ON community_members (profile_id);
CREATE INDEX idx_community_members_community_role ON community_members (community_id, role);
CREATE INDEX idx_events_community_starts ON events (community_id, starts_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_share_slug ON events (share_slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_events_status ON events (status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_event_participants_active_unique ON event_participants (event_id, profile_id) WHERE status IN ('confirmed', 'waitlisted');
CREATE INDEX idx_event_participants_event_status ON event_participants (event_id, status);
CREATE INDEX idx_event_participants_profile ON event_participants (profile_id);
CREATE INDEX idx_event_participants_waitlist ON event_participants (event_id, waitlist_position) WHERE status = 'waitlisted';
CREATE INDEX idx_attendance_event ON attendance_records (event_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs (created_at);

CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND platform_role = 'super_admin'
      AND deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION is_community_admin(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM community_members cm
    JOIN profiles p ON p.id = cm.profile_id
    WHERE cm.community_id = p_community_id
      AND cm.profile_id = auth.uid()
      AND cm.role = 'admin'
      AND p.deleted_at IS NULL
  ) OR is_super_admin();
$$;

CREATE OR REPLACE FUNCTION is_community_member(p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM community_members
    WHERE community_id = p_community_id
      AND profile_id = auth.uid()
  ) OR is_super_admin();
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.email,
      'New member'
    ),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER communities_set_updated_at
BEFORE UPDATE ON communities
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER events_set_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER event_participants_set_updated_at
BEFORE UPDATE ON event_participants
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER attendance_records_set_updated_at
BEFORE UPDATE ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

COMMIT;
