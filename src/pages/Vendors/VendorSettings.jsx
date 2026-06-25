import React, { useState } from 'react';
import { PageHeader, VCard, PrimaryBtn, SecondaryBtn } from './VendorComponents';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const SECTIONS = [
    {
        title: 'Approval Thresholds', icon: '⚡', desc: 'Auto-approval limits and manual overrides.', fields: [
            { label: 'PO Auto-Approve Below', type: 'number', defaultVal: '10000', suffix: '₹' },
            { label: 'Payment Approval Threshold', type: 'number', defaultVal: '50000', suffix: '₹' },
            { label: 'GRN Override Allow', type: 'select', options: ['Manager Only', 'Admin Only', 'Any Staff'] },
        ]
    },
    {
        title: 'Workflow Rules', icon: '🔄', desc: 'Automated actions and routing for documents.', fields: [
            { label: 'PO Approval Flow', type: 'select', options: ['Direct Approve', '1-Level Approval', '2-Level Approval'] },
            { label: 'GRN Auto-Match', type: 'toggle', defaultVal: true },
            { label: 'Invoice OCR Auto-Post', type: 'toggle', defaultVal: false },
        ]
    },
    {
        title: 'RBAC — Roles', icon: '👥', desc: 'Key personnel assigned to vendor workflows.', fields: [
            { label: 'Purchase Manager', type: 'text', defaultVal: 'Amit V.' },
            { label: 'Payment Approver', type: 'text', defaultVal: 'Finance Head' },
            { label: 'GRN Officer', type: 'text', defaultVal: 'Warehouse Team' },
        ]
    }
];

export default function VendorSettings() {
    const [toggles, setToggles] = useState({});

    const save = () => toast.success('Settings saved successfully! ✓', {
        style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold' }
    });

    return (
        <div className="p-4 lg:p-8 w-full space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Vendor Settings & Configuration" 
                subtitle="Manage RBAC, workflow rules, and approval thresholds"
                actions={<PrimaryBtn onClick={save}>Save Settings</PrimaryBtn>}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {SECTIONS.map((section, si) => {
                    const isLastOddItem = si === SECTIONS.length - 1 && SECTIONS.length % 2 !== 0;
                    return (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: si * 0.1, duration: 0.4 }}
                        key={si}
                        className={isLastOddItem ? "lg:col-span-2" : ""}
                    >
                        <VCard className="h-full flex flex-col group hover:shadow-md border-slate-200/70 transition-all duration-300">
                            <div className="border-b border-slate-100 pb-4 mb-5">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-green-50 group-hover:text-green-700 group-hover:border-green-100 transition-colors shadow-sm">
                                        {section.icon}
                                    </div>
                                    <h2 className="text-[15px] font-extrabold text-slate-800 tracking-tight">{section.title}</h2>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium pl-11">{section.desc}</p>
                            </div>
                            
                            <div className={`flex-1 pl-2 ${isLastOddItem ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'space-y-5'}`}>
                                {section.fields.map((field, fi) => (
                                    <div key={fi} className="group/field flex flex-col justify-start">
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider group-hover/field:text-green-700 transition-colors">
                                            {field.label}
                                        </label>
                                        
                                        {field.type === 'toggle' ? (
                                            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 group-hover/field:border-green-100 group-hover/field:bg-green-50/30 transition-colors h-[42px] mt-auto">
                                                <span className={`text-xs font-bold ${(toggles[field.label] ?? field.defaultVal) ? 'text-green-800' : 'text-slate-600'}`}>
                                                    {(toggles[field.label] ?? field.defaultVal) ? 'Status: Enabled' : 'Status: Disabled'}
                                                </span>
                                                <button
                                                    onClick={() => setToggles(t => ({ ...t, [field.label]: !(t[field.label] ?? field.defaultVal) }))}
                                                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/20"
                                                    style={{ background: (toggles[field.label] ?? field.defaultVal) ? '#16a34a' : '#cbd5e1' }}>
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${(toggles[field.label] ?? field.defaultVal) ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        ) : field.type === 'select' ? (
                                            <div className="relative mt-auto">
                                                <select defaultValue={field.options?.[0]}
                                                    className="w-full text-[13px] font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 transition-all appearance-none cursor-pointer shadow-sm">
                                                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                                                    ▼
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative flex items-center mt-auto">
                                                <input type={field.type} defaultValue={field.defaultVal}
                                                    className="w-full text-[13px] font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 transition-all shadow-sm" 
                                                    style={{ paddingRight: field.suffix ? '2.5rem' : '1rem' }}
                                                />
                                                {field.suffix && (
                                                    <span className="absolute right-4 text-slate-400 font-bold text-xs pointer-events-none">
                                                        {field.suffix}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </VCard>
                    </motion.div>
                )})}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <SecondaryBtn onClick={() => toast.success('Reset to defaults', { icon: '🔄' })}>Reset Defaults</SecondaryBtn>
                <PrimaryBtn onClick={save}>Save All Settings</PrimaryBtn>
            </div>
        </div>
    );
}
