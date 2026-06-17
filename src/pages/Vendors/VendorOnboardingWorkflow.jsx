import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ONBOARDING_STAGES, VENDOR_ROUTES } from './vendorConstants';
import { fetchVendors } from '../../api/vendorService';
import { PageHeader, VCard, PrimaryBtn, StatusBadge } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';

export default function VendorOnboardingWorkflow() {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        fetchVendors()
            .then(data => setVendors(Array.isArray(data) ? data : []))
            .catch(() => setVendors([]));
    }, []);

    // Group vendors by stage
    const vendorsByStage = ONBOARDING_STAGES.map((stage, index) => {
        return {
            ...stage,
            vendors: vendors.filter(v => v.onboardingStage === index)
        };
    });

    const handleVendorClick = (vendor) => {
        navigate(VENDOR_ROUTES.onboarding, { state: { vendor, mode: 'edit' } });
    };

    return (
        <div className="w-full min-h-screen p-4 sm:p-6"
            style={{
                fontFamily: '"Inter", sans-serif',
                background: 'linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                backgroundColor: '#F8FAFC'
            }}>
            <div className="w-full px-4 sm:px-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-[24px] font-bold text-[#1e293b] tracking-tight">Onboarding Pipeline</h1>
                        <p className="text-[11px] text-slate-400 mt-1 font-bold uppercase ">Live Departmental Verification Flow</p>
                    </div>
                    {/* <div className="flex items-center gap-3 shrink-0">
                        <PrimaryBtn onClick={() => navigate(VENDOR_ROUTES.onboarding)} className="!px-6 !py-2 !text-[12px] !rounded-xl shadow-lg shadow-blue-100">
                            + New Onboarding
                        </PrimaryBtn>
                    </div> */}
                </div>

                {/* The 'scrollbar-none' style hides the scrollbar line while allowing scrolling */}
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `}</style>
                <div className="flex gap-6 overflow-x-auto pb-10 items-stretch min-h-[75vh] px-2 pr-[200px] no-scrollbar">
                    {vendorsByStage.map((stage) => (
                        <div key={stage.key} className="flex-shrink-0 w-[310px] flex flex-col">
                            {/* Stage Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-white rounded-t-2xl border border-slate-200 border-b-0 shadow-sm">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-base grayscale opacity-70">{stage.icon}</span>
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase ">{stage.label}</h3>
                                </div>
                                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200">
                                    {stage.vendors.length}
                                </span>
                            </div>

                            {/* Vendor Cards in this Stage */}
                            <div className="flex-1 bg-white rounded-b-xl p-2.5 space-y-2.5 border border-slate-200 shadow-sm">
                                <AnimatePresence mode='popLayout'>
                                    {stage.vendors.length > 0 ? (
                                        stage.vendors.map((v) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={v.id}
                                                onClick={() => handleVendorClick(v)}
                                                className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-sm shadow-inner group-hover:bg-blue-50 transition-colors shrink-0">
                                                        🏢
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">{v.id}</p>
                                                            <div className="flex gap-1">
                                                                <div className="w-4 h-4 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-[8px] font-bold border border-emerald-100">✓</div>
                                                                <div className="w-4 h-4 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-[8px] font-bold border border-blue-100">📄</div>
                                                            </div>
                                                        </div>
                                                        <h4 className="text-[13px] font-bold text-slate-800 truncate mb-0.5">{v.name}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{v.category}</p>
                                                    </div>
                                                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] shadow-sm border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                                        →
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-bold text-slate-300 uppercase ">Modified</span>
                                                        <span className="text-[10px] font-bold text-slate-500">{v.lastUpdated}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{v.status}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-xl">
                                            <p className="text-[9px] font-bold text-slate-300 uppercase ">Queue Empty</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
