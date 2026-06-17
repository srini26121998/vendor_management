import React, { useState } from 'react';
import { PageHeader, VCard, SectionTitle, PrimaryBtn, SecondaryBtn } from './VendorComponents';
import toast from 'react-hot-toast';

const SECTIONS = [
    {
        title: 'Approval Thresholds', icon: '⚡', fields: [
            { label: 'PO Auto-Approve Below', type: 'number', defaultVal: '10000', suffix: '₹' },
            { label: 'Payment Approval Threshold', type: 'number', defaultVal: '50000', suffix: '₹' },
            { label: 'GRN Override Allow', type: 'select', options: ['Manager Only', 'Admin Only', 'Any Staff'] },
        ]
    },
    {
        title: 'Workflow Rules', icon: '🔄', fields: [
            { label: 'PO Approval Flow', type: 'select', options: ['Direct Approve', '1-Level Approval', '2-Level Approval'] },
            { label: 'GRN Auto-Match', type: 'toggle', defaultVal: true },
            { label: 'Invoice OCR Auto-Post', type: 'toggle', defaultVal: false },
        ]
    },
    {
        title: 'RBAC — Roles', icon: '👥', fields: [
            { label: 'Purchase Manager', type: 'text', defaultVal: 'Amit V.' },
            { label: 'Payment Approver', type: 'text', defaultVal: 'Finance Head' },
            { label: 'GRN Officer', type: 'text', defaultVal: 'Warehouse Team' },
        ]
    },
    {
        title: 'Notification Templates', icon: '📣', fields: [
            { label: 'WhatsApp Template — PO', type: 'textarea', defaultVal: 'PO #{po_id} approved. Amount ₹{amount}...' },
            { label: 'WhatsApp Template — Payment', type: 'textarea', defaultVal: 'Payment of ₹{amount} processed via {mode}...' },
        ]
    },
];

export default function VendorSettings() {
    const [toggles, setToggles] = useState({ grnMatch: true, ocrPost: false });

    const save = () => toast.success('Settings saved successfully! ✓');

    return (
        <div className="p-4 lg:p-6 space-y-4" style={{ fontFamily: '"Inter", sans-serif' }}>
            <PageHeader title="Vendor Settings & Configuration" subtitle="RBAC, workflow rules, thresholds, and templates"
                actions={<PrimaryBtn onClick={save}>Save All Settings</PrimaryBtn>}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SECTIONS.map((section, si) => (
                    <VCard key={si}>
                        <SectionTitle>{section.icon} {section.title}</SectionTitle>
                        <div className="space-y-3">
                            {section.fields.map((field, fi) => (
                                <div key={fi}>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">{field.label}</label>
                                    {field.type === 'toggle' ? (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setToggles(t => ({ ...t, [field.label]: !t[field.label] }))}
                                                className="relative inline-flex h-5 w-10 items-center rounded-full transition-colors"
                                                style={{ background: (toggles[field.label] ?? field.defaultVal) ? '#1E3A5F' : '#cbd5e1' }}>
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${(toggles[field.label] ?? field.defaultVal) ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                            <span className="text-xs text-slate-500">{(toggles[field.label] ?? field.defaultVal) ? 'Enabled' : 'Disabled'}</span>
                                        </div>
                                    ) : field.type === 'select' ? (
                                        <select defaultValue={field.options?.[0]}
                                            className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-400">
                                            {field.options?.map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    ) : field.type === 'textarea' ? (
                                        <textarea defaultValue={field.defaultVal} rows={2}
                                            className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none resize-none" />
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            {field.suffix && <span className="text-sm text-slate-400">{field.suffix}</span>}
                                            <input type={field.type} defaultValue={field.defaultVal}
                                                className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </VCard>
                ))}
            </div>

            <div className="flex justify-end gap-2">
                <SecondaryBtn onClick={() => toast.success('Reset to defaults')}>Reset Defaults</SecondaryBtn>
                <PrimaryBtn onClick={save}>Save All Settings</PrimaryBtn>
            </div>
        </div>
    );
}
