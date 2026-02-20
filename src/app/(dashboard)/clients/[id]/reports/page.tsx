'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Report } from '@/lib/firebase/types';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { FileText, Plus, Loader2, Calendar, ArrowRight } from 'lucide-react';

export default function ReportsListPage() {
    const params = useParams();
    const clientId = params.id as string;
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const q = query(collection(db, 'reports'), where('clientId', '==', clientId));
            const snap = await getDocs(q);
            setReports(
                snap.docs
                    .map((d) => ({ id: d.id, ...d.data() } as Report))
                    .sort((a, b) => b.dateRangeEnd.localeCompare(a.dateRangeEnd))
            );
            setLoading(false);
        };
        fetch();
    }, [clientId]);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

    return (
        <>
            <Header title="Reports" subtitle="Generated reports for this client" />
            <div className="p-8 max-w-4xl">
                <div className="flex justify-end mb-6">
                    <Link href={`/clients/${clientId}/reports/new`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all">
                        <Plus className="w-4 h-4" /> Generate Report
                    </Link>
                </div>

                {reports.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-1">No reports yet</p>
                        <p className="text-gray-500 text-sm mb-4">Generate your first weekly or monthly report</p>
                        <Link href={`/clients/${clientId}/reports/new`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all">
                            <Plus className="w-4 h-4" /> Create Report
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map((report) => (
                            <Link key={report.id} href={`/clients/${clientId}/reports/${report.id}`}
                                className="glass rounded-xl px-5 py-4 flex items-center justify-between card-hover group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{report.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <Calendar className="w-3 h-3" />
                                            <span>{report.dateRangeStart} → {report.dateRangeEnd}</span>
                                            <span className="capitalize px-1.5 py-0.5 rounded bg-gray-800/50 text-gray-400">{report.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
