'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { useOrg } from '@/lib/auth/org-context';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Client, KPI, KPISnapshot, Issue } from '@/lib/firebase/types';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import {
    BarChart3, Layers, ListChecks, AlertTriangle, FileText,
    Building2, ArrowUp, ArrowDown, Minus, Loader2, Plus,
    TrendingUp, TrendingDown, CircleDot,
} from 'lucide-react';

export default function ClientOverviewPage() {
    const params = useParams();
    const clientId = params.id as string;
    const { currentOrg } = useOrg();
    const [client, setClient] = useState<Client | null>(null);
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const clientDoc = await getDoc(doc(db, 'clients', clientId));
                if (clientDoc.exists()) {
                    setClient({ id: clientDoc.id, ...clientDoc.data() } as Client);
                }
                // Fetch KPIs
                const kpiQuery = query(collection(db, 'kpis'), where('clientId', '==', clientId));
                const kpiSnap = await getDocs(kpiQuery);
                setKpis(kpiSnap.docs.map((d) => ({ id: d.id, ...d.data() } as KPI)));
            } catch (error) {
                console.error('Error fetching client:', error);
            }
            setLoading(false);
        };
        fetch();
    }, [clientId]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center">
                    <p className="text-gray-400">Client not found</p>
                    <Link href="/dashboard" className="text-indigo-400 text-sm mt-2 hover:underline">
                        Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const trustColors: Record<string, string> = {
        green: 'bg-emerald-500/10 text-emerald-400',
        yellow: 'bg-amber-500/10 text-amber-400',
        red: 'bg-red-500/10 text-red-400',
    };

    return (
        <>
            <Header title={client.name} subtitle={`${client.industry} · ${client.businessModel} · ${client.reportingCadence}`} />

            <div className="p-8">
                {/* Quick stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    <div className="glass rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs text-gray-500 uppercase tracking-wider">KPIs</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{kpis.length}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Layers className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Funnel Stages</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{client.funnelStages?.length || 0}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ListChecks className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Lead Statuses</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{client.leadStatuses?.length || 0}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Open Issues</span>
                        </div>
                        <p className="text-2xl font-bold text-white">—</p>
                    </div>
                </div>

                {/* Funnel Stages */}
                {client.funnelStages && client.funnelStages.length > 0 && (
                    <section className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Funnel Stages</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {client.funnelStages
                                .sort((a, b) => a.order - b.order)
                                .map((stage, i) => (
                                    <div
                                        key={stage.id}
                                        className="flex-shrink-0 px-5 py-3 rounded-xl text-sm font-medium text-white border"
                                        style={{
                                            backgroundColor: stage.color + '15',
                                            borderColor: stage.color + '40',
                                        }}
                                    >
                                        <span className="text-xs opacity-60 mr-2">{i + 1}.</span>
                                        {stage.name}
                                    </div>
                                ))}
                        </div>
                    </section>
                )}

                {/* KPI Grid */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">KPI Dictionary</h3>
                        <Link
                            href={`/clients/${clientId}/kpis`}
                            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            View All →
                        </Link>
                    </div>

                    {kpis.length === 0 ? (
                        <div className="glass rounded-xl p-8 text-center">
                            <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 mb-1">No KPIs defined yet</p>
                            <p className="text-gray-500 text-sm mb-4">Start building your KPI dictionary</p>
                            <Link
                                href={`/clients/${clientId}/kpis`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Add KPIs
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {kpis.slice(0, 6).map((kpi) => (
                                <Link
                                    key={kpi.id}
                                    href={`/clients/${clientId}/kpis/${kpi.id}`}
                                    className="glass rounded-xl p-4 card-hover group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                                            {kpi.name}
                                        </h4>
                                        <span className={`w-2.5 h-2.5 rounded-full ${kpi.trustScore === 'green' ? 'bg-emerald-400' :
                                                kpi.trustScore === 'yellow' ? 'bg-amber-400' : 'bg-red-400'
                                            }`} />
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{kpi.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">Target: {kpi.targetMonthly} {kpi.unit}</span>
                                        <span className="text-xs text-gray-600">{kpi.updateFrequency}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Quick Links */}
                <section>
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { href: `/clients/${clientId}/data-entry`, label: 'Enter Data', icon: Plus, color: 'indigo' },
                            { href: `/clients/${clientId}/accountability`, label: 'Issues Board', icon: AlertTriangle, color: 'amber' },
                            { href: `/clients/${clientId}/reports/new`, label: 'New Report', icon: FileText, color: 'emerald' },
                            { href: `/clients/${clientId}/agencies`, label: 'Agencies', icon: Building2, color: 'purple' },
                        ].map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="glass rounded-xl p-4 text-center card-hover group"
                            >
                                <action.icon className={`w-6 h-6 mx-auto mb-2 text-${action.color}-400 group-hover:scale-110 transition-transform`} />
                                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                    {action.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
