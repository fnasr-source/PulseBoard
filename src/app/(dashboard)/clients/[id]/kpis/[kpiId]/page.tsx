'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { KPI, KPISnapshot } from '@/lib/firebase/types';
import { useOrg } from '@/lib/auth/org-context';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowLeft, Plus, Loader2, TrendingUp, TrendingDown, Target, Calendar, Clock } from 'lucide-react';

export default function KPIDetailPage() {
    const params = useParams();
    const clientId = params.id as string;
    const kpiId = params.kpiId as string;
    const { currentOrg } = useOrg();
    const [kpi, setKpi] = useState<KPI | null>(null);
    const [snapshots, setSnapshots] = useState<KPISnapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [noteValue, setNoteValue] = useState('');
    const [noteText, setNoteText] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const kpiDoc = await getDoc(doc(db, 'kpis', kpiId));
            if (kpiDoc.exists()) setKpi({ id: kpiDoc.id, ...kpiDoc.data() } as KPI);
            const snapQ = query(collection(db, 'kpiSnapshots'), where('kpiId', '==', kpiId));
            const snapSnap = await getDocs(snapQ);
            setSnapshots(
                snapSnap.docs
                    .map((d) => ({ id: d.id, ...d.data() } as KPISnapshot))
                    .sort((a, b) => a.date.localeCompare(b.date))
            );
        } catch (error) {
            console.error('Error:', error);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [kpiId]);

    const handleAddSnapshot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrg || !noteValue) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'kpiSnapshots'), {
                kpiId, clientId, orgId: currentOrg.id,
                date: noteDate, value: Number(noteValue),
                notes: noteText, source: 'manual', createdAt: Timestamp.now(),
            });
            await fetchData();
            setShowNoteForm(false);
            setNoteValue('');
            setNoteText('');
        } catch (err) {
            console.error('Error:', err);
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
    if (!kpi) return <div className="p-8 text-gray-400">KPI not found</div>;

    const latestValue = snapshots.length > 0 ? snapshots[snapshots.length - 1].value : null;
    const previousValue = snapshots.length > 1 ? snapshots[snapshots.length - 2].value : null;
    const delta = latestValue !== null && previousValue !== null ? latestValue - previousValue : null;
    const chartData = snapshots.map((s) => ({ date: s.date, value: s.value }));

    const trustColors: Record<string, string> = {
        green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        yellow: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    return (
        <>
            <Header title={kpi.name} subtitle={kpi.description} />

            <div className="p-8">
                <Link href={`/clients/${clientId}/kpis`}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to KPI Dictionary
                </Link>

                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    <div className="glass rounded-xl p-4">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Current</span>
                        <p className="text-2xl font-bold text-white mt-1">
                            {latestValue !== null ? `${latestValue}${kpi.unit}` : '—'}
                        </p>
                        {delta !== null && (
                            <div className={`flex items-center gap-1 mt-1 text-xs ${delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                                {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                            </div>
                        )}
                    </div>
                    <div className="glass rounded-xl p-4">
                        <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1"><Target className="w-3 h-3" /> Target</span>
                        <p className="text-2xl font-bold text-white mt-1">{kpi.targetMonthly}{kpi.unit}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Trust</span>
                        <div className="mt-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${trustColors[kpi.trustScore]}`}>
                                {kpi.trustScore.charAt(0).toUpperCase() + kpi.trustScore.slice(1)}
                            </span>
                        </div>
                        {kpi.trustReason && <p className="text-xs text-gray-500 mt-2">{kpi.trustReason}</p>}
                    </div>
                    <div className="glass rounded-xl p-4">
                        <span className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Snapshots</span>
                        <p className="text-2xl font-bold text-white mt-1">{snapshots.length}</p>
                    </div>
                </div>

                {/* Chart */}
                <div className="glass rounded-2xl p-6 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Trend Over Time</h3>
                    {chartData.length < 2 ? (
                        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                            Need at least 2 data points to show a chart. Add snapshots below.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#374151' }} />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#374151' }} />
                                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                                    labelStyle={{ color: '#9ca3af' }} itemStyle={{ color: '#818cf8' }} />
                                <ReferenceLine y={kpi.targetMonthly} stroke="#34d399" strokeDasharray="5 5" label={{ value: 'Target', fill: '#34d399', fontSize: 11 }} />
                                <Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 4 }}
                                    activeDot={{ r: 6, fill: '#818cf8' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Add snapshot */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Snapshots & Notes</h3>
                    <button onClick={() => setShowNoteForm(!showNoteForm)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all">
                        <Plus className="w-4 h-4" /> Add Entry
                    </button>
                </div>

                {showNoteForm && (
                    <form onSubmit={handleAddSnapshot} className="glass rounded-xl p-5 mb-4 animate-fade-in space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Date</label>
                                <input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Value ({kpi.unit})</label>
                                <input type="number" step="any" value={noteValue} onChange={(e) => setNoteValue(e.target.value)} required
                                    className="w-full px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                                <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Optional note"
                                    className="w-full px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-60 transition-all">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Snapshots list */}
                <div className="space-y-2">
                    {snapshots.length === 0 ? (
                        <div className="glass rounded-xl p-8 text-center text-gray-500 text-sm">
                            No snapshots yet. Add your first data point above.
                        </div>
                    ) : (
                        [...snapshots].reverse().map((snap) => (
                            <div key={snap.id} className="glass rounded-lg px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-gray-500 font-mono w-24">{snap.date}</span>
                                    <span className="text-sm font-medium text-white">{snap.value}{kpi.unit}</span>
                                </div>
                                {snap.notes && <span className="text-xs text-gray-400">{snap.notes}</span>}
                                <span className="text-[10px] text-gray-600 uppercase">{snap.source}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
