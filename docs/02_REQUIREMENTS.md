# Requirements

## Related Documents

- [Product Vision](./01_PRODUCT_VISION.md)
- [User Stories](./03_USER_STORIES.md)
- [System Architecture](./04_SYSTEM_ARCHITECTURE.md)
- [Database Design](./05_DATABASE_DESIGN.md)
- [RBAC](./06_RBAC.md)
- [Authentication](./07_AUTHENTICATION.md)
- [UI System](./10_UI_SYSTEM.md)
- [Implementation Plan](./16_IMPLEMENTATION_PLAN.md)
- [Roadmap](./17_ROADMAP.md)

---

## Overview

Functional and non-functional requirements for the RallyNook MVP. Requirements are tagged **MVP** or **Future**. MVP requirements map to milestones in [Implementation Plan](./16_IMPLEMENTATION_PLAN.md).

**Explicit exclusion:** This platform is **not a court booking system**. No facility inventory, slot reservation, or booking payment flows in MVP.

---

## Functional Requirements

### FR-AUTH: Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-AUTH-01 | Users shall sign in with Google through Auth0 as the single identity provider | MVP |
| FR-AUTH-02 | Users shall sign out and clear session | MVP |
| FR-AUTH-03 | Unauthenticated users accessing protected routes shall redirect to login | MVP |
| FR-AUTH-04 | Session shall persist across browser restarts (secure cookies) | MVP |
| FR-AUTH-05 | No second identity provider shall be introduced; additional methods require product need and free-tier/terms review | MVP |
| FR-AUTH-06 | Application roles shall be stored server-side and enforced by PostgreSQL RLS, not browser values | MVP |
| FR-AUTH-07 | Auth0 session/JWT validation and Auth0-subject-to-profile mapping shall be verified at the server/data boundary | MVP |

### FR-PROFILE: User Profile

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PROFILE-01 | On first sign-in, user profile record shall be created linked to auth user | MVP |
| FR-PROFILE-02 | User shall view and edit display name | MVP |
| FR-PROFILE-03 | User shall set avatar (URL or upload via Supabase Storage) | MVP |
| FR-PROFILE-04 | User shall optionally add phone number | MVP |
| FR-PROFILE-05 | Profile shall show events joined and communities | MVP |

### FR-COMMUNITY: Community

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-COMMUNITY-01 | Admin shall create a community with name, slug, description, activity type | MVP |
| FR-COMMUNITY-02 | MVP UI shall support one community per admin account | MVP |
| FR-COMMUNITY-03 | Community shall have a public slug for future discovery | MVP |
| FR-COMMUNITY-04 | Admin shall edit community settings | MVP |
| FR-COMMUNITY-05 | Members shall be associated with a community | MVP |
| FR-COMMUNITY-06 | Admin shall invite or add members (MVP: join via event implies membership) | MVP |
| FR-COMMUNITY-07 | User shall manage multiple communities from one account | Future |
| FR-COMMUNITY-08 | Community switcher in navigation | Future |

### FR-EVENT: Events

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-EVENT-01 | Admin shall create event with title, description, start/end time, capacity, location | MVP |
| FR-EVENT-02 | Event shall belong to a community | MVP |
| FR-EVENT-03 | Event shall generate a unique share slug for WhatsApp links | MVP |
| FR-EVENT-04 | Admin shall edit event details before event starts | MVP |
| FR-EVENT-05 | Admin shall cancel event (soft delete or status cancelled) | MVP |
| FR-EVENT-06 | Event shall display confirmed count vs capacity | MVP |
| FR-EVENT-07 | Public event page shall be viewable without auth | MVP |
| FR-EVENT-08 | Event status: draft, published, cancelled, completed | MVP |

### FR-JOIN: Join and Leave Event

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-JOIN-01 | Authenticated community member shall join published event | MVP |
| FR-JOIN-02 | Join shall be first-come-first-served up to capacity | MVP |
| FR-JOIN-03 | Join when full shall add user to waitlist automatically | MVP |
| FR-JOIN-04 | User shall leave event (cancel participation) | MVP |
| FR-JOIN-05 | User shall see own status: confirmed, waitlisted, or not joined | MVP |
| FR-JOIN-06 | Concurrent joins at capacity shall not overbook | MVP |
| FR-JOIN-07 | Guest shall not join; prompted to sign in | MVP |

### FR-WAITLIST: Waitlist

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-WAITLIST-01 | Waitlisted users shall see waitlist position | MVP |
| FR-WAITLIST-02 | On confirmed user cancellation, first waitlisted user shall auto-promote | MVP |
| FR-WAITLIST-03 | Promotion shall update waitlist positions for remaining waitlisted users | MVP |
| FR-WAITLIST-04 | Admin shall view full waitlist ordered by position | MVP |

### FR-PARTICIPANTS: Participant List

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PARTICIPANTS-01 | Event page shall show ordered list of confirmed participants | MVP |
| FR-PARTICIPANTS-02 | Admin shall remove participant (triggers waitlist promotion if confirmed) | MVP |
| FR-PARTICIPANTS-03 | Participant list shall show display name and avatar | MVP |
| FR-PARTICIPANTS-04 | Admin dashboard shall list participants across events | MVP |

### FR-ATTENDANCE: Attendance

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ATTENDANCE-01 | Admin shall mark participant as present, absent, or no-show | MVP |
| FR-ATTENDANCE-02 | Attendance shall only apply to confirmed participants | MVP |
| FR-ATTENDANCE-03 | Admin shall view attendance summary for an event | MVP |
| FR-ATTENDANCE-04 | QR check-in for attendance | Future |

### FR-ADMIN: Admin Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ADMIN-01 | Community admin shall access dashboard with upcoming events | MVP |
| FR-ADMIN-02 | Dashboard shall show quick actions: create event, copy share link | MVP |
| FR-ADMIN-03 | Dashboard shall show participant and waitlist counts per event | MVP |
| FR-ADMIN-04 | Super admin shall access platform-level management | MVP |
| FR-ADMIN-05 | Analytics and statistics dashboards | Future |

### FR-RBAC: Role-Based Access Control

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-RBAC-01 | Roles: Guest, Member, Admin (community), Super Admin (platform) | MVP |
| FR-RBAC-02 | Permissions enforced via Supabase RLS | MVP |
| FR-RBAC-03 | UI shall hide unauthorized actions (defense in depth) | MVP |
| FR-RBAC-04 | Least privilege on all operations | MVP |

See [RBAC](./06_RBAC.md) for full permission matrix.

### FR-UI: User Interface

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-UI-01 | Responsive design: mobile-first, usable on tablet and desktop | MVP |
| FR-UI-02 | Dark mode default with light mode toggle | MVP |
| FR-UI-03 | Design system per [UI System](./10_UI_SYSTEM.md) | MVP |
| FR-UI-04 | Loading, empty, and error states for all primary views | MVP |
| FR-UI-05 | WCAG 2.1 AA accessibility target | MVP |
| FR-UI-06 | Framer Motion animations per motion guidelines | MVP |

---

## Future Functional Requirements

| Area | Requirements |
|------|--------------|
| **Payments** | Event fees, Stripe integration, refunds |
| **Subscriptions** | Community membership tiers |
| **Membership** | Paid community access, member limits |
| **Calendar Sync** | Export to Google Calendar, iCal feeds |
| **Notifications** | Email, push, WhatsApp on promotion/cancel |
| **Leaderboards** | Points, rankings, seasonal stats |
| **Skill Levels** | Self-reported or admin-assigned skill tags |
| **Statistics** | Attendance history, participation trends |
| **Analytics** | Admin insights, export CSV |
| **QR Check-In** | Scan to mark attendance |
| **Multiple Communities** | Switcher, cross-community admin |
| **Native Apps** | iOS/Android via React Native or similar |

Detailed phasing: [Roadmap](./17_ROADMAP.md).

---

## Non-Functional Requirements

### NFR-PERF: Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | Largest Contentful Paint on public event page (mobile) | < 2.5s |
| NFR-PERF-02 | Time to Interactive on join button | < 3s |
| NFR-PERF-03 | Server Action response for join/leave | < 500ms p95 |
| NFR-PERF-04 | Database queries use appropriate indexes | Per [Database Design](./05_DATABASE_DESIGN.md) |
| NFR-PERF-05 | Images optimized via Next.js Image | MVP |

### NFR-SEC: Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | OWASP Top 10 mitigations documented in [Security](./08_SECURITY.md) |
| NFR-SEC-02 | All mutations validated with Zod |
| NFR-SEC-03 | RLS enabled on all public tables |
| NFR-SEC-04 | Secrets only in environment variables |
| NFR-SEC-05 | HTTPS only in production |
| NFR-SEC-06 | Rate limiting on auth and join endpoints |
| NFR-SEC-07 | Audit fields on mutable entities |

### NFR-SCALE: Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCALE-01 | Support 100 concurrent users per event join burst |
| NFR-SCALE-02 | Pagination for participant lists > 50 |
| NFR-SCALE-03 | Schema supports horizontal read scaling (Supabase) |
| NFR-SCALE-04 | No architectural changes needed for 10K users |

### NFR-MAINT: Maintainability

| ID | Requirement |
|----|-------------|
| NFR-MAINT-01 | TypeScript strict mode |
| NFR-MAINT-02 | Feature-first module structure |
| NFR-MAINT-03 | Documented coding standards |
| NFR-MAINT-04 | AI development guide for consistent implementation |

### NFR-TEST: Testability

| ID | Requirement |
|----|-------------|
| NFR-TEST-01 | Vitest unit tests for validation and utilities |
| NFR-TEST-02 | Playwright E2E for auth, join, waitlist, promotion |
| NFR-TEST-03 | Manual QA checklist per milestone |

### NFR-DEPLOY: Deployment

| ID | Requirement |
|----|-------------|
| NFR-DEPLOY-01 | Deploy to a host compatible with Next.js and product use; verify free-tier terms before selection |
| NFR-DEPLOY-02 | Use local PostgreSQL for development; hosted environments require verified free-tier and recovery approval |
| NFR-DEPLOY-03 | Environment variable documentation |
| NFR-DEPLOY-04 | CI runs lint, typecheck, tests on PR |

### NFR-COST: Cost

| ID | Requirement |
|----|-------------|
| NFR-COST-01 | MVP buildable, testable, and locally deployable at $0; hosted free-tier use must be verified |
| NFR-COST-02 | No paid third-party services required for MVP |

---

## Tech Stack Requirements

| Layer | Technology | Version Policy |
|-------|------------|----------------|
| Frontend framework | Next.js (App Router) | Latest stable |
| Language | TypeScript | Strict |
| Styling | Tailwind CSS | v4 or latest stable |
| Components | shadcn/ui | Latest |
| Animation | Framer Motion | Latest |
| Forms | React Hook Form + Zod | Latest |
| Backend | Next.js Server Actions + Supabase PostgreSQL | Modular monolith |
| Database | PostgreSQL (via Supabase) | 15+ |
| Auth | Auth0 | Google via Auth0; Supabase Auth is not used |
| Hosting | Not yet selected | Verify eligibility and terms; Vercel Hobby is personal-use only |
| Package manager | pnpm | Latest |
| Icons | Lucide | Latest |
| Unit tests | Vitest | Latest |
| E2E tests | Playwright | Latest |
| Lint | ESLint | Latest |
| Format | Prettier | Latest |

---

## Constraints

1. **No application code in bootstrap phase** — Documentation only until M0.
2. **Solo developer + AI** — Complexity must stay manageable.
3. **Mobile-first** — Primary use case is WhatsApp link on phone.
4. **Free services** — No paid APIs in MVP path.
5. **Not court booking** — Event participation only.

---

## Requirements Traceability

| MVP Feature (from product brief) | Requirement IDs |
|----------------------------------|-----------------|
| Authentication | FR-AUTH-01–04 |
| User Profile | FR-PROFILE-01–05 |
| Community | FR-COMMUNITY-01–06 |
| Events | FR-EVENT-01–08 |
| Join Event | FR-JOIN-01–07 |
| Leave Event | FR-JOIN-04 |
| Participant List | FR-PARTICIPANTS-01–03 |
| Waitlist | FR-WAITLIST-01–04 |
| Automatic Promotion | FR-WAITLIST-02–03 |
| Attendance | FR-ATTENDANCE-01–03 |
| Admin Dashboard | FR-ADMIN-01–03 |
| Responsive Design | FR-UI-01 |
| Dark Mode | FR-UI-02 |
| RBAC | FR-RBAC-01–04 |

All MVP features trace to milestones M0–M18 in [Implementation Plan](./16_IMPLEMENTATION_PLAN.md).
