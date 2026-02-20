# PulseBoard – Technical Design Document

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    Client (Browser)                   │
│     Next.js 14 App Router + React + Tailwind CSS     │
│     Firebase Client SDK (Auth, Firestore, Storage)    │
└────────────────────────┬─────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼─────────────────────────────┐
│              Firebase App Hosting (Cloud Run)          │
│     Next.js SSR + API Routes + Server Actions         │
│     Firebase Admin SDK (service account)               │
└────────────────────────┬─────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌────────┐      ┌──────────────┐      ┌──────────┐
│Firebase │      │   Firestore   │      │  Cloud    │
│  Auth   │      │  (Database)   │      │ Storage   │
└────────┘      └──────────────┘      └──────────┘
```

### Stack Decisions

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) | SSR + API routes, excellent DX, Firebase App Hosting native support |
| UI | React 18 + Tailwind CSS | Requested by user, rapid styling, responsive |
| Auth | Firebase Authentication | Native integration with Firebase ecosystem, email/password for MVP |
| Database | Cloud Firestore | Serverless, real-time capable, scales with Firebase App Hosting |
| Storage | Cloud Storage for Firebase | File uploads (CSV, deliverables) |
| Charts | Recharts | Stable, React-native charting library |
| Hosting | Firebase App Hosting | Auto-deploy from GitHub, SSR support via Cloud Run |
| CI/CD | GitHub → Firebase App Hosting | Automatic builds on push to main branch |

> **Note:** The user's original spec mentioned Prisma + SQLite. We use Firestore instead because the explicit requirement is Firebase App Hosting with Firebase services. Firestore provides the same structured data capabilities with zero infrastructure management.

## Data Model (Firestore Collections)

### Collection: `organizations`
```typescript
interface Organization {
  id: string;                    // auto-generated
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
// Sub-collection: organizations/{orgId}/members
interface OrgMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'owner' | 'consultant' | 'viewer';
  joinedAt: Timestamp;
}
```

### Collection: `clients` (top-level, indexed by orgId)
```typescript
interface Client {
  id: string;
  orgId: string;                  // reference to organization
  name: string;
  industry: string;
  businessModel: 'service' | 'education' | 'ecom' | 'investment';
  timezone: string;
  reportingCadence: 'weekly' | 'biweekly' | 'monthly';
  funnelStages: FunnelStage[];    // ordered array
  leadStatuses: LeadStatus[];     // ordered array
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FunnelStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

interface LeadStatus {
  id: string;
  name: string;
  category: 'active' | 'closed' | 'neutral';
  order: number;
}
```

### Collection: `kpis` (top-level, indexed by clientId)
```typescript
interface KPI {
  id: string;
  clientId: string;
  orgId: string;
  name: string;
  description: string;
  formula: string;
  unit: string;                   // %, $, #, etc.
  targetMonthly: number;
  owner: string;
  dataSource: 'manual' | 'csv' | 'google_sheets';
  updateFrequency: 'daily' | 'weekly' | 'monthly';
  trustScore: 'green' | 'yellow' | 'red';
  trustReason: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Collection: `kpiSnapshots` (top-level, indexed by kpiId + date)
```typescript
interface KPISnapshot {
  id: string;
  kpiId: string;
  clientId: string;
  orgId: string;
  date: string;                   // YYYY-MM-DD
  value: number;
  notes: string;
  source: 'manual' | 'csv';
  createdAt: Timestamp;
}
```

### Collection: `issues` (Accountability Board)
```typescript
interface Issue {
  id: string;
  clientId: string;
  orgId: string;
  title: string;
  description: string;
  linkedKpiIds: string[];
  hypothesis: string;
  status: 'open' | 'decided' | 'in_progress' | 'resolved';
  decision: string;
  result: string;
  resultKpiSnapshotId: string;    // optional link
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
// Sub-collection: issues/{issueId}/actions
interface Action {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'done';
  notes: string;
  createdAt: Timestamp;
}
```

### Collection: `reports`
```typescript
interface Report {
  id: string;
  clientId: string;
  orgId: string;
  title: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  type: 'weekly' | 'monthly';
  content: {
    executiveSummary: string;
    kpiHighlights: { kpiId: string; delta: number; trend: 'up' | 'down' | 'flat' }[];
    funnelSummary: Record<string, number>;
    problems: string[];
    actions: string[];
  };
  createdBy: string;
  createdAt: Timestamp;
}
```

### Collection: `agencies`
```typescript
interface Agency {
  id: string;
  clientId: string;
  orgId: string;
  name: string;
  contactName: string;
  contactEmail: string;
  scores: {
    reportingQuality: number;     // 1-5
    testingDiscipline: number;
    creativeQuality: number;
    responsiveness: number;
  };
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
// Sub-collection: agencies/{agencyId}/deliverables
interface Deliverable {
  id: string;
  name: string;
  dueDate: string;
  receivedDate: string | null;
  link: string;
  status: 'pending' | 'received' | 'late';
  createdAt: Timestamp;
}
```

## Routes / Pages

| Route | Purpose | Auth Required |
|-------|---------|--------------|
| `/` | Landing → redirect to `/dashboard` if logged in | No |
| `/login` | Sign in page | No |
| `/signup` | Sign up page | No |
| `/dashboard` | Organization overview: list of clients | Yes |
| `/clients/new` | Client setup wizard (multi-step) | Yes (Consultant+) |
| `/clients/[id]` | Client overview dashboard | Yes |
| `/clients/[id]/kpis` | KPI Dictionary | Yes |
| `/clients/[id]/kpis/[kpiId]` | KPI detail (chart + notes) | Yes |
| `/clients/[id]/data-entry` | Manual entry + CSV import | Yes (Consultant+) |
| `/clients/[id]/accountability` | Issue → Decision → Action → Result board | Yes |
| `/clients/[id]/reports` | List saved reports | Yes |
| `/clients/[id]/reports/new` | Generate new report | Yes (Consultant+) |
| `/clients/[id]/reports/[reportId]` | View/print report | Yes |
| `/clients/[id]/agencies` | Agency scorecards | Yes |
| `/settings` | Org settings, members, roles | Yes (Owner) |

## Security Model

### Firestore Rules
- All reads/writes require `request.auth != null`
- Organization-level isolation: users can only access data where they are a member
- Role-based writes: Viewers cannot create/update/delete
- Server-side validation via Firebase Admin SDK in API routes

### Auth Flow
1. User signs up with email/password → Firebase Auth creates user
2. On first login, user creates or joins an Organization
3. JWT token passed to server; Admin SDK verifies token + checks org membership
4. Client-side: `onAuthStateChanged` listener manages session

## Future Integrations (Post-MVP)
- Google Sheets API for KPI data pull
- Meta Ads API for ad spend / CPL metrics
- Google Ads API for campaign data
- Slack/email alerts for metric thresholds
- OAuth/SSO for enterprise clients
