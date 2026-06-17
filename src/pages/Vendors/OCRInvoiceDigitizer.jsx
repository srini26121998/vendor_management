import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VENDOR_ROUTES } from './vendorConstants';
import { PageHeader, VCard, PrimaryBtn, SecondaryBtn, VendorBreadcrumb } from './VendorComponents';
import {
    ArrowLeft, Scan, FileText, CheckCircle2, AlertCircle,
    Bot, Cpu, UploadCloud, ShieldCheck, Zap, Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const STEPS = [
    { label: 'Upload', icon: '📤', desc: 'Ingest Document' },
    { label: 'Extracting', icon: '🧠', desc: 'AI Neural Process' },
    { label: 'Review', icon: '👁️', desc: 'Verify Field Data' },
    { label: 'Posted', icon: '✅', desc: 'Ledger Recorded' },
];

const CONFIDENCE_FIELD = ({ label, value, confidence, isLow }) => {
    const colorClass = confidence >= 90 ? 'text-emerald-600' : confidence >= 70 ? 'text-amber-600' : 'text-rose-600';
    return (
        <div className="space-y-1.5 mb-6">
            <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{label}</label>
                <div className={`text-[10px] font-bold ${colorClass} uppercase`}>
                    {confidence}% Confidence
                </div>
            </div>
            <input
                defaultValue={value}
                className={`w-full px-4 py-2.5 bg-white border ${isLow ? 'border-rose-300 ring-1 ring-rose-50' : 'border-slate-200'} rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm`}
            />
            {isLow && (
                <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle size={12} /> Low confidence verification required
                </p>
            )}
        </div>
    );
};

export default function OCRInvoiceDigitizer() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [extracting, setExtracting] = useState(false);

    const handleUpload = () => {
        setStep(1);
        setExtracting(true);
        setTimeout(() => {
            setExtracting(false);
            setStep(2);
            toast.success('AI Extraction Complete!');
        }, 3000);
    };

    const handlePost = () => {
        toast.success('Invoice recorded & posted to ledger!');
        navigate(VENDOR_ROUTES.purchaseInvoice);
    };

    return (
        <div className="min-h-screen w-full bg-[#F3F5F9] flex flex-col" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* ── Fixed Top Navigation ── */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(VENDOR_ROUTES.purchaseInvoice)} className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all border border-slate-200">
                        <ArrowLeft size={16} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            OCR Invoice Digitizer

                        </h1>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Neural Hub Online</span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* ── Left Sidebar: Stepper ── */}
                <div className="w-[340px] bg-white border-r border-slate-200 p-10 overflow-y-auto hidden lg:block">
                    <div className="space-y-12 relative">
                        {STEPS.map((s, i) => {
                            const active = i === step;
                            const done = i < step;
                            return (
                                <div key={i} className="relative z-10 flex items-start gap-4">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all border-2 flex-shrink-0
                                        ${done ? 'bg-blue-600 border-blue-600 text-white shadow-md' : active ? 'bg-white border-blue-600 text-blue-600 shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                        {done ? '✓' : i + 1}
                                    </div>
                                    <div className="pt-0.5">
                                        <p className={`text-[12px] font-bold uppercase tracking-wider leading-none ${active ? 'text-blue-600' : done ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</p>
                                        <p className="text-[12px] text-slate-400 font-medium mt-1.5">{s.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-24 p-6 rounded-2xl bg-white border border-slate-200 relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 rounded-full blur-[60px] -mr-12 -mt-12 opacity-10"></div>
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 mb-4">Digitization Guide</h4>
                        <p className="text-[12px] font-medium leading-relaxed text-slate-600 italic">
                            "AI-powered extraction reduces manual entry errors by 98% while ensuring GST compliance."
                        </p>
                        <div className="mt-6 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold font-mono text-slate-400">{Math.round((step / (STEPS.length - 1)) * 100)}%</span>
                        </div>
                    </div>
                </div>

                {/* ── Right Content ── */}
                <div className="flex-1 overflow-y-auto bg-[#F3F5F9] p-6 sm:p-12">
                    <div className="max-w-[1000px] mx-auto">
                        <AnimatePresence mode="wait">
                            {step === 0 && (
                                <motion.div key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-slate-200 hover:border-blue-300 transition-all group cursor-pointer text-center"
                                        onClick={handleUpload}>
                                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6 mx-auto group-hover:text-blue-500 transition-colors">
                                            <UploadCloud size={32} />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800 mb-2">Upload Strategic Invoice</h2>
                                        <p className="text-slate-500 text-[13px] font-medium max-w-sm mx-auto mb-8 leading-relaxed">
                                            Ingest invoice documents via OCR. Our neural engine will automatically map fields to your financial registry.
                                        </p>
                                        <div className="flex justify-center items-center gap-3">
                                            <PrimaryBtn className="px-8 shadow-blue-100 shadow-lg">
                                                <div className="flex items-center gap-2">
                                                    <Scan size={16} />
                                                    <span>Use Scanner</span>
                                                </div>
                                            </PrimaryBtn>
                                            <SecondaryBtn className="px-8 min-w-[180px]">
                                                Select File
                                            </SecondaryBtn>
                                        </div>
                                        <p className="mt-6 text-[10px] font-bold text-slate-300 uppercase ">
                                            Supports PDF, JPG, PNG & EDI Formats
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <VCard className="py-20 flex flex-col items-center justify-center text-center">
                                        <div className="relative mb-8">
                                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white animate-pulse">
                                                <Cpu size={32} />
                                            </div>
                                        </div>
                                        <h2 className="text-lg font-bold text-slate-800 mb-2">Neural Extraction in Progress</h2>
                                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-6">Mapping Fields • Validating GSTIN</p>
                                        <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 3 }}
                                                className="h-full bg-blue-600 rounded-full"
                                            />
                                        </div>
                                    </VCard>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Document Preview */}
                                    <VCard noPad className="overflow-hidden flex flex-col h-full border-slate-200">
                                        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Source Document</h3>
                                            <span className="text-[9px] font-bold bg-white text-slate-500 px-2 py-0.5 rounded border border-slate-200">SCAN #4012</span>
                                        </div>
                                        <div className="p-6 flex-1 bg-white font-mono text-[10px] text-slate-500 leading-relaxed overflow-y-auto">
                                            <div className="text-center text-[12px] font-bold text-slate-800 mb-4 uppercase border-b border-slate-100 pb-2">Tax Invoice</div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between"><span>INVOICE NO:</span><span className="font-bold text-slate-700">INV-2026-2046</span></div>
                                                <div className="flex justify-between"><span>DATE:</span><span className="font-bold text-slate-700">04 MAY 2026</span></div>
                                                <div className="flex justify-between"><span>VENDOR:</span><span className="font-bold text-slate-700 text-blue-600">SUNRISE FOODS PVT LTD</span></div>
                                            </div>
                                            <div className="my-4 border-t border-slate-100 pt-3 space-y-2">
                                                <div className="flex justify-between"><span>Basmati Rice 50Kg</span><span>₹4,750</span></div>
                                                <div className="flex justify-between"><span>Sunflower Oil 20L</span><span>₹2,900</span></div>
                                            </div>
                                            <div className="mt-6 pt-3 border-t-2 border-slate-900 space-y-1">
                                                <div className="flex justify-between font-bold"><span>SUBTOTAL</span><span>₹7,650</span></div>
                                                <div className="flex justify-between"><span>GST (18%)</span><span>₹1,377</span></div>
                                                <div className="flex justify-between text-[14px] font-bold text-slate-900 pt-1 border-t border-slate-100"><span>TOTAL</span><span>₹9,027</span></div>
                                            </div>
                                            <div className="mt-6 p-3 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-[10px] flex items-start gap-2 shadow-sm">
                                                <Zap size={14} className="text-blue-500 shrink-0" />
                                                <span>AI Match: GSTIN validated against Strategic Registry.</span>
                                            </div>
                                        </div>
                                    </VCard>

                                    {/* Extraction Results */}
                                    <VCard noPad className="overflow-hidden border-slate-200">
                                        <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                                            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Neural Extraction</h3>
                                            <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold">
                                                <ShieldCheck size={14} /> 6/7 VALIDATED
                                            </div>
                                        </div>
                                        <div className="p-6 overflow-y-auto" style={{ maxHeight: '500px' }}>
                                            <CONFIDENCE_FIELD label="Vendor Entity" value="Sunrise Foods Pvt Ltd" confidence={98} />
                                            <div className="grid grid-cols-2 gap-x-4">
                                                <CONFIDENCE_FIELD label="Invoice ID" value="INV-2026-2046" confidence={99} />
                                                <CONFIDENCE_FIELD label="Issuance Date" value="2026-05-04" confidence={96} />
                                            </div>
                                            <CONFIDENCE_FIELD label="Strategic GSTIN" value="27ABCDE1234F1Z5" confidence={99} />
                                            <div className="grid grid-cols-2 gap-x-4">
                                                <CONFIDENCE_FIELD label="Total Value" value="₹9,027" confidence={94} />
                                                <CONFIDENCE_FIELD label="Tax Liability" value="₹1,377" confidence={88} />
                                            </div>
                                            <CONFIDENCE_FIELD label="Notes Scribble" value="Expedite Payment" confidence={42} isLow />

                                            <div className="mt-4 flex gap-3">
                                                <PrimaryBtn onClick={handlePost} className="flex-1 shadow-blue-100 shadow-lg">
                                                    Post Invoice →
                                                </PrimaryBtn>
                                                <SecondaryBtn onClick={() => setStep(0)} className="px-6">
                                                    Discard
                                                </SecondaryBtn>
                                            </div>
                                        </div>
                                    </VCard>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
