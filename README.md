# Sports Community Platform

Event participation management for sports communities. Admins share event links, members join first-come-first-served, full events use a waitlist, and admins record attendance. This is **not** a court-booking system.

## Technology

- Next.js App Router, React, TypeScript (strict), Tailwind CSS
- pnpm, Zod, Vitest, Playwright
- PostgreSQL with Supabase migrations and Row Level Security
- **Target identity:** Auth0 as the single identity provider; Google login is an Auth0 connection
- CI: GitHub Actions on the public repository
- Hosting: not selected until free-tier terms and product eligibility are verified

## Current status

**Overall milestone progress:** `###----------------` **3/19 complete (16%)**

M0–M2 are complete. M3 is in progress: the application now uses the Auth0 SDK, maps verified Auth0 issuer/subject claims to internal UUID profiles, and has a forward migration for PostgreSQL RLS/RPC identity checks. The code passes lint, typecheck, and production build; all migrations applied successfully to a temporary local PostgreSQL instance. All 21 database regression assertions also passed against local PostgreSQL using a temporary TAP-compatible test shim.

**Auth0 application provisioned.** The Auth0 MCP created the Regular Web Application, saved credentials in ignored `.env.local`, and registered the local callback/logout URLs. The local Supabase Auth0 tenant config is enabled. You still need to enable the Google connection, deploy/attach the Post-Login Action, and configure local Supabase API values.

**M3 is not complete yet.** Live Auth0 sign-in and the real Supabase Auth0 third-party JWT integration still need verification, including running the suite with Supabase's actual pgTAP runner. M4 and production deployment remain blocked until those checks pass. See the [implementation plan](./docs/16_IMPLEMENTATION_PLAN.md), [authentication setup](./docs/07_AUTHENTICATION.md), and [repository audit](./docs/19_REPOSITORY_AUDIT.md).

## Local development

Requirements: Node.js 20+, pnpm 9+, Supabase CLI, and Docker only if running the local Supabase stack.

```bash
pnpm install
cp -n .env.example .env.local
pnpm dev
```

If `.env.local` already exists, do not overwrite it; add only missing keys. The public landing page and quality checks work without cloud credentials. To sign in locally, finish Google connection and Action setup and configure local Supabase API values using [the authentication setup guide](./docs/07_AUTHENTICATION.md). Never paste secrets into issues, pull requests, or chat.

For local database, migration, and database-test work:

```bash
supabase start
supabase db reset
supabase test db
```

The live Auth0 tenant and Supabase hosted project are not required for lint, typecheck, or build. No service should require billing or paid usage.

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

The test runner/scripts are introduced in M16; until then run the checks currently defined in `package.json`.

## Budget and architecture rules

- $0 ongoing service cost is mandatory. Free trials, expiring credits, and required paid features do not qualify.
- Never enable billing, upgrade, or accept charges without explicit authorization.
- Verify pricing, quotas, payment requirements, terms, and restrictions from official sources before adopting services.
- Auth0 is the sole identity provider; application roles stay in trusted PostgreSQL records and are enforced by RLS.
- No service-role key in browser or user-triggered request paths.
- No AI-agent watermark or `Co-authored-by` commit trailer.

## Documentation

- [Documentation index](./docs/README.md)
- [Milestone plan](./docs/16_IMPLEMENTATION_PLAN.md)
- [Authentication](./docs/07_AUTHENTICATION.md)
- [RBAC](./docs/06_RBAC.md)
- [Free-tier technology audit](./docs/19_REPOSITORY_AUDIT.md)
- [Deployment](./docs/13_DEPLOYMENT.md)
