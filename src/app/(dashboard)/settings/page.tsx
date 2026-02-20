'use client';

import { useState, useEffect } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { useAuth } from '@/lib/auth/context';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { OrgMember } from '@/lib/firebase/types';
import Header from '@/components/layout/Header';
import { Users, Plus, Trash2, Loader2, Shield } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const { currentOrg, currentRole } = useOrg();
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'consultant' | 'viewer'>('consultant');

    useEffect(() => {
        const fetchMembers = async () => {
            if (!currentOrg) return;
            try {
                const q = query(collection(db, 'orgMembers'), where('orgId', '==', currentOrg.id));
                const snap = await getDocs(q);
                setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrgMember)));
            } catch (error) {
                console.error('Error fetching members:', error);
            }
            setLoadingMembers(false);
        };
        fetchMembers();
    }, [currentOrg]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrg || !inviteEmail.trim()) return;

        await addDoc(collection(db, 'orgMembers'), {
            orgId: currentOrg.id,
            userId: '', // Will be linked when user signs up/in
            email: inviteEmail.trim(),
            displayName: inviteEmail.trim().split('@')[0],
            role: inviteRole,
            joinedAt: Timestamp.now(),
        });

        setInviteEmail('');
        setShowInvite(false);
        // Refresh
        const q = query(collection(db, 'orgMembers'), where('orgId', '==', currentOrg.id));
        const snap = await getDocs(q);
        setMembers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrgMember)));
    };

    const roleColors: Record<string, string> = {
        owner: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        consultant: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        viewer: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };

    return (
        <>
            <Header title="Settings" subtitle={currentOrg?.name || ''} />
            <div className="p-8 max-w-3xl">
                {/* Organization */}
                <section className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        Organization
                    </h3>
                    <div className="glass rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">{currentOrg?.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Your role: <span className="capitalize text-gray-300">{currentRole}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Members */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" />
                            Members
                        </h3>
                        {currentRole === 'owner' && (
                            <button
                                onClick={() => setShowInvite(!showInvite)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Add Member
                            </button>
                        )}
                    </div>

                    {showInvite && (
                        <form onSubmit={handleInvite} className="glass rounded-xl p-5 mb-4 space-y-3">
                            <div className="flex gap-3">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="member@example.com"
                                    required
                                    className="flex-1 px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                />
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as 'consultant' | 'viewer')}
                                    className="px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                                >
                                    <option value="consultant">Consultant</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-all"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    )}

                    {loadingMembers ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => (
                                <div key={member.id} className="glass rounded-xl px-5 py-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-white">{member.displayName || member.email}</p>
                                        <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                    <span
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium capitalize border ${roleColors[member.role]}`}
                                    >
                                        {member.role}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
