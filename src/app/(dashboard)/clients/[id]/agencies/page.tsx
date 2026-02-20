'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { useOrg } from '@/lib/auth/org-context';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Agency, Deliverable } from '@/lib/firebase/types';
import Header from '@/components/layout/Header';
import {
    Building2, Plus, Star, Loader2, X, Check, Edit3, Trash2,
    ChevronDown, ChevronRight, Package, Calendar, MessageSquare,
} from 'lucide-react';

export default function AgenciesPage() {
    const params = useParams();
    const clientId = params.id as string;
    const { currentOrg } = useOrg();
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [deliverables, setDeliverables] = useState<Map<string, Deliverable[]>>(new Map());
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
    const [expandedAgency, setExpandedAgency] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '', contactName: '', contactEmail: '', notes: '',
        scores: { reportingQuality: 3, testingDiscipline: 3, creativeQuality: 3, responsiveness: 3 },
    });

    const [delivForm, setDelivForm] = useState({ name: '', dueDate: '', link: '' });
    const [showDelivForm, setShowDelivForm] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const agencySnap = await getDocs(query(collection(db, 'agencies'), where('clientId', '==', clientId)));
            const agencyList = agencySnap.docs.map((d) => ({ id: d.id, ...d.data() } as Agency));
            setAgencies(agencyList);

            const delivMap = new Map<string, Deliverable[]>();
            for (const agency of agencyList) {
                const delivSnap = await getDocs(query(collection(db, 'deliverables'), where('agencyId', '==', agency.id)));
                delivMap.set(agency.id, delivSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Deliverable)));
            }
            setDeliverables(delivMap);
        } catch (err) { console.error('Error:', err); }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [clientId]);

    const handleSaveAgency = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrg) return;
        setSaving(true);
        try {
            if (editingAgency) {
                await updateDoc(doc(db, 'agencies', editingAgency.id), { ...form, updatedAt: Timestamp.now() });
            } else {
                await addDoc(collection(db, 'agencies'), { ...form, clientId, orgId: currentOrg.id, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
            }
            setForm({ name: '', contactName: '', contactEmail: '', notes: '', scores: { reportingQuality: 3, testingDiscipline: 3, creativeQuality: 3, responsiveness: 3 } });
            setEditingAgency(null);
            setShowForm(false);
            await fetchData();
        } catch (err) { console.error('Error:', err); }
        setSaving(false);
    };

    const handleDeleteAgency = async (id: string) => {
        if (!confirm('Delete this agency?')) return;
        await deleteDoc(doc(db, 'agencies', id));
        await fetchData();
    };

    const handleAddDeliverable = async (agencyId: string) => {
        if (!delivForm.name) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'deliverables'), {
                agencyId, ...delivForm, receivedDate: null, status: 'pending', createdAt: Timestamp.now(),
            });
            setDelivForm({ name: '', dueDate: '', link: '' });
            setShowDelivForm(null);
            await fetchData();
        } catch (err) { console.error('Error:', err); }
        setSaving(false);
    };

    const markReceived = async (delivId: string) => {
        await updateDoc(doc(db, 'deliverables', delivId), { receivedDate: new Date().toISOString().split('T')[0], status: 'received' });
        await fetchData();
    };

    const ScoreStars = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => onChange?.(n)} disabled={!onChange}
                    className={`${n <= value ? 'text-amber-400' : 'text-gray-700'} ${onChange ? 'cursor-pointer hover:text-amber-300' : ''} transition-colors`}>
                    <Star className="w-4 h-4" fill={n <= value ? 'currentColor' : 'none'} />
                </button>
            ))}
        </div>
    );

    const avgScore = (scores: Agency['scores']) => {
        const vals = Object.values(scores);
        return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

    return (
        <>
            <Header title="Agency Scorecards" subtitle="Track agency performance and deliverables" />
            <div className="p-8 max-w-4xl">
                <div className="flex justify-end mb-6">
                    <button onClick={() => { setEditingAgency(null); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all">
                        <Plus className="w-4 h-4" /> Add Agency
                    </button>
                </div>

                {/* Agency Form */}
                {showForm && (
                    <form onSubmit={handleSaveAgency} className="glass rounded-2xl p-6 mb-6 space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">{editingAgency ? 'Edit Agency' : 'New Agency'}</h3>
                            <button type="button" onClick={() => { setShowForm(false); setEditingAgency(null); }}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Agency name *" required
                                className="px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Contact name"
                                className="px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="Contact email" type="email"
                                className="px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-400 mb-2">Scores (1–5)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { key: 'reportingQuality', label: 'Reporting' },
                                    { key: 'testingDiscipline', label: 'Testing' },
                                    { key: 'creativeQuality', label: 'Creative' },
                                    { key: 'responsiveness', label: 'Responsiveness' },
                                ].map((item) => (
                                    <div key={item.key} className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                                        <ScoreStars
                                            value={(form.scores as any)[item.key]}
                                            onChange={(v) => setForm({ ...form, scores: { ...form.scores, [item.key]: v } })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes..." rows={2}
                            className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />

                        <div className="flex justify-end gap-3">
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-60 transition-all">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {editingAgency ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Agency list */}
                {agencies.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No agencies added yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {agencies.map((agency) => {
                            const agencyDeliverables = deliverables.get(agency.id) || [];
                            const isExpanded = expandedAgency === agency.id;
                            return (
                                <div key={agency.id} className="glass rounded-xl overflow-hidden">
                                    <button onClick={() => setExpandedAgency(isExpanded ? null : agency.id)}
                                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-800/20 transition-all">
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-white">{agency.name}</h4>
                                            <p className="text-xs text-gray-500">{agency.contactName} · {agency.contactEmail}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-amber-400">
                                            <Star className="w-4 h-4" fill="currentColor" />
                                            <span className="text-sm font-medium">{avgScore(agency.scores)}</span>
                                        </div>
                                        <span className="text-xs text-gray-600">{agencyDeliverables.length} deliverable{agencyDeliverables.length !== 1 ? 's' : ''}</span>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-5 pb-5 border-t border-gray-800/30 space-y-4 animate-fade-in">
                                            {/* Scores */}
                                            <div className="grid grid-cols-4 gap-4 pt-4">
                                                {[
                                                    { key: 'reportingQuality', label: 'Reporting' },
                                                    { key: 'testingDiscipline', label: 'Testing' },
                                                    { key: 'creativeQuality', label: 'Creative' },
                                                    { key: 'responsiveness', label: 'Responsiveness' },
                                                ].map((item) => (
                                                    <div key={item.key} className="text-center p-3 rounded-lg bg-gray-900/50">
                                                        <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                                                        <ScoreStars value={(agency.scores as any)[item.key]} />
                                                    </div>
                                                ))}
                                            </div>

                                            {agency.notes && <p className="text-sm text-gray-400 italic">{agency.notes}</p>}

                                            {/* Deliverables */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                        <Package className="w-3 h-3" /> Deliverables
                                                    </p>
                                                    <button onClick={() => setShowDelivForm(showDelivForm === agency.id ? null : agency.id)}
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                                        <Plus className="w-3 h-3" /> Add
                                                    </button>
                                                </div>

                                                {showDelivForm === agency.id && (
                                                    <div className="p-3 rounded-lg bg-gray-900/50 mb-3 space-y-2 animate-fade-in">
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <input value={delivForm.name} onChange={(e) => setDelivForm({ ...delivForm, name: e.target.value })} placeholder="Deliverable name *"
                                                                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                                                            <input type="date" value={delivForm.dueDate} onChange={(e) => setDelivForm({ ...delivForm, dueDate: e.target.value })}
                                                                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                                                            <input value={delivForm.link} onChange={(e) => setDelivForm({ ...delivForm, link: e.target.value })} placeholder="Link (optional)"
                                                                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <button onClick={() => handleAddDeliverable(agency.id)}
                                                                className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded font-medium hover:bg-indigo-600 transition-all">
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {agencyDeliverables.map((deliv) => (
                                                    <div key={deliv.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/20 transition-all">
                                                        <Package className={`w-3.5 h-3.5 ${deliv.status === 'received' ? 'text-emerald-400' : deliv.status === 'late' ? 'text-red-400' : 'text-gray-500'}`} />
                                                        <span className="text-sm text-gray-200 flex-1">{deliv.name}</span>
                                                        {deliv.dueDate && <span className="text-xs text-gray-600 flex items-center gap-1"><Calendar className="w-3 h-3" />{deliv.dueDate}</span>}
                                                        {deliv.status === 'pending' && (
                                                            <button onClick={() => markReceived(deliv.id)} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                                                                Mark Received
                                                            </button>
                                                        )}
                                                        {deliv.status === 'received' && <span className="text-xs text-emerald-400">✓ Received</span>}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2">
                                                <button onClick={() => { setEditingAgency(agency); setForm({ ...agency }); setShowForm(true); }}
                                                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1">
                                                    <Edit3 className="w-3 h-3" /> Edit
                                                </button>
                                                <button onClick={() => handleDeleteAgency(agency.id)}
                                                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1">
                                                    <Trash2 className="w-3 h-3" /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
