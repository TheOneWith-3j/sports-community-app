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

**Overall milestone progress:** `#################---` **17/19 complete (89%)**

M0–M16 are complete. M6 Event CRUD and M7's anonymous public share page were verified in the browser. M8 implements atomic event joining, first-time community enrollment, guest return-to-event login, participation status, and duplicate/closed-event rejection. M9 renders the caller's private waitlist position and an ordered admin waitlist. M10 adds confirmed/waitlisted leave controls with synchronous promotion and position renumbering. M11 adds confirmed participant lists and admin removal; M12 adds admin attendance marking and summaries. M13 adds the responsive dashboard shell, upcoming-event overview, capacity statistics, and event sharing. M14 centralizes app-layer role checks, tightens participant mutation privileges, and preserves RLS/RPC authority. M15 adds persisted dark/light themes, accessible loading/error primitives, and reduced-motion support. M16 adds Vitest validation tests, coverage scripts, and a Playwright configuration gated for seeded test environments. Migrations `20260101000008` through `20260101000011` are included, and all 49 hosted SQL regression assertions pass before this branch. Lint, typecheck, production build, and local unit tests pass. The official `supabase test db --linked` runner remains unavailable without Docker/Podman; Auth0/Supabase-backed E2E flows require test credentials and seeded data. Temporary QA fixtures were removed after verification. See the [implementation plan](./docs/16_IMPLEMENTATION_PLAN.md).

**Auth0 setup is provisioned.** The Auth0 MCP created the Regular Web Application, saved credentials in ignored `.env.local`, and registered the local callback/logout URLs. The application display name is now RallyNook; the tenant domain is unchanged. The local Supabase Auth0 tenant config is enabled. The `RallyNook Supabase JWT Role Claim` Post-Login Action is created, built, deployed, and attached to the Login trigger (confirmed in the Auth0 Dashboard by the project owner). The app's Google sign-in route was verified to redirect to Google Accounts, and the Auth0 login page displays the Google option.

**M4 profile setup is complete.** A persisted onboarding flag ensures new Auth0 users confirm a display name even when the provider supplies an email as `name`. A disposable authenticated browser session verified first-login redirect, inline rejection of invalid profile values, successful onboarding, profile edits, persistence after navigation, and redirect away from completed onboarding. Lint, typecheck, production build, and all 22 hosted SQL assertions pass. Expired- and wrong-audience-token rejection were not separately exercised; do not treat hosting or production deployment as approved. See the [implementation plan](./docs/16_IMPLEMENTATION_PLAN.md), [authentication setup](./docs/07_AUTHENTICATION.md), and [repository audit](./docs/19_REPOSITORY_AUDIT.md).

## Local development

Requirements: Node.js 20+ and pnpm 9+. The pinned Supabase CLI is available through `pnpm exec supabase`; a compatible Docker runtime is required only for the local Supabase stack.

```bash
pnpm install
cp -n .env.example .env.local
pnpm dev
```

If `.env.local` already exists, do not overwrite it; add only missing keys. The public landing page and quality checks work without cloud credentials. Google connection and Action setup are configured in Auth0, and the owner reports adding Auth0 under Supabase Third-Party Auth. The hosted database migrations are applied; use [the authentication setup guide](./docs/07_AUTHENTICATION.md) for setup and remaining token edge-case verification. Never paste credentials into issues, pull requests, or chat.

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
