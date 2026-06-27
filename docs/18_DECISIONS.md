# Architecture Decision Records

This document records every major technical and product decision for the Sports Community Platform. All future implementation must align with these records. When revisiting a decision, add a new ADR with a superseding status rather than editing history.

## Related Documents

- [Product Vision](./01_PRODUCT_VISION.md)
- [Requirements](./02_REQUIREMENTS.md)
- [System Architecture](./04_SYSTEM_ARCHITECTURE.md)
- [Database Design](./05_DATABASE_DESIGN.md)
- [RBAC](./06_RBAC.md)
- [Authentication](./07_AUTHENTICATION.md)
- [Security](./08_SECURITY.md)
- [Implementation Plan](./16_IMPLEMENTATION_PLAN.md)

---

## ADR-001: Modular Monolith Architecture

**Status:** Accepted

**Context:** A solo developer will build the MVP with AI assistance. The product scope is event participation management for sports communities — not a distributed system requiring independent scaling of services.

**Decision:** Use a modular monolith: Next.js (App Router) frontend + backend logic in the same repository, with Supabase as the managed backend for PostgreSQL and authentication.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| Microservices | Operational overhead; premature for MVP scale |
| Separate Express/Fastify API | Duplicates auth, validation, and deployment; RLS already secures data |
| tRPC + separate DB layer | Adds abstraction without clear MVP benefit |

**Consequences:**

- Single deployment unit on Vercel
- Feature modules in `src/features/` provide boundaries without network hops
- Scaling is vertical (larger serverless instances) and database read replicas (future) before service split

**Future Revisit Criteria:** Sustained traffic requiring independent scaling of background workers, or a dedicated mobile API with different SLAs.

---

## ADR-002: Supabase as Backend Platform

**Status:** Accepted

**Context:** Need PostgreSQL, authentication, and row-level security with minimal DevOps. Free tier required for MVP.

**Decision:** Use Supabase for PostgreSQL, Supabase Auth, and RLS. Data access from Next.js via `@supabase/ssr` with server and browser clients.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| Self-hosted PostgreSQL + NextAuth | More setup; auth provider wiring manual |
| Firebase | NoSQL model poor fit for relational event/participant data |
| PlanetScale + custom auth | MySQL; RLS not native; extra auth layer |

**Consequences:**

- RLS policies are the primary authorization enforcement layer
- Migrations managed via Supabase CLI SQL files
- Vendor coupling acceptable for MVP velocity; PostgreSQL is portable

**Future Revisit Criteria:** Supabase pricing or limits block growth; need multi-region write scaling.

---

## ADR-003: Server Actions Over REST API for MVP

**Status:** Accepted

**Context:** Next.js App Router supports Server Actions for mutations. A separate REST layer adds boilerplate without benefit when the only client is this Next.js app.

**Decision:** Use Server Actions for all mutations (join event, create event, mark attendance). Use Server Components for reads. Reserve Route Handlers (`app/api/`) only for OAuth callbacks or webhooks (future).

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| Full REST API | Duplicate validation, types, and auth checks |
| GraphQL | Over-engineered for MVP CRUD |
| tRPC | Extra dependency; Server Actions sufficient |

**Consequences:**

- Actions co-located with features in `src/features/*/actions.ts`
- Zod validation at action boundary
- Error responses use a consistent `{ success, error, data }` shape

**Future Revisit Criteria:** Native mobile apps or third-party integrations require a public API.

---

## ADR-004: Atomic Event Join via PostgreSQL Functions

**Status:** Accepted

**Context:** Event join is first-come-first-served. Concurrent joins at capacity can cause overbooking if handled in application code without transactions.

**Decision:** Implement `join_event`, `leave_event`, and internal `promote_waitlisted` as PostgreSQL functions (RPC) called from Server Actions. Functions run in a single transaction with row-level locking on participant counts.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| Application-level check-then-insert | Race condition at capacity boundary |
| Redis distributed lock | Extra infrastructure; not on free tier stack |
| Optimistic UI only | Must reconcile with server truth; doesn't replace atomicity |

**Consequences:**

- Business logic for FCFS and waitlist lives in SQL (documented in [Database Design](./05_DATABASE_DESIGN.md))
- Server Actions call `supabase.rpc('join_event', { ... })`
- Easier to test with SQL unit tests (future)

**Future Revisit Criteria:** Logic becomes too complex for SQL; extract to Edge Function while keeping transactional boundaries.

---

## ADR-005: Waitlist Promotion on Cancellation (Synchronous)

**Status:** Accepted

**Context:** When a confirmed participant cancels, the first waitlisted user must be promoted immediately so the event page reflects accurate capacity.

**Decision:** Promotion runs synchronously inside `leave_event` PostgreSQL function via trigger or direct call to `promote_waitlisted`. No background job queue for MVP.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| pg_cron polling | Delay between cancel and promotion |
| Supabase Edge Function + queue | Complexity without MVP need |
| Manual admin promotion | Poor UX; replaces WhatsApp pain partially |

**Consequences:**

- Instant promotion on cancel
- No additional infrastructure
- Notification on promotion deferred to post-MVP

**Future Revisit Criteria:** Notification fan-out or promotion chains require async processing.

---

## ADR-006: Google OAuth Only for MVP Authentication

**Status:** Accepted

**Context:** Target users share event links on WhatsApp. Google login is familiar, free, and quick to implement via Supabase Auth.

**Decision:** MVP supports Google OAuth only. Architecture uses Supabase Auth provider abstraction so Phone OTP and Email OTP can be added without schema changes.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| Email/password | Password management burden; weaker UX on mobile |
| Magic link only | Less familiar for sports community users in target market |
| Phone OTP first | SMS costs; more setup for MVP |

**Consequences:**

- `auth.users` populated by Supabase; `profiles` extended via trigger
- Auth UI shows single "Continue with Google" button
- Provider enum documented for future extension

**Future Revisit Criteria:** User feedback requires phone-first auth in target markets.

---

## ADR-007: RBAC Enforced at Database via RLS

**Status:** Accepted

**Context:** Authorization must not rely solely on UI hiding. A malicious client could call Supabase directly.

**Decision:** All tables have RLS enabled. Policies encode role checks using helper functions (`is_community_admin`, `is_super_admin`, etc.). UI role checks are defense-in-depth only.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| App-layer only | Bypassable via direct Supabase client |
| Service role for all server reads | Bypasses RLS; violates least privilege |

**Consequences:**

- Every table documented in [RBAC](./06_RBAC.md) with policy names
- Server Actions use user-scoped Supabase client (anon key + session)
- Service role key never exposed to client or user-triggered actions

**Future Revisit Criteria:** Performance issues from complex RLS; consider materialized views or policy simplification.

---

## ADR-008: Soft Deletes on User-Facing Entities

**Status:** Accepted

**Context:** Admins may accidentally delete events or remove participants. Audit and recovery improve trust.

**Decision:** Use `deleted_at TIMESTAMPTZ NULL` on `profiles`, `communities`, and `events`. Hard delete only for join records that are cancelled (status-based). Queries filter `WHERE deleted_at IS NULL` by default.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| Hard delete everywhere | No recovery; breaks referential audit |
| Separate archive tables | More joins; unnecessary for MVP |

**Consequences:**

- RLS policies include `deleted_at IS NULL` conditions
- Unique constraints on slugs may need partial indexes excluding soft-deleted rows

**Future Revisit Criteria:** Storage growth from soft-deleted rows; scheduled purge job for rows deleted > 1 year.

---

## ADR-009: Single Community per Admin in MVP, Multi-Community Schema

**Status:** Accepted

**Context:** MVP targets individual community admins (badminton/pickleball groups). Future targets club owners with multiple communities.

**Decision:** Schema supports multiple communities and community membership from day one. MVP UI limits an admin to creating one community; no community switcher in MVP.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| No communities table; events owned by user | Blocks multi-community future; poor data model |
| Full multi-community UI in MVP | Scope creep |

**Consequences:**

- `communities` and `community_members` tables exist in M2
- MVP onboarding flow creates one community per admin account
- Schema ready for multi-community without migration

**Future Revisit Criteria:** MVP validated; club owners request community switcher.

---

## ADR-010: Public Event Pages via Share Slug

**Status:** Accepted

**Context:** Admins share event links in WhatsApp. Recipients must view event details without navigating a complex app shell.

**Decision:** Each event has a unique `share_slug` (short, URL-safe). Public route `/e/[slug]` renders event details. Join requires authentication.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| UUID in URL | Long, ugly in WhatsApp messages |
| Signed JWT links | Expiry complexity; admin wants permanent links until event ends |

**Consequences:**

- Slugs generated on event creation (nanoid or similar, 8–10 chars)
- RLS allows anonymous SELECT on published events by slug
- Rate limiting on public routes (documented in Security)

**Future Revisit Criteria:** Need expiring or password-protected event links.

---

## ADR-011: pnpm as Package Manager

**Status:** Accepted

**Context:** Consistent installs, disk efficiency, monorepo-ready if needed later.

**Decision:** Use pnpm exclusively. Commit `pnpm-lock.yaml`. Document `pnpm` commands in README.

**Alternatives Considered:** npm (slower), yarn (no strong advantage).

**Consequences:** CI and Vercel use pnpm. No `package-lock.json` or `yarn.lock`.

---

## ADR-012: Feature-First Folder Structure

**Status:** Accepted

**Context:** AI sessions implement one feature at a time. Colocation reduces context switching.

**Decision:** Organize `src/features/{auth,communities,events,participants,attendance}/` with actions, queries, types, and components per feature. Shared UI in `src/components/ui` (shadcn) and `src/components/domain`.

**Alternatives Considered:**

| Alternative | Why Rejected |
|-------------|--------------|
| Layer-first (all actions together) | Hard to find related code per milestone |
| Pages-only colocation | Logic scattered across app router |

**Consequences:** Each milestone in [Implementation Plan](./16_IMPLEMENTATION_PLAN.md) maps to one or more feature folders.

---

## ADR-013: Server Components by Default

**Status:** Accepted

**Context:** Next.js App Router optimizes for RSC. Client bundles should stay minimal for mobile performance.

**Decision:** Default to Server Components. Add `"use client"` only for interactivity (forms with instant feedback, theme toggle, animations, modals).

**Alternatives Considered:** Client-heavy SPA patterns — rejected for SEO, TTFB, and bundle size.

**Consequences:** Document RSC boundaries in [System Architecture](./04_SYSTEM_ARCHITECTURE.md). Framer Motion wrapped in thin client components.

---

## ADR-014: Zod for All Validation

**Status:** Accepted

**Context:** Server Actions receive untrusted input. TypeScript types are erased at runtime.

**Decision:** Every Server Action validates input with Zod schemas in `src/lib/validations/`. Share schemas between client forms (React Hook Form) and server.

**Alternatives Considered:** Yup, Valibot — Zod pairs best with React Hook Form and has widest AI training data.

**Consequences:** Invalid input returns `{ success: false, error: { code, message, fieldErrors } }`.

---

## ADR-015: Dark Mode Default with Class Strategy

**Status:** Accepted

**Context:** Premium sports apps in 2026 often default dark. Target users browse events on mobile at night.

**Decision:** Default theme is dark. Support light mode via `next-themes` with `class` strategy on `<html>`. Tokens defined for both in [UI System](./10_UI_SYSTEM.md).

**Alternatives Considered:** System-only — rejected; brand experience should be consistent.

**Consequences:** All components must work in both themes. No hardcoded colors outside tokens.

---

## ADR-016: Vitest + Playwright for Testing

**Status:** Accepted

**Context:** Need fast unit tests for utilities and Zod schemas; E2E for critical flows (join, waitlist, promotion).

**Decision:** Vitest for unit/integration. Playwright for E2E. Testing Library for component tests where needed.

**Alternatives Considered:** Jest (slower), Cypress (heavier for CI).

**Consequences:** See [Testing](./12_TESTING.md) for structure and CI integration.

---

## ADR-017: Not a Court Booking System

**Status:** Accepted

**Context:** Sports platforms often conflate facility booking with event participation. This product replaces WhatsApp participant lists, not court reservation systems.

**Decision:** No court inventory, time-slot booking, payment per slot, or facility management in MVP or near-term roadmap core. Events are participation containers with capacity, not bookable resources.

**Alternatives Considered:** Hybrid booking + events — rejected; scope explosion and different user mental model.

**Consequences:**

- No `courts`, `slots`, or `reservations` tables
- `events.location` is a text field (venue name/address), not a linked bookable entity
- Future calendar sync links to external booking tools if needed

---

## ADR-018: Activity Types for Sport Extensibility

**Status:** Accepted

**Context:** Launch with badminton and pickleball; architecture must support any sport without schema migration.

**Decision:** Seed `activity_types` table (`badminton`, `pickleball`, `general`). Communities and events reference `activity_type_id`. New sports added via seed/admin without code changes.

**Consequences:** UI filters and icons driven by activity type metadata.

---

## ADR-019: UUID Primary Keys

**Status:** Accepted

**Context:** Supabase defaults to UUID. Avoids ID enumeration attacks on public URLs.

**Decision:** All primary keys are UUID v4 via `gen_random_uuid()`.

**Consequences:** Slightly larger indexes than bigint; acceptable for scale.

---

## ADR-020: Vercel for Hosting

**Status:** Accepted

**Context:** Next.js native host, free tier, preview deployments per PR.

**Decision:** Deploy to Vercel. Environment variables for Supabase keys. No self-hosted Node server for MVP.

**Future Revisit Criteria:** Need long-running WebSocket server (unlikely with Supabase Realtime).

---

## Decision Log Maintenance

When adding a new ADR:

1. Assign next number (ADR-021+)
2. Include Status, Context, Decision, Alternatives, Consequences, Future Revisit Criteria
3. Cross-link from affected docs
4. Mark superseded ADRs as **Superseded by ADR-XXX** rather than deleting
