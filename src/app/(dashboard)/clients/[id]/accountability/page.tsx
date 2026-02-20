'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { useOrg } from '@/lib/auth/org-context';
import { useAuth } from '@/lib/auth/context';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, Timestamp, deleteDoc } from 'firebase/firestore';
import { Issue, Action, KPI } from '@/lib/firebase/types';
import Header from '@/components/layout/Header';
import {
    Plus, AlertTriangle, Loader2, ChevronDown, ChevronRight,
    Check, Clock, Play, X, Edit3, Trash2, MessageSquare,
    ListChecks, Target, Lightbulb,
} from 'lucide-react';

export default function AccountabilityBoardPage() {
    const params = useParams();
    const clientId = params.id as string;
    const { currentOrg } = useOrg();
    const { user } = useAuth();
    const [issues, setIssues] = useState<Issue[]>([]);
    const [actions, setActions] = useState<Map<string, Action[]>>(new Map());
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
    const [showNewIssue, setShowNewIssue] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // New issue form
    const [form, setForm] = useState({ title: '', description: '', hypothesis: '', linkedKpiIds: [] as string[] });
    // New action form
    const [actionForm, setActionForm] = useState({ title: '', owner: '', dueDate: '', notes: '' });
    const [showActionForm, setShowActionForm] = useState<string | null>(null);
    // Decision/result forms
    const [decisionText, setDecisionText] = useState('');
    const [resultText, setResultText] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const [issueSnap, kpiSnap] = await Promise.all([
                getDocs(query(collection(db, 'issues'), where('clientId', '==', clientId))),
                getDocs(query(collection(db, 'kpis'), where('clientId', '==', clientId))),
            ]);
            const issueList = issueSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Issue));
            setIssues(issueList);
            setKpis(kpiSnap.docs.map((d) => ({ id: d.id, ...d.data() } as KPI)));

            // Fetch actions for all issues
            const actionsMap = new Map<string, Action[]>();
            for (const issue of issueList) {
                const actSnap = await getDocs(query(collection(db, 'actions'), where('issueId', '==', issue.id)));
                actionsMap.set(issue.id, actSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Action)));
            }
            setActions(actionsMap);
        } catch (err) {
            console.error('Error:', err);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [clientId]);

    const handleCreateIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrg || !user) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'issues'), {
                clientId, orgId: currentOrg.id, ...form,
                status: 'open', decision: '', result: '', resultKpiSnapshotId: '',
                createdBy: user.uid, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
            });
            setForm({ title: '', description: '', hypothesis: '', linkedKpiIds: [] });
            setShowNewIssue(false);
            await fetchData();
        } catch (err) { console.error('Error:', err); }
        setSaving(false);
    };

    const handleAddAction = async (issueId: string) => {
        if (!actionForm.title) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'actions'), {
                issueId, ...actionForm, status: 'pending', createdAt: Timestamp.now(),
            });
            setActionForm({ title: '', owner: '', dueDate: '', notes: '' });
            setShowActionForm(null);
            await fetchData();
        } catch (err) { console.error('Error:', err); }
        setSaving(false);
    };

    const updateIssueStatus = async (issueId: string, status: string, extra: Record<string, any> = {}) => {
        await updateDoc(doc(db, 'issues', issueId), { status, ...extra, updatedAt: Timestamp.now() });
        await fetchData();
    };

    const updateActionStatus = async (actionId: string, status: string) => {
        await updateDoc(doc(db, 'actions', actionId), { status });
        await fetchData();
    };

    const statusColors: Record<string, string> = {
        open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        decided: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        in_progress: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };

    const actionStatusIcons: Record<string, React.ReactNode> = {
        pending: <Clock className="w-3.5 h-3.5 text-gray-500" />,
        in_progress: <Play className="w-3.5 h-3.5 text-indigo-400" />,
        done: <Check className="w-3.5 h-3.5 text-emerald-400" />,
    };

    const filtered = issues.filter((i) => statusFilter === 'all' || i.status === statusFilter);

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

    return (
        <>
            <Header title="Accountability Board" subtitle="Issue → Decision → Action → Result" />
            <div className="p-8 max-w-4xl">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1 p-1 bg-gray-900/80 rounded-lg">
                        {['all', 'open', 'decided', 'in_progress', 'resolved'].map((s) => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${statusFilter === s ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-gray-200'
                                    }`}>
                                {s === 'all' ? 'All' : s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowNewIssue(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all">
                        <Plus className="w-4 h-4" /> New Issue
                    </button>
                </div>

                {/* New Issue Form */}
                {showNewIssue && (
                    <form onSubmit={handleCreateIssue} className="glass rounded-2xl p-6 mb-6 space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-400" /> New Issue
                            </h3>
                            <button type="button" onClick={() => setShowNewIssue(false)}>
                                <X className="w-5 h-5 text-gray-500 hover:text-gray-300" />
                            </button>
                        </div>
                        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Issue title *" required
                            className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue..." rows={2}
                            className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
                        <input value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} placeholder="Hypothesis (what do you think is causing this?)"
                            className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />

                        {kpis.length > 0 && (
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Link to KPIs</label>
                                <div className="flex flex-wrap gap-2">
                                    {kpis.map((k) => (
                                        <button key={k.id} type="button"
                                            onClick={() => setForm({
                                                ...form,
                                                linkedKpiIds: form.linkedKpiIds.includes(k.id)
                                                    ? form.linkedKpiIds.filter((id) => id !== k.id)
                                                    : [...form.linkedKpiIds, k.id],
                                            })}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.linkedKpiIds.includes(k.id) ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400' : 'bg-gray-800 border-gray-700 text-gray-400'
                                                }`}>
                                            {k.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowNewIssue(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-all">Cancel</button>
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 disabled:opacity-60 transition-all">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Issue'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Issues List */}
                {filtered.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <ListChecks className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">{issues.length === 0 ? 'No issues yet' : 'No issues match this filter'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((issue) => {
                            const issueActions = actions.get(issue.id) || [];
                            const isExpanded = expandedIssue === issue.id;
                            return (
                                <div key={issue.id} className="glass rounded-xl overflow-hidden">
                                    <button onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                                        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-800/20 transition-all">
                                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-medium text-white truncate">{issue.title}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${statusColors[issue.status]}`}>
                                                    {issue.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            {issue.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{issue.description}</p>}
                                        </div>
                                        <span className="text-xs text-gray-600">{issueActions.length} action{issueActions.length !== 1 ? 's' : ''}</span>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-5 pb-5 border-t border-gray-800/30 space-y-4 animate-fade-in">
                                            {/* Hypothesis */}
                                            {issue.hypothesis && (
                                                <div className="pt-4">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                        <Lightbulb className="w-3 h-3" /> Hypothesis
                                                    </p>
                                                    <p className="text-sm text-gray-300">{issue.hypothesis}</p>
                                                </div>
                                            )}

                                            {/* Decision */}
                                            <div className="pt-2">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                    <Target className="w-3 h-3" /> Decision
                                                </p>
                                                {issue.decision ? (
                                                    <p className="text-sm text-gray-300">{issue.decision}</p>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <input value={decisionText} onChange={(e) => setDecisionText(e.target.value)} placeholder="Enter decision..."
                                                            className="flex-1 px-3 py-1.5 bg-gray-900/80 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                                                        <button onClick={() => { updateIssueStatus(issue.id, 'decided', { decision: decisionText }); setDecisionText(''); }}
                                                            className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 text-xs rounded font-medium hover:bg-indigo-500/30 transition-all">
                                                            Save
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="pt-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                        <ListChecks className="w-3 h-3" /> Actions ({issueActions.length})
                                                    </p>
                                                    <button onClick={() => setShowActionForm(showActionForm === issue.id ? null : issue.id)}
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                                                        <Plus className="w-3 h-3" /> Add
                                                    </button>
                                                </div>

                                                {showActionForm === issue.id && (
                                                    <div className="p-3 rounded-lg bg-gray-900/50 mb-3 space-y-2 animate-fade-in">
                                                        <input value={actionForm.title} onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })} placeholder="Action title *"
                                                            className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <input value={actionForm.owner} onChange={(e) => setActionForm({ ...actionForm, owner: e.target.value })} placeholder="Owner"
                                                                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                                                            <input type="date" value={actionForm.dueDate} onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })}
                                                                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                                                        </div>
                                                        <div className="flex justify-end">
                                                            <button onClick={() => handleAddAction(issue.id)} disabled={saving}
                                                                className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded font-medium hover:bg-indigo-600 disabled:opacity-60 transition-all">
                                                                Add Action
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {issueActions.map((action) => (
                                                    <div key={action.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800/20 transition-all">
                                                        <button onClick={() => updateActionStatus(action.id,
                                                            action.status === 'pending' ? 'in_progress' : action.status === 'in_progress' ? 'done' : 'pending')}>
                                                            {actionStatusIcons[action.status]}
                                                        </button>
                                                        <span className={`text-sm flex-1 ${action.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                            {action.title}
                                                        </span>
                                                        {action.owner && <span className="text-xs text-gray-500">{action.owner}</span>}
                                                        {action.dueDate && <span className="text-xs text-gray-600">{action.dueDate}</span>}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Result */}
                                            <div className="pt-2">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                    <MessageSquare className="w-3 h-3" /> Result
                                                </p>
                                                {issue.result ? (
                                                    <p className="text-sm text-gray-300">{issue.result}</p>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <input value={resultText} onChange={(e) => setResultText(e.target.value)} placeholder="What changed? Link to data..."
                                                            className="flex-1 px-3 py-1.5 bg-gray-900/80 border border-gray-700 rounded text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                                                        <button onClick={() => { updateIssueStatus(issue.id, 'resolved', { result: resultText }); setResultText(''); }}
                                                            className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs rounded font-medium hover:bg-emerald-500/30 transition-all">
                                                            Resolve
                                                        </button>
                                                    </div>
                                                )}
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
