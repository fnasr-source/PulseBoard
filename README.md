# PulseBoard

**Consultant Control Room** — A unified dashboard for managing multiple clients, tracking KPIs, running accountability boards, generating reports, and scoring agencies.

**Live Repo:** [fnasr-source/PulseBoard](https://github.com/fnasr-source/PulseBoard)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | React 19 + Tailwind CSS 4 |
| Auth | Firebase Authentication (Email/Password) |
| Database | Cloud Firestore |
| Storage | Cloud Storage for Firebase |
| Charts | Recharts |
| Hosting | Firebase App Hosting (Cloud Run) |
| Icons | Lucide React |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login + Signup pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/         # Auth-protected dashboard
│   │   ├── dashboard/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── clients/
│   │   │   ├── new/page.tsx           # Client setup wizard
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # Client overview
│   │   │       ├── kpis/page.tsx      # KPI Dictionary
│   │   │       ├── kpis/[kpiId]/page.tsx  # KPI detail + chart
│   │   │       ├── data-entry/page.tsx    # Manual + CSV import
│   │   │       ├── accountability/page.tsx # Issue board
│   │   │       ├── reports/page.tsx       # Reports list
│   │   │       ├── reports/new/page.tsx   # Report generator
│   │   │       ├── reports/[reportId]/page.tsx  # Report viewer
│   │   │       └── agencies/page.tsx      # Agency scorecards
│   │   └── layout.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Landing page
├── components/
│   └── layout/
│       ├── Sidebar.tsx      # Dashboard sidebar with org selector + nav
│       └── Header.tsx       # Dashboard header with search
└── lib/
    ├── auth/
    │   ├── context.tsx      # Firebase Auth provider
    │   └── org-context.tsx  # Organization provider
    └── firebase/
        ├── config.ts        # Client SDK init
        ├── admin.ts         # Admin SDK init
        └── types.ts         # All Firestore interfaces
```

## Setup

### Prerequisites
- Node.js 20+
- Firebase project (`pulseboard-ab03b`)

### Local Development

```bash
# 1. Clone
git clone https://github.com/fnasr-source/PulseBoard.git
cd PulseBoard

# 2. Install
npm install

# 3. Environment variables
cp .env.local.example .env.local
# Fill in your Firebase config (see below)

# 4. Run
npm run dev
# → http://localhost:3000
```

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCwCEwo0yVIAFE55fAeOZN0Bw3ZcLBEgHI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=pulseboard-ab03b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=pulseboard-ab03b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=pulseboard-ab03b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=866619529458
NEXT_PUBLIC_FIREBASE_APP_ID=1:866619529458:web:cb48adccdc35c7f2b5586b
```

### Firebase Admin SDK
Place the service account JSON file at the project root. The Admin SDK (`src/lib/firebase/admin.ts`) auto-detects it by matching `*-firebase-adminsdk-*.json`.

---

## Firebase Project Setup

**Project ID:** `pulseboard-ab03b`

### What's Already Done ✅
- Firebase web app registered (`pulseboard-web`)
- Firestore database created (Native mode, `nam5` region)
- Firebase APIs enabled: Firestore, Identity Toolkit, Storage, Firebase Storage
- `apphosting.yaml` configured with env vars
- `firestore.rules` with auth-required rules
- `.env.local` with real credentials

### What You Need to Do Manually ⚠️

1. **Enable Email/Password Auth:**
   - Firebase Console → Authentication → Sign-in method → Email/Password → Enable

2. **Connect GitHub to Firebase App Hosting:**
   - Firebase Console → App Hosting → Get started
   - Connect your GitHub repo → Select `main` branch
   - The `apphosting.yaml` in this repo auto-configures the deployment

3. **Deploy Firestore Rules:**
   ```bash
   npx firebase-tools deploy --only firestore:rules --project pulseboard-ab03b
   ```

---

## Current Status

**MVP Milestones 1–8: ✅ COMPLETE**

All core features are implemented and the build passes with 0 TypeScript errors across 16 routes:

| Milestone | Feature | Status |
|-----------|---------|--------|
| M1 | Auth + Orgs + Layout | ✅ Done |
| M2 | Client Setup Wizard | ✅ Done |
| M3 | KPI Dictionary + Detail | ✅ Done |
| M4 | Dashboard + Charts | ✅ Done |
| M5 | CSV Import | ✅ Done |
| M6 | Accountability Board | ✅ Done |
| M7 | Reports | ✅ Done |
| M8 | Agency Scorecards | ✅ Done |
| M9 | Polish + Tests | 🔲 Not started |

### Next Steps (Milestone 9 — Polish)

- [ ] Seed data script for demo
- [ ] Error handling and loading states polish
- [ ] Unit/integration tests
- [ ] Accessibility audit
- [ ] Final production build and deploy via Firebase App Hosting

---

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| PRD | [`docs/PRD.md`](docs/PRD.md) | Product requirements, personas, user journeys, MVP scope |
| Tech Design | [`docs/TECH_DESIGN.md`](docs/TECH_DESIGN.md) | Architecture, data model, routes, security model |
| Task Plan | [`docs/TASK_PLAN.md`](docs/TASK_PLAN.md) | Milestone breakdown with acceptance criteria |
| Status | [`docs/STATUS.md`](docs/STATUS.md) | Full build history, decisions made, and current state |

---

## Key Design Decisions

1. **Firebase over Prisma/SQLite** — Chose Firestore for zero-infra serverless DB that integrates natively with Firebase Auth and App Hosting
2. **Top-level collections** — All Firestore collections (clients, kpis, issues, etc.) are top-level with `orgId`/`clientId` indexes for query flexibility
3. **Client-side rendering** — Dashboard uses `'use client'` components with Firebase Client SDK for real-time data
4. **Dark mode by default** — Premium glassmorphism design with indigo/purple accent palette
5. **CSV import with PapaParse** — Client-side parsing with column mapping UI and validation preview

## Dependencies

```
firebase          # Client SDK (Auth, Firestore, Storage)
firebase-admin    # Server-side Admin SDK
recharts          # Line charts for KPI trends
papaparse         # CSV parsing
uuid              # ID generation for funnel stages / lead statuses
date-fns          # Date utilities
lucide-react      # Icons
```
