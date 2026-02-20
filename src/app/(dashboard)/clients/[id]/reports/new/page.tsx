'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { useOrg } from '@/lib/auth/org-context';
import { useAuth } from '@/lib/auth/context';
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { KPI, KPISnapshot, Issue, Client } from '@/lib/firebase/types';
import Header from '@/components/layout/Header';
import {
    FileText, Loader2, TrendingUp, TrendingDown, ArrowLeft, Save,
    Calendar, Edit3,
} from 'lucide-react';

export default function NewReportPage() {
    const params = useParams();
    const clientId = params.id as string;
    const router = useRouter();
    const { currentOrg } = useOrg();
    const { user } = useAuth();
    const [client, setClient] = useState<Client | null>(null);
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [snapshots, setSnapshots] = useState<KPISnapshot[]>([]);
    const [issues, setIssues] = useState<Issue[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Report form
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const [dateStart, setDateStart] = useState(weekAgo);
    const [dateEnd, setDateEnd] = useState(today);
    const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
    const [executiveSummary, setExecutiveSummary] = useState('');
    const [customProblems, setCustomProblems] = useState('');
    const [customActions, setCustomActions] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const [clientDoc, kpiSnap, snapSnap, issueSnap] = await Promise.all([
                    getDoc(doc(db, 'clients', clientId)),
                    getDocs(query(collection(db, 'kpis'), where('clientId', '==', clientId))),
                    getDocs(query(collection(db, 'kpiSnapshots'), where('clientId', '==', clientId))),
                    getDocs(query(collection(db, 'issues'), where('clientId', '==', clientId))),
                ]);
                if (clientDoc.exists()) setClient({ id: clientDoc.id, ...clientDoc.data() } as Client);
                setKpis(kpiSnap.docs.map((d) => ({ id: d.id, ...d.data() } as KPI)));
                setSnapshots(snapSnap.docs.map((d) => ({ id: d.id, ...d.data() } as KPISnapshot)));
                setIssues(issueSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Issue)));
            } catch (err) { console.error('Error:', err); }
            setLoading(false);
        };
        fetch();
    }, [clientId]);

    // Auto-generate summary when data loaded
    useEffect(() => {
        if (!kpis.length || loading) return;
        const rangeSnapshots = snapshots.filter((s) => s.date >= dateStart && s.date <= dateEnd);

        // Calculate KPI deltas
        const kpiDeltas = kpis.map((kpi) => {
            const kpiSnaps = rangeSnapshots.filter((s) => s.kpiId === kpi.id).sort((a, b) => a.date.localeCompare(b.date));
            if (kpiSnaps.length < 2) return { kpi, delta: 0, trend: 'flat' as const, latest: kpiSnaps[kpiSnaps.length - 1]?.value || 0 };
            const latest = kpiSnaps[kpiSnaps.length - 1].value;
            const earliest = kpiSnaps[0].value;
            const delta = latest - earliest;
            return { kpi, delta, trend: (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat') as 'up' | 'down' | 'flat', latest };
        });

        const upKpis = kpiDeltas.filter((d) => d.delta > 0).sort((a, b) => b.delta - a.delta);
        const downKpis = kpiDeltas.filter((d) => d.delta < 0).sort((a, b) => a.delta - b.delta);
        const openIssues = issues.filter((i) => i.status !== 'resolved');

        let summary = `Report for ${client?.name || 'Client'} covering ${dateStart} to ${dateEnd}.\n\n`;
        if (upKpis.length) summary += `📈 ${upKpis.length} KPIs improved. Top movers: ${upKpis.slice(0, 3).map((d) => `${d.kpi.name} (+${d.delta.toFixed(1)})`).join(', ')}.\n`;
        if (downKpis.length) summary += `📉 ${downKpis.length} KPIs declined. Watch: ${downKpis.slice(0, 3).map((d) => `${d.kpi.name} (${d.delta.toFixed(1)})`).join(', ')}.\n`;
        if (openIssues.length) summary += `\n⚠️ ${openIssues.length} open issue${openIssues.length > 1 ? 's' : ''} requiring attention.`;

        if (!executiveSummary) setExecutiveSummary(summary);
    }, [kpis, snapshots, issues, loading, dateStart, dateEnd]);

    const handleSave = async () => {
        if (!currentOrg || !user) return;
        setSaving(true);
        try {
            const rangeSnapshots = snapshots.filter((s) => s.date >= dateStart && s.date <= dateEnd);
            const kpiHighlights = kpis.map((kpi) => {
                const kpiSnaps = rangeSnapshots.filter((s) => s.kpiId === kpi.id).sort((a, b) => a.date.localeCompare(b.date));
                const delta = kpiSnaps.length >= 2 ? kpiSnaps[kpiSnaps.length - 1].value - kpiSnaps[0].value : 0;
                return { kpiId: kpi.id, kpiName: kpi.name, delta, trend: (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat') as 'up' | 'down' | 'flat' };
            }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

            const funnelSummary: Record<string, number> = {};
            (client?.funnelStages || []).forEach((s) => { funnelSummary[s.name] = 0; });

            const openIssues = issues.filter((i) => i.status !== 'resolved');

            const reportRef = await addDoc(collection(db, 'reports'), {
                clientId, orgId: currentOrg.id,
                title: `${reportType === 'weekly' ? 'Weekly' : 'Monthly'} Report: ${dateStart} – ${dateEnd}`,
                dateRangeStart: dateStart, dateRangeEnd: dateEnd, type: reportType,
                content: {
                    executiveSummary,
                    kpiHighlights: kpiHighlights.slice(0, 10),
                    funnelSummary,
                    problems: customProblems ? customProblems.split('\n').filter(Boolean) : openIssues.map((i) => i.title),
                    actions: customActions ? customActions.split('\n').filter(Boolean) : [],
                },
                createdBy: user.uid, createdAt: Timestamp.now(),
            });
            router.push(`/clients/${clientId}/reports/${reportRef.id}`);
        } catch (err) {
            console.error('Error saving report:', err);
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

    return (
        <>
            <Header title="Generate Report" subtitle={client?.name || ''} />
            <div className="p-8 max-w-4xl">
                <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="glass rounded-2xl p-6 space-y-6">
                    {/* Config */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Type</label>
                            <select value={reportType} onChange={(e) => setReportType(e.target.value as any)}
                                className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all">
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                            <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">End Date</label>
                            <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        </div>
                    </div>

                    {/* Executive Summary */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                            <Edit3 className="w-4 h-4 text-indigo-400" /> Executive Summary
                        </label>
                        <textarea value={executiveSummary} onChange={(e) => setExecutiveSummary(e.target.value)} rows={6}
                            className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                    </div>

                    {/* KPI Highlights Preview */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-3">KPI Highlights (auto-calculated)</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {kpis.slice(0, 6).map((kpi) => {
                                const kpiSnaps = snapshots.filter((s) => s.kpiId === kpi.id && s.date >= dateStart && s.date <= dateEnd);
                                const delta = kpiSnaps.length >= 2 ? kpiSnaps[kpiSnaps.length - 1].value - kpiSnaps[0].value : 0;
                                return (
                                    <div key={kpi.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-800/50">
                                        {delta > 0 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
                                            delta < 0 ? <TrendingDown className="w-4 h-4 text-red-400" /> :
                                                <span className="w-4 h-4 text-gray-500">—</span>}
                                        <span className="text-xs text-gray-300 flex-1">{kpi.name}</span>
                                        <span className={`text-xs font-medium ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Problems & Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Key Problems (one per line)</label>
                            <textarea value={customProblems} onChange={(e) => setCustomProblems(e.target.value)} rows={4}
                                placeholder="Auto-populated from open issues if left blank"
                                className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Recommended Actions (one per line)</label>
                            <textarea value={customActions} onChange={(e) => setCustomActions(e.target.value)} rows={4}
                                placeholder="Your recommended next steps..."
                                className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-60 transition-all">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save & View Report
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
