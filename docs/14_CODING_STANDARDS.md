# Coding Standards

## Related Documents

- [System Architecture](./04_SYSTEM_ARCHITECTURE.md)
- [API Strategy](./09_API_STRATEGY.md)
- [UI System](./10_UI_SYSTEM.md)
- [Component Library](./11_COMPONENT_LIBRARY.md)
- [Testing](./12_TESTING.md)
- [AI Development Guide](./15_AI_DEVELOPMENT_GUIDE.md)

---

## Overview

Coding conventions for the Sports Community Platform. All code — human or AI generated — must follow these standards for consistency and maintainability.

---

## General Principles

1. **Prefer simplicity** — smallest correct solution
2. **Feature-first** — code lives in feature modules
3. **Server by default** — Client Components only when necessary
4. **Strong typing** — no `any`; strict TypeScript
5. **Validate at boundaries** — Zod on all Server Action inputs
6. **Match existing patterns** — read surrounding code before adding

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | kebab-case | `event-card.tsx` |
| Files (utilities) | kebab-case | `format-date.ts` |
| React components | PascalCase | `EventCard` |
| Functions | camelCase | `getEventBySlug` |
| Server Actions | camelCase verb | `createEvent`, `joinEvent` |
| Constants | SCREAMING_SNAKE | `MAX_EVENT_CAPACITY` |
| Types/Interfaces | PascalCase | `EventSummary` |
| Enums (TS) | PascalCase keys | `ParticipantStatus.Confirmed` |
| CSS variables | kebab-case | `--brand-primary` |
| Database | snake_case | `event_participants` |

---

## Folder Structure

See [System Architecture](./04_SYSTEM_ARCHITECTURE.md) for full tree.

**Rules:**

- One primary component per file
- Co-locate feature components in `features/{name}/components/`
- Shared domain components in `components/domain/`
- shadcn primitives in `components/ui/` — do not modify heavily; extend via wrapper
- Zod schemas in `lib/validations/` grouped by domain
- Supabase clients only in `lib/supabase/`

---

## Imports

**Order:**

1. React / Next.js
2. External packages
3. `@/components/*`
4. `@/features/*`
5. `@/lib/*`
6. `@/types/*`
7. Relative imports

**Rules:**

- Use `@/` path alias for all src imports
- No default exports except Next.js pages and lazy-loaded components
- Prefer named exports for components, actions, types
- No barrel files (`index.ts` re-exporting everything) except `types/index.ts`

```typescript
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/domain/event-card';
import { getUpcomingEvents } from '@/features/events/queries';
import { createClient } from '@/lib/supabase/server';
import type { Event } from '@/types';
```

---

## TypeScript

### Config Requirements

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": false
  }
}
```

### Rules

- Never use `any` — use `unknown` and narrow
- Never use `@ts-ignore` — fix the type or use `@ts-expect-error` with comment
- Infer types from Zod: `type CreateEventInput = z.infer<typeof createEventSchema>`
- Generate DB types from Supabase: `src/types/database.ts`
- Prefer `interface` for object shapes; `type` for unions and utilities

### Database Types

```typescript
import type { Database } from '@/types/database';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
```

---

## React Components

### Server Components (default)

```typescript
// No "use client" directive
import { getEventBySlug } from '@/features/events/queries';

export async function EventPage({ params }: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  return <EventDetail event={event} />;
}
```

### Client Components

```typescript
'use client';

import { useTransition } from 'react';
import { joinEvent } from '@/features/participants/actions';
```

Add `"use client"` only for: hooks, event handlers, browser APIs, Framer Motion, theme.

### Component Structure

```typescript
// 1. Types
type EventCardProps = { event: EventSummary };

// 2. Component
export function EventCard({ event }: EventCardProps) {
  // hooks (client only)
  // derived state
  // handlers (client only)
  return (/* JSX */);
}
```

### Props

- Destructure props in function signature
- Optional props with `?`
- Children: `React.ReactNode`

---

## Server Actions

Location: `src/features/{feature}/actions.ts`

```typescript
'use server';

export async function myAction(input: unknown): Promise<ActionResult<MyData>> {
  // 1. Validate with Zod
  // 2. Auth check (getUser)
  // 3. Authorization check (optional app-layer)
  // 4. Supabase mutation
  // 5. revalidatePath
  // 6. Return ActionResult
}
```

**Rules:**

- Always accept `unknown` or validated type; parse with Zod first
- Always use user-scoped Supabase client
- Always return `ActionResult<T>`, never throw to client
- Log errors server-side with context
- Call `revalidatePath` after successful mutations

---

## Forms

**Stack:** React Hook Form + Zod resolver + shadcn Form components

```typescript
const form = useForm<CreateEventInput>({
  resolver: zodResolver(createEventSchema),
  defaultValues: { /* ... */ },
});

async function onSubmit(data: CreateEventInput) {
  const result = await createEvent(data);
  if (!result.success) {
    // map fieldErrors to form.setError
    return;
  }
  toast.success('Event created');
  router.push(`/dashboard/events/${result.data.id}`);
}
```

**Rules:**

- Share Zod schema between client and server
- Show inline field errors
- Disable submit while `isPending`
- Use `useTransition` for Server Action pending state

---

## Validation

- All schemas in `src/lib/validations/`
- Use `.trim()` on strings
- Use `.uuid()` for IDs
- Use `.datetime()` for ISO strings
- Refine cross-field rules (end > start) in schema

---

## Error Handling

```typescript
// Server Action
catch (error) {
  console.error('[actionName]', { userId, error });
  return {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'User-friendly message' },
  };
}

// Client
if (!result.success) {
  toast.error(result.error.message);
}
```

Never expose Postgres error messages to users.

---

## Accessibility

- Semantic HTML: `main`, `nav`, `section`, `button`
- `<Label htmlFor={id}>` on all form fields
- `aria-label` on icon-only buttons
- `aria-live="polite"` for join status updates
- Focus management in modals (Radix handles)
- See [UI System](./10_UI_SYSTEM.md)

---

## Animations

- Wrap Framer Motion in client components
- Use `useReducedMotion()` hook
- Prefer CSS transitions for simple hover/focus
- Stagger lists: 50ms delay increment
- Durations: 150–350ms per [UI System](./10_UI_SYSTEM.md)

---

## Utilities

Location: `src/lib/utils/`

- Pure functions only
- Unit tested
- Single responsibility
- `cn()` for class merging (clsx + tailwind-merge) — from shadcn

---

## Comments

- Code should be self-explanatory
- Comment **why**, not **what**
- JSDoc on exported utilities and complex functions
- No commented-out code in commits

```typescript
/** Generates 8-char URL-safe slug for WhatsApp sharing. */
export function generateShareSlug(): string { /* ... */ }
```

---

## Documentation

- README updated at M18 for setup instructions
- Complex business logic documented in feature README if needed (optional)
- ADRs in [Decisions](./18_DECISIONS.md) for architectural changes

---

## ESLint and Prettier

### ESLint

- Extend `next/core-web-vitals` and `next/typescript`
- No unused vars (prefix with `_` if intentionally unused)
- Enforce `import/order` if configured

### Prettier

- Semi: true
- Single quotes: true
- Tab width: 2
- Trailing comma: es5
- Print width: 100

### Commands

```bash
pnpm lint        # ESLint
pnpm format      # Prettier write
pnpm typecheck   # tsc --noEmit
```

Run all three before marking milestone complete.

---

## Git Conventions

### Commit Messages

Conventional Commits:

```
feat(events): add create event server action
fix(participants): prevent double join on rapid click
docs: update RBAC matrix
chore: upgrade next to 15.x
test(e2e): add waitlist promotion spec
```

### Branch Names

```
milestone/M8-join-event
feat/event-card
fix/waitlist-position
```

---

## Anti-Patterns (Do Not)

| Anti-Pattern | Why |
|--------------|-----|
| `any` type | Breaks type safety |
| Service role in Server Actions | Bypasses RLS |
| Direct INSERT to event_participants | Must use RPC |
| `dangerouslySetInnerHTML` for user content | XSS risk |
| Fetch in Client Component for initial data | Use Server Component |
| Hardcoded colors | Use design tokens |
| Microservices split | Monolith for MVP |
| Court booking tables/logic | Out of product scope |

---

## File Templates

### New Feature Module

```
features/my-feature/
  actions.ts       # Server Actions
  queries.ts       # Server-side data fetching
  types.ts         # Feature types
  components/      # Feature-specific UI
```

### New Page

```
app/(dashboard)/my-page/
  page.tsx         # Server Component page
  loading.tsx      # Suspense fallback
  error.tsx        # Error boundary (optional)
```
