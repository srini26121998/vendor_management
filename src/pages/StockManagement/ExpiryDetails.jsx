import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Package, TrendingDown, Zap,
    ShieldCheck, Download, Trash2, Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
    VCard, VendorBreadcrumb,
    PrimaryBtn, SecondaryBtn, StatusBadge
} from '../Vendors/VendorComponents';


export default function ExpiryDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);

    useEffect(() => {
        // TODO: Replace with API call to /api/inventory/expiry/{id} when endpoint is available
        setItem(null);
    }, [id]);

    if (!item) return (
        <div className="p-10 text-center font-bold text-slate-400 text-[13px]">
            Item not found — expiry detail API not yet connected.
        </div>
    );

    const calculateMarkdownPrice = (original, percent) =>
        (original * (1 - percent / 100)).toFixed(2);

    return (
        <div className="min-h-screen bg-slate-50 pb-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all border border-slate-200">
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <VendorBreadcrumb items={[
                                { label: 'Predictive Expiry', path: '/vendors/inventory/predictive-expiry' },
                                { label: 'Item Intelligence' }
                            ]} />
                            <h2 className="text-[14px] font-bold text-slate-900">Product Expiry Intelligence</h2>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <SecondaryBtn icon={<Download size={14} />}>Export</SecondaryBtn>
                        <PrimaryBtn icon={<ShieldCheck size={14} />}>Authorize Markdown</PrimaryBtn>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-6xl mx-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Main Info Card */}
                    <VCard className="lg:col-span-2 p-5 space-y-4 bg-white shadow-md border-slate-100">

                        {/* Product Header */}
                        <div className="flex gap-5">
                            <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 shrink-0">
                                <Package size={40} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-[16px] font-bold text-slate-900 tracking-tight leading-tight">{item.name}</h3>
                                        <p className="text-slate-400 font-bold uppercase  text-[9px] mt-0.5">{item.id} | System Registered</p>
                                    </div>
                                    <StatusBadge status={item.daysToExpiry <= 3 ? 'CRITICAL' : 'WARNING'} size="sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 bg-slate-50 rounded-xl">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Category</span>
                                        <span className="text-[12px] font-bold text-slate-700">{item.category}</span>
                                    </div>
                                    <div className="p-2.5 bg-slate-50 rounded-xl">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Store Location</span>
                                        <span className="text-[12px] font-bold text-slate-700">{item.store}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preservation Strategy */}
                        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <TrendingDown size={120} />
                            </div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Zap size={14} className="text-amber-400" /> Preservation Strategy & Yield
                            </h4>
                            <div className="grid grid-cols-3 gap-4 relative z-10">
                                <div>
                                    <p className="text-[9px] font-bold text-indigo-200 uppercase  mb-1">Markdown Velocity</p>
                                    <p className="text-[18px] font-bold italic">High (+12%)</p>
                                    <div className="w-8 h-0.5 bg-amber-400 mt-1.5 rounded-full" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-indigo-200 uppercase  mb-1">Est. Recovery Yield</p>
                                    <p className="text-[18px] font-bold italic">₹{calculateMarkdownPrice(item.originalPrice * 142, 25)}</p>
                                    <p className="text-[9px] text-emerald-400 font-bold mt-1">Projected at 25% Markdown</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-indigo-200 uppercase  mb-1">Digital Push Reach</p>
                                    <p className="text-[18px] font-bold italic">2.4k Users</p>
                                    <p className="text-[9px] text-blue-300 font-bold mt-1">Geo-fenced mobile target</p>
                                </div>
                            </div>
                        </div>

                        {/* Lifecycle History */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Lifecycle History & Audit Trail</h4>
                                <span className="text-[9px] font-bold text-blue-600 uppercase cursor-pointer hover:underline">View Full Log</span>
                            </div>
                            <div className="space-y-2">
                                {[
                                    { event: 'Inbound Receipt', date: '2026-04-10', status: 'Completed', detail: 'Received at Mumbai Hub via Logistics ID: L-4402' },
                                    { event: 'Quality Check', date: '2026-04-10', status: 'Passed', detail: 'Visual and temperature check verified' },
                                    { event: 'Expiry Warning (15D)', date: '2026-04-26', status: 'Triggered', detail: 'Automated notification sent to store manager' },
                                    { event: 'Predictive Pricing Model', date: 'Today', status: 'Active', detail: 'Dynamic markdown suggestion: 25%' },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group">
                                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-blue-100 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-[12px] font-bold text-slate-800">{step.event}</span>
                                                <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded-md shrink-0">{step.status}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium truncate">{step.detail}</p>
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight">{step.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </VCard>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Stock Parameters */}
                        <VCard className="p-4 bg-white border-slate-100 shadow-md">
                            <h4 className="text-[9px] font-bold text-slate-400 uppercase  mb-3">Stock Parameters</h4>
                            <div className="space-y-3">
                                {[
                                    { label: 'Current Price', value: `₹${item.originalPrice}`, color: 'text-slate-900' },
                                    { label: 'Inventory Level', value: '142 Units', color: 'text-emerald-600' },
                                    { label: 'Expiry Date', value: item.expiryDate, color: 'text-rose-500' },
                                    { label: 'Days Remaining', value: `${item.daysToExpiry} Days`, color: item.daysToExpiry <= 3 ? 'text-rose-600' : 'text-blue-600' },
                                ].map((row, i, arr) => (
                                    <div key={i} className={`flex justify-between items-center ${i < arr.length - 1 ? 'pb-3 border-b border-slate-50' : ''}`}>
                                        <span className="text-[10px] font-bold text-slate-500">{row.label}</span>
                                        <span className={`text-[13px] font-bold ${row.color}`}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </VCard>

                        {/* Model Confidence */}
                        <VCard className="p-4 bg-slate-900 text-white border-none shadow-xl">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-white/10 rounded-lg text-blue-400"><Info size={14} /></div>
                                <h4 className="text-[10px] font-bold uppercase ">Model Confidence</h4>
                            </div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Pricing Accuracy</span>
                                <span className="text-[13px] font-bold text-emerald-400">98.4%</span>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full mb-4">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '98.4%' }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    className="bg-emerald-400 h-full rounded-full"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed italic">The prediction is based on 3 months of historical velocity data for this SKU in the Mumbai Hub cluster.</p>
                        </VCard>

                        {/* Write-off Button */}
                        <button className="w-full py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-bold uppercase  border border-rose-100 hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                            <Trash2 size={14} /> Mark as Damaged/Write-off
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
