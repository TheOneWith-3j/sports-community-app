# Database Design

## Related Documents

- [System Architecture](./04_SYSTEM_ARCHITECTURE.md)
- [RBAC](./06_RBAC.md)
- [Authentication](./07_AUTHENTICATION.md)
- [Security](./08_SECURITY.md)
- [API Strategy](./09_API_STRATEGY.md)
- [Decisions](./18_DECISIONS.md)

---

## Overview

Production-ready PostgreSQL schema for Supabase. All tables use UUID primary keys, audit timestamps, and RLS. Soft deletes apply to user-facing entities. Business-critical join/waitlist logic lives in PostgreSQL functions for atomicity.

**Identity boundary:** Auth0 is the sole identity provider; Supabase Auth is not used. The existing M2 migration is coupled to `auth.users` and `auth.uid()` and is not the target schema. Before M3 can be accepted, migrate the profile identity binding and every RLS policy/RPC to a trusted, server-verified Auth0 issuer/subject mapping. See [Authentication](./07_AUTHENTICATION.md) and [Repository Audit](./19_REPOSITORY_AUDIT.md).

**This schema models event participation, not court or facility booking.**

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Tables | snake_case, plural | `event_participants` |
| Columns | snake_case | `created_at` |
| Primary keys | `id UUID` | `id` |
| Foreign keys | `{table_singular}_id` | `community_id` |
| Enums | snake_case type name | `participant_status` |
| Indexes | `idx_{table}_{columns}` | `idx_events_community_starts` |
| Functions | snake_case verb | `join_event` |
| RLS policies | `{table}_{role}_{action}` | `events_public_select` |

---

## Entity Relationship Diagram

```mermaid
erDiagram
  auth0_identity ||--|| profiles : identifies
  profiles ||--o{ community_members : has
  communities ||--o{ community_members : has
  communities ||--o{ events : hosts
  profiles ||--o{ events : creates
  activity_types ||--o{ communities : categorizes
  activity_types ||--o{ events : tags
  events ||--o{ event_participants : has
  profiles ||--o{ event_participants : joins
  event_participants ||--o| attendance_records : has
  profiles ||--o{ attendance_records : marks

  profiles {
    uuid id PK
    text auth_issuer
    text auth_subject
    text display_name
    text avatar_url
    text phone
    boolean onboarding_completed
    platform_role platform_role
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  communities {
    uuid id PK
    text name
    text slug UK
    text description
    uuid activity_type_id FK
    uuid owner_id FK
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  community_members {
    uuid id PK
    uuid community_id FK
    uuid profile_id FK
    community_role role
    timestamptz joined_at
    timestamptz created_at
  }

  activity_types {
    uuid id PK
    text name UK
    text slug UK
    text icon
    timestamptz created_at
  }

  events {
    uuid id PK
    uuid community_id FK
    uuid created_by FK
    uuid activity_type_id FK
    text title
    text description
    timestamptz starts_at
    timestamptz ends_at
    int capacity
    text location
    event_status status
    text share_slug UK
    timestamptz created_at
    timestamptz updated_at
    timestamptz deleted_at
  }

  event_participants {
    uuid id PK
    uuid event_id FK
    uuid profile_id FK
    participant_status status
    int waitlist_position
    timestamptz joined_at
    timestamptz cancelled_at
    timestamptz created_at
    timestamptz updated_at
  }

  attendance_records {
    uuid id PK
    uuid participant_id FK UK
    uuid event_id FK
    attendance_status status
    uuid marked_by FK
    timestamptz marked_at
    timestamptz created_at
    timestamptz updated_at
  }

  audit_logs {
    uuid id PK
    uuid actor_id FK
    text action
    text entity_type
    uuid entity_id
    jsonb metadata
    timestamptz created_at
  }
```

---

## Enums

```sql
CREATE TYPE platform_role AS ENUM ('member', 'super_admin');

CREATE TYPE community_role AS ENUM ('member', 'admin');

CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

CREATE TYPE participant_status AS ENUM ('confirmed', 'waitlisted', 'cancelled');

CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'no_show');
```

---

## Tables

### `profiles`

**Purpose:** Stores application-specific user data. Each profile has an internal UUID independent of its external identity-provider subject.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Stable internal application identity |
| `auth_issuer` | TEXT | NOT NULL, unique with `auth_subject` | Validated Auth0 issuer |
| `auth_subject` | TEXT | NOT NULL, unique with `auth_issuer` | Validated Auth0 `sub`; never cast to UUID |
| `display_name` | TEXT | NOT NULL | User-visible name |
| `avatar_url` | TEXT | NULL | Profile image URL |
| `phone` | TEXT | NULL | Optional phone |
| `onboarding_completed` | BOOLEAN | NOT NULL DEFAULT false | Whether first-login profile setup is complete |
| `platform_role` | platform_role | NOT NULL DEFAULT 'member' | Platform-level role |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Created timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Updated timestamp |
| `deleted_at` | TIMESTAMPTZ | NULL | Soft delete |

**Indexes:**

- Unique index on (`auth_issuer`, `auth_subject`) for identity binding
- `idx_profiles_platform_role` ON (`platform_role`) WHERE `deleted_at IS NULL`

**Why it exists:** Auth0 authenticates users; the app stores profile data and trusted application roles in PostgreSQL.

---

### `activity_types`

**Purpose:** Sport/activity catalog for extensibility beyond badminton and pickleball.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK DEFAULT gen_random_uuid() | Primary key |
| `name` | TEXT | NOT NULL UNIQUE | Display name |
| `slug` | TEXT | NOT NULL UNIQUE | URL-safe identifier |
| `icon` | TEXT | NULL | Lucide icon name |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Created timestamp |

**Seed data:**

| name | slug | icon |
|------|------|------|
| Badminton | badminton | shuttlecock |
| Pickleball | pickleball | circle-dot |
| General | general | users |

**Why it exists:** Avoid hardcoding sports; communities and events reference activity type.

---

### `communities`

**Purpose:** A sports community group (e.g., "Tuesday Night Badminton"). Tenant boundary for events and members.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK DEFAULT gen_random_uuid() | Primary key |
| `name` | TEXT | NOT NULL | Community name |
| `slug` | TEXT | NOT NULL | URL slug |
| `description` | TEXT | NULL | About text |
| `activity_type_id` | UUID | FK → activity_types(id) | Primary sport |
| `owner_id` | UUID | FK → profiles(id) | Creating admin |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Created |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Updated |
| `deleted_at` | TIMESTAMPTZ | NULL | Soft delete |

**Indexes:**

- `idx_communities_slug` UNIQUE ON (`slug`) WHERE `deleted_at IS NULL`
- `idx_communities_owner` ON (`owner_id`) WHERE `deleted_at IS NULL`

**Why it exists:** Groups events and members; future multi-community support.

---

### `community_members`

**Purpose:** Many-to-many between profiles and communities with community-scoped role.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK DEFAULT gen_random_uuid() | Primary key |
| `community_id` | UUID | FK → communities(id) ON DELETE CASCADE | Community |
| `profile_id` | UUID | FK → profiles(id) ON DELETE CASCADE | Member |
| `role` | community_role | NOT NULL DEFAULT 'member' | member or admin |
| `joined_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Join date |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Created |

**Constraints:**

- UNIQUE (`community_id`, `profile_id`)

**Indexes:**

- `idx_community_members_profile` ON (`profile_id`)
- `idx_community_members_community_role` ON (`community_id`, `role`)

**Why it exists:** Community-scoped RBAC; tracks who belongs to which group.

---

### `events`

**Purpose:** An event participation container with capacity, schedule, and share link. **Not a bookable court slot.**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK DEFAULT gen_random_uuid() | Primary key |
| `community_id` | UUID | FK → communities(id) | Hosting community |
| `created_by` | UUID | FK → profiles(id) | Creator |
| `activity_type_id` | UUID | FK → activity_types(id) | Sport tag |
| `title` | TEXT | NOT NULL | Event title |
| `description` | TEXT | NULL | Details |
| `starts_at` | TIMESTAMPTZ | NOT NULL | Start time |
| `ends_at` | TIMESTAMPTZ | NOT NULL | End time |
| `capacity` | INTEGER | NOT NULL CHECK (capacity > 0) | Max confirmed participants |
| `location` | TEXT | NULL | Venue name/address (text only) |
| `status` | event_status | NOT NULL DEFAULT 'draft' | Lifecycle status |
| `share_slug` | TEXT | NOT NULL | Public URL slug |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Created |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Updated |
| `deleted_at` | TIMESTAMPTZ | NULL | Soft delete |

**Constraints:**

- `ends_at > starts_at`
- UNIQUE (`share_slug`) WHERE `deleted_at IS NULL`

**Indexes:**

- `idx_events_community_starts` ON (`community_id`, `starts_at`) WHERE `deleted_at IS NULL`
- `idx_events_share_slug` ON (`share_slug`) WHERE `deleted_at IS NULL`
- `idx_events_status` ON (`status`) WHERE `deleted_at IS NULL`

**Why it exists:** Core entity replacing WhatsApp event messages.

---

### `event_participants`

**Purpose:** Tracks who joined an event, their status, and waitlist position.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK DEFAULT gen_random_uuid() | Primary key |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE | Event |
| `profile_id` | UUID | FK → profiles(id) ON DELETE CASCADE | Participant |
| `status` | participant_status | NOT NULL | confirmed, waitlisted, cancelled |
| `waitlist_position` | INTEGER | NULL | 1-based position when waitlisted |
| `joined_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Original join time |
| `cancelled_at` | TIMESTAMPTZ | NULL | When cancelled |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Created |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Updated |

**Constraints:**

- Partial unique: one active participation per user per event

```sql
CREATE UNIQUE INDEX idx_event_participants_active_unique
  ON event_participants (event_id, profile_id)
  WHERE status IN ('confirmed', 'waitlisted');
```

**Indexes:**

- `idx_event_participants_event_status` ON (`event_id`, `status`)
- `idx_event_participants_profile` ON (`profile_id`)
- `idx_event_participants_waitlist` ON (`event_id`, `waitlist_position`) WHERE `status = 'waitlisted'`

**Why it exists:** FCFS join, waitlist, and participant list source of truth.

---

### `attendance_records`

**Purpose:** Admin-marked attendance for confirmed participants on event day.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK DEFAULT gen_random_uuid() | Primary key |
| `participant_id` | UUID | FK → event_participants(id) ON DELETE CASCADE, UNIQUE | One record per participant |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE | Denormalized for queries |
| `status` | attendance_status | NOT NULL | present, absent, no_show |
| `marked_by` | UUID | FK → profiles(id) | Admin who marked |
| `marked_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | When marked |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Created |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | Updated |

**Indexes:**

- `idx_attendance_event` ON (`event_id`)

**Why it exists:** Replace manual attendance checklists.

---

### `audit_logs`

**Purpose:** Security audit trail for sensitive admin actions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK DEFAULT gen_random_uuid() | Primary key |
| `actor_id` | UUID | FK → profiles(id) NULL | Who performed action |
| `action` | TEXT | NOT NULL | e.g., `participant.removed` |
| `entity_type` | TEXT | NOT NULL | e.g., `event` |
| `entity_id` | UUID | NOT NULL | Target entity ID |
| `metadata` | JSONB | NULL | Additional context |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | When |

**Indexes:**

- `idx_audit_logs_entity` ON (`entity_type`, `entity_id`)
- `idx_audit_logs_actor` ON (`actor_id`)
- `idx_audit_logs_created` ON (`created_at`)

**Why it exists:** Accountability for admin actions; security compliance.

---

## Database Functions

### Helper Functions (RLS)

`current_profile_id()` is a trusted helper that resolves the verified JWT's `(iss, sub)` pair to the internal UUID profile. Migration `20260101000003_auth0_identity.sql` implements it as a narrowly scoped SECURITY DEFINER function with a pinned empty search path; validate the migration and RLS behavior locally before deployment.

All policies and RPCs below use `current_profile_id()` as the caller's internal profile ID. It returns `NULL` for a guest or unmapped identity.

```sql

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = current_profile_id()
      AND platform_role = 'super_admin'
      AND deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is admin of given community
CREATE OR REPLACE FUNCTION is_community_admin(p_community_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members cm
    JOIN profiles p ON p.id = cm.profile_id
    WHERE cm.community_id = p_community_id
      AND cm.profile_id = current_profile_id()
      AND cm.role = 'admin'
      AND p.deleted_at IS NULL
  ) OR is_super_admin();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Check if current user is member of community
CREATE OR REPLACE FUNCTION is_community_member(p_community_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = p_community_id
      AND profile_id = current_profile_id()
  ) OR is_super_admin();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

### `join_event(p_event_id UUID)`

**Purpose:** Atomic FCFS join or waitlist assignment.

**Logic:**

1. Verify event is `published`, not deleted, not in past
2. Verify caller is community member (auto-add member on first join if MVP policy allows)
3. Check for existing active participation — return error if exists
4. `SELECT ... FOR UPDATE` on event row
5. Count confirmed participants
6. If count < capacity: INSERT `confirmed`
7. Else: INSERT `waitlisted` with `waitlist_position = max + 1`
8. Return `{ status, waitlist_position }`

**Returns:** JSON `{ "status": "confirmed" | "waitlisted", "waitlist_position": number | null }`

### `leave_event(p_event_id UUID)`

**Purpose:** Cancel participation and promote waitlist if was confirmed.

**Logic:**

1. Resolve the current internal profile from the verified Auth0 issuer and subject; find its active participation
2. Set status to `cancelled`, set `cancelled_at`
3. If was `confirmed`: call `promote_waitlisted(p_event_id)`
4. If was `waitlisted`: reorder remaining waitlist positions
5. Return `{ status: "cancelled", promoted_profile_id: uuid | null }`

### `promote_waitlisted(p_event_id UUID)`

**Purpose:** Internal — promote first waitlisted user to confirmed.

**Logic:**

1. Lock event row
2. Verify confirmed count < capacity
3. Select first waitlisted by `waitlist_position ASC, joined_at ASC FOR UPDATE SKIP LOCKED`
4. Update to `confirmed`, clear `waitlist_position`
5. Decrement positions for remaining waitlisted
6. Return promoted profile_id

### `remove_participant(p_participant_id UUID)`

**Purpose:** Admin removes a participant (same promotion logic as leave).

**Logic:**

1. Verify caller is community admin for event's community
2. Cancel participant
3. If was confirmed: promote waitlist
4. Write audit log

---

## Triggers

### `handle_updated_at`

Apply to all tables with `updated_at`:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Auth0 profile provisioning

There is no `auth.users` trigger. The server-side login/profile-provisioning operation calls `ensure_current_profile()`, which resolves or creates a profile with a race-safe unique `(auth_issuer, auth_subject)` binding derived from verified claims. Profile creation does not accept caller-supplied subject values and assigns only the default `member` role. The migration's SQL tests must pass locally before applying it to hosted data.

---

## Row Level Security Summary

RLS enabled on all tables. Full policy definitions in [RBAC](./06_RBAC.md).

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own + community co-members | Trigger only | Own | Super admin |
| communities | Members + public slug | Authenticated (MVP: one per user) | Admin | Soft delete admin |
| community_members | Community members | Admin or auto on join | Admin | Admin |
| activity_types | Everyone | Super admin | Super admin | Super admin |
| events | Published public; members all | Community admin | Community admin | Soft delete admin |
| event_participants | Event visible users | Via RPC only | Via RPC only | Via RPC only |
| attendance_records | Community admin + own | Community admin | Community admin | Community admin |
| audit_logs | Super admin | System/admin insert | None | Super admin |

**Critical:** Direct INSERT/UPDATE on `event_participants` from client is denied. All join/leave via RPC functions running as `SECURITY DEFINER` with internal auth checks.

---

## Migration Strategy

1. Migrations in `supabase/migrations/` with timestamp prefix: `20260101000000_initial_schema.sql`
2. One logical change per migration file
3. Always include RLS policies in same migration as table creation
4. Seed `activity_types` in `supabase/seed.sql`
5. Generate TypeScript types: `pnpm supabase gen types typescript --local > src/types/database.ts`

---

## Pagination

Participant lists exceeding 50 rows:

```sql
SELECT ep.*, p.display_name, p.avatar_url
FROM event_participants ep
JOIN profiles p ON p.id = ep.profile_id
WHERE ep.event_id = $1 AND ep.status = 'confirmed'
ORDER BY ep.joined_at ASC
LIMIT $2 OFFSET $3;
```

Use cursor-based pagination (joined_at, id) for real-time lists in future.

---

## Future Extensibility

| Future Feature | Schema Extension |
|----------------|------------------|
| Payments | `payments` table FK to event_participants |
| Notifications | `notification_preferences`, `notification_log` |
| Multi-community UI | No change — schema ready |
| Skill levels | `profile_skills` junction table |
| QR check-in | `attendance_records.checked_in_at`, `check_in_code` on events |
| Court booking | **Not planned** — would be separate product |

---

## Index Rationale

| Index | Query Pattern |
|-------|---------------|
| `idx_events_community_starts` | Dashboard upcoming events list |
| `idx_event_participants_event_status` | Count confirmed, list by status |
| `idx_event_participants_active_unique` | Prevent duplicate active joins |
| `idx_communities_slug` | Public community page (future) |
| `idx_events_share_slug` | Public event page lookup |

---

## Data Integrity Rules

1. Capacity is never exceeded for `confirmed` status (enforced in `join_event` RPC)
2. `waitlist_position` is contiguous 1..N for waitlisted participants per event
3. Cancelled participants retain row for audit; excluded from active unique index
4. Attendance only for `confirmed` participants at time of event
5. Soft-deleted events do not appear in public queries
