# PulseBoard – Task Plan & Milestones

## Milestone 1: Project Scaffold + Auth + Orgs + Base Layout
**Acceptance:** User can sign up, sign in, create an org, see the main dashboard layout with sidebar nav.

- [ ] Initialize Next.js 14 project with TypeScript + Tailwind CSS
- [ ] Set up Firebase config (client SDK + Admin SDK with service account)
- [ ] Create GitHub repository and connect to Firebase App Hosting
- [ ] Set up Firestore database + security rules
- [ ] Implement Firebase Auth (email/password sign-up / sign-in)
- [ ] Create Organization CRUD + member management
- [ ] Build base layout: sidebar navigation + header + responsive shell
- [ ] Role-based access control middleware
- [ ] Auth-protected routes

## Milestone 2: Client Setup Wizard + Funnel Stages + Lead Statuses
**Acceptance:** User can create a client via multi-step wizard with funnel stages and lead statuses.

- [ ] Multi-step client creation wizard UI
- [ ] Business model, industry, timezone, cadence selection
- [ ] Funnel stages configuration (add/remove/reorder)
- [ ] Lead statuses configuration (defaults + editable)
- [ ] Client list on dashboard
- [ ] Client overview page (empty state)

## Milestone 3: KPI Dictionary + KPI Snapshots (Manual Entry)
**Acceptance:** User can CRUD KPIs, set trust scores, manually enter snapshot data.

- [ ] KPI Dictionary page with table view
- [ ] Add/Edit KPI form (all fields)
- [ ] Trust Score indicator (Green/Yellow/Red + reason)
- [ ] Manual KPI snapshot entry form
- [ ] Snapshot storage with date indexing
- [ ] KPI detail page with notes log

## Milestone 4: Dashboard (Overview + KPI Detail with Charts)
**Acceptance:** Client overview shows KPI tiles with trend arrows, funnel counts; KPI detail has line chart.

- [ ] KPI tiles: current value vs target, trend arrow, trust badge
- [ ] Funnel stage counts for current period
- [ ] Lead status distribution
- [ ] KPI detail page: Recharts line chart over time
- [ ] Date range selector for dashboard

## Milestone 5: CSV Import for KPI Snapshots
**Acceptance:** User can upload a CSV file and bulk-import KPI snapshots with validation.

- [ ] CSV upload UI with drag-and-drop
- [ ] CSV parsing and column mapping
- [ ] Validation (required fields, number format, date format)
- [ ] Preview before import
- [ ] Batch write to Firestore

## Milestone 6: Accountability Board
**Acceptance:** Full Issue → Decision → Action → Result lifecycle working.

- [ ] Issue list view with status filters
- [ ] Create Issue form (linked to client + KPIs)
- [ ] Hypothesis & Decision fields
- [ ] Action items with owner, due date, status
- [ ] Result entry with KPI snapshot link
- [ ] Status progression workflow

## Milestone 7: Report Generator + Saved Reports + Print-to-PDF
**Acceptance:** User can generate, save, view, and print weekly reports.

- [ ] Report generation page with date range picker
- [ ] Auto-populated executive summary from KPI deltas
- [ ] KPI highlights (top 5 up/down)
- [ ] Funnel summary section
- [ ] Problems & recommended actions from issues
- [ ] Editable narrative fields
- [ ] Save report to Firestore
- [ ] Report view page with print-to-PDF styling
- [ ] Saved reports list

## Milestone 8: Agency Scorecards + Deliverables Tracking
**Acceptance:** User can add agencies, track deliverables, and rate agency performance.

- [ ] Agency CRUD per client
- [ ] Deliverables tracking (name, due/received date, status)
- [ ] Score fields (1-5): Reporting, Testing, Creative, Responsiveness
- [ ] Notes field
- [ ] Agency list view with score summary

## Milestone 9: Polish + Tests + README Demo Script
**Acceptance:** Build passes, tests pass, demo script in README, seed data works.

- [ ] Seed data script for demo
- [ ] Unit tests for critical utilities
- [ ] Integration tests for auth and data flows
- [ ] Error handling and loading states polish
- [ ] Accessibility audit (labels, keyboard nav)
- [ ] README with setup instructions, env variables, demo script
- [ ] Final build verification
