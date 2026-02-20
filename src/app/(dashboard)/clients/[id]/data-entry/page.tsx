'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { useOrg } from '@/lib/auth/org-context';
import { collection, query, where, getDocs, addDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { KPI, KPISnapshot } from '@/lib/firebase/types';
import Papa from 'papaparse';
import Header from '@/components/layout/Header';
import {
    Upload, FileSpreadsheet, Plus, Loader2, Check, X, AlertCircle,
} from 'lucide-react';

export default function DataEntryPage() {
    const params = useParams();
    const clientId = params.id as string;
    const { currentOrg } = useOrg();
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'manual' | 'csv'>('manual');

    // Manual entry state
    const [selectedKpi, setSelectedKpi] = useState('');
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
    const [entryValue, setEntryValue] = useState('');
    const [entryNotes, setEntryNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // CSV state
    const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<{ date: string; kpi: string; value: string; notes: string }>({
        date: '', kpi: '', value: '', notes: '',
    });
    const [csvErrors, setCsvErrors] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            const q = query(collection(db, 'kpis'), where('clientId', '==', clientId));
            const snap = await getDocs(q);
            setKpis(snap.docs.map((d) => ({ id: d.id, ...d.data() } as KPI)));
            setLoading(false);
        };
        fetch();
    }, [clientId]);

    const handleManualSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrg || !selectedKpi || !entryValue) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'kpiSnapshots'), {
                kpiId: selectedKpi, clientId, orgId: currentOrg.id,
                date: entryDate, value: Number(entryValue),
                notes: entryNotes, source: 'manual', createdAt: Timestamp.now(),
            });
            setSaveSuccess(true);
            setEntryValue('');
            setEntryNotes('');
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving snapshot:', err);
        }
        setSaving(false);
    };

    const handleFileUpload = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setCsvHeaders(results.meta.fields || []);
                setCsvData(results.data as Record<string, string>[]);
                setCsvErrors([]);
                setImportResult(null);
                // Auto-map columns
                const fields = results.meta.fields || [];
                setColumnMapping({
                    date: fields.find((f) => /date/i.test(f)) || '',
                    kpi: fields.find((f) => /kpi|metric|name/i.test(f)) || '',
                    value: fields.find((f) => /value|amount|number/i.test(f)) || '',
                    notes: fields.find((f) => /note|comment/i.test(f)) || '',
                });
            },
            error: (err) => {
                setCsvErrors([err.message]);
            },
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            handleFileUpload(file);
        }
    }, []);

    const handleImport = async () => {
        if (!currentOrg || !columnMapping.date || !columnMapping.value) return;
        setImporting(true);
        let success = 0;
        let errors = 0;
        const errorMessages: string[] = [];

        const batch = writeBatch(db);

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const dateVal = row[columnMapping.date];
            const valueVal = parseFloat(row[columnMapping.value]);
            const notesVal = columnMapping.notes ? row[columnMapping.notes] : '';

            if (!dateVal || isNaN(valueVal)) {
                errors++;
                errorMessages.push(`Row ${i + 1}: Invalid date or value`);
                continue;
            }

            // Find KPI by name if column mapped
            let kpiId = '';
            if (columnMapping.kpi && row[columnMapping.kpi]) {
                const found = kpis.find((k) => k.name.toLowerCase() === row[columnMapping.kpi].toLowerCase());
                kpiId = found?.id || '';
                if (!kpiId) {
                    errors++;
                    errorMessages.push(`Row ${i + 1}: KPI "${row[columnMapping.kpi]}" not found`);
                    continue;
                }
            } else if (selectedKpi) {
                kpiId = selectedKpi;
            }

            if (!kpiId) {
                errors++;
                errorMessages.push(`Row ${i + 1}: No KPI mapped`);
                continue;
            }

            const ref = collection(db, 'kpiSnapshots');
            const docRef = await addDoc(ref, {
                kpiId, clientId, orgId: currentOrg.id,
                date: dateVal, value: valueVal,
                notes: notesVal || '', source: 'csv', createdAt: Timestamp.now(),
            });
            success++;
        }

        setCsvErrors(errorMessages);
        setImportResult({ success, errors });
        setImporting(false);
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

    return (
        <>
            <Header title="Data Entry" subtitle="Enter KPI data manually or import from CSV" />
            <div className="p-8 max-w-4xl">
                {/* Tab selector */}
                <div className="flex gap-1 mb-6 p-1 bg-gray-900/80 rounded-lg w-fit">
                    <button onClick={() => setTab('manual')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'manual' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}>
                        Manual Entry
                    </button>
                    <button onClick={() => setTab('csv')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'csv' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-gray-200'}`}>
                        CSV Import
                    </button>
                </div>

                {/* Manual entry */}
                {tab === 'manual' && (
                    <form onSubmit={handleManualSave} className="glass rounded-2xl p-6 space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">KPI *</label>
                                <select value={selectedKpi} onChange={(e) => setSelectedKpi(e.target.value)} required
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all">
                                    <option value="">Select KPI...</option>
                                    {kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Date *</label>
                                <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} required
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Value *</label>
                                <input type="number" step="any" value={entryValue} onChange={(e) => setEntryValue(e.target.value)} required
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                                <input value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)} placeholder="Optional"
                                    className="w-full px-3 py-2.5 bg-gray-900/80 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            {saveSuccess && <span className="text-emerald-400 text-sm flex items-center gap-1"><Check className="w-4 h-4" /> Saved!</span>}
                            <button type="submit" disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-60 transition-all">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Save Entry
                            </button>
                        </div>
                    </form>
                )}

                {/* CSV import */}
                {tab === 'csv' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Drop zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`glass rounded-2xl p-8 text-center border-2 border-dashed transition-all cursor-pointer ${dragOver ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-gray-700/50'
                                }`}
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.csv';
                                input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) handleFileUpload(file);
                                };
                                input.click();
                            }}
                        >
                            <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-300 font-medium">Drop CSV file here or click to browse</p>
                            <p className="text-xs text-gray-500 mt-1">Supports .csv files with headers</p>
                        </div>

                        {/* Column mapping */}
                        {csvHeaders.length > 0 && (
                            <div className="glass rounded-2xl p-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                                    <h3 className="text-lg font-semibold text-white">Map Columns</h3>
                                    <span className="text-xs text-gray-500 ml-auto">{csvData.length} rows found</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {['date', 'kpi', 'value', 'notes'].map((field) => (
                                        <div key={field}>
                                            <label className="block text-xs font-medium text-gray-400 mb-1 capitalize">{field} {field !== 'notes' ? '*' : ''}</label>
                                            <select value={(columnMapping as any)[field]} onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all">
                                                <option value="">—</option>
                                                {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>

                                {!columnMapping.kpi && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Apply to KPI (if no KPI column)</label>
                                        <select value={selectedKpi} onChange={(e) => setSelectedKpi(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all">
                                            <option value="">Select KPI...</option>
                                            {kpis.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Preview */}
                                {csvData.length > 0 && (
                                    <div className="overflow-x-auto max-h-48 rounded-lg border border-gray-800/50">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-gray-800/50">
                                                    {csvHeaders.map((h) => (
                                                        <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvData.slice(0, 5).map((row, i) => (
                                                    <tr key={i} className="border-b border-gray-800/30">
                                                        {csvHeaders.map((h) => (
                                                            <td key={h} className="px-3 py-1.5 text-gray-300">{row[h]}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Errors */}
                                {csvErrors.length > 0 && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        {csvErrors.slice(0, 5).map((err, i) => (
                                            <p key={i} className="text-xs text-red-400 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 flex-shrink-0" /> {err}
                                            </p>
                                        ))}
                                        {csvErrors.length > 5 && <p className="text-xs text-red-500 mt-1">...and {csvErrors.length - 5} more</p>}
                                    </div>
                                )}

                                {importResult && (
                                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <p className="text-sm text-emerald-400">{importResult.success} rows imported successfully{importResult.errors > 0 ? `, ${importResult.errors} errors` : ''}</p>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button onClick={handleImport} disabled={importing || !columnMapping.date || !columnMapping.value}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-60 transition-all">
                                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        Import {csvData.length} Rows
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
