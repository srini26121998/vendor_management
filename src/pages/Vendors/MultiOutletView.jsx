import React, { useState, useEffect } from 'react';
import { formatCurrency, VENDOR_ROUTES } from './vendorConstants';
import { fetchPurchaseOrders, searchGlobalInventory } from '../../api/vendorService';
import { VCard, SectionTitle, StatusBadge, PrimaryBtn, SecondaryBtn, VendorBreadcrumb, VModal } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, TrendingUp, Package, AlertTriangle, CheckCircle, XCircle, ArrowRight, Activity, Box, ArrowLeftRight, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const OUTLETS = [
    { id: 'O1', name: 'Main Branch — Andheri', location: 'Mumbai', stock: 84, pending: 2, sales: '₹2.4L/day', icon: <Building2 size={24} /> },
    { id: 'O2', name: 'Bandra West Outlet', location: 'Mumbai', stock: 92, pending: 0, sales: '₹1.8L/day', icon: <Building2 size={24} /> },
    { id: 'O3', name: 'Powai Branch', location: 'Mumbai', stock: 61, pending: 5, sales: '₹1.2L/day', alert: true, icon: <Building2 size={24} /> },
    { id: 'O4', name: 'Thane Branch', location: 'Thane', stock: 78, pending: 1, sales: '₹0.9L/day', icon: <Building2 size={24} /> },
];

export default function MultiOutletView() {
    const navigate = useNavigate();
    const [selectedId, setSelectedId] = useState('O1');
    const [transferModal, setTransferModal] = useState(false);
    const [transferData, setTransferData] = useState({ source: 'O2', item: 'Organic Wheat (10kg)', qty: 50 });

    const [globalSearch, setGlobalSearch] = useState('');
    const [searchResults, setSearchResults] = useState(null);

    const [pendingPOs, setPendingPOs] = useState([]);

    useEffect(() => {
        fetchPurchaseOrders()
            .then(data => setPendingPOs((Array.isArray(data) ? data : []).filter(p => p.status === 'pending')))
            .catch(() => setPendingPOs([]));
    }, []);

    const selected = OUTLETS.find(o => o.id === selectedId);
    const labelCls = "text-[12px] font-semibold text-slate-500 uppercase tracking-wider block mb-2";

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

    const handleSearch = async (e) => {
        const query = e.target.value;
        setGlobalSearch(query);
        if (query.length > 2) {
            try {
                const results = await searchGlobalInventory(query);
                if (results && results.length > 0 && results[0].outlets) {
                    setSearchResults(results[0].outlets);
                } else {
                    setSearchResults([]);
                }
            } catch (err) {
                console.error("Search failed", err);
                setSearchResults([]);
            }
        } else {
            setSearchResults(null);
        }
    };

    const initiateTransferFromSearch = (sourceOutletId, stockName) => {
        setTransferData({ source: sourceOutletId, item: stockName || globalSearch, qty: '' });
        setTransferModal(true);
    };

    return (
        <div className="w-full bg-[#F8FAFC] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="text-[13px] font-medium text-[#16a34a] mb-1 flex items-center gap-2">
                            <Activity size={14} /> Network Overview
                        </div>
                        <h1 className="text-[20px] font-extrabold text-slate-900 tracking-tight leading-none">Multi-Outlet Control</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/vendors/inventory/warehouse-map')} className="px-5 py-2.5 bg-[#e2f5e3] hover:bg-[#d1f0d3] border border-[#bbf7d0] text-slate-800 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-sm">
                            <MapPin size={14} /> Warehouse Map
                        </button>
                        <button onClick={() => setTransferModal(true)} className="px-5 py-2.5 bg-[#e2f5e3] hover:bg-[#d1f0d3] border border-[#bbf7d0] text-slate-800 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-sm">
                            <Box size={14} /> Initiate Transfer
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* ── Sidebar: Outlet List ── */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-[12px] font-bold text-slate-800 flex items-center gap-2">
                                    <Building2 size={14} className="text-[#16a34a]" /> Facilities
                                </h3>
                            </div>
                            <div className="p-3 space-y-1">
                                {OUTLETS.map(outlet => {
                                    const isSelected = selectedId === outlet.id;
                                    return (
                                        <button key={outlet.id} onClick={() => setSelectedId(outlet.id)}
                                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isSelected ? 'bg-white border border-[#bbf7d0] shadow-sm ring-1 ring-[#bbf7d0]' : 'bg-white hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
                                            
                                            <div className="flex-1 text-left">
                                                <div className={`text-[13px] font-bold mb-0.5 ${isSelected ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}>{outlet.name}</div>
                                                <div className={`text-[10px] font-semibold uppercase tracking-wider ${isSelected ? 'text-[#16a34a]' : 'text-slate-400'}`}>{outlet.location}</div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {outlet.alert && <div className={`w-2 h-2 rounded-full animate-pulse ${isSelected ? 'bg-rose-500' : 'bg-rose-400'}`} />}
                                                <ChevronRight size={16} className={`${isSelected ? 'text-[#16a34a]' : 'text-slate-300 opacity-0 group-hover:opacity-100'} transition-all transform ${isSelected ? 'translate-x-1' : ''}`} />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-slate-800 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <Activity size={16} className="text-[#16a34a]" />
                                    <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Network Health</h4>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Global Fulfillment Rate</span>
                                            <span className="text-[14px] font-bold text-slate-900">94%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                                            <div className="bg-[#16a34a] h-1.5 rounded-full" style={{ width: '94%' }}></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-4">
                                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Active Zones</span>
                                        <span className="text-[12px] font-bold text-slate-900">4 Regions</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Main Content: Outlet Dashboard ── */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* ── Global Inventory Search ── */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#16a34a]"></div>
                            
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Search size={14} /> Global Inventory Locator
                            </label>
                            <div className="relative group">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search any SKU (e.g., 'Wheat', 'Milk') to instantly locate stock across all facilities..."
                                    value={globalSearch}
                                    onChange={handleSearch}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 outline-none focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-50 transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <AnimatePresence>
                                {searchResults && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        className="border-t border-slate-100 overflow-hidden pt-6"
                                    >
                                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">Availability: <span className="text-[#16a34a]">{globalSearch}</span></div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {searchResults.map((res, i) => (
                                                <div key={i} className="bg-white border border-slate-200 hover:border-green-200 hover:shadow-md transition-all p-4 rounded-xl flex flex-col justify-between">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-[12px] font-bold text-slate-800">{res.outletName || res.outlet}</span>
                                                        <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${res.status === 'Excess' ? 'bg-green-50 text-green-700' : (res.status === 'Critical' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}`}>
                                                            {res.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <div className="text-[20px] font-extrabold text-slate-900 leading-none">{res.stock}</div>
                                                            <div className="text-[10px] text-slate-500 font-medium mt-1">Units Available</div>
                                                        </div>
                                                        {res.status === 'Excess' && res.outletId !== selectedId && (
                                                            <button
                                                                onClick={() => initiateTransferFromSearch(res.outletId, globalSearch)}
                                                                className="px-4 py-2 bg-[#e2f5e3] hover:bg-[#d1f0d3] border border-[#bbf7d0] text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all shadow-sm"
                                                            >
                                                                Transfer
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div key={selectedId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 sm:p-8">
                                    
                                    {/* Outlet Header */}
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shadow-inner border border-slate-200/60">
                                                {selected.icon}
                                            </div>
                                            <div>
                                                <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight mb-1">{selected.name}</h2>
                                                <div className="flex items-center gap-3 text-[12px] font-medium text-slate-500">
                                                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {selected.location}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span className="flex items-center gap-1.5 text-emerald-600"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span> Live Telemetry</span>
                                                </div>
                                            </div>
                                        </div>
                                        {selected.alert && (
                                            <div className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-100 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                                                <AlertTriangle size={14} className="text-rose-500" /> Critical Stock Levels
                                            </div>
                                        )}
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                                        <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Stock Health Index</label>
                                            <div className="flex items-end justify-between mb-4">
                                                <div className="text-[28px] font-extrabold text-slate-900 leading-none">{selected.stock}%</div>
                                                <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${selected.stock >= 80 ? 'bg-emerald-100/50 text-emerald-700' : 'bg-amber-100/50 text-amber-700'}`}>
                                                    {selected.stock >= 80 ? 'Optimal' : 'At Risk'}
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${selected.stock}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${selected.stock >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            </div>
                                        </div>
                                        
                                        <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-2">
                                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Pending GRNs</label>
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                    <Package size={14} />
                                                </div>
                                            </div>
                                            <div className="text-[28px] font-extrabold text-slate-900 leading-none mb-1">{selected.pending}</div>
                                            <p className="text-[11px] text-slate-500 font-medium">Awaiting QA verification</p>
                                        </div>
                                        
                                        <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                                            <div className="flex justify-between items-start mb-2">
                                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">24h Revenue</label>
                                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                    <TrendingUp size={14} />
                                                </div>
                                            </div>
                                            <div className="text-[28px] font-extrabold text-slate-900 leading-none mb-1">{selected.sales}</div>
                                            <p className="text-[11px] text-slate-500 font-medium">Compared to yesterday</p>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
                                        <button onClick={() => setTransferModal(true)} className="flex-1 px-5 py-3 bg-[#e2f5e3] hover:bg-[#d1f0d3] border border-[#bbf7d0] text-slate-800 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2 shadow-sm">
                                            <ArrowLeftRight size={16} /> Route Inventory to {selected.name.split(' ')[0]}
                                        </button>
                                        <button onClick={() => navigate(VENDOR_ROUTES.reports)} className="flex-1 px-5 py-3 bg-[#e2f5e3] hover:bg-[#d1f0d3] border border-[#bbf7d0] text-slate-800 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-2 shadow-sm">
                                            <Activity size={16} /> Deep Dive Analytics
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                    </div>
                </div>
            </div>

            {/* ── Transfer Stock Modal ── */}
            <VModal open={transferModal} onClose={() => setTransferModal(false)} title="Execute Inventory Transfer" width="max-w-2xl">
                <div className="space-y-6">
                    <div className="bg-green-50 p-5 rounded-xl border border-green-100 flex items-start gap-4">
                        <div className="mt-0.5 bg-green-100 p-1.5 rounded-lg text-green-700">
                            <Info size={20} />
                        </div>
                        <div>
                            <h4 className="text-[13px] font-bold text-slate-800 mb-1">Transfer Protocol Initiated</h4>
                            <p className="text-[12px] text-slate-600 leading-relaxed">
                                Routing stock to <strong className="text-slate-800">{selected?.name}</strong>. Please confirm source facility and allocate quantities below.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Source Facility</label>
                            <select value={transferData.source} onChange={e => setTransferData(prev => ({ ...prev, source: e.target.value }))}
                                className="w-full text-[13px] font-semibold border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all">
                                {OUTLETS.filter(o => o.id !== selectedId).map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Commodity Type</label>
                            <select className="w-full text-[13px] font-semibold border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all">
                                <option>Grains & Pulses</option>
                                <option>Dairy Products</option>
                                <option>Packaging Material</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Target SKU Locator</label>
                        <div className="relative group">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                            <input type="text" placeholder="Scan or type SKU name..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white focus:bg-white text-[13px] font-medium focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Selected Payload</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-md">Verified In Stock</span>
                        </div>
                        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
                            <div>
                                <p className="text-[14px] font-bold text-slate-900 mb-1">{transferData.item}</p>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">WH-10KG-01</span>
                                    <span>·</span>
                                    <span>Source Avail: <strong className="text-slate-700">420 Units</strong></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                <input type="number" value={transferData.qty} onChange={e => setTransferData(prev => ({ ...prev, qty: e.target.value }))}
                                    className="w-16 text-center text-[14px] font-bold border border-slate-200 rounded-lg py-1.5 focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all bg-white" />
                                <span className="text-[11px] font-bold text-slate-500 pr-2">Units</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
                        <button onClick={() => setTransferModal(false)} className="px-5 py-2 bg-white border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all">Cancel</button>
                        <button onClick={handleTransfer} className="px-5 py-2 bg-[#e2f5e3] hover:bg-[#d1f0d3] border border-[#bbf7d0] text-slate-800 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-sm">
                            <CheckCircle size={16} /> Execute Transfer
                        </button>
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
