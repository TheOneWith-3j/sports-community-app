# Repository and Free-Tier Technology Audit

**Last verified:** 2026-10-11
**Scope:** RallyNook. This is an event participation product, not a court-booking system or the unrelated Kyron Medical AI Assistant.

## Budget and quality requirements

The project must remain buildable, testable, and locally deployable with no required paid service. A free trial, temporary credit, or a plan that requires a paid feature is not a free-tier decision. Do not enable billing, upgrade, add paid resources, or accept usage-based charges without explicit user authorization. Recheck official provider terms, pricing, quotas, payment requirements, and restrictions before production adoption and whenever a provider's plan changes.

“Industry grade” means using maintained, production-suitable technologies and engineering controls—not choosing the most expensive provider. Preserve the existing Next.js App Router, strict TypeScript, pnpm, Tailwind, Zod, PostgreSQL, and modular-monolith architecture unless evidence justifies a documented change. Require server-side authorization, least privilege, migrations, automated tests, lint/typecheck/build, dependency and secret checks, accessible responsive UI, safe error handling, and documented recovery/failure behavior. Free local tools and deterministic local checks must remain available without cloud credentials.

## Service comparison

| Service and purpose | Free allowance and verified features | Restrictions, expiry, and usage risks | Payment requirements | Product fit and decision | Official evidence (checked 2026-10-11) |
|---|---|---|---|---|---|
| **Auth0 — application identity provider; Google is a federated login connection** | Pricing page lists $0/month, up to 25,000 MAU, unlimited social connections, 5 Organizations, one custom domain, and says no credit card is needed to sign up. | Free plan has feature limits. The pricing page lists **role-based access control per Organization under Essentials**, so do not depend on Auth0 Organizations or Auth0 RBAC for community-specific authorization. Terms of use and any production-specific restrictions must be checked before launch. | No card needed to sign up per pricing page. Do not add paid features or upgrade. | **M3 Auth0 implementation is underway; live tenant and pricing/terms validation remain outstanding.** Use Auth0 as the only IdP. Keep dynamic community membership/roles in trusted PostgreSQL records and enforce them in RLS. | [Auth0 pricing](https://auth0.com/pricing); [Auth0 Next.js SDK quickstart](https://auth0.com/docs/quickstart/webapp/nextjs); [Auth0 RBAC](https://auth0.com/docs/manage-users/access-control/rbac); [Auth0 Organizations](https://auth0.com/docs/manage-users/organizations); [Auth0 token validation](https://auth0.com/docs/secure/tokens/access-tokens/validate-access-tokens) |
| **Supabase — PostgreSQL, migrations, RLS, optional Storage; no Supabase Auth in the target architecture** | Free page lists 500 MB database/project, 5 GB egress, 1 GB file storage, 50,000 third-party MAU, and two active free projects. Supabase documents an Auth0 third-party JWT integration and local CLI workflow. | Free projects pause after one week inactive. No daily backups are listed for Free; use and verify tested exports/recovery. Quotas are shared where the plan specifies organization-level usage. Monitor limits; do not incur overages. | Official pages reviewed do not establish all payment/card-verification requirements for every account/region; verify before creating any hosted resource. Keep billing disabled. | **Retain for local PostgreSQL and migrations; managed Free project is a candidate only after payment, recovery, and quota checks. Auth0 is the sole IdP.** Existing M2 schema/RLS currently assumes Supabase Auth and must be migrated before use with Auth0. | [Supabase pricing](https://supabase.com/pricing); [Supabase billing and quotas](https://supabase.com/docs/guides/platform/billing-on-supabase); [Supabase Auth0 integration](https://supabase.com/docs/guides/auth/third-party/auth0) |
| **Vercel Hobby — Next.js hosting candidate** | Official plan page lists free monthly usage allowances, including 100 GB fast data transfer and 1,000,000 function invocations. It describes Hobby as for personal projects. | Explicitly restricted to personal, non-commercial use. On usage caps, features may pause until the next allowance window. Suitability depends on product/commercial status and runtime limits. | Hobby is free; usage limits may pause service rather than bill, but verify account settings and applicable terms. Never upgrade or enable paid usage. | **Do not assume it is an eligible production host. Defer until project use is confirmed personal/non-commercial and current terms/quotas are accepted; preserve local deployment and evaluate alternatives before launch.** | [Vercel Hobby plan and fair-use restriction](https://vercel.com/docs/plans/hobby) |
| **GitHub Actions — CI** | Standard GitHub-hosted runners are free for public repositories; self-hosted runner usage is free. This repository is public at audit time. | Private-repository allowances depend on account plan; overages can be billed. Avoid paid larger runners and unbounded artifact/cache retention. Recheck repository visibility and billing configuration. | Public standard runner usage is free per official docs. Do not enable paid usage. | **Adopt for CI while the repository is public and standard runners are used; local checks remain authoritative and runnable offline.** | [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) |
| **Google — social identity upstream of Auth0** | Auth0 pricing includes unlimited social connections on Free; Google is a supported social identity provider. No separate app-side Google OAuth implementation is intended. | Google provider terms, verification requirements, branding, and any Google-specific quotas or restrictions must be confirmed during setup. | No paid Google API is required for the planned sign-in path; provider terms still require verification. | **Use only as an Auth0 connection if verified; do not configure Supabase Auth Google OAuth in parallel.** | [Auth0 pricing](https://auth0.com/pricing); [Auth0 connections](https://auth0.com/docs/authenticate/identity-providers) |
| **Transactional email — not currently required by an MVP milestone** | No provider selected or quota assumed. | Verify recipient/domain restrictions, sending quota, production access, deliverability, terms, and failure/status behavior if a documented milestone requires email. | Unknown until provider is evaluated. No paid service authorized. | **Defer; do not add a provider or claim delivery without provider confirmation.** | Evaluate official documentation only when the feature is in milestone scope. |
| **AI, voice, analytics, background services — not required by this product's current scope** | No allowance assumed. | Not applicable to the current sports event participation platform. Any future proposal requires explicit product need and separate official free-tier/privacy review. | No paid service authorized. | **Reject as out of scope unless requirements change.** | Re-evaluate only against an approved requirement. |

### Decision summary

1. Use Auth0 as the single identity provider; Google is an Auth0 connection, not a second application identity system.
2. Use Auth0's official Next.js SDK and standards-based OIDC/OAuth flow. Verify the free plan and terms before production use. Do not depend on paid Auth0 Organizations or per-Organization RBAC.
3. Keep platform and community roles in server-controlled PostgreSQL data. RLS is the final data authorization boundary; browser-supplied roles and token role claims never grant business roles.
4. Supabase is a database/platform candidate, not an additional identity provider. Its Auth0 third-party integration must be configured and tested using its official guide. Do not use Supabase Auth.
5. The previously merged M3 used Supabase Auth and did not comply with this target. Its replacement with Auth0 and the database/RLS identity mapping is in progress. The full migration chain applies to isolated local PostgreSQL; all 21 database regression assertions pass using a temporary TAP-compatible shim. The official Supabase pgTAP run and live Auth0/Supabase token verification remain outstanding; do not start M4 or use it as production-ready until those gates are verified.
6. Vercel Hobby is not approved for product production until its personal-use restriction is shown to fit the product's actual use. No paid alternative is implicitly authorized.

## Auth0-to-PostgreSQL identity and authorization contract

- Auth0 authenticates the person. The application validates the Auth0 session on the server using the official SDK.
- For Supabase Data API access, follow Supabase's Auth0 third-party integration exactly, including its Auth0 Action adding the required `role: "authenticated"` claim to the **ID token** and passing that ID token as the Supabase JWT. That claim selects the PostgreSQL `authenticated` database role only; it is not an application role.
- Validate issuer, signature, expiry, and intended audience according to the Auth0/Supabase integration. Reject invalid or missing credentials; do not silently fall back to anonymous access for protected operations.
- Do not trust Auth0 `app_metadata`, user metadata, browser state, or client-supplied role values as the source of community authorization. The database remains authoritative for `platform_role` and `community_members.role`.
- The existing schema uses `profiles.id` as a foreign key to `auth.users.id` and policies/RPCs use `auth.uid()`. That is coupled to Supabase Auth and must not be carried forward unchanged. Design a reviewed migration that preserves internal UUID profile IDs, binds each profile to a unique trusted Auth0 `iss` + `sub`, and resolves the current profile from verified JWT claims in a narrowly privileged helper. Update all RLS policies, triggers, RPCs, account lifecycle handling, and tests. Ensure guest requests resolve to no profile and cannot access protected data.
- Treat the required `role` claim and Auth0 ID-token audience semantics as an integration detail, distinct from product-level RBAC. Do not place community roles or super-admin grants in a client-editable token.
- Never place Auth0 client secrets, Management API tokens, or database privileged keys in browser code or user-triggered paths. Supabase publishable/anon keys are not secrets but rely on strict RLS.

## Adopted-service configuration and operations

### Auth0 (target; not yet wired into the application)

Use environment variables with server-only names, for example:

```env
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_SECRET=
APP_BASE_URL=http://localhost:3000
```

Exact names and required values must follow the current official Auth0 Next.js SDK and Supabase third-party integration at implementation time. The Supabase integration uses the Auth0 ID token; do not add an API audience unless the selected SDK/integration requires one. Keep `.env.local` untracked; publish only non-secret values. Configure separate local/development and production callback/logout URLs without creating additional paid tenants or features. Provide mocked auth/session tests for local CI; an end-to-end provider test requires explicitly configured credentials.

When Auth0 limits or provider failures occur, show a safe retryable sign-in error, preserve server-side logs without tokens/PII, and never issue a local success-shaped session. Record the actual free-plan entitlements and any unverified terms in this audit before production use.

### Supabase (local-first; managed project not yet approved)

Use local Supabase CLI/PostgreSQL for migration and RLS tests when Docker is available. Keep service-role credentials limited to local setup/admin scripts; never use them for a user request. Store hosted project URL and publishable key only after a free-project/payment/recovery decision. Do not enable billing. Monitor pause state, storage/database/egress/third-party MAU quotas. Maintain tested database export and restore instructions; a paused project is an availability risk, not a backup.

### CI and hosting

CI must run `pnpm install --frozen-lockfile`, lint, typecheck, unit/integration tests, production build, dependency vulnerability checks, available secret scanning, and suitable SQL/RLS checks without cloud credentials. Authenticated E2E may use mocks by default. Provider-backed smoke tests are opt-in. CI must not enable billing or use paid runners.

Hosting is not settled by “free” alone: retain local `pnpm dev` and production build capability. Before selecting a public host, verify framework/runtime support, project eligibility, commercial-use terms, monthly limits, pause/cold-start behavior, persistent storage, deployment controls, and cost/overage behavior from official docs. Document the chosen host and recovery path here before launch.

## Local verification and remaining unknowns

- No hosted service credentials are required for lint, typecheck, unit tests, or local build.
- Auth0 sign-in, OAuth callbacks, tenant configuration, and production terms have not yet been verified in this repository.
- Auth0-to-Supabase RLS behavior, subject-to-profile mapping, and SQL RPC access require integration tests before M3 can be accepted.
- Supabase Free payment/card requirements and recovery guarantees were not established by the official pages checked above; verify before creating a hosted database.
- Vercel Hobby commercial eligibility is not established and must not be assumed.
- Provider prices/quotas can change; this dated review is evidence, not a promise of future availability.
