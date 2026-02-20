'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrg } from '@/lib/auth/org-context';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { FunnelStage, LeadStatus } from '@/lib/firebase/types';
import { v4 as uuidv4 } from 'uuid';
import Header from '@/components/layout/Header';
import {
    ArrowRight,
    ArrowLeft,
    Check,
    Building2,
    Layers,
    ListChecks,
    Loader2,
    Plus,
    Trash2,
    GripVertical,
} from 'lucide-react';

const STEPS = ['Client Info', 'Funnel Stages', 'Lead Statuses', 'Review'];

const DEFAULT_FUNNEL_STAGES: FunnelStage[] = [
    { id: uuidv4(), name: 'Awareness', order: 0, color: '#818cf8' },
    { id: uuidv4(), name: 'Interest', order: 1, color: '#a78bfa' },
    { id: uuidv4(), name: 'Consideration', order: 2, color: '#c084fc' },
    { id: uuidv4(), name: 'Decision', order: 3, color: '#f472b6' },
    { id: uuidv4(), name: 'Conversion', order: 4, color: '#34d399' },
];

const DEFAULT_LEAD_STATUSES: LeadStatus[] = [
    { id: uuidv4(), name: 'New', category: 'active', order: 0 },
    { id: uuidv4(), name: 'Contacted', category: 'active', order: 1 },
    { id: uuidv4(), name: 'No Answer', category: 'neutral', order: 2 },
    { id: uuidv4(), name: 'Follow-up Later', category: 'neutral', order: 3 },
    { id: uuidv4(), name: 'Interested', category: 'active', order: 4 },
    { id: uuidv4(), name: 'Not Interested', category: 'closed', order: 5 },
    { id: uuidv4(), name: 'Wrong Number', category: 'closed', order: 6 },
    { id: uuidv4(), name: 'Qualified', category: 'active', order: 7 },
    { id: uuidv4(), name: 'Meeting Booked', category: 'active', order: 8 },
    { id: uuidv4(), name: 'Won', category: 'closed', order: 9 },
    { id: uuidv4(), name: 'Lost', category: 'closed', order: 10 },
];

const INDUSTRIES = [
    'Healthcare', 'Real Estate', 'SaaS / Technology', 'Education', 'E-Commerce',
    'Finance / Investment', 'Hospitality', 'Legal', 'Automotive', 'Other',
];

const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Riyadh',
    'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney',
];

export default function NewClientPage() {
    const router = useRouter();
    const { currentOrg } = useOrg();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);

    // Step 1: Client info
    const [name, setName] = useState('');
    const [industry, setIndustry] = useState('');
    const [businessModel, setBusinessModel] = useState<'service' | 'education' | 'ecom' | 'investment'>('service');
    const [timezone, setTimezone] = useState('America/New_York');
    const [reportingCadence, setReportingCadence] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');

    // Step 2: Funnel stages
    const [funnelStages, setFunnelStages] = useState<FunnelStage[]>(DEFAULT_FUNNEL_STAGES);

    // Step 3: Lead statuses
    const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>(DEFAULT_LEAD_STATUSES);

    const addFunnelStage = () => {
        setFunnelStages((prev) => [
            ...prev,
            { id: uuidv4(), name: '', order: prev.length, color: '#818cf8' },
        ]);
    };

    const removeFunnelStage = (id: string) => {
        setFunnelStages((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
    };

    const updateFunnelStage = (id: string, field: string, value: string) => {
        setFunnelStages((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const addLeadStatus = () => {
        setLeadStatuses((prev) => [
            ...prev,
            { id: uuidv4(), name: '', category: 'active' as const, order: prev.length },
        ]);
    };

    const removeLeadStatus = (id: string) => {
        setLeadStatuses((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
    };

    const updateLeadStatus = (id: string, field: string, value: string) => {
        setLeadStatuses((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        );
    };

    const handleSubmit = async () => {
        if (!currentOrg) return;
        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, 'clients'), {
                orgId: currentOrg.id,
                name,
                industry,
                businessModel,
                timezone,
                reportingCadence,
                funnelStages: funnelStages.filter((s) => s.name.trim()),
                leadStatuses: leadStatuses.filter((s) => s.name.trim()),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            router.push(`/clients/${docRef.id}`);
        } catch (error) {
            console.error('Error creating client:', error);
            setSaving(false);
        }
    };

    const canNext = () => {
        if (step === 0) return name.trim() && industry;
        if (step === 1) return funnelStages.some((s) => s.name.trim());
        if (step === 2) return leadStatuses.some((s) => s.name.trim());
        return true;
    };

    const categoryColors: Record<string, string> = {
        active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        closed: 'bg-red-500/10 text-red-400 border-red-500/20',
        neutral: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };

    return (
        <>
            <Header title="New Client" subtitle="Set up a new client account" />

            <div className="p-8 max-w-3xl mx-auto">
                {/* Progress */}
                <div className="flex items-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center gap-2 flex-1">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${i < step
                                        ? 'bg-indigo-500 text-white'
                                        : i === step
                                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                                            : 'bg-gray-800 text-gray-500'
                                    }`}
                            >
                                {i < step ? <Check className="w-4 h-4" /> : i + 1}
                            </div>
                            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-indigo-400' : 'text-gray-500'}`}>
                                {s}
                            </span>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-px ${i < step ? 'bg-indigo-500/40' : 'bg-gray-800'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="glass rounded-2xl p-6 animate-fade-in">
                    {/* Step 1: Client Info */}
                    {step === 0 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 mb-2">
                                <Building2 className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-lg font-semibold text-white">Client Information</h3>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Client Name *</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Industry *</label>
                                <select
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                                >
                                    <option value="">Select industry...</option>
                                    {INDUSTRIES.map((ind) => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Business Model</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {(['service', 'education', 'ecom', 'investment'] as const).map((model) => (
                                        <button
                                            key={model}
                                            type="button"
                                            onClick={() => setBusinessModel(model)}
                                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${businessModel === model
                                                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                                                    : 'bg-gray-900/80 border-gray-700 text-gray-400 hover:border-gray-600'
                                                }`}
                                        >
                                            {model === 'ecom' ? 'E-Commerce' : model.charAt(0).toUpperCase() + model.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Timezone</label>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                                    >
                                        {TIMEZONES.map((tz) => (
                                            <option key={tz} value={tz}>{tz}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Reporting Cadence</label>
                                    <select
                                        value={reportingCadence}
                                        onChange={(e) => setReportingCadence(e.target.value as any)}
                                        className="w-full px-4 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Funnel Stages */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <Layers className="w-5 h-5 text-indigo-400" />
                                    <h3 className="text-lg font-semibold text-white">Funnel Stages</h3>
                                </div>
                                <button
                                    onClick={addFunnelStage}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Stage
                                </button>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">
                                Define the stages your client&apos;s leads move through.
                            </p>

                            <div className="space-y-2">
                                {funnelStages.map((stage, i) => (
                                    <div key={stage.id} className="flex items-center gap-3 group">
                                        <GripVertical className="w-4 h-4 text-gray-600" />
                                        <span className="w-6 text-center text-xs text-gray-500 font-mono">{i + 1}</span>
                                        <input
                                            type="color"
                                            value={stage.color}
                                            onChange={(e) => updateFunnelStage(stage.id, 'color', e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                                        />
                                        <input
                                            value={stage.name}
                                            onChange={(e) => updateFunnelStage(stage.id, 'name', e.target.value)}
                                            placeholder="Stage name"
                                            className="flex-1 px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                        <button
                                            onClick={() => removeFunnelStage(stage.id)}
                                            className="p-1.5 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Lead Statuses */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <ListChecks className="w-5 h-5 text-indigo-400" />
                                    <h3 className="text-lg font-semibold text-white">Lead Statuses</h3>
                                </div>
                                <button
                                    onClick={addLeadStatus}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                                >
                                    <Plus className="w-3 h-3" />
                                    Add Status
                                </button>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">
                                Define lead disposition statuses like call-center results.
                            </p>

                            <div className="space-y-2">
                                {leadStatuses.map((status) => (
                                    <div key={status.id} className="flex items-center gap-3 group">
                                        <GripVertical className="w-4 h-4 text-gray-600" />
                                        <input
                                            value={status.name}
                                            onChange={(e) => updateLeadStatus(status.id, 'name', e.target.value)}
                                            placeholder="Status name"
                                            className="flex-1 px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                                        />
                                        <select
                                            value={status.category}
                                            onChange={(e) => updateLeadStatus(status.id, 'category', e.target.value)}
                                            className="px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-indigo-500/50 transition-all"
                                        >
                                            <option value="active">Active</option>
                                            <option value="neutral">Neutral</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                        <button
                                            onClick={() => removeLeadStatus(status.id)}
                                            className="p-1.5 rounded text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Check className="w-5 h-5 text-emerald-400" />
                                Review & Create
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800/50">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Client Info</p>
                                    <p className="text-white font-medium">{name}</p>
                                    <p className="text-sm text-gray-400">{industry} · {businessModel} · {reportingCadence}</p>
                                    <p className="text-xs text-gray-500 mt-1">{timezone}</p>
                                </div>

                                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800/50">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                        Funnel Stages ({funnelStages.filter((s) => s.name.trim()).length})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {funnelStages.filter((s) => s.name.trim()).map((s) => (
                                            <span
                                                key={s.id}
                                                className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                                                style={{ backgroundColor: s.color + '30', borderColor: s.color + '60', borderWidth: 1 }}
                                            >
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-800/50">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                                        Lead Statuses ({leadStatuses.filter((s) => s.name.trim()).length})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {leadStatuses.filter((s) => s.name.trim()).map((s) => (
                                            <span
                                                key={s.id}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${categoryColors[s.category]}`}
                                            >
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800/50">
                        <button
                            onClick={() => setStep((s) => Math.max(0, s - 1))}
                            disabled={step === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {step < STEPS.length - 1 ? (
                            <button
                                onClick={() => setStep((s) => s + 1)}
                                disabled={!canNext()}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-60 transition-all"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Create Client
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
