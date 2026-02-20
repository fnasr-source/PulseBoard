'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Report, Client } from '@/lib/firebase/types';
import Header from '@/components/layout/Header';
import {
    ArrowLeft, Printer, TrendingUp, TrendingDown, Minus,
    AlertTriangle, ListChecks, FileText, BarChart3, Loader2,
} from 'lucide-react';

export default function ReportViewPage() {
    const params = useParams();
    const clientId = params.id as string;
    const reportId = params.reportId as string;
    const router = useRouter();
    const [report, setReport] = useState<Report | null>(null);
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const [reportDoc, clientDoc] = await Promise.all([
                getDoc(doc(db, 'reports', reportId)),
                getDoc(doc(db, 'clients', clientId)),
            ]);
            if (reportDoc.exists()) setReport({ id: reportDoc.id, ...reportDoc.data() } as Report);
            if (clientDoc.exists()) setClient({ id: clientDoc.id, ...clientDoc.data() } as Client);
            setLoading(false);
        };
        fetch();
    }, [reportId, clientId]);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
    if (!report) return <div className="p-8 text-gray-400">Report not found</div>;

    return (
        <>
            <Header title={report.title} subtitle={`${report.dateRangeStart} → ${report.dateRangeEnd}`} />
            <div className="p-8 max-w-4xl">
                <div className="flex items-center justify-between mb-6 no-print">
                    <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all">
                        <Printer className="w-4 h-4" /> Print / PDF
                    </button>
                </div>

                {/* Printable report */}
                <div className="space-y-6">
                    {/* Header */}
                    <div className="glass rounded-2xl p-8 text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">PulseBoard</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">{report.title}</h1>
                        <p className="text-gray-400">{client?.name} · {report.type} Report</p>
                        <p className="text-sm text-gray-500 mt-1">{report.dateRangeStart} to {report.dateRangeEnd}</p>
                    </div>

                    {/* Executive Summary */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-400" /> Executive Summary
                        </h2>
                        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{report.content.executiveSummary}</div>
                    </div>

                    {/* KPI Highlights */}
                    <div className="glass rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" /> KPI Highlights
                        </h2>
                        <div className="space-y-2">
                            {report.content.kpiHighlights.map((h, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-800/50">
                                    {h.trend === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
                                        h.trend === 'down' ? <TrendingDown className="w-4 h-4 text-red-400" /> :
                                            <Minus className="w-4 h-4 text-gray-500" />}
                                    <span className="text-sm text-gray-200 flex-1">{h.kpiName}</span>
                                    <span className={`text-sm font-medium ${h.trend === 'up' ? 'text-emerald-400' : h.trend === 'down' ? 'text-red-400' : 'text-gray-500'}`}>
                                        {h.delta > 0 ? '+' : ''}{h.delta.toFixed(1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Problems & Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" /> Key Problems
                            </h2>
                            {report.content.problems.length === 0 ? (
                                <p className="text-sm text-gray-500">No problems identified</p>
                            ) : (
                                <ul className="space-y-2">
                                    {report.content.problems.map((p, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <span className="text-amber-400 mt-0.5">•</span> {p}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="glass rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <ListChecks className="w-5 h-5 text-indigo-400" /> Recommended Actions
                            </h2>
                            {report.content.actions.length === 0 ? (
                                <p className="text-sm text-gray-500">No actions specified</p>
                            ) : (
                                <ul className="space-y-2">
                                    {report.content.actions.map((a, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <span className="text-indigo-400 mt-0.5">•</span> {a}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
