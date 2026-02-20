import { Timestamp } from 'firebase/firestore';

// ============ Organization ============
export interface Organization {
    id: string;
    name: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface OrgMember {
    id: string;
    userId: string;
    email: string;
    displayName: string;
    role: 'owner' | 'consultant' | 'viewer';
    joinedAt: Timestamp;
}

export type UserRole = 'owner' | 'consultant' | 'viewer';

// ============ Client ============
export interface Client {
    id: string;
    orgId: string;
    name: string;
    industry: string;
    businessModel: 'service' | 'education' | 'ecom' | 'investment';
    timezone: string;
    reportingCadence: 'weekly' | 'biweekly' | 'monthly';
    funnelStages: FunnelStage[];
    leadStatuses: LeadStatus[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface FunnelStage {
    id: string;
    name: string;
    order: number;
    color: string;
}

export interface LeadStatus {
    id: string;
    name: string;
    category: 'active' | 'closed' | 'neutral';
    order: number;
}

// ============ KPI ============
export interface KPI {
    id: string;
    clientId: string;
    orgId: string;
    name: string;
    description: string;
    formula: string;
    unit: string;
    targetMonthly: number;
    owner: string;
    dataSource: 'manual' | 'csv' | 'google_sheets';
    updateFrequency: 'daily' | 'weekly' | 'monthly';
    trustScore: 'green' | 'yellow' | 'red';
    trustReason: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface KPISnapshot {
    id: string;
    kpiId: string;
    clientId: string;
    orgId: string;
    date: string;
    value: number;
    notes: string;
    source: 'manual' | 'csv';
    createdAt: Timestamp;
}

// ============ Accountability Board ============
export interface Issue {
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
    resultKpiSnapshotId: string;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Action {
    id: string;
    issueId: string;
    title: string;
    owner: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'done';
    notes: string;
    createdAt: Timestamp;
}

// ============ Reports ============
export interface Report {
    id: string;
    clientId: string;
    orgId: string;
    title: string;
    dateRangeStart: string;
    dateRangeEnd: string;
    type: 'weekly' | 'monthly';
    content: {
        executiveSummary: string;
        kpiHighlights: { kpiId: string; kpiName: string; delta: number; trend: 'up' | 'down' | 'flat' }[];
        funnelSummary: Record<string, number>;
        problems: string[];
        actions: string[];
    };
    createdBy: string;
    createdAt: Timestamp;
}

// ============ Agency ============
export interface Agency {
    id: string;
    clientId: string;
    orgId: string;
    name: string;
    contactName: string;
    contactEmail: string;
    scores: {
        reportingQuality: number;
        testingDiscipline: number;
        creativeQuality: number;
        responsiveness: number;
    };
    notes: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Deliverable {
    id: string;
    agencyId: string;
    name: string;
    dueDate: string;
    receivedDate: string | null;
    link: string;
    status: 'pending' | 'received' | 'late';
    createdAt: Timestamp;
}
