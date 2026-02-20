# PulseBoard — Project Status & Build History

> **Last Updated:** 2026-02-20  
> **Build Status:** ✅ Passing (0 TypeScript errors, 16 routes)  
> **GitHub:** [fnasr-source/PulseBoard](https://github.com/fnasr-source/PulseBoard)

---

## What Has Been Built

### Milestone 1: Scaffold + Auth + Orgs + Layout ✅
- Next.js 16 project with TypeScript, Tailwind CSS 4, App Router, `src/` directory
- Firebase client SDK configured (`src/lib/firebase/config.ts`) with env vars
- Firebase Admin SDK configured (`src/lib/firebase/admin.ts`) auto-detects service account JSON
- 12 Firestore data model interfaces defined in `src/lib/firebase/types.ts`
- Auth context provider (`src/lib/auth/context.tsx`): sign-in, sign-up, sign-out, auth state listener
- Org context provider (`src/lib/auth/org-context.tsx`): org CRUD, current org selection, member roles
- Login & Signup pages with form validation and error display
- Dashboard layout with collapsible sidebar, org selector, client nav, user profile
- Dashboard page with org onboarding flow and client grid
- Settings page for org info and team member management
- Landing page with auth redirect logic

### Milestone 2: Client Setup Wizard ✅
- 4-step wizard: Client Info → Funnel Stages → Lead Statuses → Review
- Industry selector (10 industries), business model selector (4 types)
- Timezone and reporting cadence configuration
- Default funnel stages (5) and lead statuses (11) pre-filled with color coding
- Add/remove stages with color picker, add/remove statuses with category selector

### Milestone 3: KPI Dictionary ✅
- Full CRUD with inline form for KPI creation/editing
- Search by name or description
- Trust score filter (Green/Yellow/Red)
- Table view with all KPI fields
- KPI detail page with:
  - Stats row (current value, target, trust score, snapshot count)
  - Recharts line chart with target reference line
  - Snapshot entry form (date, value, notes)
  - Reverse-chronological snapshots log

### Milestone 4: Data Entry (Manual + CSV) ✅
- Tab-based UI: Manual Entry | CSV Import
- Manual: select KPI, enter date/value/notes, success confirmation
- CSV Import:
  - Drag-and-drop file upload
  - Auto-detect column mapping (date, kpi, value, notes)
  - Preview table (first 5 rows)
  - Validation with error display
  - Batch import to Firestore

### Milestone 5: Accountability Board ✅
- Issue → Decision → Action → Result lifecycle
- Issue list with status filters (All, Open, Decided, In Progress, Resolved)
- Create issue form with title, description, hypothesis, KPI linking
- Expandable issue cards showing:
  - Hypothesis section
  - Decision entry (inline edit → save)
  - Action items (add, toggle status: pending → in_progress → done)
  - Result entry (inline edit → resolve)

### Milestone 6: Reports ✅
- Reports list page with date range display
- Report generator:
  - Date range picker + type selector (weekly/monthly)
  - Auto-generated executive summary from KPI deltas
  - KPI highlights grid (up/down/flat indicators)
  - Editable problems & recommended actions
  - Save to Firestore
- Report viewer with PulseBoard branding and Print-to-PDF button

### Milestone 7: Agency Scorecards ✅
- Agency CRUD with contact info
- 1-5 star ratings for 4 categories (Reporting, Testing, Creative, Responsiveness)
- Average score display on agency cards
- Expandable agency details with:
  - Score breakdown
  - Deliverable tracking (add, mark received)
  - Due date management
  - Notes

---

## Infrastructure Status

| Item | Status | Details |
|------|--------|---------|
| Firebase Project | ✅ | `pulseboard-ab03b` |
| Firebase Web App | ✅ | `pulseboard-web` (appId: `1:866619529458:web:cb48adccdc35c7f2b5586b`) |
| Firestore DB | ✅ | Native mode, `nam5` region |
| Firestore API | ✅ | Enabled |
| Identity Toolkit API | ✅ | Enabled |
| Storage API | ✅ | Enabled |
| Firebase Storage API | ✅ | Enabled |
| Email/Password Auth | ⚠️ | API enabled but sign-in method needs manual Console enable |
| Firebase App Hosting | ⚠️ | `apphosting.yaml` ready, needs GitHub connection in Console |
| Firestore Rules | ⚠️ | `firestore.rules` written, needs deploy: `npx firebase-tools deploy --only firestore:rules` |

---

## Key Decisions Made

1. **Firebase over Prisma/SQLite** — Original spec mentioned Prisma + SQLite. Changed to Firestore because the deployment target is Firebase App Hosting, and Firestore provides serverless scaling with zero infra management.

2. **Top-level Firestore collections** — Instead of Firestore sub-collections, all collections are top-level (`clients`, `kpis`, `issues`, etc.) with `orgId`/`clientId` fields for cross-query flexibility.

3. **Client-side Firebase SDK** — Dashboard pages use `'use client'` directives with Firebase Client SDK. This was chosen for real-time capability and simpler auth state management via `onAuthStateChanged`.

4. **React Context for state** — Auth and Org state managed via React Context API (no Redux/Zustand). Sufficient for the MVP scope.

5. **PapaParse for CSV** — Client-side CSV parsing with PapaParse library. Column mapping is done via UI dropdowns with auto-detection.

6. **Recharts for charts** — Stable, React-native charting. Used for KPI trend line charts with target reference lines.

---

## What's NOT Done Yet (Milestone 9: Polish)

- [ ] Seed data script for demo
- [ ] Unit tests for critical utilities
- [ ] Integration tests for auth and data flows
- [ ] Error boundary components
- [ ] Accessibility audit (labels, keyboard nav, screen readers)
- [ ] Role-based access enforcement (currently all authenticated users can CRUD)
- [ ] Drag-to-reorder for funnel stages / lead statuses
- [ ] Google Sheets data source integration
- [ ] Scheduled report email delivery
- [ ] Agency file upload storage

---

## Environment Variables

Already configured in `.env.local` (not committed to git):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCwCEwo0yVIAFE55fAeOZN0Bw3ZcLBEgHI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pulseboard-ab03b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pulseboard-ab03b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pulseboard-ab03b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=866619529458
NEXT_PUBLIC_FIREBASE_APP_ID=1:866619529458:web:cb48adccdc35c7f2b5586b
```

For Firebase Admin SDK, place the service account JSON at the project root (pattern: `*-firebase-adminsdk-*.json`). It is auto-detected by `src/lib/firebase/admin.ts`.
