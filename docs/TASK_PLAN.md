# PulseBoard – Task Plan & Milestones

## Milestone 1: Project Scaffold + Auth + Orgs + Base Layout ✅
**Acceptance:** User can sign up, sign in, create an org, see the main dashboard layout with sidebar nav.

- [x] Initialize Next.js 16 project with TypeScript + Tailwind CSS
- [x] Set up Firebase config (client SDK + Admin SDK with service account)
- [x] Create GitHub repository and connect to Firebase App Hosting
- [x] Set up Firestore database + security rules
- [x] Implement Firebase Auth (email/password sign-up / sign-in)
- [x] Create Organization CRUD + member management
- [x] Build base layout: sidebar navigation + header + responsive shell
- [ ] Role-based access control middleware (deferred to M9)
- [x] Auth-protected routes

## Milestone 2: Client Setup Wizard + Funnel Stages + Lead Statuses ✅
**Acceptance:** User can create a client via multi-step wizard with funnel stages and lead statuses.

- [x] Multi-step client creation wizard UI
- [x] Business model, industry, timezone, cadence selection
- [x] Funnel stages configuration (add/remove/reorder)
- [x] Lead statuses configuration (defaults + editable)
- [x] Client list on dashboard
- [x] Client overview page (empty state)

## Milestone 3: KPI Dictionary + KPI Snapshots (Manual Entry) ✅
**Acceptance:** User can CRUD KPIs, set trust scores, manually enter snapshot data.

- [x] KPI Dictionary page with table view
- [x] Add/Edit KPI form (all fields)
- [x] Trust Score indicator (Green/Yellow/Red + reason)
- [x] Manual KPI snapshot entry form
- [x] Snapshot storage with date indexing
- [x] KPI detail page with notes log

## Milestone 4: Dashboard (Overview + KPI Detail with Charts) ✅
**Acceptance:** Client overview shows KPI tiles with trend arrows, funnel counts; KPI detail has line chart.

- [x] KPI tiles: current value vs target, trend arrow, trust badge
- [x] Funnel stage counts for current period
- [x] Lead status distribution
- [x] KPI detail page: Recharts line chart over time
- [ ] Date range selector for dashboard (deferred to M9)

## Milestone 5: CSV Import for KPI Snapshots ✅
**Acceptance:** User can upload a CSV file and bulk-import KPI snapshots with validation.

- [x] CSV upload UI with drag-and-drop
- [x] CSV parsing and column mapping
- [x] Validation (required fields, number format, date format)
- [x] Preview before import
- [x] Batch write to Firestore

## Milestone 6: Accountability Board ✅
**Acceptance:** Full Issue → Decision → Action → Result lifecycle working.

- [x] Issue list view with status filters
- [x] Create Issue form (linked to client + KPIs)
- [x] Hypothesis & Decision fields
- [x] Action items with owner, due date, status
- [x] Result entry with KPI snapshot link
- [x] Status progression workflow

## Milestone 7: Report Generator + Saved Reports + Print-to-PDF ✅
**Acceptance:** User can generate, save, view, and print weekly reports.

- [x] Report generation page with date range picker
- [x] Auto-populated executive summary from KPI deltas
- [x] KPI highlights (top movers up/down)
- [x] Funnel summary section
- [x] Problems & recommended actions from issues
- [x] Editable narrative fields
- [x] Save report to Firestore
- [x] Report view page with print-to-PDF styling
- [x] Saved reports list

## Milestone 8: Agency Scorecards + Deliverables Tracking ✅
**Acceptance:** User can add agencies, track deliverables, and rate agency performance.

- [x] Agency CRUD per client
- [x] Deliverables tracking (name, due/received date, status)
- [x] Score fields (1-5): Reporting, Testing, Creative, Responsiveness
- [x] Notes field
- [x] Agency list view with score summary

## Milestone 9: Polish + Tests + Deploy 🔲 NOT STARTED
**Acceptance:** Build passes, tests pass, demo script in README, seed data works.

- [ ] Seed data script for demo
- [ ] Unit tests for critical utilities
- [ ] Integration tests for auth and data flows
- [ ] Error handling and loading states polish
- [ ] Accessibility audit (labels, keyboard nav)
- [ ] Role-based access control enforcement
- [ ] Date range selector for dashboard
- [ ] Drag-to-reorder funnel stages
- [ ] Deploy Firestore rules
- [ ] Enable email/password auth in Firebase Console
- [ ] Connect GitHub repo to Firebase App Hosting
- [ ] Final build verification + production deploy
