# RallyNook

Your corner for community sports events. Admins share event links, members join first-come-first-served, full events use a waitlist, and admins record attendance. This is **not** a court-booking system.

The repository is still named `sports-community-app`; RallyNook is the product brand.

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

**Auth0 setup is provisioned.** The Auth0 MCP created the Regular Web Application, saved credentials in ignored `.env.local`, and registered the local callback/logout URLs. The application display name is now RallyNook; the tenant domain is unchanged. The local Supabase Auth0 tenant config is enabled. The `RallyNook Supabase JWT Role Claim` Post-Login Action is created, built, deployed, and attached to the Login trigger (confirmed in the Auth0 Dashboard by the project owner). The app's Google sign-in route was verified to redirect to Google Accounts, and the Auth0 login page displays the Google option.

**M3 is not complete yet.** Local browser smoke checks confirm the login page offers Google, unauthenticated `/dashboard` requests reach Auth0 Universal Login, safe local `next` paths are preserved, and external `next` URLs fall back to `/dashboard`. Interactive Google sign-in and the issued ID token's `role: authenticated` claim still need verification. The project owner created a Supabase Free project and supplied its URL/publishable key, which are stored in ignored `.env.local`; a read-only API check currently returns `401 Invalid API key`, so the key must be rechecked in the project's Connect dialog. The hosted dashboard Auth0 third-party integration and schema migrations also need setup. Local Supabase integration tests remain blocked: Docker is unavailable, and starting the stack through the installed Podman runtime failed. M4 and production deployment remain blocked until the acceptance checks pass. See the [implementation plan](./docs/16_IMPLEMENTATION_PLAN.md), [authentication setup](./docs/07_AUTHENTICATION.md), and [repository audit](./docs/19_REPOSITORY_AUDIT.md).

## Local development

Requirements: Node.js 20+ and pnpm 9+. The pinned Supabase CLI is available through `pnpm exec supabase`; a compatible Docker runtime is required only for the local Supabase stack.

```bash
pnpm install
cp -n .env.example .env.local
pnpm dev
```

If `.env.local` already exists, do not overwrite it; add only missing keys. The public landing page and quality checks work without cloud credentials. Google connection and Action setup are configured in Auth0; to complete sign-in/JWT verification, enable Auth0 in the project's Supabase Third-Party Auth settings and follow [the authentication setup guide](./docs/07_AUTHENTICATION.md). Never paste credentials into issues, pull requests, or chat.

For local database, migration, and database-test work:

```bash
pnpm exec supabase start
pnpm exec supabase db reset
pnpm exec supabase test db
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
