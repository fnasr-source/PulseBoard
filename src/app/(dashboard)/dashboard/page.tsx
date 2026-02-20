'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useOrg } from '@/lib/auth/org-context';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Client } from '@/lib/firebase/types';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import {
    Plus,
    Users,
    Building2,
    BarChart3,
    ArrowRight,
    Loader2,
    Briefcase,
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const { currentOrg, loading: orgLoading, organizations, createOrganization } = useOrg();
    const [clients, setClients] = useState<Client[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [showCreateOrg, setShowCreateOrg] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [creatingOrg, setCreatingOrg] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchClients = async () => {
            if (!currentOrg) {
                setLoadingClients(false);
                return;
            }
            try {
                const q = query(collection(db, 'clients'), where('orgId', '==', currentOrg.id));
                const snap = await getDocs(q);
                setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client)));
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
            setLoadingClients(false);
        };
        fetchClients();
    }, [currentOrg]);

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgName.trim()) return;
        setCreatingOrg(true);
        try {
            await createOrganization(orgName.trim());
            setShowCreateOrg(false);
            setOrgName('');
        } catch (error) {
            console.error('Error creating org:', error);
        }
        setCreatingOrg(false);
    };

    const businessModelLabels: Record<string, string> = {
        service: 'Service',
        education: 'Education',
        ecom: 'E-Commerce',
        investment: 'Investment',
    };

    // No org yet → show onboarding
    if (!orgLoading && organizations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/25">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Create Your Organization</h2>
                        <p className="text-gray-400 text-sm">
                            Set up your consulting practice to start managing clients.
                        </p>
                    </div>

                    <form onSubmit={handleCreateOrg} className="glass rounded-2xl p-6 space-y-4">
                        <div>
                            <label htmlFor="orgName" className="block text-sm font-medium text-gray-300 mb-1.5">
                                Organization Name
                            </label>
                            <input
                                id="orgName"
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="e.g. Growth Marketing Co."
                                required
                                className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creatingOrg}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-60 transition-all"
                        >
                            {creatingOrg ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Create Organization
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header
                title="Dashboard"
                subtitle={currentOrg ? `${currentOrg.name} · ${clients.length} client${clients.length !== 1 ? 's' : ''}` : 'Loading...'}
            />

            <div className="p-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                    {[
                        {
                            label: 'Total Clients',
                            value: clients.length,
                            icon: Briefcase,
                            color: 'from-indigo-500/10 to-blue-500/10',
                            border: 'border-indigo-500/20',
                            iconColor: 'text-indigo-400',
                        },
                        {
                            label: 'Active KPIs',
                            value: '—',
                            icon: BarChart3,
                            color: 'from-emerald-500/10 to-teal-500/10',
                            border: 'border-emerald-500/20',
                            iconColor: 'text-emerald-400',
                        },
                        {
                            label: 'Open Issues',
                            value: '—',
                            icon: Users,
                            color: 'from-amber-500/10 to-orange-500/10',
                            border: 'border-amber-500/20',
                            iconColor: 'text-amber-400',
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className={`p-5 rounded-xl bg-gradient-to-br ${stat.color} border ${stat.border}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {stat.label}
                                </span>
                                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Clients grid */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-white">Clients</h3>
                    <Link
                        href="/clients/new"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Add Client
                    </Link>
                </div>

                {loadingClients ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    </div>
                ) : clients.length === 0 ? (
                    <div className="text-center py-20 glass rounded-2xl">
                        <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-2">No clients yet</p>
                        <p className="text-gray-500 text-sm mb-6">
                            Click &quot;Add Client&quot; to set up your first client account
                        </p>
                        <Link
                            href="/clients/new"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Create First Client
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {clients.map((client) => (
                            <Link
                                key={client.id}
                                href={`/clients/${client.id}`}
                                className="glass rounded-xl p-5 card-hover group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="text-white font-semibold group-hover:text-indigo-300 transition-colors">
                                            {client.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{client.industry}</p>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        {businessModelLabels[client.businessModel] || client.businessModel}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>{client.funnelStages?.length || 0} funnel stages</span>
                                    <span>·</span>
                                    <span>{client.reportingCadence}</span>
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">{client.timezone}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
