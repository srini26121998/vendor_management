import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import { fetchInvoices, approveInvoice } from '../../api/vendorService';
import {
    PageHeader, StatusBadge, SearchBar, VCard,
    PrimaryBtn, SecondaryBtn, EmptyState, ColumnConfig
} from './VendorComponents';
import { Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const FILTERS = [
    { label: 'All', value: 'all' }, { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' }, { label: 'Paid', value: 'paid' }, { label: 'Overdue', value: 'overdue' },
];

export default function PurchaseInvoice() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [selected, setSelected] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [advMode, setAdvMode] = useState(false);
    const [gstExpand, setGstExpand] = useState(false);
    const [cols, setCols] = useState([
        { id: 'id', label: 'Invoice Number', visible: true, sortable: true },
        { id: 'vendor', label: 'Vendor', visible: true, sortable: true },
        { id: 'date', label: 'Date', visible: true, sortable: true },
        { id: 'dueDate', label: 'Due Date', visible: true, sortable: true },
        { id: 'amount', label: 'Amount', visible: true, sortable: true },
        { id: 'grnMatch', label: '3-Way Match', visible: true, sortable: false },
        { id: 'itcEligible', label: 'ITC Status', visible: true, sortable: false },
        { id: 'status', label: 'Status', visible: true, sortable: false },
    ]);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const loadInvoices = () => {
        fetchInvoices().then(res => {
            const data = Array.isArray(res.data || res) ? (res.data || res) : [];
            const uiData = data.map(inv => ({
                id: inv.invoiceNumber, // using invoiceNumber as the visual ID
                realId: inv.id,
                vendor: inv.vendorName,
                date: inv.invoiceDate,
                dueDate: inv.dueDate || inv.invoiceDate, // Map real dueDate, fallback to invoiceDate if null
                amount: inv.totalAmount,
                grnMatch: inv.grnMatchStatus?.toLowerCase() || 'pending',
                poMatch: inv.poMatchStatus?.toLowerCase() || 'pending',
                itcEligible: true, // Assuming true for now
                status: inv.submissionStatus?.toLowerCase() || 'under_review'
            }));
            setInvoices(uiData);
        }).catch(err => console.error("Failed to load invoices", err));
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    const handleBulkApprove = async () => {
        try {
            const realIds = selected.map(invoiceNum => {
                const found = invoices.find(inv => inv.id === invoiceNum);
                return found ? found.realId : null;
            }).filter(Boolean);

            if (realIds.length === 0) {
                toast.error("No valid invoices selected.");
                return;
            }

            toast.loading("Approving selected invoices...", { id: "approve-invoice" });
            
            await Promise.all(realIds.map(id => approveInvoice(id)));

            toast.success("Invoices approved successfully!", { id: "approve-invoice" });
            setSelected([]);
            loadInvoices();
        } catch (err) {
            console.error("Failed to approve invoices", err);
            toast.error("Failed to approve invoices.", { id: "approve-invoice" });
        }
    };

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

    const toggleCol = (id) => {
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

    const filtered = invoices.filter(i => {
        const matchF = filter === 'all' || i.status === filter;
        const matchS = i.id.toLowerCase().includes(search.toLowerCase()) ||
            i.vendor.toLowerCase().includes(search.toLowerCase());
        return matchF && matchS;
    });

    const sortedData = getSortedData(filtered);
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const SortIndicator = ({ column }) => {
        if (sortConfig.key !== column) return <span className="ml-1 opacity-20">⇅</span>;
        return <span className="ml-1 text-blue-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const visibleCols = cols.filter(c => c.visible);

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-6 pb-32" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1600px] mx-auto">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Purchase Invoices</h1>
                        <p className="text-sm text-slate-500 mt-1">3-way match verification with ITC tracking and reconciliation</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <PrimaryBtn onClick={() => setAdvMode(!advMode)}>
                            <Settings className={`w-4 h-4 ${advMode ? 'animate-spin' : ''}`} />
                            {advMode ? 'Config Active' : 'View Config'}
                        </PrimaryBtn>
                        <PrimaryBtn onClick={() => navigate(VENDOR_ROUTES.ocrInvoice)}>
                            <span className="text-base">📷</span> Scan Invoice OCR
                        </PrimaryBtn>
                        <PrimaryBtn onClick={() => navigate(VENDOR_ROUTES.invoiceCreate)}>
                            + Record Invoice
                        </PrimaryBtn>
                    </div>
                </div>

                <ColumnConfig cols={cols} onChange={toggleCol} advMode={advMode} setAdvMode={setAdvMode} />

                {/* ── GST Summary ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors" onClick={() => setGstExpand(!gstExpand)}>
                        <div className="flex items-center gap-3">
                            <span className="text-base">📊</span>
                            <span className="text-sm font-bold text-slate-700 uppercase">GST Summary & ITC Reconciliation</span>
                        </div>
                        <span className={`text-slate-400 transition-transform ${gstExpand ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {gstExpand && (
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
                            {[
                                { label: 'Total GST (Input)', value: '₹42,180', color: 'emerald', desc: 'Accrued input tax credit' },
                                { label: 'ITC Eligible', value: '₹36,450', color: 'blue', desc: 'Ready for claim' },
                                { label: 'ITC Blocked', value: '₹5,730', color: 'rose', desc: 'Rule 17(5) restricted' },
                                { label: 'Pending Recon', value: '₹12,600', color: 'amber', desc: 'Vendor filing pending' },
                            ].map((g, i) => (
                                <div key={i} className={`p-4 rounded-2xl border border-${g.color}-100 bg-${g.color}-50/30 group hover:scale-105 transition-all`}>
                                    <div className={`text-2xl font-bold text-${g.color}-600 mb-1`}>{g.value}</div>
                                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">{g.label}</div>
                                    <div className="text-[10px] text-slate-400 mt-2 font-medium">{g.desc}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Filter & Search Section ── */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by Invoice Number or Vendor Name..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full lg:w-auto">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {FILTERS.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => { setFilter(f.value); setCurrentPage(1); }}
                                        className={`group flex items-center justify-center gap-2 px-5 py-1.5 text-[11px] font-bold rounded-full border active:scale-95 transition-all duration-300 whitespace-nowrap uppercase tracking-wider ${
                                            filter === f.value 
                                                ? 'bg-green-50 text-green-800 border-green-200 shadow-sm' 
                                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Table Section ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500">

                                    {visibleCols.map(col => (
                                        <th key={col.id}
                                            draggable={advMode}
                                            onDragStart={(e) => handleDragStart(e, col.id)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => handleDrop(e, col.id)}
                                            onClick={() => col.sortable && requestSort(col.id)}
                                            className={`px-6 py-4 text-left text-xs font-bold uppercase tracking-wider transition-colors 
                                                ${col.sortable && !advMode ? 'cursor-pointer hover:bg-slate-100/50' : ''}
                                                ${advMode ? 'cursor-move border-r border-blue-100/50 bg-blue-50/30' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                {col.label} {col.sortable && !advMode && <SortIndicator column={col.id} />}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleCols.length} className="py-20 text-center">
                                            <EmptyState icon="🧾" title="No results found" desc="Adjust your filters or search keywords" />
                                        </td>
                                    </tr>
                                ) : paginatedData.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                                        {visibleCols.map(col => (
                                            <td key={col.id} className="px-6 py-4">
                                                {col.id === 'id' && (
                                                    <span className="px-2 py-1 text-slate-800 rounded-md text-[11px] font-mono font-bold">
                                                        {inv.id}
                                                    </span>
                                                )}
                                                {col.id === 'vendor' && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-blue-600 font-bold text-[10px] shadow-sm">
                                                            {inv.vendor.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-800">{inv.vendor}</span>
                                                    </div>
                                                )}
                                                {col.id === 'date' && <span className="text-slate-500 font-medium whitespace-nowrap">{formatDate(inv.date)}</span>}
                                                {col.id === 'dueDate' && <span className="text-rose-500 font-bold whitespace-nowrap">{formatDate(inv.dueDate)}</span>}
                                                {col.id === 'amount' && <span className="font-bold text-slate-800">{formatCurrency(inv.amount)}</span>}
                                                {col.id === 'grnMatch' && (
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${inv.grnMatch === 'matched' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                        {inv.grnMatch === 'matched' ? '✓ Matched' : '⚠ Partial'}
                                                    </span>
                                                )}
                                                {col.id === 'itcEligible' && (
                                                    <span className={`text-xs font-bold ${inv.itcEligible ? 'text-emerald-600' : 'text-slate-300'}`}>
                                                        {inv.itcEligible ? '✓ Eligible' : 'Blocked'}
                                                    </span>
                                                )}
                                                {col.id === 'status' && <StatusBadge status={inv.status} size="xs" />}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>



                {/* ── Pagination ── */}
                <div className="mt-6 flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-xs font-semibold text-slate-500">
                        Showing <span className="text-slate-800">{paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="text-slate-800">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="text-slate-800">{sortedData.length}</span> results
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i} onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'hover:bg-slate-50 text-slate-500'}`}>
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
