import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, BarChart3, ShoppingCart, Globe,
    AlertCircle, Download, Calendar, TrendingUp,
    ChevronDown, Filter, Info, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCard, VendorBreadcrumb,
    PrimaryBtn, SecondaryBtn, StatusBadge
} from '../Vendors/VendorComponents';
import toast from 'react-hot-toast';


const DATE_RANGES = ['Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'Last 60 Days', 'Last 90 Days'];

// Volume data for different date ranges
const VOLUME_DATA = {
    'Last 7 Days': [65, 45, 80, 55, 95, 75, 85],
    'Last 14 Days': [40, 60, 55, 70, 45, 80, 65, 50, 75, 90, 60, 80, 70, 85],
    'Last 30 Days': [65, 45, 80, 55, 95, 75, 85, 40, 60, 90, 70, 85, 50, 65, 80, 55, 72, 90, 45, 60, 85, 70, 55, 80, 65, 90, 75, 50, 85, 70],
    'Last 60 Days': [55, 70, 45, 80, 65, 90, 75, 50, 85, 70, 60, 80, 55, 65, 90, 45, 75, 80, 55, 70, 65, 85, 45, 60, 90, 70, 80, 55, 75, 65,
        65, 45, 80, 55, 95, 75, 85, 40, 60, 90, 70, 85, 50, 65, 80, 55, 72, 90, 45, 60, 85, 70, 55, 80, 65, 90, 75, 50, 85, 70],
    'Last 90 Days': [65, 45, 80, 55, 95, 75, 85, 40, 60, 90, 70, 85, 50, 65, 80, 55, 72, 90, 45, 60, 85, 70, 55, 80, 65, 90, 75, 50, 85, 70,
        55, 70, 45, 80, 65, 90, 75, 50, 85, 70, 60, 80, 55, 65, 90, 45, 75, 80, 55, 70, 65, 85, 45, 60, 90, 70, 80, 55, 75, 65,
        65, 45, 80, 55, 95, 75, 85, 40, 60, 90, 70, 85, 50, 65, 80, 55, 72, 90, 45, 60, 85, 70, 55, 80, 65, 90, 75, 50, 85, 70],
};

// Revenue is price * volume multiplier
const getRevenueData = (volumeData, price) =>
    volumeData.map(v => Math.round((v * price * 0.012)));

export default function ExpiryAnalytics() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [chartMode, setChartMode] = useState('volume'); // 'volume' | 'revenue'
    const [dateRange, setDateRange] = useState('Last 30 Days');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        // TODO: Replace with API call to /api/inventory/expiry/{id} when endpoint is available
        setItem(null);
    }, [id]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDateDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!item) return (
        <div className="p-20 text-center font-bold text-slate-400 text-[12px]">
            Item not found — expiry analytics API not yet connected.
        </div>
    );

    const rawVolumeData = VOLUME_DATA[dateRange] || VOLUME_DATA['Last 30 Days'];
    const rawRevenueData = getRevenueData(rawVolumeData, item.originalPrice);
    const chartData = chartMode === 'volume' ? rawVolumeData : rawRevenueData;
    const maxVal = Math.max(...chartData);
    // Show at most 12 bars for readability
    const displayCount = Math.min(chartData.length, 12);
    const step = Math.floor(chartData.length / displayCount);
    const displayData = chartData.filter((_, i) => i % step === 0).slice(0, displayCount);

    const daysLabel = dateRange.replace('Last ', '').replace(' Days', '');

    return (
        <div className="min-h-screen bg-slate-50 pb-20" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-40">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all border border-slate-200">
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <VendorBreadcrumb items={[
                                { label: 'Predictive Expiry', path: '/vendors/inventory/predictive-expiry' },
                                { label: 'Sales & Expiry Analytics' }
                            ]} />
                            <div className="flex items-center gap-2 mt-0.5">
                                <h2 className="text-[14px] font-bold text-slate-900">{item.name} Performance</h2>
                                <StatusBadge status="ACTIVE TRACKING" size="xs" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Date Range Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDateDropdown(v => !v)}
                                className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all"
                            >
                                <Calendar size={14} className="text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-600">{dateRange}</span>
                                <ChevronDown size={12} className={`text-slate-400 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {showDateDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50"
                                    >
                                        {DATE_RANGES.map(range => (
                                            <button
                                                key={range}
                                                onClick={() => {
                                                    setDateRange(range);
                                                    setShowDateDropdown(false);
                                                    toast.success(`Showing data for ${range}`);
                                                }}
                                                className={`w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-bold transition-all ${dateRange === range
                                                        ? 'bg-blue-50 text-blue-700'
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {range}
                                                {dateRange === range && <Check size={12} className="text-blue-600" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <PrimaryBtn
                            icon={<Download size={14} />}
                            onClick={() => toast.success('Generating performance report...')}
                        >
                            <span className="text-[11px]">Generate Report</span>
                        </PrimaryBtn>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <VCard className="p-4 bg-white border-slate-100 shadow-md group hover:border-blue-200 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><ShoppingCart size={18} /></div>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded-full">↑ 14%</span>
                        </div>
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase  mb-1">Total Unit Sales</h4>
                        <p className="text-[20px] font-bold text-slate-900 tracking-tight">1,248 Units</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">Aggregated across all stores</p>
                    </VCard>

                    <VCard className="p-4 bg-white border-slate-100 shadow-md group hover:border-emerald-200 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform"><TrendingUp size={18} /></div>
                            <span className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded-full">Optimal</span>
                        </div>
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase  mb-1">Sell-Through Rate</h4>
                        <p className="text-[20px] font-bold text-slate-900 tracking-tight">84.2%</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">Target benchmark: 80%</p>
                    </VCard>

                    <VCard className="p-4 bg-white border-slate-100 shadow-md group hover:border-rose-200 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform"><AlertCircle size={18} /></div>
                            <span className="text-[9px] font-bold text-rose-600 uppercase bg-rose-50 px-1.5 py-0.5 rounded-full">High Risk</span>
                        </div>
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase  mb-1">Projected Waste</h4>
                        <p className="text-[20px] font-bold text-slate-900 tracking-tight">₹450.00</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">Calculated at current velocity</p>
                    </VCard>

                    <VCard className="p-4 bg-white border-slate-100 shadow-md group hover:border-indigo-200 transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><Globe size={18} /></div>
                            <span className="text-[9px] font-bold text-indigo-600 uppercase bg-indigo-50 px-1.5 py-0.5 rounded-full">Live</span>
                        </div>
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase  mb-1">Digital Reach</h4>
                        <p className="text-[20px] font-bold text-slate-900 tracking-tight">3,482</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">App & E-commerce impressions</p>
                    </VCard>
                </div>

                {/* Chart Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <VCard className="lg:col-span-2 p-6 bg-white border-slate-100 shadow-xl flex flex-col" style={{ minHeight: 420 }}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-[13px] font-bold text-slate-900">Daily Sales Velocity Trend</h4>
                                <p className="text-[10px] font-medium text-slate-400 uppercase ">
                                    {chartMode === 'volume' ? 'Units sold' : 'Revenue (₹)'} · {dateRange}
                                </p>
                            </div>
                            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setChartMode('volume')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${chartMode === 'volume'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Volume
                                </button>
                                <button
                                    onClick={() => setChartMode('revenue')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${chartMode === 'revenue'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Revenue
                                </button>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="flex-1 relative" style={{ minHeight: 300 }}>
                            {/* Y-axis grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pb-8 pointer-events-none">
                                {[0, 25, 50, 75, 100].reverse().map(pct => (
                                    <div key={pct} className="flex items-center gap-2">
                                        <span className="text-[8px] font-bold text-slate-300 w-8 text-right shrink-0">
                                            {chartMode === 'volume'
                                                ? Math.round(maxVal * pct / 100)
                                                : `₹${Math.round(maxVal * pct / 100)}`}
                                        </span>
                                        <div className="flex-1 h-[1px] bg-slate-100" />
                                    </div>
                                ))}
                            </div>

                            {/* Bars */}
                            <div className="absolute inset-0 flex items-end pl-10 pr-2 pb-8 gap-1">
                                <AnimatePresence mode="wait">
                                    {displayData.map((val, i) => {
                                        const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                                        const dayOffset = i * step;
                                        return (
                                            <motion.div
                                                key={`${chartMode}-${dateRange}-${i}`}
                                                className="flex flex-col items-center flex-1 group"
                                            >
                                                <div className="relative w-full flex justify-center">
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                        {chartMode === 'volume' ? `${val} units` : `₹${val}`}
                                                    </div>
                                                    <motion.div
                                                        key={`bar-${chartMode}-${dateRange}-${i}`}
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${heightPct}%` }}
                                                        exit={{ height: 0 }}
                                                        transition={{ delay: i * 0.04, duration: 0.6, ease: 'easeOut' }}
                                                        className={`w-full max-w-[32px] rounded-t-xl cursor-pointer group-hover:opacity-90 transition-opacity shadow-sm ${chartMode === 'volume'
                                                                ? 'bg-gradient-to-t from-blue-600/90 to-indigo-400'
                                                                : 'bg-gradient-to-t from-emerald-600/90 to-teal-400'
                                                            }`}
                                                        style={{ minHeight: 4 }}
                                                    />
                                                </div>
                                                <span className="text-[8px] font-bold text-slate-400 mt-1.5 uppercase tracking-tighter">
                                                    M{dayOffset + 10}
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </VCard>

                    <div className="space-y-4">
                        <VCard className="p-5 bg-slate-900 text-white border-none shadow-2xl">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-blue-400">Channel Performance</h4>
                            <div className="space-y-4">
                                {[
                                    { label: 'In-Store POS', value: 72, color: 'bg-emerald-400' },
                                    { label: 'Mobile App Sales', value: 18, color: 'bg-blue-400' },
                                    { label: 'Web E-commerce', value: 10, color: 'bg-indigo-400' },
                                ].map((channel, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[11px] font-bold text-slate-300">{channel.label}</span>
                                            <span className="text-[11px] font-bold text-white">{channel.value}%</span>
                                        </div>
                                        <div className="w-full bg-white/10 h-1.5 rounded-full">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${channel.value}%` }}
                                                transition={{ delay: i * 0.15, duration: 0.8 }}
                                                className={`${channel.color} h-full rounded-full`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                    <Info size={12} className="inline mr-1.5 text-blue-400" />
                                    Mobile app sales surged 4.2% after the 2h-ago flash sale push.
                                </p>
                            </div>
                        </VCard>

                        <VCard className="p-5 bg-white border-slate-100 shadow-xl">
                            <h4 className="text-[10px] font-bold text-slate-900 mb-4 uppercase ">Optimization Recommendations</h4>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-[11px] font-bold">1</div>
                                    <div>
                                        <h5 className="text-[11px] font-bold text-slate-800">Increase Markdown</h5>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Push to 30% to clear 142 units within 48h.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-[11px] font-bold">2</div>
                                    <div>
                                        <h5 className="text-[11px] font-bold text-slate-800">Bundle Offer</h5>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Bundle with SKU-4421 (Greek Yogurt).</p>
                                    </div>
                                </div>
                            </div>
                            <PrimaryBtn className="w-full mt-6 !py-3" icon={<Filter size={14} />}>
                                <span className="text-[10px]">Apply Auto-Optimization</span>
                            </PrimaryBtn>
                        </VCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
