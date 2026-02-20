'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { useOrg } from '@/lib/auth/org-context';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { KPI } from '@/lib/firebase/types';
import { v4 as uuidv4 } from 'uuid';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import {
    Plus, Search, Filter, Edit3, Trash2, X, Check, Loader2,
    BarChart3, CircleDot,
} from 'lucide-react';

export default function KPIDictionaryPage() {
    const params = useParams();
    const clientId = params.id as string;
    const { currentOrg } = useOrg();
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTrust, setFilterTrust] = useState<string>('all');

    // Form state
    const [form, setForm] = useState<{
        name: string; description: string; formula: string; unit: string;
        targetMonthly: number; owner: string; dataSource: 'manual' | 'csv' | 'google_sheets';
        updateFrequency: 'daily' | 'weekly' | 'monthly'; trustScore: 'green' | 'yellow' | 'red'; trustReason: string;
    }>({
        name: '', description: '', formula: '', unit: '%',
        targetMonthly: 0, owner: '', dataSource: 'manual',
        updateFrequency: 'weekly', trustScore: 'green', trustReason: '',
    });
    const [saving, setSaving] = useState(false);

    const fetchKPIs = async () => {
        try {
            const q = query(collection(db, 'kpis'), where('clientId', '==', clientId));
            const snap = await getDocs(q);
            setKpis(snap.docs.map((d) => ({ id: d.id, ...d.data() } as KPI)));
        } catch (error) {
            console.error('Error fetching KPIs:', error);
        }
        setLoading(false);
    };

    useEffect(() => { fetchKPIs(); }, [clientId]);

    const openEditForm = (kpi: KPI) => {
        setEditingKpi(kpi);
        setForm({
            name: kpi.name, description: kpi.description, formula: kpi.formula, unit: kpi.unit,
            targetMonthly: kpi.targetMonthly, owner: kpi.owner, dataSource: kpi.dataSource,
            updateFrequency: kpi.updateFrequency, trustScore: kpi.trustScore, trustReason: kpi.trustReason,
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setForm({
            name: '', description: '', formula: '', unit: '%', targetMonthly: 0, owner: '',
            dataSource: 'manual', updateFrequency: 'weekly', trustScore: 'green', trustReason: ''
        });
        setEditingKpi(null);
        setShowForm(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrg) return;
        setSaving(true);

        try {
            if (editingKpi) {
                await updateDoc(doc(db, 'kpis', editingKpi.id), {
                    ...form, updatedAt: Timestamp.now(),
                });
            } else {
                await addDoc(collection(db, 'kpis'), {
                    ...form, clientId, orgId: currentOrg.id,
                    createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
                });
            }
            await fetchKPIs();
            resetForm();
        } catch (error) {
            console.error('Error saving KPI:', error);
        }
        setSaving(false);
    };

    const handleDelete = async (kpiId: string) => {
        if (!confirm('Delete this KPI?')) return;
        await deleteDoc(doc(db, 'kpis', kpiId));
        await fetchKPIs();
    };

    const filteredKpis = kpis.filter((k) => {
        const matchesSearch = k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            k.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTrust = filterTrust === 'all' || k.trustScore === filterTrust;
        return matchesSearch && matchesTrust;
    });

    const trustDot = (score: string) => {
        const colors: Record<string, string> = {
            green: 'bg-emerald-400', yellow: 'bg-amber-400', red: 'bg-red-400',
        };
        return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[score]}`} />;
    };

    return (
        <>
            <Header title="KPI Dictionary" subtitle="Define and manage KPIs for this client" />

            <div className="p-8">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search KPIs..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-900/80 border border-gray-800 rounded-lg text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={filterTrust}
                            onChange={(e) => setFilterTrust(e.target.value)}
                            className="px-3 py-2.5 bg-gray-900/80 border border-gray-800 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50 transition-all"
                        >
                            <option value="all">All Trust</option>
                            <option value="green">🟢 Green</option>
                            <option value="yellow">🟡 Yellow</option>
                            <option value="red">🔴 Red</option>
                        </select>
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Add KPI
                        </button>
                    </div>
                </div>

                {/* Form */}
                {showForm && (
                    <form onSubmit={handleSave} className="glass rounded-2xl p-6 mb-6 animate-fade-in space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">
                                {editingKpi ? 'Edit KPI' : 'New KPI'}
                            </h3>
                            <button type="button" onClick={resetForm} className="text-gray-500 hover:text-gray-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Owner</label>
                                <input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                                className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Formula</label>
                            <input value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value })} placeholder="e.g. (Leads / Spend) × 100"
                                className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all">
                                    <option value="%">%</option>
                                    <option value="$">$</option>
                                    <option value="#">#</option>
                                    <option value="ratio">ratio</option>
                                    <option value="score">score</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Target</label>
                                <input type="number" value={form.targetMonthly} onChange={(e) => setForm({ ...form, targetMonthly: Number(e.target.value) })}
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Data Source</label>
                                <select value={form.dataSource} onChange={(e) => setForm({ ...form, dataSource: e.target.value as any })}
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all">
                                    <option value="manual">Manual</option>
                                    <option value="csv">CSV</option>
                                    <option value="google_sheets">Google Sheets</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Frequency</label>
                                <select value={form.updateFrequency} onChange={(e) => setForm({ ...form, updateFrequency: e.target.value as any })}
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        {/* Trust Score */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Trust Score</label>
                            <div className="flex gap-2 mb-2">
                                {(['green', 'yellow', 'red'] as const).map((score) => (
                                    <button key={score} type="button" onClick={() => setForm({ ...form, trustScore: score })}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${form.trustScore === score
                                            ? score === 'green' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                                : score === 'yellow' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                                                    : 'bg-red-500/10 border-red-500/40 text-red-400'
                                            : 'bg-gray-900/80 border-gray-700 text-gray-400 hover:border-gray-600'
                                            }`}>
                                        {trustDot(score)}
                                        {score.charAt(0).toUpperCase() + score.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <input value={form.trustReason} onChange={(e) => setForm({ ...form, trustReason: e.target.value })} placeholder="Reason for trust score..."
                                className="w-full px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={resetForm}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-all">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-60 transition-all">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {editingKpi ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    </div>
                ) : filteredKpis.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 mb-1">{kpis.length === 0 ? 'No KPIs yet' : 'No matching KPIs'}</p>
                        <p className="text-gray-500 text-sm">
                            {kpis.length === 0 ? 'Add your first KPI to start tracking.' : 'Try a different search term.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800/50">
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">KPI</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Target</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Owner</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Source</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Trust</th>
                                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredKpis.map((kpi) => (
                                    <tr key={kpi.id} className="border-b border-gray-800/30 hover:bg-gray-900/30 transition-colors">
                                        <td className="py-3 px-4">
                                            <Link href={`/clients/${clientId}/kpis/${kpi.id}`} className="text-sm font-medium text-white hover:text-indigo-300 transition-colors">
                                                {kpi.name}
                                            </Link>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{kpi.description}</p>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-300">{kpi.targetMonthly} {kpi.unit}</td>
                                        <td className="py-3 px-4 text-sm text-gray-400">{kpi.owner || '—'}</td>
                                        <td className="py-3 px-4 text-xs text-gray-500 capitalize">{kpi.dataSource}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                {trustDot(kpi.trustScore)}
                                                <span className="text-xs text-gray-400 capitalize">{kpi.trustScore}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEditForm(kpi)} className="p-1.5 rounded text-gray-500 hover:text-indigo-400 transition-colors">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(kpi.id)} className="p-1.5 rounded text-gray-500 hover:text-red-400 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
