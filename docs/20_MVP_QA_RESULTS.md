# MVP QA Results

**Run date:** 2026-10-22  
**Environment:** local Next.js app with the hosted Supabase Free project and Auth0 configuration

## Verified

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` — 15 tests passed
- `pnpm build`
- Public Playwright smoke and critical accessibility checks — 2 passed
- Public event page at 375px viewport — HTTP 200, event content rendered
- Public event page at 1440px viewport — HTTP 200, event content rendered
- Jash Joshi Google/Auth0 identity mapped to the application profile
- Jash Joshi has `platform_role = 'super_admin'`
- `RallyNook Demo Community` exists with Jash as admin and a QA member
- `RallyNook Demo Night` is published with capacity 1
- Demo participation state: Jash confirmed; QA member waitlisted at position 1

## Not verified

- Authenticated browser flows requiring a real Auth0 session: join, leave, promotion, attendance, and sign-out
- iOS Safari and Android Chrome device smoke tests
- Production deployment and production callback URLs
- Lighthouse LCP target; Lighthouse is not currently installed in the repository

These checks remain blocked by the absence of a committed-safe Playwright Auth0 storage state, physical/browser device coverage, and an approved $0 hosting provider. No production billing or paid resource was enabled.
