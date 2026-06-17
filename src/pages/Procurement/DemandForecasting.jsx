import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell
} from 'recharts';
import {
    VENDOR_ROUTES
} from '../Vendors/vendorConstants';

const STORE_LIST = [
    { id: 'S001', name: 'Main Warehouse - Mumbai' },
    { id: 'S002', name: 'Bandra Retail Outlet' },
    { id: 'S003', name: 'Pune Fulfillment Center' },
    { id: 'S004', name: 'Bangalore Hub' },
];

import { VCard, PrimaryBtn, SecondaryBtn, VendorBreadcrumb } from '../Vendors/VendorComponents';
import {
    TrendingUp, Calendar, Filter, Download,
    AlertTriangle, Package, Layers, RefreshCcw,
    ChevronRight, ArrowUpRight, ArrowDownRight,
    Search, FileText, Share2, Sparkles, ArrowLeft,
    CheckCircle2, Info, Loader2, Database, Zap,
    Sliders, Eye, EyeOff, Thermometer, Activity,
    ShieldCheck, BarChart2, PieChart as LPieChart
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DemandForecasting() {
    const navigate = useNavigate();

    // Filter & Parameter States
    const [selectedStores, setSelectedStores] = useState(['S001']);
    const [selectedCategories, setSelectedCategories] = useState(['all']);
    const [skuSearch, setSkuSearch] = useState('');
    const [dateRange, setDateRange] = useState('Last 12 weeks');
    const [leadTimeOverride, setLeadTimeOverride] = useState(5);
    const [safetyStockMultiplier, setSafetyStockMultiplier] = useState(1.0);
    const [includeSeasonality, setIncludeSeasonality] = useState(true);
    const [showOosDays, setShowOosDays] = useState(true);
    const [chartType, setChartType] = useState('area'); // Default to area for a premium look

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Recalibrating Forecasting Models...');
    const [lastRecalibrated, setLastRecalibrated] = useState('12 mins ago');
    const [chartData, setChartData] = useState([]);

    // KPI States
    const [kpiData, setKpiData] = useState({
        daysOfCover: 14.2,
        reorderPoint: 1150,
        safetyStock: 4280,
        currentStock: 12450,
        forecastAccuracy: 92.4
    });

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            simulateRecalculation();
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, [selectedStores, selectedCategories, safetyStockMultiplier, includeSeasonality]);

    const simulateRecalculation = () => {
        const factor = safetyStockMultiplier * (includeSeasonality ? 1.15 : 1.0);
        setKpiData(prev => ({
            ...prev,
            daysOfCover: parseFloat((14.2 * factor).toFixed(1)),
            reorderPoint: Math.round(1150 * factor),
            safetyStock: Math.round(4280 * factor),
            forecastAccuracy: parseFloat((92.4 - (Math.random() * 2)).toFixed(1))
        }));

        setChartData(prev => prev.map(d => ({
            ...d,
            forecast: Math.round((d.forecast || 0) * factor)
        })));
    };

    const handleExport = (type) => {
        const toastId = toast.loading(`Preparing ${type.toUpperCase()}...`);
        setTimeout(() => {
            toast.success(`${type.toUpperCase()} Exported!`, { id: toastId });
        }, 1500);
    };

    const getDocColor = (doc) => {
        if (doc < 7) return 'text-rose-600 bg-rose-50 border-rose-100';
        if (doc < 14) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    };

    return (
        <div className="min-h-screen w-full bg-[#F3F5F9] flex flex-col" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Professional Sticky Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-2 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm">
                            <ArrowLeft size={16} />
                        </button>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h1 className="text-[18px] font-bold text-slate-800 tracking-tight">Demand Forecasting</h1>
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-bold rounded-md uppercase tracking-widest">
                                    <Sparkles size={10} /> ALGORITHMIC
                                </div>
                            </div>
                            <VendorBreadcrumb items={[{ label: 'Procurement', path: '/vendors/procurement/smart-po' }, { label: 'Forecasting & Analytics' }]} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <PrimaryBtn small onClick={simulateRecalculation} icon={<RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />}>
                            Recalculate
                        </PrimaryBtn>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-5 max-w-[1600px] mx-auto w-full space-y-6">

                {/* 1. Filter & Parameter Controls */}
                <VCard className="border-slate-200 shadow-lg bg-white p-6">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                        <Sliders size={18} className="text-blue-600" />
                        <h2 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">Filter & Parameter Controls</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-6">
                        <div className="lg:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Store <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <select
                                    value={selectedStores[0]}
                                    onChange={e => setSelectedStores([e.target.value])}
                                    className="w-full pl-11 pr-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 h-11 focus:bg-white outline-none shadow-sm transition-all"
                                >
                                    <option value="all">All Stores</option>
                                    {STORE_LIST.map(s => <option key={s.id} value={s.id}>{s.name.split(' - ')[0]}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Category Selection */}
                        <div className="lg:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                            <select
                                value={selectedCategories[0]}
                                onChange={e => setSelectedCategories([e.target.value])}
                                className="w-full px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 h-11 focus:bg-white outline-none shadow-sm transition-all"
                            >
                                <option value="all">All Categories</option>
                                <option value="dairy">Dairy</option>
                                <option value="staples">Staples</option>
                                <option value="frozen">Frozen</option>
                            </select>
                        </div>

                        {/* SKU Search */}
                        <div className="lg:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SKU Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                <input
                                    type="text"
                                    placeholder="Min 2 chars..."
                                    value={skuSearch}
                                    onChange={e => setSkuSearch(e.target.value)}
                                    className="w-full pl-11 pr-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 h-11 focus:bg-white outline-none shadow-sm transition-all"
                                />
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="lg:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Range <span className="text-red-500">*</span></label>
                            <select
                                value={dateRange}
                                onChange={e => setDateRange(e.target.value)}
                                className="w-full px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 h-11 focus:bg-white outline-none shadow-sm transition-all"
                            >
                                <option>Last 12 weeks</option>
                                <option>Last 4 weeks</option>
                                <option>Last 26 weeks</option>
                                <option>Last 52 weeks</option>
                            </select>
                        </div>

                        {/* Lead Time Override */}
                        <div className="lg:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center block">Lead Time Override</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={leadTimeOverride}
                                    onChange={e => setLeadTimeOverride(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 text-center focus:bg-white outline-none"
                                />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Days</span>
                            </div>
                        </div>

                        {/* Safety Stock Multiplier */}
                        <div className="lg:col-span-1 space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center block">Safety Stock Mult.</label>
                            <div className="space-y-1">
                                <input
                                    type="range"
                                    min="0.5"
                                    max="3.0"
                                    step="0.1"
                                    value={safetyStockMultiplier}
                                    onChange={e => setSafetyStockMultiplier(parseFloat(e.target.value))}
                                    className="w-full accent-blue-600 h-1.5 rounded-lg appearance-none bg-slate-100 cursor-pointer"
                                />
                                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                    <span>0.5x</span>
                                    <span className="text-blue-600">{safetyStockMultiplier.toFixed(1)}x</span>
                                    <span>3.0x</span>
                                </div>
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="lg:col-span-2 flex items-center justify-around gap-4 pt-4">
                            <div className="flex items-center gap-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Seasonal Factor</label>
                                <button
                                    onClick={() => setIncludeSeasonality(!includeSeasonality)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${includeSeasonality ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${includeSeasonality ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Show OOS Days</label>
                                <button
                                    onClick={() => setShowOosDays(!showOosDays)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${showOosDays ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showOosDays ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </VCard>

                {/* 2. KPI Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                        { id: 'doc', label: 'Days of Cover', value: kpiData.daysOfCover, unit: 'Days', color: getDocColor(kpiData.daysOfCover) },
                        { id: 'rop', label: 'Reorder Point', value: kpiData.reorderPoint, unit: 'Units', icon: <Package size={16} />, color: 'bg-white border-slate-100 text-slate-800' },
                        { id: 'ssl', label: 'Safety Stock Level', value: kpiData.safetyStock, unit: 'Units', icon: <ShieldCheck size={16} />, color: 'bg-white border-slate-100 text-slate-800' },
                        { id: 'cs', label: 'Current Stock', value: kpiData.currentStock, unit: 'Units', icon: <Database size={16} />, color: 'bg-white border-slate-100 text-slate-800' },
                        { id: 'fa', label: 'Forecast Accuracy %', value: kpiData.forecastAccuracy, unit: '%', icon: <TrendingUp size={16} />, color: 'bg-white border-slate-100 text-emerald-600' },
                    ].map((kpi) => (
                        <VCard key={kpi.id} className="p-4 border-slate-200 shadow-sm transition-all hover:scale-[1.02] bg-white">
                            <p className="text-[10px] font-bold uppercase  opacity-70 mb-2">{kpi.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-[26px] font-bold tracking-tight">{kpi.value.toLocaleString()}</h3>
                                <span className="text-[12px] font-bold opacity-60 uppercase">{kpi.unit}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <div className="text-[9px] font-bold uppercase opacity-50">vs last period</div>
                                <div className="p-1.5 rounded-lg bg-black/5">
                                    {kpi.icon || <Thermometer size={14} />}
                                </div>
                            </div>
                        </VCard>
                    ))}
                </div>

                {/* 3. Main Dashboard Content */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Chart Area */}
                    <VCard className="lg:col-span-8 flex flex-col min-h-[500px] shadow-xl border-slate-200 bg-white p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-[16px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                    <Activity size={18} className="text-blue-600" /> Sales Velocity vs. Forecasted Demand
                                </h3>
                                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Algorithmic simulation based on current parameters</p>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <button
                                    onClick={() => setChartType('area')}
                                    className={`p-2 rounded-xl transition-all flex items-center gap-2 ${chartType === 'area' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Activity size={14} /> <span className="text-[10px] font-bold uppercase">Area</span>
                                </button>
                                <button
                                    onClick={() => setChartType('bar')}
                                    className={`p-2 rounded-xl transition-all flex items-center gap-2 ${chartType === 'bar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <BarChart2 size={14} /> <span className="text-[10px] font-bold uppercase">Bar</span>
                                </button>
                                <button
                                    onClick={() => setChartType('line')}
                                    className={`p-2 rounded-xl transition-all flex items-center gap-2 ${chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <TrendingUp size={14} /> <span className="text-[10px] font-bold uppercase">Line</span>
                                </button>
                                <button
                                    onClick={() => setChartType('pie')}
                                    className={`p-2 rounded-xl transition-all flex items-center gap-2 ${chartType === 'pie' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LPieChart size={14} /> <span className="text-[10px] font-bold uppercase">Pie</span>
                                </button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Historical</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Forecast</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative z-10">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center space-y-4">
                                    <Loader2 size={48} className="text-blue-600 animate-spin" />
                                    <p className="text-[14px] font-bold text-slate-600">{loadingMessage}</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'area' ? (
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                                            />
                                            <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                                            <Line type="monotone" dataKey="forecast" stroke="#cbd5e1" strokeDasharray="6 6" strokeWidth={3} dot={false} />
                                        </AreaChart>
                                    ) : chartType === 'bar' ? (
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                                            />
                                            <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="forecast" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    ) : chartType === 'line' ? (
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                                            />
                                            <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="forecast" stroke="#cbd5e1" strokeDasharray="6 6" strokeWidth={3} dot={false} />
                                        </LineChart>
                                    ) : (
                                        <RPieChart>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                                            />
                                            <Pie
                                                data={[
                                                    { name: 'Historical Sales', value: chartData.reduce((acc, curr) => acc + curr.sales, 0) },
                                                    { name: 'Projected Forecast', value: chartData.reduce((acc, curr) => acc + curr.forecast, 0) }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#3b82f6" />
                                                <Cell fill="#cbd5e1" />
                                            </Pie>
                                            <Legend verticalAlign="bottom" height={36} />
                                        </RPieChart>
                                    )}
                                </ResponsiveContainer>
                            )}
                        </div>
                    </VCard>

                    {/* Sidebar: Analytics & Insights */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* OOS Heatmap */}
                        <VCard className="shadow-lg border-slate-200 bg-white p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-amber-500" /> Out-of-Stock Heatmap
                                </h3>
                                <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-all text-slate-400">
                                    <Info size={16} />
                                </button>
                            </div>
                            <div className="space-y-6">
                                {[
                                    { sku: 'Basmati Rice 5kg', risk: 'High', days: 3, color: 'rose' },
                                    { sku: 'Sunflower Oil 1L', risk: 'Med', days: 7, color: 'amber' },
                                    { sku: 'Sugar S30 50kg', risk: 'Critical', days: 1, color: 'rose' }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-3">
                                        <div className="flex justify-between items-center text-[11px] font-bold">
                                            <span className="text-slate-600 uppercase tracking-tight">{item.sku}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] ${item.color === 'rose' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {item.days}D OoS RISK
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {Array.from({ length: 14 }).map((_, idx) => {
                                                const isActive = idx < (14 - item.days);
                                                return (
                                                    <div key={idx} className={`h-4 flex-1 rounded-sm border border-white transition-all ${isActive ? (idx > 10 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-rose-500'}`} />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-between text-[9px] font-bold text-slate-400 uppercase ">
                                <span>Day 1</span>
                                <span>Projected Inventory Status</span>
                                <span>Day 14</span>
                            </div>
                        </VCard>

                        {/* Lead Time Disruption Analysis */}
                        <VCard className="border-slate-200 shadow-md bg-white p-6 text-slate-800 overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 blur-2xl opacity-50" />
                            <h3 className="text-[12px] font-bold text-slate-400 mb-5 uppercase flex items-center gap-2 relative z-10">
                                <Zap size={16} className="text-blue-500" /> Disruption Simulator
                            </h3>
                            <div className="space-y-3 relative z-10">
                                <button className="w-full p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-2xl text-left transition-all group shadow-sm">
                                    <p className="text-[12px] font-bold text-slate-700 group-hover:text-blue-600">Logistics Strike Scenario</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">+5 Days Lead Time across all nodes</p>
                                </button>
                                <button className="w-full p-3.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 rounded-2xl text-left transition-all group shadow-sm">
                                    <p className="text-[12px] font-bold text-slate-700 group-hover:text-rose-600">Peak Festival Spike</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tight">+40% Demand Variance for Staples</p>
                                </button>
                            </div>
                        </VCard>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400">
                        <Info size={16} className="text-blue-500" />
                        Predictive models last synchronized: {lastRecalibrated}
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] text-slate-600 uppercase  hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                            <Share2 size={14} /> Share
                        </button>
                        <button onClick={() => handleExport('excel')} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-[11px] text-blue-600 uppercase  hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm">
                            <Download size={14} /> Export Data
                        </button>
                        <button onClick={() => handleExport('pdf')} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[11px] uppercase  hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 shadow-blue-200">
                            <FileText size={14} /> Generate Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
