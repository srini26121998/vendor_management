import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, Package, AlertCircle,
    TrendingDown, Zap, ShoppingCart, Globe, Smartphone,
    CheckCircle, Clock, Trash2, Tag, Percent,
    BarChart3, Store, Layers, Filter, Plus,
    RefreshCw, Send, Download, ShieldCheck,
    MoreHorizontal, ChevronRight, Info,
    Eye, Settings, Bell, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    PageHeader, VCard, VendorBreadcrumb,
    PrimaryBtn, SecondaryBtn, VModal, VTable,
    StatusBadge
} from '../Vendors/VendorComponents';


const CATEGORIES = ['All Categories', 'Dairy', 'Bakery', 'Frozen', 'Produce', 'Meat'];
const STORES = ['All Stores', 'Mumbai Hub', 'Pune DC', 'Surat Cold Storage', 'Navi Mumbai Hub'];
const PUSH_CHANNELS = ['POS Terminals', 'Mobile App', 'E-commerce'];
const SALE_DURATIONS = ['Until Expiry', '24 Hours', '48 Hours', 'Custom End Date'];

export default function PredictiveExpiry() {
    const navigate = useNavigate();
    const [expiryWindow, setExpiryWindow] = useState('7 Days'); // '3 Days', '7 Days', '15 Days', 'Custom'
    const [customDays, setCustomDays] = useState(10);
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedStore, setSelectedStore] = useState('All Stores');

    const [items, setItems] = useState([]);

    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchMarkdown, setBatchMarkdown] = useState(10);


    // Dynamic Filtering Logic
    const filteredItems = items.filter(item => {
        // Expiry Window Filter
        let withinWindow = true;
        if (expiryWindow === '3 Days') withinWindow = item.daysToExpiry <= 3;
        else if (expiryWindow === '7 Days') withinWindow = item.daysToExpiry <= 7;
        else if (expiryWindow === '15 Days') withinWindow = item.daysToExpiry <= 15;
        else if (expiryWindow === 'Custom') withinWindow = item.daysToExpiry <= customDays;

        // Category Filter
        const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;

        // Store Filter
        const matchesStore = selectedStore === 'All Stores' || item.store === selectedStore;

        return withinWindow && matchesCategory && matchesStore;
    });

    const handleMarkdownChange = (id, percent) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, markdownPercent: Math.min(90, Math.max(0, percent)) } : item
        ));
    };

    const toggleFlashSale = (id) => {
        const item = items.find(i => i.id === id);
        if (!item.flashSale) {
            toast.success(`Flash Sale Prepared for ${item.name}`);
        }
        setItems(items.map(item =>
            item.id === id ? { ...item, flashSale: !item.flashSale } : item
        ));
    };

    const handleBatchApply = () => {
        setItems(items.map(item => ({ ...item, markdownPercent: batchMarkdown })));
        setShowBatchModal(false);
        toast.success(`Applied ${batchMarkdown}% Markdown to all items`);
    };

    const calculateMarkdownPrice = (original, percent) => {
        return (original * (1 - percent / 100)).toFixed(2);
    };

    const getSuggestedMarkdown = (days) => {
        if (days <= 3) return 50;
        if (days <= 7) return 25;
        if (days <= 15) return 10;
        return 5;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Control Center Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <button onClick={() => navigate(-1)} className="p-2.5 rounded-2xl bg-white text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all border border-slate-200 shadow-sm active:scale-95">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    Predictive Expiry Control Center
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-100">AI Engine Active</span>
                                </h1>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Automated Markdown Logic & POS Channel Synchronization</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">

                            <PrimaryBtn
                                className="!rounded-xl shadow-lg shadow-blue-100"
                                icon={<Zap size={16} />}
                                onClick={() => {
                                    setItems(items.map(item => ({ ...item, flashSale: true })));
                                    toast.success("All items pushed to Flash Sale channels");
                                }}
                            >
                                Mass Flash Push
                            </PrimaryBtn>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8">

                {/* ADVANCED FILTERING SUITE */}
                <VCard className="p-8 shadow-xl border-slate-100 bg-white/50 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                        {/* Expiry Window */}
                        <div className="lg:col-span-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={14} className="text-blue-500" /> Observation Window
                                </label>
                                {expiryWindow === 'Custom' && <span className="text-[11px] font-bold text-blue-600">{customDays} Days</span>}
                            </div>
                            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                                {['3 Days', '7 Days', '15 Days', 'Custom'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setExpiryWindow(tab)}
                                        className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all uppercase tracking-tight ${expiryWindow === tab ? 'bg-white text-blue-600 shadow-lg border border-slate-100 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Days Input */}
                        <AnimatePresence>
                            {expiryWindow === 'Custom' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="lg:col-span-2 space-y-3"
                                >
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Threshold</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            min="1" max="60"
                                            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-[14px] font-black text-slate-700 focus:border-blue-500 outline-none transition-all shadow-sm"
                                            value={customDays}
                                            onChange={(e) => setCustomDays(e.target.value)}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Category & Store Filters */}
                        <div className={`space-y-3 ${expiryWindow === 'Custom' ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Inventory Segment</label>
                            <div className="relative group">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <select
                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-[13px] font-black text-slate-600 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className={`space-y-3 ${expiryWindow === 'Custom' ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Distribution Node</label>
                            <div className="relative group">
                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <select
                                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-[13px] font-black text-slate-600 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none"
                                    value={selectedStore}
                                    onChange={(e) => setSelectedStore(e.target.value)}
                                >
                                    {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </VCard>

                {/* ANALYTICS FEED */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                                <TrendingDown size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">High-Risk Expiry Queue</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time markdown control & push history</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-tighter">{filteredItems.length} Items requiring action</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {filteredItems.length === 0 ? (
                            <VCard className="p-20 text-center bg-slate-50/50 border-dashed border-2 border-slate-200 !rounded-[3rem]">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100">
                                    <ShieldCheck size={40} className="text-slate-200" />
                                </div>
                                <h4 className="text-xl font-black text-slate-400 uppercase tracking-tight">System Integrity Verified</h4>
                                <p className="text-[12px] text-slate-400 font-bold uppercase mt-2">No critical expiry threats detected in the selected window.</p>
                            </VCard>
                        ) : (
                            filteredItems.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <VCard className="p-0 border-slate-100 shadow-xl relative overflow-hidden group hover:border-blue-200 transition-all !rounded-[2.5rem] bg-white">
                                        <div className="flex flex-col lg:flex-row min-h-[220px]">

                                            {/* Product Identity Block */}
                                            <div className="lg:w-[320px] p-8 bg-slate-50/50 border-r border-slate-100 flex flex-col justify-between relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600" />

                                                <div className="space-y-6">
                                                    <div className="flex justify-between items-start">
                                                        <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border ${item.daysToExpiry <= 3 ? 'bg-rose-500 text-white border-rose-400' :
                                                            item.daysToExpiry <= 7 ? 'bg-amber-400 text-white border-amber-300' : 'bg-blue-500 text-white border-blue-400'}`}>
                                                            {item.daysToExpiry} Days Remaining
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{item.id}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-900 leading-[1.2] mb-2">{item.name}</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase">{item.category}</span>
                                                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase">{item.store}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-8 grid grid-cols-2 gap-4">
                                                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">MSRP</p>
                                                        <p className="text-[14px] font-black text-slate-700">₹{item.originalPrice}</p>
                                                    </div>
                                                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Expiry</p>
                                                        <p className="text-[13px] font-black text-rose-500">{item.expiryDate}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Markdown Architecture */}
                                            <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-center">

                                                {/* Pricing Logic */}
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Price Markdown Intensity</label>
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative flex-1 group">
                                                                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
                                                                <input
                                                                    type="number"
                                                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-[18px] font-black text-blue-600 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                                                                    value={item.markdownPercent}
                                                                    onChange={(e) => handleMarkdownChange(item.id, parseInt(e.target.value) || 0)}
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleMarkdownChange(item.id, getSuggestedMarkdown(item.daysToExpiry))}
                                                                className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group border border-blue-100"
                                                                title="Suggest Optimal Price"
                                                            >
                                                                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                                                        <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest relative z-10">Optimized Listing Price</span>
                                                        <div className="text-3xl font-black italic mt-2 relative z-10">₹{calculateMarkdownPrice(item.originalPrice, item.markdownPercent)}</div>
                                                    </div>
                                                </div>

                                                {/* Omni-Channel Push */}
                                                <div className="space-y-6">
                                                    <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner group transition-all hover:bg-white hover:border-amber-200">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.flashSale ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-slate-200 text-slate-400'}`}>
                                                                    <Zap size={20} fill={item.flashSale ? "currentColor" : "none"} />
                                                                </div>
                                                                <div>
                                                                    <span className="text-[13px] font-black text-slate-800 tracking-tight block">Flash Sale</span>
                                                                    <span className={`text-[9px] font-black uppercase ${item.flashSale ? 'text-amber-600' : 'text-slate-400'}`}>
                                                                        {item.flashSale ? 'Live Broadcast' : 'Ready to push'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => toggleFlashSale(item.id)}
                                                                className={`w-14 h-7 rounded-full transition-all relative p-1 ${item.flashSale ? 'bg-amber-500 shadow-inner' : 'bg-slate-300'}`}
                                                            >
                                                                <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all transform ${item.flashSale ? 'translate-x-7' : 'translate-x-0'}`} />
                                                            </button>
                                                        </div>

                                                        {/* Push Channels */}
                                                        <div className="flex flex-wrap gap-2 opacity-100 transition-all">
                                                            {PUSH_CHANNELS.map(ch => (
                                                                <div
                                                                    key={ch}
                                                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 border ${item.flashSale && item.channels.includes(ch) ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-50' : 'bg-white text-slate-300 border-slate-100'}`}
                                                                >
                                                                    {ch === 'POS Terminals' ? <ShoppingCart size={12} /> :
                                                                        ch === 'Mobile App' ? <Smartphone size={12} /> : <Globe size={12} />}
                                                                    {ch}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Advanced Controls */}
                                                <div className="space-y-6">
                                                    <div className={`space-y-3 transition-all duration-500 ${item.flashSale ? 'opacity-100 scale-100' : 'opacity-40 grayscale'}`}>
                                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Lifecycle Duration</label>
                                                        <div className="relative">
                                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                            <select
                                                                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-12 pr-4 py-3 text-[12px] font-black text-slate-600 focus:bg-white focus:border-blue-500 outline-none transition-all appearance-none"
                                                                value={item.duration}
                                                                onChange={(e) => {
                                                                    const newItems = [...items];
                                                                    const i = newItems.findIndex(it => it.id === item.id);
                                                                    newItems[i].duration = e.target.value;
                                                                    setItems(newItems);
                                                                }}
                                                            >
                                                                {SALE_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => navigate(`analytics/${item.id}`)}
                                                            className="flex-1 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black text-slate-500 uppercase hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm active:scale-95"
                                                        >
                                                            Insights
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setItems(items.filter(i => i.id !== item.id));
                                                                toast.success(`Removed ${item.id} from control queue`);
                                                            }}
                                                            className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm active:scale-95"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Real-time Inventory Insight Bar */}
                                        <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-10">
                                                <div className="flex items-center gap-2.5">
                                                    <Layers size={14} className="text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">System Stock: <span className="text-slate-800">142 Units</span></span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <RefreshCw size={14} className="text-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">Sell-through Velocity: <span className="text-blue-600">8.2% / day</span></span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`details/${item.id}`)}
                                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-2 group"
                                            >
                                                Critical Detail Ledger <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </VCard>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* BATCH MODAL - REDESIGNED FOR PREMIUM AESTHETICS */}
            <VModal
                open={showBatchModal}
                onClose={() => setShowBatchModal(false)}
                title="Mass Inventory Control"
                width="max-w-lg"
            >
                <div className="relative overflow-hidden">
                    {/* Background Accents */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="p-8 space-y-8 relative z-10">
                        {/* Hero Section */}
                        <div className="flex flex-col items-center text-center space-y-5">
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 rounded-full scale-150 animate-pulse" />
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 border-4 border-white relative z-10">
                                    <Layers size={40} className="drop-shadow-md" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-slate-100">
                                    <Percent size={20} className="text-blue-600" />
                                </div>
                            </div>

                            <div>
                                <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Batch Markdown Engine</h4>
                                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-8">Mass Price Optimization & Inventory Clearance</p>
                            </div>
                        </div>

                        {/* Interactive Selector Area */}
                        <div className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 shadow-inner relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 block text-center relative z-10">Select Markdown Intensity</label>

                            <div className="flex items-center justify-center gap-10 relative z-10">
                                <button
                                    onClick={() => setBatchMarkdown(Math.max(0, batchMarkdown - 5))}
                                    className="w-14 h-14 bg-white rounded-3xl border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-300 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all duration-300 active:scale-95"
                                >
                                    -
                                </button>

                                <div className="flex flex-col items-center">
                                    <div className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 drop-shadow-sm select-none">
                                        {batchMarkdown}%
                                    </div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${batchMarkdown > 50 ? 'text-rose-500' : 'text-blue-500'}`}>
                                        {batchMarkdown > 50 ? 'Aggressive Clearance' : 'Standard Discount'}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setBatchMarkdown(Math.min(90, batchMarkdown + 5))}
                                    className="w-14 h-14 bg-white rounded-3xl border border-slate-200 flex items-center justify-center text-2xl font-black text-slate-300 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl transition-all duration-300 active:scale-95"
                                >
                                    +
                                </button>
                            </div>

                            {/* Scale Indicators */}
                            <div className="flex justify-between mt-8 px-4 relative z-10">
                                {[0, 25, 50, 75, 90].map(val => (
                                    <div key={val} className="flex flex-col items-center gap-1">
                                        <div className={`w-1 h-2 rounded-full ${batchMarkdown >= val ? 'bg-blue-600' : 'bg-slate-200'}`} />
                                        <span className={`text-[9px] font-black ${batchMarkdown === val ? 'text-blue-600 scale-125' : 'text-slate-300'} transition-all`}>{val}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Logic Warning */}
                        <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-[1.5rem] flex gap-4 backdrop-blur-sm">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0 shadow-sm border border-amber-200">
                                <Zap size={20} fill="currentColor" className="opacity-80" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[12px] font-bold text-amber-800 uppercase tracking-tight">Push Protocol Warning</p>
                                <p className="text-[11px] text-amber-600 font-medium leading-relaxed italic">
                                    Markdown applies immediately to POS. Flash sales channels require manual activation or 'Mass Push' command.
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 pt-2">
                            <button
                                onClick={() => setShowBatchModal(false)}
                                className="flex-1 px-8 py-4 bg-white border-2 border-slate-100 text-slate-400 text-[13px] font-black uppercase tracking-widest rounded-[1.5rem] hover:bg-slate-50 hover:text-slate-600 transition-all duration-300 active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBatchApply}
                                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-[13px] font-black uppercase tracking-widest rounded-[1.5rem] hover:shadow-2xl hover:shadow-blue-200 hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center justify-center gap-3"
                            >
                                <ShieldCheck size={20} />
                                Apply Markdown
                            </button>
                        </div>
                    </div>
                </div>
            </VModal>
        </div>
    );
}
