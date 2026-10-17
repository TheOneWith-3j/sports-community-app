# Component Library

## Related Documents

- [UI System](./10_UI_SYSTEM.md)
- [Coding Standards](./14_CODING_STANDARDS.md)
- [Implementation Plan](./16_IMPLEMENTATION_PLAN.md)

---

## Overview

Reusable component specifications for RallyNook. All components follow [UI System](./10_UI_SYSTEM.md) tokens. Built on shadcn/ui primitives in `src/components/ui/`; domain components in `src/components/domain/` and `src/components/layout/`.

**Conventions:**

- Server Components by default; Client only when noted
- All interactive components: 44px min touch target on mobile
- All states documented: default, hover, focus, disabled, loading, error, empty

---

## Primitive Components (shadcn/ui base)

### Button

**Path:** `src/components/ui/button.tsx`

| Variant | Appearance | Use |
|---------|------------|-----|
| `default` | Brand gradient background, white text | Primary CTA (Join Event, Create) |
| `secondary` | `bg-muted` text-foreground | Secondary actions |
| `outline` | Border border-border, transparent bg | Tertiary, Cancel |
| `ghost` | Transparent, hover bg-muted | Toolbar, icon adjacency |
| `destructive` | `--destructive` background | Leave event, delete |
| `link` | Text brand-primary underline | Inline links |

| Size | Height | Padding | Use |
|------|--------|---------|-----|
| `sm` | 36px | px-3 | Compact tables |
| `default` | 44px | px-4 | Standard mobile |
| `lg` | 48px | px-6 | Hero CTAs |
| `icon` | 44×44px | — | Icon only |

**Props:** `variant`, `size`, `disabled`, `loading` (shows spinner), `asChild`, standard button HTML attrs.

**Accessibility:** `aria-busy` when loading; icon-only requires `aria-label`.

**Example:**

```tsx
<Button variant="default" size="lg" loading={isPending}>
  Join Event
</Button>
```

---

### Card

**Path:** `src/components/ui/card.tsx`

**Structure:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

| Property | Value |
|----------|-------|
| Radius | `rounded-2xl` (radius-xl) |
| Background | `bg-card` |
| Border | `border border-border/50` |
| Padding | `p-6` default |

**Variants:**

| Variant | Use |
|---------|-----|
| `default` | Standard content card |
| `interactive` | Hover elevation + cursor pointer |
| `glass` | Navbar, overlay panels |

---

### Input

**Path:** `src/components/ui/input.tsx`

| Property | Value |
|----------|-------|
| Height | 44px |
| Radius | `rounded-lg` |
| Border | `border-input` |
| Focus | `ring-2 ring-ring/20` |

**Props:** Standard input + `error?: boolean` toggles destructive border.

**Pair with:** `Label`, `FormMessage` from shadcn Form.

---

### Select

**Path:** `src/components/ui/select.tsx`

**Use:** Activity type picker, attendance status, event status filter.

| Property | Value |
|----------|-------|
| Trigger height | 44px |
| Content | `rounded-xl` popover |

**Accessibility:** Radix Select — keyboard navigable, aria-expanded.

---

### Modal / Dialog

**Path:** `src/components/ui/dialog.tsx`

**Use:** Confirmations, create event quick form on mobile.

| Property | Value |
|----------|-------|
| Overlay | `bg-black/60 backdrop-blur-sm` |
| Content radius | `rounded-2xl` |
| Max width | `sm:max-w-md` |
| Animation | Fade + scale 0.95 (Framer or Radix) |

**Accessibility:** Focus trap, Escape to close, `aria-labelledby` on title.

---

### Drawer

**Path:** `src/components/ui/drawer.tsx` (vaul)

**Use:** Mobile action sheets, filter panels.

| Property | Value |
|----------|-------|
| Direction | Bottom on mobile |
| Handle | Visible drag handle |
| Radius | `rounded-t-2xl` |

---

### Toast

**Path:** `src/components/ui/toast.tsx` + `toaster.tsx`

**Use:** Success/error feedback after actions.

| Variant | Icon | Color |
|---------|------|-------|
| `default` | Info | neutral |
| `success` | CheckCircle | `--success` |
| `destructive` | XCircle | `--destructive` |
| `warning` | AlertTriangle | `--warning` |

**Position:** Bottom center mobile; top-right desktop.

**Duration:** 4000ms default; 6000ms for errors.

---

### Avatar

**Path:** `src/components/ui/avatar.tsx`

| Size | Dimensions | Use |
|------|------------|-----|
| `sm` | 32px | Participant list compact |
| `md` | 40px | Standard list |
| `lg` | 56px | Profile header |
| `xl` | 80px | Profile page |

**Fallback:** Initials from display name on `bg-muted`.

**Ring:** `ring-2 ring-border` optional for confirmed participants.

---

### Badge

**Path:** `src/components/ui/badge.tsx`

| Variant | Use |
|---------|-----|
| `default` | Generic label |
| `success` | Confirmed, Present |
| `warning` | Waitlisted |
| `destructive` | Cancelled, No-show |
| `secondary` | Draft, Absent |
| `outline` | Count badges |

**Size:** `text-body-sm px-2 py-0.5 rounded-full`.

---

### Tabs

**Path:** `src/components/ui/tabs.tsx`

**Use:** Event admin view (Participants | Waitlist | Attendance).

| Property | Value |
|----------|-------|
| List | Underline or pill style |
| Active | `border-brand-primary` underline |

---

## Layout Components

### Navbar

**Path:** `src/components/layout/navbar.tsx`  
**Type:** Client Component (scroll effects optional)

**Structure:**

```
[Logo]                    [Theme Toggle] [Avatar Menu]
```

| Property | Value |
|----------|-------|
| Position | Sticky top |
| Style | `elevation-glass` |
| Height | 56px |

**Mobile public event page:** Back button left, Share button right.

**Accessibility:** `<nav aria-label="Main">`.

---

### Sidebar

**Path:** `src/components/layout/sidebar.tsx`  
**Type:** Server Component shell + Client toggle

**Visible:** `md:` breakpoint and above.

**Items:** Dashboard, Events, Community, Settings.

**Active state:** `bg-muted` + brand left border 2px.

---

### Bottom Navigation

**Path:** `src/components/layout/bottom-nav.tsx`  
**Type:** Client Component

**Visible:** Below `md` breakpoint on dashboard routes.

| Item | Icon | Route |
|------|------|-------|
| Home | LayoutDashboard | /dashboard |
| Events | Calendar | /dashboard/events |
| Community | Users | /dashboard/community |
| Settings | Settings | /dashboard/settings |

| Property | Value |
|----------|-------|
| Height | 64px + safe-area-inset-bottom |
| Style | `elevation-glass` fixed bottom |

---

## Domain Components

### EventCard

**Path:** `src/components/domain/event-card.tsx`

**Purpose:** Display event summary in dashboard lists.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `event` | `EventSummary` | Title, dates, location, capacity |
| `confirmedCount` | `number` | Current confirmed participants |
| `status` | `EventStatus` | draft, published, etc. |
| `href` | `string` | Link target |
| `showActions` | `boolean` | Admin quick actions |

**Layout:**

- Title: `text-heading-md`
- Meta row: date icon + formatted date, map pin + location
- Capacity bar: progress `confirmedCount / capacity`
- Badge: status variant
- Footer: Copy link button (admin)

**States:**

| State | Display |
|-------|---------|
| Loading | `Skeleton` variant event-card |
| Empty | N/A (parent handles) |
| Draft | Muted opacity + Draft badge |
| Cancelled | Strikethrough title |

**Interaction:** Card variant `interactive`; entire card clickable except action buttons.

---

### ParticipantList

**Path:** `src/components/domain/participant-list.tsx`

**Purpose:** Ordered list of confirmed participants.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `participants` | `Participant[]` | id, displayName, avatarUrl, joinedAt |
| `showJoinedAt` | `boolean` | Show relative time |
| `adminActions` | `boolean` | Show remove button |
| `onRemove` | `(id) => void` | Admin remove handler |
| `currentUserId` | `string?` | Highlight current user |

**Layout:**

- Numbered list 1..N (join order)
- Avatar md + name + optional "You" badge
- Admin: ghost destructive icon button Remove

**States:**

| State | Display |
|-------|---------|
| Loading | 5× skeleton rows |
| Empty | EmptyState "No participants yet" |
| Error | ErrorState with retry |

**Animation:** Stagger list items 50ms on mount.

---

### WaitlistCard

**Path:** `src/components/domain/waitlist-card.tsx`

**Purpose:** Show user's waitlist status or admin full waitlist.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `'user' \| 'admin'` | Display mode |
| `position` | `number` | Required for the user variant |
| `participants` | `WaitlistedParticipant[]` | Required for the admin variant |

**User variant:**

- Warning badge "Waitlisted"
- Large position number: "#3 on waitlist"
- Helper text: "You'll be promoted automatically when a spot opens"

**Admin variant:**

- Ordered list with position, display name, and join date
- The admin event page loads this list only after server-side community-admin authorization

---

### AttendanceCard

**Path:** `src/components/domain/attendance-card.tsx`

**Purpose:** Admin marks attendance for one participant.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `participant` | `Participant` | Participant info |
| `attendanceStatus` | `AttendanceStatus?` | Current status |
| `onMark` | `(status) => void` | Mark handler |

**Layout:**

- Avatar + name
- Segmented control or three toggle buttons: Present | Absent | No-show
- Active state uses semantic badge colors

---

### StatisticsCard

**Path:** `src/components/domain/statistics-card.tsx`

**Purpose:** Dashboard metric display.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Metric name |
| `value` | `string \| number` | Primary value |
| `icon` | `LucideIcon` | Optional icon |
| `trend` | `{ value: number; direction: 'up' \| 'down' }?` | Future |

**Layout:** Card with icon top-left, value `text-display-md`, label `text-body-sm muted`.

**MVP metrics:** Upcoming events count, Total participants this week, Average attendance rate.

---

## Feedback Components

### Skeleton Loader

**Path:** `src/components/ui/skeleton.tsx`

**Variants:**

| Variant | Dimensions | Use |
|---------|------------|-----|
| `text` | h-4 w-full | Text lines |
| `avatar` | 40px circle | Participant rows |
| `card` | h-32 w-full rounded-2xl | EventCard |
| `button` | h-11 w-full rounded-xl | CTA placeholder |

**Animation:** `animate-pulse bg-muted`.

---

### EmptyState

**Path:** `src/components/domain/empty-state.tsx`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `icon` | `LucideIcon` | 48px muted icon |
| `title` | `string` | `text-heading-md` |
| `description` | `string` | `text-body-md muted` |
| `action` | `ReactNode?` | Optional CTA button |

**Presets:**

| Preset | Title | Use |
|--------|-------|-----|
| `no-events` | No events yet | Dashboard |
| `no-participants` | No participants yet | Event page |
| `no-waitlist` | Waitlist is empty | Admin waitlist tab |
| `no-community` | Create your community | Onboarding |

**Visual:** Optional radial gradient orb behind icon (brand 10% opacity).

---

### LoadingState

**Path:** `src/components/domain/loading-state.tsx`

**Variants:**

| Variant | Display |
|---------|---------|
| `page` | Centered spinner + "Loading..." |
| `inline` | Small spinner in button |
| `section` | Skeleton matching section layout |

**Spinner:** Lucide `Loader2` with `animate-spin text-brand-primary`.

---

### ErrorState

**Path:** `src/components/domain/error-state.tsx`

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Default "Something went wrong" |
| `message` | `string?` | Error detail (user-safe) |
| `onRetry` | `() => void?` | Retry button |

**Visual:** AlertCircle icon destructive color; Retry outline button.

---

### ConfirmationDialog

**Path:** `src/components/domain/confirmation-dialog.tsx`  
**Type:** Client Component

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Controlled open |
| `onOpenChange` | `(open) => void` | |
| `title` | `string` | Dialog title |
| `description` | `string` | Consequence explanation |
| `confirmLabel` | `string` | Default "Confirm" |
| `variant` | `'default' \| 'destructive'` | Confirm button style |
| `onConfirm` | `() => void` | Async confirm handler |
| `loading` | `boolean` | Disables during action |

**Presets:**

| Preset | Title | Variant |
|--------|-------|---------|
| Leave event | Leave this event? | destructive |
| Remove participant | Remove participant? | destructive |
| Cancel event | Cancel this event? | destructive |

---

## Form Patterns

### EventForm

**Path:** `src/features/events/components/event-form.tsx`  
**Type:** Client Component

**Fields:** title, description, startsAt, endsAt, capacity, location, activityTypeId.

**Library:** React Hook Form + Zod resolver.

**Submit:** Calls `createEvent` or `updateEvent` Server Action.

**UX:** Inline validation; datetime-local inputs on mobile.

---

### ProfileForm

**Path:** `src/features/auth/components/profile-form.tsx`

**Fields:** displayName, phone, avatar upload.

---

### CommunityForm

**Path:** `src/features/communities/components/community-form.tsx`

**Fields:** name, slug (auto-generated from name, editable), description, activityTypeId.

---

## Component Composition Examples

### Public Event Page

```
EventPage (Server)
├── Navbar (public variant)
├── EventHeader
│   ├── title, meta, CapacityBar
├── JoinEventButton (Client)
├── ParticipantList
└── StickyJoinCTA (Client, mobile)
```

### Admin Event Detail

```
EventAdminPage (Server)
├── Tabs
│   ├── ParticipantList (adminActions)
│   ├── WaitlistCard (admin variant)
│   └── AttendanceList (AttendanceCard × N)
└── ConfirmationDialog (remove participant)
```

---

## Storybook / Documentation

Storybook is **not** in MVP scope. Component specs in this document are the source of truth. Optional Storybook in Phase 2 ([Roadmap](./17_ROADMAP.md)).

---

## Component Checklist for AI Implementation

When implementing any component:

- [ ] Uses design tokens from [UI System](./10_UI_SYSTEM.md) — no hardcoded hex colors
- [ ] Works in dark and light mode
- [ ] Loading, empty, error states implemented
- [ ] 44px touch targets on mobile
- [ ] Keyboard and screen reader accessible
- [ ] `"use client"` only if needed
- [ ] Framer Motion respects `prefers-reduced-motion`

---

## Component Index

| Component | Path | Type |
|-----------|------|------|
| Button | ui/button | Client |
| Card | ui/card | Server |
| Input | ui/input | Server |
| Select | ui/select | Client |
| Dialog | ui/dialog | Client |
| Drawer | ui/drawer | Client |
| Toast | ui/toast | Client |
| Avatar | ui/avatar | Server |
| Badge | ui/badge | Server |
| Tabs | ui/tabs | Client |
| Skeleton | ui/skeleton | Server |
| Navbar | layout/navbar | Client |
| Sidebar | layout/sidebar | Mixed |
| BottomNav | layout/bottom-nav | Client |
| EventCard | domain/event-card | Server |
| ParticipantList | domain/participant-list | Mixed |
| WaitlistCard | domain/waitlist-card | Server |
| AttendanceCard | domain/attendance-card | Client |
| StatisticsCard | domain/statistics-card | Server |
| EmptyState | domain/empty-state | Server |
| LoadingState | domain/loading-state | Server |
| ErrorState | domain/error-state | Server |
| ConfirmationDialog | domain/confirmation-dialog | Client |
| EventForm | features/events/components | Client |
| ProfileForm | features/auth/components | Client |
