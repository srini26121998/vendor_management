import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import { fetchInvoices } from '../../api/vendorService';
import {
    VCard, SectionTitle, StatusBadge, PrimaryBtn, SecondaryBtn, EmptyState, VendorBreadcrumb, MultiChart, ColumnConfig
} from './VendorComponents';
import { ArrowLeft, Settings, CreditCard, Database, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const PAYMENT_MODES = [
    { mode: 'NEFT', time: 'Same Day', icon: '🏦' }, { mode: 'RTGS', time: '2-4 hrs', icon: '⚡' },
    { mode: 'UPI', time: 'Instant', icon: '📱' }, { mode: 'Cheque', time: '2-3 days', icon: '📝' }, { mode: 'Cash', time: 'Instant', icon: '💵' },
];

const DONUT_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
const BUCKET_COLORS = {
    '0-30 DAYS': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    '31-60 DAYS': 'text-amber-600 bg-amber-50 border-amber-100',
    '61-90 DAYS': 'text-orange-600 bg-orange-50 border-orange-100',
    '90+ DAYS': 'text-rose-600 bg-rose-50 border-rose-100'
};

export default function PayablesDashboard() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [activeBucket, setActiveBucket] = useState('all');
    const [advMode, setAdvMode] = useState(false);
    const [showFacility, setShowFacility] = useState(false);
    const [cols, setCols] = useState([
        { id: 'vendor', label: 'Vendor', visible: true, sortable: true },
        { id: 'id', label: 'Invoice #', visible: true, sortable: true },
        { id: 'dueDate', label: 'Due Date', visible: true, sortable: true },
        { id: 'overdue', label: 'Overdue', visible: true, sortable: true },
        { id: 'amount', label: 'Amount', visible: true, sortable: true },
        { id: 'status', label: 'Status', visible: true, sortable: false },
        { id: 'actions', label: 'Actions', visible: true, sortable: false },
    ]);
    const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        setIsLoading(true);
        fetchInvoices().then(res => {
            const data = Array.isArray(res.data || res) ? (res.data || res) : [];
            const mapped = data.map(inv => ({
                id: inv.invoiceNumber,
                realId: inv.id,
                vendor: inv.vendorName,
                vendorId: inv.vendorId,
                dueDate: inv.dueDate || inv.invoiceDate,
                amount: inv.totalAmount,
                status: inv.submissionStatus ? inv.submissionStatus.toLowerCase() : 'under_review'
            }));
            setInvoices(mapped);
        }).catch(err => {
            console.error("Failed to fetch invoices for payables", err);
            toast.error("Failed to load live invoices");
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    const agingData = useMemo(() => {
        let bucket30 = 0; let count30 = 0;
        let bucket60 = 0; let count60 = 0;
        let bucket90 = 0; let count90 = 0;
        let bucket90Plus = 0; let count90Plus = 0;

        invoices.forEach(inv => {
            if (inv.status === 'paid') return;
            const today = new Date();
            const due = new Date(inv.dueDate);
            const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 30) {
                bucket30 += inv.amount;
                count30++;
            } else if (diffDays >= 31 && diffDays <= 60) {
                bucket60 += inv.amount;
                count60++;
            } else if (diffDays >= 61 && diffDays <= 90) {
                bucket90 += inv.amount;
                count90++;
            } else if (diffDays > 90) {
                bucket90Plus += inv.amount;
                count90Plus++;
            }
        });

        return [
            { range: '0-30 DAYS', amount: bucket30, count: count30, color: '#2563eb', fill: '#eff6ff' },
            { range: '31-60 DAYS', amount: bucket60, count: count60, color: '#f59e0b', fill: '#fffbeb' },
            { range: '61-90 DAYS', amount: bucket90, count: count90, color: '#ea580c', fill: '#fff7ed' },
            { range: '90+ DAYS', amount: bucket90Plus, count: count90Plus, color: '#dc2626', fill: '#fef2f2' },
        ];
    }, [invoices]);

    const toggleSelect = (id) => {
        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    };

    const selectAll = () => {
        if (selected.length === paginatedData.length) setSelected([]);
        else setSelected(paginatedData.map(v => v.id));
    };

    const selectedInvoices = invoices.filter(i => selected.includes(i.id));
    const totalSelectedAmount = selectedInvoices.reduce((sum, i) => sum + i.amount, 0);

    // Advanced Column Controls
    const handleDragStart = (e, id) => {
        if (!advMode) return;
        e.dataTransfer.setData('colId', id);
    };

    const handleDrop = (e, tgtId) => {
        if (!advMode) return;
        const srcId = e.dataTransfer.getData('colId');
        if (srcId === tgtId || !srcId) return;
        const newCols = [...cols];
        const srcIdx = newCols.findIndex(c => c.id === srcId);
        const tgtIdx = newCols.findIndex(c => c.id === tgtId);
        const [moved] = newCols.splice(srcIdx, 1);
        newCols.splice(tgtIdx, 0, moved);
        setCols(newCols);
    };

    const toggleColumn = (id) => {
        setCols(cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    };

    // Sorting Logic
    const requestSort = (key) => {
        if (advMode) return;
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedData = (data) => {
        const sortableItems = [...data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    };

    const [invoiceSearch, setInvoiceSearch] = useState('');

    // Aging bucket filter logic — maps range to overdue days
    const getBucketFiltered = (invoices) => {
        if (activeBucket === 'all') return invoices;
        return invoices.filter(inv => {
            const today = new Date();
            const due = new Date(inv.dueDate);
            const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
            if (activeBucket === '0-30 DAYS') return diffDays >= 0 && diffDays <= 30;
            if (activeBucket === '31-60 DAYS') return diffDays >= 31 && diffDays <= 60;
            if (activeBucket === '61-90 DAYS') return diffDays >= 61 && diffDays <= 90;
            if (activeBucket === '90+ DAYS') return diffDays > 90;
            return true;
        });
    };

    const searchFiltered = invoices.filter(inv =>
        inv.vendor.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.id.toLowerCase().includes(invoiceSearch.toLowerCase())
    );
    const bucketFiltered = getBucketFiltered(searchFiltered);
    const sortedData = getSortedData(bucketFiltered);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const SortIndicator = ({ column }) => {
        if (sortConfig.key !== column) return <span className="ml-1 opacity-20">⇅</span>;
        return <span className="ml-1 text-blue-600">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const visibleCols = cols.filter(c => c.visible);

    return (
        <div className="min-h-screen w-full bg-[#F3F5F9] flex flex-col pb-10" style={{ fontFamily: '"Inter", sans-serif' }}>
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
                                <h1 className="text-[18px] font-bold text-slate-800 tracking-tight">Accounts Payable</h1>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold rounded-md uppercase tracking-widest">
                                    <CreditCard size={10} /> PAYABLES
                                </div>
                            </div>
                            <VendorBreadcrumb items={[{ label: 'Vendors', path: '/vendors' }, { label: 'Accounts Payable' }]} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setAdvMode(!advMode)}
                            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg border transition-all shadow-sm ${advMode ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            <Settings className={`w-4 h-4 ${advMode ? 'animate-spin' : ''}`} />
                            {advMode ? 'Config Active' : 'View Config'}
                        </button>
                        <SecondaryBtn small onClick={() => navigate(VENDOR_ROUTES.gstRecon)} icon={<RefreshCw size={14} />}>
                            GST Recon
                        </SecondaryBtn>
                        <SecondaryBtn small onClick={() => navigate(VENDOR_ROUTES.ledger)} icon={<Database size={14} />}>
                            Ledger Hub
                        </SecondaryBtn>
                        <PrimaryBtn small onClick={() => navigate(VENDOR_ROUTES.paymentProcess)} icon={<CreditCard size={14} />}>
                            Process Payments
                        </PrimaryBtn>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto w-full p-4">
                <ColumnConfig cols={cols} onChange={toggleColumn} advMode={advMode} setAdvMode={setAdvMode} />

                {/* ── Aging Buckets ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                    {/* All bucket reset */}
                    <button onClick={() => { setActiveBucket('all'); setCurrentPage(1); }}
                        className={`p-4 rounded-xl text-left border transition-all bg-white shadow-sm hover:shadow-md ${
                            activeBucket === 'all' ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-100'
                        }`}>
                        <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">All Invoices</div>
                        <div className="text-xl font-bold text-gray-900">{invoices.length}</div>
                        <div className="text-[10px] text-gray-400 font-medium uppercase">Total</div>
                    </button>
                    {agingData.map((ag, i) => (
                        <button key={i} onClick={() => { setActiveBucket(ag.range); setCurrentPage(1); }}
                            className={`p-4 rounded-xl text-left border transition-all relative overflow-hidden group bg-white shadow-sm hover:shadow-md ${activeBucket === ag.range ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-100'}`}>
                            <div className="flex items-center justify-between mb-2 relative z-10">
                                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${BUCKET_COLORS[ag.range]}`}>{ag.range}</span>
                                <span className="text-[11px] font-bold text-gray-400">{ag.count} Items</span>
                            </div>
                            <div className="text-xl font-bold text-gray-900 mb-0.5 relative z-10 tracking-tight">{formatCurrency(ag.amount)}</div>
                            <div className="text-[10px] font-medium text-gray-500 uppercase relative z-10">Outstanding</div>
                        </button>
                    ))}
                </div>

                {/* ── Credit Line Banner ── */}
                <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-between border border-gray-100 relative overflow-hidden group shadow-sm" style={{ borderLeft: '4px solid #2563eb' }}>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl border border-blue-100">🏦</div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">Corporate Credit Facility</p>
                            <p className="text-base font-bold tracking-tight text-gray-800">Available Overdraft: <span className="text-emerald-600 font-bold">₹50,000</span> <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-lg ml-3 border border-blue-100">HDFC PLATINUM FLOW</span></p>
                        </div>
                    </div>
                    <button onClick={() => setShowFacility(true)} className="px-4 py-2 bg-blue-600 text-white text-[11px] font-bold uppercase rounded-lg hover:bg-blue-700 transition-all shadow-sm">Facility Hub</button>
                </div>

                {/* ── Invoice Search Bar ── */}
                <div className="mb-3 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        value={invoiceSearch}
                        onChange={e => { setInvoiceSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Search invoices by vendor or invoice #..."
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-400 transition-all shadow-sm"
                    />
                    {activeBucket !== 'all' && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                            Filtered: {activeBucket} · {sortedData.length} results
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-9">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[11px] text-gray-400 font-bold bg-gray-50/50 border-b border-gray-50">

                                            {visibleCols.map(col => (
                                                <th key={col.id}
                                                    draggable={advMode}
                                                    onDragStart={(e) => handleDragStart(e, col.id)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => handleDrop(e, col.id)}
                                                    className={`px-4 py-4 uppercase tracking-wider transition-all 
                                                        ${col.sortable && !advMode ? 'cursor-pointer hover:bg-gray-100/50 hover:text-gray-700' : ''}
                                                        ${advMode ? 'bg-blue-50/50 cursor-move border-x border-blue-50/20' : ''}`}>
                                                    <div className="flex items-center gap-2">
                                                        {col.label} {col.sortable && !advMode && <SortIndicator column={col.id} />}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="text-[13px] divide-y divide-gray-50">
                                        {paginatedData.length === 0 ? (
                                            <tr>
                                                <td colSpan={visibleCols.length} className="py-24 text-center">
                                                    <EmptyState icon="💳" title="No invoices detected" desc="Adjust your filters or aging parameters" />
                                                </td>
                                            </tr>
                                        ) : paginatedData.map((inv) => {
                                            const today = new Date();
                                            const due = new Date(inv.dueDate);
                                            const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
                                            const daysOverdue = inv.status === 'paid' ? null : diffDays;
                                            return (
                                                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    {visibleCols.map(col => (
                                                        <td key={col.id} className="px-4 py-4">
                                                            {col.id === 'vendor' && (
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600 font-bold text-[10px] border border-gray-200/50 group-hover:scale-110 transition-transform">
                                                                        {inv.vendor.charAt(0)}
                                                                    </div>
                                                                    <span className="font-semibold text-gray-700 tracking-tight">{inv.vendor}</span>
                                                                </div>
                                                            )}
                                                            {col.id === 'id' && (
                                                                <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded inline-block border border-blue-100/50">
                                                                    {inv.id}
                                                                </span>
                                                            )}
                                                            {col.id === 'dueDate' && <span className="text-gray-500 font-medium">{formatDate(inv.dueDate)}</span>}
                                                            {col.id === 'overdue' && (
                                                                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                                                    daysOverdue === null ? 'text-slate-400' :
                                                                    daysOverdue > 0 ? 'text-rose-600' :
                                                                    daysOverdue === 0 ? 'text-amber-600' :
                                                                    'text-emerald-600'
                                                                }`}>
                                                                    {daysOverdue === null ? 'Settled' :
                                                                     daysOverdue > 0 ? `${daysOverdue} days overdue` :
                                                                     daysOverdue === 0 ? 'Due Today' :
                                                                     `Due in ${Math.abs(daysOverdue)} days`}
                                                                </span>
                                                            )}
                                                            {col.id === 'amount' && <span className="font-bold text-gray-900">{formatCurrency(inv.amount)}</span>}
                                                            {col.id === 'status' && <StatusBadge status={inv.status} size="xs" />}
                                                            {col.id === 'actions' && (
                                                                inv.status === 'paid' ? (
                                                                    <span className="px-4 py-1.5 bg-slate-100 text-slate-400 text-[11px] font-bold uppercase tracking-wider rounded-lg border border-slate-200/50 inline-block shadow-sm select-none">
                                                                        Settled
                                                                    </span>
                                                                ) : (
                                                                    <button onClick={() => navigate(VENDOR_ROUTES.paymentProcess, { state: { invoiceId: inv.id } })}
                                                                        className="px-4 py-1.5 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-blue-700 transition-all shadow-sm">
                                                                        Pay Now
                                                                    </button>
                                                                )
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Pagination ── */}
                        <div className="flex items-center justify-between py-3 px-2">
                            <div className="text-[12px] font-medium text-gray-400">
                                Showing <span className="font-bold text-gray-700">{paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="font-bold text-gray-700">{sortedData.length}</span> entries
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-bold text-gray-500 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-all">
                                    ← Prev
                                </button>
                                <div className="flex items-center gap-1 mx-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button key={i} onClick={() => setCurrentPage(i + 1)}
                                            className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all shadow-sm ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-gray-400 hover:text-gray-700 border border-gray-50'}`}>
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-bold text-gray-500 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-all">
                                    Next →
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="lg:col-span-3 space-y-4">
                        <VCard>
                            <SectionTitle>Payout Modes</SectionTitle>
                            <div className="space-y-2 mt-3">
                                {PAYMENT_MODES.map(pm => (
                                    <div key={pm.mode} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 bg-white hover:border-blue-200 cursor-pointer transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-base group-hover:scale-110 transition-transform">{pm.icon}</div>
                                            <div>
                                                <p className="text-[11px] font-bold text-gray-900 uppercase leading-none mb-0.5">{pm.mode}</p>
                                                <p className="text-[10px] text-gray-400 font-semibold">{pm.time}</p>
                                            </div>
                                        </div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 group-hover:bg-blue-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </VCard>

                        <VCard>
                            <MultiChart
                                title="Aging Analytics"
                                data={agingData}
                                series={[
                                    { key: 'amount', label: 'Amount', color: '#3b82f6' }
                                ]}
                                xAxisKey="range"
                                height={200}
                                defaultType="pie"
                            />
                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-50">
                                {agingData.map((ag, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">{ag.range.split(' ')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </VCard>
                    </div>
                </div>



                {/* ── Facility Hub Modal ── */}
                {showFacility && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <VCard className="w-full max-w-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-200">🏦</div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Corporate Credit Facility Hub</h2>
                                        <p className="text-xs font-medium text-slate-400 uppercase ">HDFC Platinum Flow — OD Account 8899</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowFacility(false)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all">✕</button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Available Limit</p>
                                    <p className="text-2xl font-bold text-emerald-700">₹50,000</p>
                                    <div className="mt-2 w-full h-1 bg-emerald-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-600" style={{ width: '10%' }} />
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Sanctioned Limit</p>
                                    <p className="text-2xl font-bold text-blue-700">₹5,00,000</p>
                                    <p className="text-[9px] font-medium text-blue-500 mt-1">ROI: 8.5% p.a.</p>
                                </div>
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                                    <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Current Usage</p>
                                    <p className="text-2xl font-bold text-rose-700">₹4,50,000</p>
                                    <p className="text-[9px] font-medium text-rose-500 mt-1">Expiring: Dec 2026</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase ">Recent Facility Transactions</p>
                                <div className="space-y-2">
                                    {[
                                        { date: '05-May-2026', desc: 'Overdraft Interest Charge', amt: '-₹3,240', status: 'Debited' },
                                        { date: '01-May-2026', desc: 'Auto-Pay Settlement', amt: '+₹1,20,000', status: 'Credited' },
                                        { date: '28-Apr-2026', desc: 'Vendor Payout - SF001', amt: '-₹84,500', status: 'Debited' }
                                    ].map((t, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${t.status === 'Debited' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {t.status === 'Debited' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-slate-700">{t.desc}</p>
                                                    <p className="text-[10px] font-medium text-slate-400">{t.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[13px] font-bold ${t.status === 'Debited' ? 'text-rose-600' : 'text-emerald-600'}`}>{t.amt}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{t.status}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3">
                                <PrimaryBtn
                                    className="flex-1 !py-3"
                                    onClick={() => {
                                        toast.promise(
                                            new Promise(resolve => setTimeout(resolve, 2000)),
                                            {
                                                loading: 'Submitting limit increase request...',
                                                success: 'Request submitted to HDFC Bank!',
                                                error: 'Submission failed',
                                            }
                                        );
                                    }}
                                >
                                    Request Limit Increase
                                </PrimaryBtn>
                                <SecondaryBtn className="flex-1 !py-3" onClick={() => setShowFacility(false)}>Close Hub</SecondaryBtn>
                            </div>
                        </VCard>
                    </div>
                )}
            </div>
        </div>
    );
}
