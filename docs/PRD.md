# PulseBoard – Product Requirements Document

## Problem Statement

Strategic marketing consultants managing multiple clients, funnels, agencies, and KPIs lack a unified "mission control" tool. Data lives in scattered spreadsheets, siloed platform dashboards, and email threads. This causes:

- **No single source of truth** for KPI definitions, targets, and trust.
- **Slow onboarding** of new clients — consultants re-invent templates each time.
- **Poor accountability** — issues, decisions, actions, and results are tracked ad-hoc.
- **Difficult reporting** — weekly/monthly reports require hours of manual assembly.
- **Agency oversight gaps** — deliverables and performance notes are unstructured.

## Personas

| Persona | Role | Access Level |
|---------|------|-------------|
| **Strategic Marketing Consultant** (Primary) | Owner of the consulting practice; manages multiple client accounts end-to-end | Owner / Consultant — full CRUD everywhere |
| **Client Stakeholder** (Secondary) | Marketing VP, CEO, or project lead on client side | Viewer — read-only dashboards and reports |
| **Agency User** (Tertiary) | Media buyer, creative agency PM | Limited — upload deliverables and notes only |

## User Journeys (MVP)

### J1: Onboard a New Client
1. Sign in → select Organization → "Add Client"
2. Fill wizard: name, industry, business model, timezone, reporting cadence
3. Configure funnel stages (drag-to-reorder)
4. Configure lead statuses (defaults provided, editable)
5. Land on empty Client Overview dashboard

### J2: Build KPI Dictionary
1. Open client → KPI Dictionary tab → "Add KPI"
2. Enter: name, description, formula, unit, target, owner, data source, frequency
3. Set Trust Score (Green/Yellow/Red) + reason
4. View sortable/filterable KPI table

### J3: Enter Data & View Trends
1. Manual entry form per KPI or CSV bulk import
2. View KPI dashboard tiles: current vs target, trend arrows
3. Drill into KPI detail: line chart over time + notes log

### J4: Track Issues → Actions → Results
1. Create Issue linked to client + optional KPI(s)
2. Add hypothesis, decision, action items (owner, due date)
3. Mark actions complete, add result + link to KPI snapshot

### J5: Generate Weekly Report
1. Select client + date range → "Generate Report"
2. Auto-filled executive summary, KPI highlights, funnel summary, problems & actions
3. Edit narrative → Save → Print to PDF

### J6: Score an Agency
1. Add Agency to client → track deliverables (name, due/received date)
2. Rate: reporting quality, testing discipline, creative quality, responsiveness (1–5)
3. Add notes

## MVP Scope

| Module | In Scope | Out of Scope |
|--------|----------|-------------|
| Auth & Orgs | Email/password sign-up, multi-tenant orgs, roles (Owner/Consultant/Viewer) | SSO, OAuth providers |
| Client Setup | Wizard with business model, funnel stages, lead statuses | Automated data-source connection |
| KPI Dictionary | Full CRUD, trust score, manual data source | Calculated real-time KPIs, API integrations |
| Data Entry | Manual form, CSV import, date-stamped snapshots | Google Sheets sync, API pull |
| Dashboards | Overview tiles, funnel counts, KPI detail with line chart | Real-time streaming, complex drill-downs |
| Accountability Board | Issue → Decision → Action → Result lifecycle | Kanban drag-and-drop, Gantt |
| Reports | Weekly report generator, print-to-PDF, stored reports | Scheduled email delivery, custom templates |
| Agency Scorecards | Deliverables tracking, 1–5 scores, notes | File upload storage, agency portal |

## Success Metrics

1. Consultant can onboard a new client in < 5 minutes
2. Weekly report generation takes < 2 minutes (vs 2+ hours manual)
3. All KPI data has a single, auditable source of truth
4. Zero critical console errors in production build
