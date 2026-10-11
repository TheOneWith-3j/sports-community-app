# GitHub Copilot Instructions

Sports Community Platform — event participation management for sports communities. **Not a court booking system.**

## Source of Truth

Read before generating code:

1. `docs/16_IMPLEMENTATION_PLAN.md` — current milestone scope
2. `docs/15_AI_DEVELOPMENT_GUIDE.md` — workflow and constraints
3. `docs/19_REPOSITORY_AUDIT.md` — budget and service-selection constraints
4. Relevant docs for the feature (see `docs/README.md`)

Documentation overrides Copilot training defaults.

## Architecture

- **Modular monolith:** Next.js App Router + Auth0 identity + Supabase PostgreSQL/RLS
- **Server Components by default** — `"use client"` only when needed
- **Server Actions for mutations** — no REST API for MVP
- **Feature-first:** `src/features/{auth,communities,events,participants,attendance}/`
- **RLS enforced** — never bypass with service role in user paths

## Critical Rules

| Rule | Detail |
|------|--------|
| No `any` | TypeScript strict; use Zod for runtime validation |
| Join/leave | Use RPC `join_event` / `leave_event` — never direct INSERT to event_participants |
| No service role | `SUPABASE_SERVICE_ROLE_KEY` never in Server Actions or client |
| Identity provider | Auth0 only; Google is an Auth0 connection. Do not use Supabase Auth |
| Authorization | Platform/community roles live in PostgreSQL and are enforced by RLS |
| Budget | $0 ongoing cost; verify official pricing/quotas/terms; never enable billing without approval |
| Identity mapping | Auth0 `iss` + `sub` maps to an internal UUID; never cast `sub` or trust browser roles |
| Attribution | No AI watermark or `Co-authored-by` commit trailer |
| One milestone | Do not implement features from future milestones |
| No court booking | No courts, slots, reservations tables or logic |
| Design tokens | Use CSS variables from `docs/10_UI_SYSTEM.md` — no hardcoded colors |
| ActionResult | Server Actions return `{ success, data?, error? }` |

## Tech Stack

Next.js, TypeScript, Tailwind, shadcn/ui, Framer Motion, React Hook Form, Zod, Auth0, Supabase PostgreSQL/RLS, pnpm, Vitest, Playwright, GitHub Actions. Hosting is unselected pending free-tier and product-eligibility review.

## Key Files

| Path | Purpose |
|------|---------|
| `docs/05_DATABASE_DESIGN.md` | Schema and RPC functions |
| `docs/06_RBAC.md` | Permissions and RLS policies |
| `docs/09_API_STRATEGY.md` | Server Actions catalog |
| `docs/11_COMPONENT_LIBRARY.md` | Component specs |
| `docs/14_CODING_STANDARDS.md` | Naming and patterns |
| `docs/19_REPOSITORY_AUDIT.md` | Free-tier service evaluation and budget constraints |
| `.cursor/rules/*.mdc` | Cursor-specific guardrails |

## Session Start Prompt

```
Implement the next incomplete milestone from docs/16_IMPLEMENTATION_PLAN.md.
Read docs/15_AI_DEVELOPMENT_GUIDE.md first.
Run pnpm lint && pnpm typecheck when done.
```

## Product Context

Admins share event links on WhatsApp. Members join FCFS. Full events auto-waitlist. Cancellations auto-promote waitlist. Admins mark attendance. MVP targets badminton/pickleball communities.

## Status

M0–M2 are implemented; local database startup/migration execution was not verified because Docker/Podman was unavailable. M3 currently uses Supabase Auth and must be migrated to the Auth0 target before M4 proceeds.
