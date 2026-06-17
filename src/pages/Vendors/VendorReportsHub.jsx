import React, { useState, useMemo } from 'react';
import { VCard, SectionTitle, PrimaryBtn, SecondaryBtn, StatusBadge, VendorBreadcrumb } from './VendorComponents';
import { VENDOR_ROUTES } from './vendorConstants';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PieChart, BarChart3, CreditCard, Search, RefreshCcw, Download, Filter, ChevronLeft, ChevronRight, Share2, Printer, ArrowRight, ArrowUp, ArrowDown, ArrowUpDown, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useVendorStore from '../../store/useVendorStore';

const REPORT_CATEGORIES = [
    {
        key: 'master', name: 'Vendor Master Report',
        desc: 'Complete vendor directory with contact, compliance, and onboarding status.',
        icon: <FileText size={18} />, color: '#3b82f6',
        stats: [
            { label: 'Total Vendors', value: '42', accent: 'blue' },
            { label: 'Active', value: '38', accent: 'emerald' },
            { label: 'Pending Docs', value: '3', accent: 'amber' },
            { label: 'Risk Flagged', value: '1', accent: 'rose' }
        ]
    },
    {
        key: 'po', name: 'PO Status Report',
        desc: 'Real-time tracking of all purchase orders across their lifecycle.',
        icon: <BarChart3 size={18} />, color: '#8b5cf6',
        stats: [
            { label: 'Total POs', value: '156', accent: 'purple' },
            { label: 'Open', value: '24', accent: 'blue' },
            { label: 'Completed', value: '128', accent: 'emerald' },
            { label: 'Cancelled', value: '4', accent: 'rose' }
        ]
    },
    {
        key: 'performance', name: 'Vendor Performance',
        desc: 'Comprehensive scorecard analysis based on delivery TAT and quality.',
        icon: <PieChart size={18} />, color: '#10b981',
        stats: [
            { label: 'Avg Lead Time', value: '4.2 Days', accent: 'emerald' },
            { label: 'Quality Score', value: '94.5%', accent: 'blue' },
            { label: 'OTIF Rate', value: '88%', accent: 'amber' },
            { label: 'Disputes', value: '2', accent: 'rose' }
        ]
    },
    {
        key: 'payables', name: 'Payables Aging',
        desc: 'Strategic bucket analysis of outstanding vendor payments (0-90+ days).',
        icon: <CreditCard size={18} />, color: '#f59e0b',
        stats: [
            { label: 'Total Payable', value: '₹42.8L', accent: 'amber' },
            { label: 'Due < 30d', value: '₹12.5L', accent: 'blue' },
            { label: 'Overdue', value: '₹4.2L', accent: 'rose' },
            { label: 'On Hold', value: '₹1.8L', accent: 'slate' }
        ]
    }
];

const PER_PAGE = 5;

function SortIcon({ col, sortCol, sortDir }) {
    if (sortCol !== col) return <ArrowUpDown size={11} className="ml-1 text-slate-300 inline-block" />;
    return sortDir === 'asc'
        ? <ArrowUp size={11} className="ml-1 text-blue-600 inline-block" />
        : <ArrowDown size={11} className="ml-1 text-blue-600 inline-block" />;
}

export default function VendorReportsHub() {
    const navigate = useNavigate();
    const { vendors } = useVendorStore();
    const [selectedKey, setSelectedKey] = useState('master');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [timePeriod, setTimePeriod] = useState('MONTH');
    const [sortCol, setSortCol] = useState('id');
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);

    const selectedReport = REPORT_CATEGORIES.find(r => r.key === selectedKey);

    const handleSort = (col) => {
        if (sortCol === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
        setPage(1);
    };

    const changeReport = (key) => {
        setSelectedKey(key);
        setSearch('');
        setStatusFilter('all');
        setPage(1);
        setSortCol('id');
        setSortDir('asc');
    };

    const filtered = useMemo(() => {
        let data = [...vendors];

        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(v =>
                v.name.toLowerCase().includes(q) ||
                v.id.toLowerCase().includes(q) ||
                (v.category || '').toLowerCase().includes(q)
            );
        }
        if (statusFilter !== 'all') {
            data = data.filter(v => v.status === statusFilter);
        }
        data.sort((a, b) => {
            let va = (a[sortCol] ?? '');
            let vb = (b[sortCol] ?? '');
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return data;
    }, [vendors, search, statusFilter, sortCol, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    const labelCls = "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5";

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Vendor Analytics Hub</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <SecondaryBtn icon={<Share2 size={14} />}>Share Report</SecondaryBtn>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 border-b-4 border-b-blue-600">
                                <button onClick={() => toast.success('Link copied to clipboard!')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <Share2 size={14} className="text-blue-500" /> Copy Link
                                </button>
                                <button onClick={() => navigate(VENDOR_ROUTES.whatsapp)} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-emerald-50 rounded-xl font-bold text-emerald-600 flex items-center gap-2 transition-all">
                                    <MessageSquare size={14} className="text-emerald-500" /> Share on WhatsApp
                                </button>
                                <button onClick={() => toast.success('Emailing report...')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <FileText size={14} className="text-slate-400" /> Email as PDF
                                </button>
                            </div>
                        </div>
                        <SecondaryBtn icon={<Printer size={14} />} onClick={() => window.print()}>Print Matrix</SecondaryBtn>
                        <PrimaryBtn icon={<Download size={14} />} onClick={() => toast.success('Exporting...')}>Export Hub</PrimaryBtn>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <VCard noPad className="overflow-hidden border-slate-200">
                            <div className="p-4 border-b border-slate-100 bg-white shadow-sm">
                                <h3 className="text-[12px] font-bold text-slate-400 uppercase ">Available Reports</h3>
                            </div>
                            <div className="p-2 space-y-1">
                                {REPORT_CATEGORIES.map(r => (
                                    <button key={r.key} onClick={() => changeReport(r.key)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedKey === r.key ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                        <span className={`${selectedKey === r.key ? 'text-white' : 'text-slate-400'}`}>{r.icon}</span>
                                        <div className="text-left overflow-hidden">
                                            <div className="text-[13px] font-bold truncate">{r.name}</div>
                                            <div className={`text-[9px] font-bold uppercase ${selectedKey === r.key ? 'text-blue-100' : 'text-slate-400'}`}>Insights Available</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </VCard>

                        <VCard className="!bg-white border-blue-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText size={16} className="text-blue-600" />
                                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Report Guide</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                                Use the sidebar to switch between master directory, status, and performance analytics.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                <span>LAST REFRESH: JUST NOW</span>
                            </div>
                        </VCard>
                    </div>

                    {/* Main */}
                    <div className="lg:col-span-3 space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div key={selectedKey}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.25 }}>

                                {/* KPI Strip */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    {selectedReport.stats.map((stat, i) => (
                                        <VCard key={i}>
                                            <label className={labelCls}>{stat.label}</label>
                                            <div className="text-[24px] font-bold text-slate-800 tracking-tight">{stat.value}</div>
                                            <div className="w-full h-1 mt-3 rounded-full bg-slate-100 overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: '70%' }}
                                                    className={`h-full rounded-full bg-${stat.accent}-500`} />
                                            </div>
                                        </VCard>
                                    ))}
                                </div>

                                {/* Filters */}
                                <VCard className="mb-6">
                                    <div className="flex flex-col md:flex-row items-end gap-4">
                                        <div className="flex-1 w-full">
                                            <label className={labelCls}>Search Records</label>
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" placeholder="Search by name, ID or category..."
                                                    value={search}
                                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-[13px] font-bold focus:border-blue-500 outline-none transition-all shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="w-full md:w-48">
                                            <label className={labelCls}>Status</label>
                                            <select value={statusFilter}
                                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                                className="w-full text-[13px] font-bold border border-slate-200 rounded-lg px-4 py-2.5 bg-white outline-none shadow-sm">
                                                <option value="all">All Statuses</option>
                                                <option value="active">Active</option>
                                                <option value="pending">Pending</option>
                                                <option value="blocked">Blocked</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <PrimaryBtn icon={<RefreshCcw size={14} />} onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1); toast.success('Data refreshed!'); }}>Refresh</PrimaryBtn>
                                            <SecondaryBtn icon={<Filter size={14} />}>Advanced</SecondaryBtn>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase ">Time Period:</span>
                                            {['TODAY', 'WEEK', 'MONTH'].map(p => (
                                                <button key={p} onClick={() => setTimePeriod(p)}
                                                    className={`text-[10px] font-bold px-3 py-1 rounded-lg border transition-all ${timePeriod === p ? 'bg-blue-50 text-blue-600 border-blue-100' : 'text-slate-400 border-transparent hover:border-slate-200'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <SecondaryBtn small className="!rounded-full !px-4" onClick={() => toast.success('Exporting Excel...')}>Excel</SecondaryBtn>
                                            <SecondaryBtn small className="!rounded-full !px-4" onClick={() => toast.success('Exporting PDF...')}>PDF</SecondaryBtn>
                                        </div>
                                    </div>
                                </VCard>

                                {/* Table */}
                                <VCard noPad className="overflow-hidden border-slate-200">
                                    <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center justify-between">
                                        <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">Detailed Report Records</h3>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase ">{filtered.length} Results</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left min-w-[640px]">
                                            <thead className="bg-white border-b border-slate-100 text-[10px] font-bold uppercase ">
                                                <tr>
                                                    {[
                                                        { col: 'id', label: 'ID' },
                                                        { col: 'name', label: 'Vendor Name' },
                                                        { col: 'category', label: 'Category' },
                                                        { col: 'rating', label: 'Rating' },
                                                        { col: 'status', label: 'Status' },
                                                    ].map(({ col, label }) => (
                                                        <th key={col}
                                                            onClick={() => handleSort(col)}
                                                            className={`px-5 py-3.5 text-left cursor-pointer select-none whitespace-nowrap transition-colors hover:bg-slate-100/80 ${sortCol === col ? 'text-blue-600' : 'text-slate-400'}`}>
                                                            {label}
                                                            <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                                                        </th>
                                                    ))}
                                                    <th className="px-5 py-3.5 text-right text-slate-400">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 text-[13px]">
                                                {paginated.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-bold text-[12px]">
                                                            No records match the current filters
                                                        </td>
                                                    </tr>
                                                ) : paginated.map((v) => (
                                                    <tr key={v.id} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-5 py-3.5 font-mono font-bold text-blue-600 text-[12px]">{v.id}</td>
                                                        <td className="px-5 py-3.5 font-bold text-slate-800">{v.name}</td>
                                                        <td className="px-5 py-3.5">
                                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                                                {v.category || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 font-bold text-slate-600">
                                                            {v.rating
                                                                ? <span className="text-amber-500">⭐ {v.rating}</span>
                                                                : <span className="text-slate-300">—</span>}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <StatusBadge status={v.status} size="xs" />
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right">
                                                            <button
                                                                onClick={() => navigate(`${VENDOR_ROUTES.detail}/${v.id}`)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all shadow-sm">
                                                                Profile <ArrowRight size={11} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="px-5 py-3.5 border-t border-slate-100 bg-white flex items-center justify-between gap-4 flex-wrap">
                                        <span className="text-[11px] text-slate-400 font-bold">
                                            {filtered.length === 0
                                                ? 'No records'
                                                : `Showing ${(safePage - 1) * PER_PAGE + 1}–${Math.min(safePage * PER_PAGE, filtered.length)} of ${filtered.length} records`
                                            }
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                disabled={safePage === 1}
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                                <ChevronLeft size={14} />
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <button key={p} onClick={() => setPage(p)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all ${safePage === p ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                            <button
                                                disabled={safePage === totalPages}
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </VCard>

                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
