# UI System

## Related Documents

- [Product Vision](./01_PRODUCT_VISION.md)
- [Component Library](./11_COMPONENT_LIBRARY.md)
- [Coding Standards](./14_CODING_STANDARDS.md)
- [Decisions](./18_DECISIONS.md)

---

## Design Direction

Premium sports product aesthetic for 2026. Inspired by Nike Training Club, Apple Fitness, Linear, Notion Calendar, Arc Browser, and modern fintech.

**Principles:**

- Minimal and elegant — premium without visual noise
- Mobile-first — primary use is WhatsApp link on phone
- Dark mode default — light mode fully supported
- Large typography and generous spacing
- Subtle glass effects on navigation only
- Meaningful motion — never decorative animation for its own sake
- Accessibility first — WCAG 2.1 AA target

---

## Typography

**Font family:** Geist Sans (primary), Geist Mono (code/numbers)

Fallback stack: `Geist Sans, Inter, system-ui, -apple-system, sans-serif`

| Token | Size | Line Height | Weight | Use |
|-------|------|-------------|--------|-----|
| `text-display-xl` | 48px / 3rem | 1.1 | 700 | Hero landing |
| `text-display-lg` | 36px / 2.25rem | 1.15 | 700 | Page titles |
| `text-display-md` | 30px / 1.875rem | 1.2 | 600 | Section headers |
| `text-heading-lg` | 24px / 1.5rem | 1.3 | 600 | Card titles |
| `text-heading-md` | 20px / 1.25rem | 1.4 | 600 | Subsections |
| `text-heading-sm` | 18px / 1.125rem | 1.4 | 600 | List headers |
| `text-body-lg` | 16px / 1rem | 1.6 | 400 | Primary body |
| `text-body-md` | 14px / 0.875rem | 1.5 | 400 | Secondary body |
| `text-body-sm` | 12px / 0.75rem | 1.5 | 400 | Captions, meta |
| `text-label` | 14px / 0.875rem | 1.4 | 500 | Form labels, buttons |
| `text-overline` | 11px / 0.6875rem | 1.4 | 600 | Uppercase labels, tracking-wide |

**Letter spacing:** Display sizes `-0.02em`; overline `0.08em` uppercase.

---

## Spacing

Base unit: **4px**. Use Tailwind spacing scale.

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight icon gaps |
| `space-2` | 8px | Inline elements |
| `space-3` | 12px | Form field gaps |
| `space-4` | 16px | Card inner padding (compact) |
| `space-5` | 20px | — |
| `space-6` | 24px | Card padding default |
| `space-8` | 32px | Section gaps mobile |
| `space-10` | 40px | — |
| `space-12` | 48px | Section gaps desktop |
| `space-16` | 64px | Page section breaks |

**Page padding:** Mobile `px-4` (16px); Tablet `px-6`; Desktop `px-8`.

**Section vertical rhythm:** `py-8` mobile, `py-12` desktop.

---

## Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 6px / `rounded-md` | Badges, chips |
| `radius-md` | 8px / `rounded-lg` | Inputs, small buttons |
| `radius-lg` | 12px / `rounded-xl` | Buttons, modals |
| `radius-xl` | 16px / `rounded-2xl` | Cards, event cards |
| `radius-full` | 9999px / `rounded-full` | Avatars, pills |

---

## Elevation

Dark mode uses subtle border + background lift rather than heavy shadows.

| Level | Dark Mode | Light Mode |
|-------|-----------|------------|
| `elevation-0` | bg-background | bg-background |
| `elevation-1` | bg-card + border border-border/50 | bg-white + shadow-sm |
| `elevation-2` | bg-card + border + shadow-lg shadow-black/20 | shadow-md |
| `elevation-glass` | bg-white/5 backdrop-blur-md border border-white/10 | bg-white/80 backdrop-blur-md |

Use `elevation-glass` only for: fixed navbar, bottom nav, modal overlays.

---

## Color Tokens

Implement as CSS variables in `globals.css` for `next-themes` class strategy.

### Brand

| Token | Dark | Light | Use |
|-------|------|-------|-----|
| `--brand-primary` | `#2DD4BF` (teal-400) | `#0D9488` (teal-600) | Primary actions, links |
| `--brand-secondary` | `#34D399` (emerald-400) | `#059669` (emerald-600) | Accents, success adjacent |
| `--brand-gradient-from` | `#2DD4BF` | `#0D9488` | Gradient starts |
| `--brand-gradient-to` | `#22D3EE` (cyan-400) | `#0891B2` (cyan-600) | Gradient ends |

**Brand gradient:** `bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to` — use on primary CTAs and hero accents only.

### Neutrals (Dark Default)

| Token | Dark Value | Light Value | Use |
|-------|------------|-------------|-----|
| `--background` | `#0A0A0B` | `#FAFAFA` | Page background |
| `--foreground` | `#FAFAFA` | `#0A0A0B` | Primary text |
| `--card` | `#141416` | `#FFFFFF` | Card surfaces |
| `--card-foreground` | `#FAFAFA` | `#0A0A0B` | Card text |
| `--muted` | `#27272A` | `#F4F4F5` | Muted backgrounds |
| `--muted-foreground` | `#A1A1AA` | `#71717A` | Secondary text |
| `--border` | `#27272A` | `#E4E4E7` | Borders |
| `--input` | `#27272A` | `#E4E4E7` | Input borders |
| `--ring` | `#2DD4BF` | `#0D9488` | Focus rings |

### Semantic

| Token | Dark | Light | Use |
|-------|------|-------|-----|
| `--success` | `#34D399` | `#059669` | Confirmed, joined |
| `--success-foreground` | `#052E16` | `#FFFFFF` | Text on success |
| `--warning` | `#FBBF24` | `#D97706` | Waitlist, caution |
| `--warning-foreground` | `#451A03` | `#FFFFFF` | Text on warning |
| `--destructive` | `#F87171` | `#DC2626` | Cancel, leave, delete |
| `--destructive-foreground` | `#FFFFFF` | `#FFFFFF` | Text on destructive |
| `--info` | `#60A5FA` | `#2563EB` | Informational |

### Participant Status Colors

| Status | Color Token | Badge Variant |
|--------|-------------|---------------|
| Confirmed | `--success` | `success` |
| Waitlisted | `--warning` | `warning` |
| Cancelled | `--muted-foreground` | `secondary` |
| Present | `--success` | `success` |
| Absent | `--muted-foreground` | `secondary` |
| No-show | `--destructive` | `destructive` |

---

## Dark Theme (Default)

Dark mode is the default theme on first visit. User preference persisted in localStorage via `next-themes`.

**Characteristics:**

- Near-black background (`#0A0A0B`) — not pure black for reduced eye strain
- Elevated cards slightly lighter than background
- Teal/emerald accents pop against dark neutrals
- Images and avatars get subtle `ring-1 ring-border` for definition

---

## Light Theme

Full parity with dark. Not an afterthought.

- Higher contrast body text
- Shadows replace some border-only elevation
- Brand colors deepen for contrast on white

---

## Iconography

**Library:** Lucide React

| Context | Size | Stroke |
|---------|------|--------|
| Inline with body | 16px (`h-4 w-4`) | 2 |
| Buttons | 18px (`h-[18px]`) | 2 |
| Navigation | 20px (`h-5 w-5`) | 1.75 |
| Empty states | 48px (`h-12 w-12`) | 1.5 |
| Feature icons | 24px (`h-6 w-6`) | 2 |

Icons always paired with text in buttons except icon-only with `aria-label`.

---

## Responsive Breakpoints

Tailwind defaults:

| Breakpoint | Min Width | Layout |
|------------|-----------|--------|
| `sm` | 640px | Larger phones landscape |
| `md` | 768px | Tablet; sidebar appears |
| `lg` | 1024px | Desktop dashboard |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Max content width |

**Max content width:** `max-w-2xl` (672px) for public event pages (mobile-first focus); `max-w-6xl` for dashboard.

**Touch targets:** Minimum 44×44px for all interactive elements on mobile.

---

## Motion and Animation

**Library:** Framer Motion

### Duration Tokens

| Token | Duration | Use |
|-------|----------|-----|
| `duration-fast` | 150ms | Hover, focus |
| `duration-normal` | 250ms | Modals, toasts |
| `duration-slow` | 350ms | Page transitions |
| `duration-stagger` | 50ms | List item delay increment |

### Easing

| Token | Value | Use |
|-------|-------|-----|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Enter animations |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | State changes |
| `ease-spring` | `{ type: 'spring', stiffness: 400, damping: 30 }` | Playful micro-interactions |

### Motion Hierarchy

1. **Page content** — fade + slide up 8px on mount
2. **Lists** — stagger children 50ms
3. **Cards** — subtle scale on press (`scale: 0.98`)
4. **Modals** — fade overlay + scale from 0.95
5. **Toasts** — slide from bottom (mobile) or top-right (desktop)

### Reduced Motion

Respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Framer Motion: `useReducedMotion()` hook — disable stagger and slide.

---

## Transitions

| Property | Transition |
|----------|------------|
| Background color | `transition-colors duration-fast` |
| Border color | `transition-colors duration-fast` |
| Transform | `transition-transform duration-fast` |
| Opacity | `transition-opacity duration-normal` |
| Box shadow | `transition-shadow duration-normal` |

---

## Interaction States

### Buttons

| State | Visual |
|-------|--------|
| Default | Brand gradient or solid fill |
| Hover | Brightness 110%; subtle scale 1.02 |
| Active | Scale 0.98 |
| Focus | Ring 2px `--ring` offset 2px |
| Disabled | Opacity 50%; pointer-events none |
| Loading | Spinner replaces label; width preserved |

### Inputs

| State | Visual |
|-------|--------|
| Default | border-border bg-background |
| Focus | border-ring ring-2 ring-ring/20 |
| Error | border-destructive ring-destructive/20 |
| Disabled | opacity 50% bg-muted |

### Cards

| State | Visual |
|-------|--------|
| Default | elevation-1 |
| Hover (clickable) | elevation-2; border-brand-primary/30 |
| Active | scale 0.99 |

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | 4.5:1 body text; 3:1 large text |
| Focus visible | Ring on all interactive elements |
| Keyboard nav | Tab order logical; modals trap focus |
| Screen readers | aria-label on icon buttons; live regions for toasts |
| Form labels | Explicit `<Label htmlFor>` always |
| Error association | `aria-describedby` linking to error message |
| Skip link | "Skip to main content" on dashboard |
| Language | `<html lang="en">` |

---

## Illustration Style

Empty states use:

- Lucide icon at 48px in `--muted-foreground` at 50% opacity
- Optional subtle gradient orb background (radial, brand at 10% opacity)
- No custom illustrations in MVP — icon + text sufficient
- Future: simple line-art sports illustrations

---

## Layout Patterns

### Public Event Page (Mobile)

```
┌─────────────────────────┐
│  [← Back]    [Share]    │  sticky header (glass)
├─────────────────────────┤
│  Event Title (display)  │
│  Date · Location        │
│  ● 12/16 spots filled   │
├─────────────────────────┤
│  [    Join Event    ]   │  sticky bottom CTA
├─────────────────────────┤
│  Participants (12)      │
│  ┌─ avatar name ─────┐  │
│  └─────────────────────┘  │
└─────────────────────────┘
```

### Admin Dashboard (Desktop)

```
┌──────┬──────────────────────────────┐
│ Side │  Upcoming Events             │
│ bar  │  ┌──────┐ ┌──────┐ ┌──────┐  │
│      │  │ Event│ │ Event│ │ + New│  │
│      │  └──────┘ └──────┘ └──────┘  │
└──────┴──────────────────────────────┘
```

Mobile dashboard: bottom navigation instead of sidebar.

---

## Tailwind Configuration Notes

Extend theme in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      brand: {
        primary: 'hsl(var(--brand-primary))',
        secondary: 'hsl(var(--brand-secondary))',
      },
      // ... shadcn semantic tokens
    },
    fontFamily: {
      sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
    },
    borderRadius: {
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
    },
  },
},
```

Use shadcn/ui CSS variable convention for compatibility.

---

## shadcn/ui Integration

Base components from shadcn with custom theme tokens applied via CSS variables.

**Style variant:** New York or Default — pick one at init (M0), document in repo.

Customize:

- Button: add `gradient` variant for primary CTA
- Card: default `rounded-2xl`
- Badge: status color variants

---

## Design Token Quick Reference

| Category | Primary Token |
|----------|---------------|
| Page BG | `--background` |
| Card | `--card` |
| Primary CTA | `--brand-primary` + gradient |
| Body text | `--foreground` |
| Secondary text | `--muted-foreground` |
| Border | `--border` |
| Focus | `--ring` |
| Card radius | `radius-xl` (16px) |
| Button radius | `radius-lg` (12px) |
| Page title | `text-display-md` |
| Section gap | `space-8` mobile |

Component specs: [Component Library](./11_COMPONENT_LIBRARY.md).
