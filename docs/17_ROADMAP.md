# Roadmap

## Related Documents

- [Product Vision](./01_PRODUCT_VISION.md)
- [Requirements](./02_REQUIREMENTS.md)
- [Implementation Plan](./16_IMPLEMENTATION_PLAN.md)
- [Decisions](./18_DECISIONS.md)

---

## Overview

Post-MVP product roadmap organized by phase. MVP completion is Milestone M18 in [Implementation Plan](./16_IMPLEMENTATION_PLAN.md). This document covers what comes after.

**Reminder:** This platform manages event participation. Court booking and facility reservation remain out of core product scope unless explicitly added as a separate module in a future ADR.

---

## Phase 0: MVP (Current)

**Timeline:** Weeks 1–8 (estimate)  
**Goal:** Replace WhatsApp participant lists for badminton/pickleball communities

| Feature | Status |
|---------|--------|
| Google authentication | MVP |
| User profiles | MVP |
| Single community per admin | MVP |
| Event CRUD + share links | MVP |
| FCFS join + waitlist + auto-promotion | MVP |
| Participant lists | MVP |
| Attendance marking | MVP |
| Admin dashboard | MVP |
| Dark mode + responsive | MVP |
| RBAC + RLS | MVP |
| Vitest + Playwright | MVP |
| Vercel + Supabase deploy | MVP |

---

## Phase 1: Engagement and Retention

**Timeline:** Months 2–3 post-MVP  
**Goal:** Keep players informed and reduce admin manual follow-up

### Notifications

| Feature | Description | Priority |
|---------|-------------|----------|
| Email on waitlist promotion | Notify when promoted to confirmed | High |
| Email event reminder | 24h before event start | High |
| Event cancelled notification | Notify all participants | Medium |
| Push notifications (web) | Web push via service worker | Medium |

**Technical:** Supabase Edge Functions + Resend (free tier) or Supabase email.

### Calendar Sync

| Feature | Description | Priority |
|---------|-------------|----------|
| Add to Google Calendar | Link on event page | High |
| iCal feed per community | Subscribe to all events | Medium |
| Personal calendar export | Download .ics for joined events | Medium |

**Technical:** Generate .ics server-side; Google Calendar URL template.

### WhatsApp Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| Rich link previews | Open Graph meta tags on event pages | High |
| Share message template | Pre-filled WhatsApp share text | Medium |
| WhatsApp Business API | Automated group updates | Low (cost) |

---

## Phase 2: Multi-Community and Growth

**Timeline:** Months 3–5  
**Goal:** Support club owners and players in multiple groups

| Feature | Description |
|---------|-------------|
| Multiple communities per admin | Community switcher in nav |
| Join community via invite link | `/c/{slug}/join` flow |
| Community discovery (public directory) | Opt-in public listing |
| Member management UI | Invite, remove, role change |
| Community branding | Logo, cover image, accent color |

**Schema:** Already supports — UI and RLS review needed.

---

## Phase 3: Membership and Payments

**Timeline:** Months 5–8  
**Goal:** Monetization for clubs and paid sessions

| Feature | Description |
|---------|-------------|
| Event fees | Optional price per event |
| Stripe integration | Checkout, refunds |
| Community subscriptions | Monthly membership |
| Member tiers | Free vs paid member benefits |
| Payment history | Admin and user views |

**Technical:** `payments` table, Stripe webhooks Route Handler, PCI via Stripe Checkout (no card data on our servers).

**ADR required:** ADR-021 Payments Architecture (when starting Phase 3).

---

## Phase 4: Player Experience

**Timeline:** Months 6–10  
**Goal:** Richer player engagement

| Feature | Description |
|---------|-------------|
| Skill levels | Self-reported or admin-assigned tags |
| Leaderboards | Points from attendance + participation |
| Player statistics | Events attended, streaks |
| Profile public page | Optional shareable player profile |
| Activity feed | Recent joins, events in community |

---

## Phase 5: Operations and Scale

**Timeline:** Ongoing  
**Goal:** Production hardening at scale

| Feature | Description |
|---------|-------------|
| QR check-in | Scan code at venue for attendance |
| Realtime participant lists | Supabase Realtime subscriptions |
| Analytics dashboard | Participation trends, exports |
| Audit log UI | Super admin viewer |
| Rate limiting (production) | Upstash Redis |
| Error monitoring | Sentry |
| Performance monitoring | Vercel Speed Insights + custom metrics |
| Database read replicas | Supabase Pro |

---

## Phase 6: Platform Expansion

**Timeline:** Year 2+  
**Goal:** Broader market

| Feature | Description |
|---------|-------------|
| Native mobile apps | React Native or Expo |
| Public API | REST for third-party integrations |
| Tournament mode | Brackets, divisions, seeding |
| Sports academies | Cohort programs, recurring series |
| Internationalization | i18n for multiple languages |
| White-label | Custom domains per community |

---

## Explicit Non-Roadmap Items

These are intentionally **not planned** unless product direction changes with new ADR:

| Item | Reason |
|------|--------|
| Court booking system | Different product category — ADR-017 |
| Facility management | Scope explosion |
| Equipment rental | Out of core problem |
| Live scoring / match results | Different use case (tournament focus) |

---

## Prioritization Framework

When choosing next features after MVP:

1. **Admin pain** — Does it reduce manual WhatsApp work?
2. **Player fairness** — Does it improve join/waitlist experience?
3. **Retention** — Do notifications/calendar bring players back?
4. **Revenue** — Can clubs pay for this?
5. **Effort** — Can solo dev + AI ship in 2 weeks?

---

## Success Metrics by Phase

| Phase | Key Metric |
|-------|------------|
| MVP | 5 active communities, 100 event joins |
| Phase 1 | 50% reduction in admin WhatsApp list edits (survey) |
| Phase 2 | 20% admins manage 2+ communities |
| Phase 3 | First paid event processed |
| Phase 4 | 30% players view stats weekly |
| Phase 5 | 99.9% uptime, <500ms p95 join |

---

## Free Tier Upgrade Triggers

| Service | Upgrade When |
|---------|--------------|
| Supabase | DB > 400MB, auth MAU > 40K, need daily backups |
| Vercel | Bandwidth > 80GB/mo, need team features |
| Stripe | First payment (pay-as-you-go) |
| Resend | Email > 3K/mo free |

---

## Related Milestones

MVP delivery complete at **M18**. Phase 1 begins with notification architecture ADR and implementation milestones to be added to `16_IMPLEMENTATION_PLAN.md` when MVP ships.
