# User Stories

## Related Documents

- [Product Vision](./01_PRODUCT_VISION.md)
- [Requirements](./02_REQUIREMENTS.md)
- [RBAC](./06_RBAC.md)
- [Implementation Plan](./16_IMPLEMENTATION_PLAN.md)

---

## Overview

User stories with acceptance criteria for MVP personas. Each story maps to requirements in [Requirements](./02_REQUIREMENTS.md) and milestones in [Implementation Plan](./16_IMPLEMENTATION_PLAN.md).

**Personas:**

- **Admin** — Community Admin / Sports Organizer
- **Player** — Community member who joins events
- **Guest** — Unauthenticated visitor who opens WhatsApp link

---

## Authentication

### US-AUTH-01: Sign In with Google

**As a** Player  
**I want to** sign in with my Google account  
**So that** I can join events without creating a new password

**Acceptance Criteria:**

- Login page shows "Continue with Google" button
- Successful OAuth creates session and profile
- User redirected to dashboard or original `next` URL
- Sign-in completes in under 30 seconds on mobile

**Milestone:** M3  
**Requirements:** FR-AUTH-01, FR-AUTH-04

---

### US-AUTH-02: Sign Out

**As a** Player  
**I want to** sign out  
**So that** others cannot use my account on a shared device

**Acceptance Criteria:**

- Sign out available in settings/avatar menu
- Session cleared; dashboard inaccessible after sign out
- Redirect to login page

**Milestone:** M3  
**Requirements:** FR-AUTH-02

---

## Profile

### US-PROFILE-01: Complete Profile on First Sign-In

**As a** new Player  
**I want to** set my display name  
**So that** admins and other players recognize me on participant lists

**Acceptance Criteria:**

- Profile auto-created from Google name/avatar
- Onboarding prompts to confirm/edit display name
- Display name appears on participant lists after save

**Milestone:** M4  
**Requirements:** FR-PROFILE-01, FR-PROFILE-02

---

### US-PROFILE-02: Update Profile

**As a** Player  
**I want to** update my name, avatar, and phone  
**So that** my information stays current

**Acceptance Criteria:**

- Settings page with editable fields
- Validation on name length and phone format
- Changes reflect immediately on participant lists

**Milestone:** M4  
**Requirements:** FR-PROFILE-02, FR-PROFILE-03, FR-PROFILE-04

---

## Community

### US-COMM-01: Create Community

**As an** Admin  
**I want to** create my sports community  
**So that** I can organize events for my group

**Acceptance Criteria:**

- Form: name, slug, description, activity type (badminton/pickleball)
- Slug auto-generated from name, editable
- Admin becomes community admin role
- MVP: one community per admin account

**Milestone:** M5  
**Requirements:** FR-COMMUNITY-01, FR-COMMUNITY-02

---

### US-COMM-02: Edit Community Settings

**As an** Admin  
**I want to** update community details  
**So that** information stays accurate

**Acceptance Criteria:**

- Admin can edit name, description, activity type
- Slug change optional with uniqueness validation
- Non-admins cannot access edit form

**Milestone:** M5  
**Requirements:** FR-COMMUNITY-04

---

## Events

### US-EVENT-01: Create Event

**As an** Admin  
**I want to** create an event with capacity and schedule  
**So that** I can share it with my WhatsApp group

**Acceptance Criteria:**

- Form: title, description, start/end, capacity, location, activity type
- Event saved as draft or published
- Unique share slug generated
- Copy link button available

**Milestone:** M6  
**Requirements:** FR-EVENT-01, FR-EVENT-03

---

### US-EVENT-02: Share Event on WhatsApp

**As an** Admin  
**I want to** copy a short link  
**So that** I can paste it in WhatsApp easily

**Acceptance Criteria:**

- Share URL format: `{APP_URL}/e/{share_slug}`
- Copy to clipboard with confirmation toast
- Link opens public event page on mobile

**Milestone:** M6, M7  
**Requirements:** FR-EVENT-03, FR-EVENT-07

---

### US-EVENT-03: View Public Event Page

**As a** Guest or Player  
**I want to** view event details without navigating a complex app  
**So that** I can decide whether to join

**Acceptance Criteria:**

- Page shows title, date, time, location, capacity, participant count
- Works without authentication
- Mobile-first layout; readable on 375px width
- Join button prompts sign-in if guest

**Milestone:** M7  
**Requirements:** FR-EVENT-07, FR-UI-01

---

### US-EVENT-04: Cancel Event

**As an** Admin  
**I want to** cancel an event  
**So that** members know it is no longer happening

**Acceptance Criteria:**

- Cancel changes status to cancelled
- Public page shows cancelled state
- Confirmation dialog before cancel

**Milestone:** M6  
**Requirements:** FR-EVENT-05

---

## Join and Leave

### US-JOIN-01: Join Event (FCFS)

**As a** Player  
**I want to** join an event with one tap  
**So that** I secure my spot fairly

**Acceptance Criteria:**

- Join button on event page when authenticated and community member
- First N joiners (capacity) become confirmed
- Join order preserved by timestamp
- Concurrent joins do not exceed capacity

**Milestone:** M8  
**Requirements:** FR-JOIN-01, FR-JOIN-02, FR-JOIN-06

---

### US-JOIN-02: Join When Full (Waitlist)

**As a** Player  
**I want to** automatically join the waitlist when full  
**So that** I may get a spot if someone cancels

**Acceptance Criteria:**

- When capacity reached, next joiner gets waitlisted status
- User sees waitlist position
- No error message — waitlist is expected behavior

**Milestone:** M9  
**Requirements:** FR-JOIN-03, FR-WAITLIST-01

---

### US-JOIN-03: Leave Event

**As a** Player  
**I want to** leave an event I joined  
**So that** someone else can take my spot

**Acceptance Criteria:**

- Leave button with confirmation dialog
- Participation status set to cancelled
- If confirmed, first waitlisted user promoted automatically

**Milestone:** M10  
**Requirements:** FR-JOIN-04, FR-WAITLIST-02

---

### US-JOIN-04: Sign In to Join

**As a** Guest  
**I want to** be prompted to sign in when I tap Join  
**So that** the organizer knows who I am

**Acceptance Criteria:**

- Guest sees Join button
- Tap redirects to login with return URL to event
- After sign-in, returns to event page

**Milestone:** M8  
**Requirements:** FR-JOIN-07

---

## Participants and Waitlist

### US-PART-01: View Participant List

**As a** Player  
**I want to** see who has joined  
**So that** I know who else is playing

**Acceptance Criteria:**

- Ordered list by join time
- Shows avatar and display name
- Current user highlighted with "You" badge
- Count matches confirmed participants

**Milestone:** M11  
**Requirements:** FR-PARTICIPANTS-01, FR-PARTICIPANTS-03

---

### US-PART-02: Admin Remove Participant

**As an** Admin  
**I want to** remove a participant  
**So that** I can manage no-shows or issues before the event

**Acceptance Criteria:**

- Remove action on each participant row (admin only)
- Confirmation dialog
- Triggers waitlist promotion if removed user was confirmed

**Milestone:** M11  
**Requirements:** FR-PARTICIPANTS-02, FR-WAITLIST-02

---

### US-PART-03: Admin View Waitlist

**As an** Admin  
**I want to** see the full waitlist  
**So that** I know who is waiting for spots

**Acceptance Criteria:**

- Waitlist tab on admin event view
- Ordered by position
- Shows position number and join time

**Milestone:** M9, M11  
**Requirements:** FR-WAITLIST-04

---

## Attendance

### US-ATT-01: Mark Attendance

**As an** Admin  
**I want to** mark who showed up  
**So that** I can track participation over time

**Acceptance Criteria:**

- Mark each confirmed participant: Present, Absent, No-show
- Only community admin can mark
- Status persists and displays on attendance view

**Milestone:** M12  
**Requirements:** FR-ATTENDANCE-01, FR-ATTENDANCE-02

---

### US-ATT-02: View Attendance Summary

**As an** Admin  
**I want to** see attendance summary for an event  
**So that** I know how many attended

**Acceptance Criteria:**

- Counts: present, absent, no-show, unmarked
- Summary visible on event admin page

**Milestone:** M12  
**Requirements:** FR-ATTENDANCE-03

---

## Admin Dashboard

### US-ADMIN-01: Dashboard Overview

**As an** Admin  
**I want to** see upcoming events at a glance  
**So that** I can manage my community efficiently

**Acceptance Criteria:**

- List of upcoming events with date, capacity, confirmed count
- Quick action: create new event
- Quick action: copy share link per event
- Mobile: bottom navigation; desktop: sidebar

**Milestone:** M13  
**Requirements:** FR-ADMIN-01, FR-ADMIN-02, FR-ADMIN-03

---

## UI and Experience

### US-UI-01: Dark Mode

**As a** Player  
**I want to** use dark mode by default with option for light  
**So that** the app is comfortable to use at night

**Acceptance Criteria:**

- Dark mode default on first visit
- Theme toggle in navbar/settings
- Preference persisted
- All pages work in both themes

**Milestone:** M15  
**Requirements:** FR-UI-02

---

### US-UI-02: Empty and Loading States

**As a** User  
**I want to** see helpful messages when content is loading or empty  
**So that** I understand what is happening

**Acceptance Criteria:**

- Skeleton loaders during data fetch
- Empty states with icon, title, description, optional CTA
- Error states with retry button

**Milestone:** M15  
**Requirements:** FR-UI-04

---

## RBAC

### US-RBAC-01: Unauthorized Access Blocked

**As the** system  
**I want to** enforce permissions at the database  
**So that** users cannot bypass UI restrictions

**Acceptance Criteria:**

- Member cannot create events via API or direct Supabase
- Guest cannot join events
- Admin cannot manage other communities' events
- All policies verified in test checklist

**Milestone:** M14  
**Requirements:** FR-RBAC-01, FR-RBAC-02, FR-RBAC-04

---

## Story to Milestone Map

| Story | Milestone |
|-------|-----------|
| US-AUTH-* | M3 |
| US-PROFILE-* | M4 |
| US-COMM-* | M5 |
| US-EVENT-* | M6, M7 |
| US-JOIN-01, 04 | M8 |
| US-JOIN-02, US-PART-03 | M9 |
| US-JOIN-03 | M10 |
| US-PART-* | M11 |
| US-ATT-* | M12 |
| US-ADMIN-01 | M13 |
| US-RBAC-01 | M14 |
| US-UI-* | M15 |

Infrastructure stories (M0–M2, M16–M18) covered in [Implementation Plan](./16_IMPLEMENTATION_PLAN.md).
