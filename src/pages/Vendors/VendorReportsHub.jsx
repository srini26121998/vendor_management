import React, { useState, useEffect } from 'react';
import { VCard, PrimaryBtn, SecondaryBtn, StatusBadge } from './VendorComponents';
import { VENDOR_ROUTES } from './vendorConstants';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PieChart, BarChart3, CreditCard, Search, RefreshCcw, Download, Filter, ChevronLeft, ChevronRight, Share2, Printer, ArrowRight, ArrowUp, ArrowDown, ArrowUpDown, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchReportKpis, fetchReportData, exportReport } from '../../api/vendorService';

const REPORT_CATEGORIES = [
    {
        key: 'master', name: 'Vendor Master Report',
        desc: 'Complete vendor directory with contact, compliance, and onboarding status.',
        icon: <FileText size={18} />, color: '#166534'
    },
    {
        key: 'po', name: 'PO Status Report',
        desc: 'Real-time tracking of all purchase orders across their lifecycle.',
        icon: <BarChart3 size={18} />, color: '#8b5cf6'
    },
    {
        key: 'performance', name: 'Vendor Performance',
        desc: 'Comprehensive scorecard analysis based on delivery TAT and quality.',
        icon: <PieChart size={18} />, color: '#10b981'
    },
    {
        key: 'payables', name: 'Payables Aging',
        desc: 'Strategic bucket analysis of outstanding vendor payments (0-90+ days).',
        icon: <CreditCard size={18} />, color: '#f59e0b'
    }
];

const COLUMN_CONFIG = {
    master: [
        { col: 'vendorCode', label: 'Code' },
        { col: 'name', label: 'Vendor Name' },
        { col: 'category', label: 'Category' },
        { col: 'gstin', label: 'GSTIN' },
        { col: 'complianceStatus', label: 'Compliance' },
        { col: 'status', label: 'Status' }
    ],
    po: [
        { col: 'invoiceNumber', label: 'PO #' },
        { col: 'vendorName', label: 'Vendor Name' },
        { col: 'invoiceDate', label: 'Date' },
        { col: 'grandTotal', label: 'Total (inc. GST)' },
        { col: 'status', label: 'Status' }
    ],
    performance: [
        { col: 'vendorCode', label: 'Code' },
        { col: 'vendorName', label: 'Vendor Name' },
        { col: 'tier', label: 'Tier' },
        { col: 'overallScore', label: 'Score' },
        { col: 'onTimeDelivery', label: 'On-Time %' },
        { col: 'qualityScore', label: 'Quality %' }
    ],
    payables: [
        { col: 'vendorName', label: 'Vendor Name' },
        { col: 'totalOutstanding', label: 'Outstanding' },
        { col: 'current', label: '0-30 Days' },
        { col: 'over90Days', label: '90+ Days' },
        { col: 'lastPaymentDate', label: 'Last Payment' },
        { col: 'status', label: 'Status' }
    ]
};

const PER_PAGE = 5;

function SortIcon({ col, sortCol, sortDir }) {
    if (sortCol !== col) return <ArrowUpDown size={11} className="ml-1 text-slate-300 inline-block" />;
    return sortDir === 'asc'
        ? <ArrowUp size={11} className="ml-1 text-green-800 inline-block" />
        : <ArrowDown size={11} className="ml-1 text-green-800 inline-block" />;
}

export default function VendorReportsHub() {
    const navigate = useNavigate();
    
    // UI State
    const [selectedKey, setSelectedKey] = useState('master');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [timePeriod, setTimePeriod] = useState('MONTH');
    const [sortCol, setSortCol] = useState('id');
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);

    // Data State
    const [kpis, setKpis] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, pageSize: PER_PAGE, totalPages: 1, totalRecords: 0 });
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Data on filter change
    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Fetch KPIs
                const kpiRes = await fetchReportKpis(selectedKey, timePeriod);
                if (isMounted && kpiRes?.kpis) {
                    setKpis(kpiRes.kpis);
                }

                // Fetch Table Data
                const reqPayload = {
                    reportType: selectedKey,
                    searchQuery: search,
                    statusFilter: statusFilter === 'all' ? null : statusFilter,
                    sortBy: sortCol,
                    sortDirection: sortDir,
                    timePeriod: timePeriod
                };
                const dataRes = await fetchReportData(reqPayload, page - 1, PER_PAGE);
                if (isMounted && dataRes) {
                    setTableData(dataRes.data || []);
                    if (dataRes.pagination) {
                        setPagination(dataRes.pagination);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch report data:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // Debounce to avoid spamming the backend during typing
        const timeoutId = setTimeout(() => {
            loadData();
        }, 300);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [selectedKey, search, statusFilter, sortCol, sortDir, page, timePeriod]);

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
        setKpis([]);
        setTableData([]);
    };

    const handleExport = async () => {
        const toastId = toast.loading('Generating Excel export...');
        try {
            const reqPayload = {
                reportType: selectedKey,
                searchQuery: search,
                statusFilter: statusFilter === 'all' ? null : statusFilter,
                timePeriod: timePeriod,
                format: 'EXCEL'
            };
            const response = await exportReport(reqPayload);
            const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${selectedKey}_report.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('Export downloaded successfully!', { id: toastId });
        } catch (err) {
            console.error('Export error:', err);
            toast.error('Failed to export report.', { id: toastId });
        }
    };

    const labelCls = "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5";
    const columns = COLUMN_CONFIG[selectedKey] || [];

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
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 border-b-4 border-b-green-800">
                                <button onClick={() => toast.success('Link copied to clipboard!')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <Share2 size={14} className="text-green-800" /> Copy Link
                                </button>
                                <button onClick={() => toast.success('Emailing report...')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <FileText size={14} className="text-slate-400" /> Email as PDF
                                </button>
                            </div>
                        </div>
                        <SecondaryBtn icon={<Printer size={14} />} onClick={() => window.print()}>Print Matrix</SecondaryBtn>
                        <PrimaryBtn icon={<Download size={14} />} onClick={handleExport}>Export Hub</PrimaryBtn>
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
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selectedKey === r.key ? 'bg-green-50 text-green-800 border-green-200 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                        <span className={`${selectedKey === r.key ? 'text-green-800' : 'text-slate-400'}`}>{r.icon}</span>
                                        <div className="text-left overflow-hidden">
                                            <div className="text-[13px] font-bold truncate">{r.name}</div>
                                            <div className={`text-[9px] font-bold uppercase ${selectedKey === r.key ? 'text-green-600' : 'text-slate-400'}`}>Insights Available</div>
                                        </div>
                                    </button>
                                ))}
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
                                    {kpis.length === 0 && isLoading ? (
                                        Array(4).fill(0).map((_, i) => (
                                            <VCard key={i} className="animate-pulse">
                                                <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
                                                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                                            </VCard>
                                        ))
                                    ) : (
                                        kpis.map((stat, i) => {
                                            const numValue = parseInt(String(stat.value).replace(/[^0-9.]/g, '')) || 0;
                                            return (
                                                <VCard key={i} noPad className="relative overflow-hidden flex flex-col justify-center">
                                                    <div className="px-4 py-3 flex items-center justify-between gap-2">
                                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</label>
                                                        <div className="text-[20px] font-bold text-slate-800 tracking-tight leading-none">{stat.value}</div>
                                                    </div>
                                                    <div className="w-full h-1 bg-slate-100 absolute bottom-0 left-0">
                                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, numValue)}%` }}
                                                            className="h-full bg-green-500" />
                                                    </div>
                                                </VCard>
                                            );
                                        })
                                    )}
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
                                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-white text-[13px] font-bold focus:border-green-800 outline-none transition-all shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="w-full md:w-48">
                                            <label className={labelCls}>Status</label>
                                            <select value={statusFilter}
                                                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                                className="w-full text-[13px] font-bold border border-slate-200 rounded-lg px-4 py-2.5 bg-white outline-none shadow-sm">
                                                <option value="all">All Statuses</option>
                                                <option value="ACTIVE">Active / Processed</option>
                                                <option value="PENDING">Pending / Normal</option>
                                                <option value="OVERDUE">Overdue / Blocked</option>
                                            </select>
                                        </div>
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <SecondaryBtn icon={<Filter size={14} />}>Advanced</SecondaryBtn>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase ">Time Period:</span>
                                            {['TODAY', 'WEEK', 'MONTH', 'YEAR'].map(p => (
                                                <button key={p} onClick={() => setTimePeriod(p)}
                                                    className={`text-[10px] font-bold px-4 py-1.5 rounded-full border transition-all ${timePeriod === p ? 'bg-green-50 text-green-800 border-green-200 shadow-sm' : 'text-slate-400 border-transparent hover:border-slate-200'}`}>
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </VCard>

                                {/* Table */}
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative">
                                    {isLoading && (
                                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-100">
                                                <Loader2 size={16} className="text-green-800 animate-spin" />
                                                <span className="text-[12px] font-bold text-slate-600">Loading data...</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
                                        <h3 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">Detailed Report Records</h3>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase ">{pagination.totalRecords} Results</span>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                <tr>
                                                    {columns.map(({ col, label }) => (
                                                        <th key={col}
                                                            onClick={() => handleSort(col)}
                                                            className={`px-6 py-4 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap ${sortCol === col ? 'text-slate-800' : ''}`}>
                                                            {label}
                                                            <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />
                                                        </th>
                                                    ))}
                                                    {selectedKey === 'master' && (
                                                        <th className="px-6 py-4 text-right">Action</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="">
                                                {tableData.length === 0 && !isLoading ? (
                                                    <tr>
                                                        <td colSpan={10} className="px-5 py-10 text-center text-slate-400 font-bold text-[12px]">
                                                            No records match the current filters
                                                        </td>
                                                    </tr>
                                                ) : tableData.map((row, idx) => (
                                                    <tr key={row.id || idx} className="bg-white even:bg-slate-50/50 hover:bg-green-50/30 transition-all duration-200 border-b border-slate-200 last:border-0 text-[13px]">
                                                        {columns.map(({ col }) => (
                                                            <td key={col} className="px-6 py-3.5 whitespace-nowrap bg-inherit">
                                                                {col === 'status' || col === 'complianceStatus' ? (
                                                                    <StatusBadge status={row[col]} size="xs" />
                                                                ) : col.toLowerCase().includes('amount') || col.includes('outstanding') || col.includes('current') || col.includes('Days') ? (
                                                                    <span className="font-bold text-slate-700">₹{row[col] || 0}</span>
                                                                ) : (
                                                                    <span className={col.toLowerCase().includes('code') ? "font-mono font-bold text-green-800 text-[12px]" : "font-bold text-slate-800"}>
                                                                        {row[col] || '—'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        ))}
                                                        {selectedKey === 'master' && (
                                                            <td className="px-6 py-3.5 text-right">
                                                                <button
                                                                    onClick={() => navigate(`${VENDOR_ROUTES.detail}/${row.id}`)}
                                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 text-[10px] font-bold rounded-full uppercase tracking-wider transition-all shadow-sm">
                                                                    Profile <ArrowRight size={11} />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className="px-6 py-4 bg-white flex items-center justify-between gap-4 flex-wrap">
                                        <span className="text-[11px] text-slate-400 font-bold">
                                            {pagination.totalRecords === 0
                                                ? 'No records'
                                                : `Showing ${pagination.page * pagination.pageSize + 1}–${Math.min((pagination.page + 1) * pagination.pageSize, pagination.totalRecords)} of ${pagination.totalRecords} records`
                                            }
                                        </span>
                                        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                                            <button
                                                disabled={!pagination.hasPrevious}
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                                Prev
                                            </button>
                                            
                                            <div className="flex items-center gap-1 px-2 border-x border-slate-100">
                                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                    let p = i + 1;
                                                    if (pagination.totalPages > 5 && page > 3) p = page - 2 + i;
                                                    if (p > pagination.totalPages) return null;
                                                    return (
                                                        <button key={p} onClick={() => setPage(p)}
                                                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-[13px] font-bold transition-all duration-300 ${page === p ? 'bg-green-50 text-green-800 border-green-200 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                                                            {p}
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            <button
                                                disabled={!pagination.hasNext}
                                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                                className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-1">
                                                Next
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
