import React, { useState, useEffect } from 'react';
import { formatCurrency, VENDOR_ROUTES } from './vendorConstants';
import { fetchPurchaseOrders } from '../../api/vendorService';
import { VCard, SectionTitle, StatusBadge, PrimaryBtn, SecondaryBtn, VendorBreadcrumb, VModal } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, TrendingUp, Package, AlertTriangle, CheckCircle, XCircle, ArrowRight, Activity, Box, ArrowLeftRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const OUTLETS = [
    { id: 'O1', name: 'Main Branch — Andheri', location: 'Mumbai', stock: 84, pending: 2, sales: '₹2.4L/day', icon: '🏢' },
    { id: 'O2', name: 'Bandra West Outlet', location: 'Mumbai', stock: 92, pending: 0, sales: '₹1.8L/day', icon: '🏪' },
    { id: 'O3', name: 'Powai Branch', location: 'Mumbai', stock: 61, pending: 5, sales: '₹1.2L/day', alert: true, icon: '🏭' },
    { id: 'O4', name: 'Thane Branch', location: 'Thane', stock: 78, pending: 1, sales: '₹0.9L/day', icon: '🏛️' },
];

export default function MultiOutletView() {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState('O1');
    const [transferModal, setTransferModal] = useState(false);
    const [transferData, setTransferData] = useState({ source: 'O2', item: 'Organic Wheat (10kg)', qty: 50 });

    const [pendingPOs, setPendingPOs] = useState([]);

    useEffect(() => {
        fetchPurchaseOrders()
            .then(data => setPendingPOs((Array.isArray(data) ? data : []).filter(p => p.status === 'pending')))
            .catch(() => setPendingPOs([]));
    }, []);

    const selected = OUTLETS.find(o => o.id === selectedId);
    const labelCls = "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1";

    const handleTransfer = () => {
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1500)),
            {
                loading: 'Initiating transfer protocol...',
                success: `Successfully transferred ${transferData.qty} units to ${selected.name}! 🚛`,
                error: 'Transfer failed. Check connectivity.',
            }
        );
        setTransferModal(false);
    };

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Multi-Outlet Central View</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <PrimaryBtn icon={<Box size={16} />} onClick={() => setTransferModal(true)}>
                            Stock Transfer
                        </PrimaryBtn>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* ── Sidebar: Outlet List ── */}
                    <div className="space-y-6">
                        <VCard noPad className="overflow-hidden border-slate-200">
                            <div className="p-4 border-b border-slate-50 bg-slate-50/30">
                                <h3 className="text-[12px] font-bold text-slate-400 uppercase ">Select Outlet</h3>
                            </div>
                            <div className="p-2 space-y-1">
                                {OUTLETS.map(outlet => (
                                    <button key={outlet.id} onClick={() => setSelectedId(outlet.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedId === outlet.id ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold ${selectedId === outlet.id ? 'bg-white/20' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                                            {outlet.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <div className="text-[13px] font-bold truncate">{outlet.name}</div>
                                            <div className={`text-[9px] font-bold uppercase ${selectedId === outlet.id ? 'text-blue-100' : 'text-slate-400'}`}>{outlet.location}</div>
                                        </div>
                                        {outlet.alert && <div className={`ml-auto w-2 h-2 rounded-full ${selectedId === outlet.id ? 'bg-white' : 'bg-rose-500'}`} />}
                                    </button>
                                ))}
                            </div>
                        </VCard>

                        <VCard className="!bg-white !border-blue-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Activity size={16} className="text-blue-600" />
                                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Global Chain Status</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-slate-500 font-medium">Avg Stock Health</span>
                                    <span className="text-[11px] font-bold text-emerald-600">82%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-slate-500 font-medium">Regional Coverage</span>
                                    <span className="text-[11px] font-bold text-blue-600">4 Zones</span>
                                </div>
                            </div>
                        </VCard>
                    </div>

                    {/* ── Main Content: Outlet Dashboard ── */}
                    <div className="lg:col-span-3 space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div key={selectedId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                                <VCard className="border-slate-200">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl border border-blue-100 shadow-sm">
                                                {selected.icon}
                                            </div>
                                            <div>
                                                <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">{selected.name}</h2>
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase  mt-0.5">
                                                    <MapPin size={12} className="text-slate-300" /> {selected.location} · <span className="text-emerald-500">Live View</span>
                                                </div>
                                            </div>
                                        </div>
                                        {selected.alert && (
                                            <div className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-pulse">
                                                <AlertTriangle size={14} /> Low Stock Critical
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                            <label className={labelCls}>Stock Health</label>
                                            <div className="flex items-end justify-between mb-2">
                                                <div className="text-[24px] font-bold text-slate-800">{selected.stock}%</div>
                                                <div className={`text-[11px] font-bold px-2 py-0.5 rounded ${selected.stock >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {selected.stock >= 80 ? 'Stable' : 'Risk'}
                                                </div>
                                            </div>
                                            <div className="w-full bg-white border border-slate-200 rounded-full h-1.5 overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${selected.stock}%` }} className={`h-full rounded-full ${selected.stock >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                            <label className={labelCls}>Pending GRNs</label>
                                            <div className="text-[24px] font-bold text-slate-800 flex items-center gap-3">
                                                {selected.pending}
                                                <Package size={20} className="text-slate-300" />
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Awaiting verification</p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                            <label className={labelCls}>Daily Revenue</label>
                                            <div className="text-[24px] font-bold text-slate-800 flex items-center gap-3">
                                                {selected.sales}
                                                <TrendingUp size={20} className="text-emerald-500" />
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Last 24 hours</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <PrimaryBtn icon={<ArrowLeftRight size={14} />} className="flex-1 justify-center !py-3 shadow-blue-100 shadow-lg" onClick={() => setTransferModal(true)}>
                                            Transfer Stock to Outlet
                                        </PrimaryBtn>
                                        <SecondaryBtn icon={<TrendingUp size={14} />} className="flex-1 justify-center !py-3" onClick={() => navigate(VENDOR_ROUTES.reports)}>
                                            View Full Analytics
                                        </SecondaryBtn>
                                    </div>
                                </VCard>
                            </motion.div>
                        </AnimatePresence>

                        {/* Awaiting HQ Approval Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">Chain POs Awaiting HQ Approval</h3>
                                <button onClick={() => navigate(VENDOR_ROUTES.approvalQueue)} className="text-[10px] font-bold text-blue-600 uppercase  hover:underline flex items-center gap-1">
                                    View Queue <ArrowRight size={10} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                {pendingPOs.map((po, i) => (
                                    <VCard key={i} className="group hover:border-blue-200 transition-all shadow-sm">
                                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 border border-slate-100 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <Package size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                                    <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{po.id}</span>
                                                    <h3 className="text-[16px] font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{po.vendor}</h3>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    <span className="text-slate-800 font-bold">{formatCurrency(po.amount)}</span>
                                                    <span className="opacity-30">|</span>
                                                    <span>{po.items} Items Total</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full md:w-auto shrink-0">
                                                <button onClick={() => toast.success(`Approved!`)}
                                                    className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2 uppercase ">
                                                    <CheckCircle size={14} /> Approve
                                                </button>
                                                <button onClick={() => toast.error(`Rejected`)}
                                                    className="flex-1 md:flex-none px-5 py-2.5 bg-white text-rose-600 border border-rose-100 text-[11px] font-bold rounded-lg hover:bg-rose-50 transition-all flex items-center justify-center gap-2 uppercase ">
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </div>
                                        </div>
                                    </VCard>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Transfer Stock Modal ── */}
            <VModal open={transferModal} onClose={() => setTransferModal(false)} title="Inter-Outlet Stock Transfer" width="max-w-xl">
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <Info size={18} className="text-blue-600 mt-0.5" />
                        <p className="text-[12px] text-blue-800 leading-relaxed">
                            You are initiating a stock transfer to <strong>{selected?.name}</strong>. Please specify the source outlet and the inventory items to be moved.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Source Outlet</label>
                            <select value={transferData.source} onChange={e => setTransferData(prev => ({ ...prev, source: e.target.value }))}
                                className="w-full text-[13px] font-bold border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50 focus:border-blue-500 outline-none">
                                {OUTLETS.filter(o => o.id !== selectedId).map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Item Category</label>
                            <select className="w-full text-[13px] font-bold border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50 focus:border-blue-500 outline-none">
                                <option>Grains & Pulses</option>
                                <option>Dairy Products</option>
                                <option>Packaging Material</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Search Inventory Item</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Start typing item name (e.g. Wheat, Rice)..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-[13px] font-medium focus:border-blue-500 outline-none transition-all" />
                        </div>
                    </div>

                    <VCard noPad className="border-slate-100">
                        <div className="p-4 bg-slate-50/50 flex items-center justify-between border-b border-slate-100">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Selection</span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">In Stock</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[13px] font-bold text-slate-800">{transferData.item}</p>
                                <p className="text-[10px] text-slate-400 font-medium">SKU: WH-10KG-01 · Source Stock: 420 Units</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="number" value={transferData.qty} onChange={e => setTransferData(prev => ({ ...prev, qty: e.target.value }))}
                                    className="w-16 text-center text-[13px] font-bold border border-slate-200 rounded-lg py-1.5 focus:border-blue-500 outline-none" />
                                <span className="text-[11px] font-bold text-slate-400">Units</span>
                            </div>
                        </div>
                    </VCard>

                    <div className="flex justify-end gap-3 pt-4">
                        <SecondaryBtn onClick={() => setTransferModal(false)}>Cancel</SecondaryBtn>
                        <PrimaryBtn onClick={handleTransfer} className="px-8 shadow-blue-100 shadow-lg">Confirm Transfer</PrimaryBtn>
                    </div>
                </div>
            </VModal>
        </div>
    );
}

const Info = ({ size, className }) => (
    <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);
