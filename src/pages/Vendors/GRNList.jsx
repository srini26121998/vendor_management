import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import { fetchGRNs } from '../../api/vendorService';
import {
    PageHeader, StatusBadge, SearchBar, VCard,
    PrimaryBtn, SecondaryBtn, EmptyState, ColumnConfig
} from './VendorComponents';
import { exportToExcel, exportToPDF, printData } from '../../utils/exportUtils';
import { Settings, ChevronDown, FileSpreadsheet, FileText, Upload, Eye, Edit3, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

const FILTERS = [
    { label: 'All', value: 'all' }, { label: 'Matched', value: 'matched' },
    { label: 'Partial', value: 'partial' }, { label: 'Pending', value: 'pending' },
];

export default function GRNList() {
    const navigate = useNavigate();
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [advMode, setAdvMode] = useState(false);
    const [cols, setCols] = useState([
        { id: 'id', label: 'GRN Number', visible: true, sortable: true },
        { id: 'poId', label: 'PO Ref', visible: true, sortable: true },
        { id: 'vendor', label: 'Vendor', visible: true, sortable: true },
        { id: 'date', label: 'Date', visible: true, sortable: true },
        { id: 'items', label: 'Items', visible: true, sortable: true },
        { id: 'amount', label: 'Amount', visible: true, sortable: true },
        { id: 'receivedBy', label: 'Received By', visible: true, sortable: true },
        { id: 'actions', label: 'Actions', visible: true, sortable: false },
    ]);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const adaptGRN = (dto) => {
        const items = dto.items || [];
        let subtotal = 0;
        let totalTax = 0;

        items.forEach(item => {
            const qty = (item.acceptedQuantity !== undefined && item.acceptedQuantity !== null) 
                ? item.acceptedQuantity 
                : (item.receivedQuantity || 0);
            const price = item.unitPrice || 0;
            const itemSubtotal = qty * price;
            const taxRate = item.gstRate !== undefined && item.gstRate !== null ? item.gstRate : 5;
            const itemTax = itemSubtotal * (taxRate / 100);

            subtotal += itemSubtotal;
            totalTax += itemTax;
        });

        const amount = subtotal + totalTax;

        return {
            id: dto.id,
            grnNumber: dto.grnNumber || '—',
            poId: dto.purchaseOrderNumber || '—',
            purchaseOrderId: dto.purchaseOrderId,
            vendor: dto.vendorName || '—',
            date: dto.receivedDate || dto.createdAt,
            items: items.length,
            amount: amount,
            status: dto.status?.toLowerCase() || 'pending',
            receivedBy: dto.receivedByUserName || 'System'
        };
    };

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                setLoading(true);
                const response = await fetchGRNs();
                const data = response.data || response;
                if (isMounted) {
                    if (Array.isArray(data)) {
                        setGrns(data.map(adaptGRN));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch GRNs from backend:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        load();
        return () => { isMounted = false; };
    }, []);

    const toggleSelect = (id) => {
        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    };

    const selectAll = () => {
        if (selected.length === paginatedData.length) setSelected([]);
        else setSelected(paginatedData.map(v => v.id));
    };

    const selectedGRNs = grns.filter(g => selected.includes(g.id));
    const totalSelectedAmount = selectedGRNs.reduce((sum, g) => sum + g.amount, 0);

    const handleExport = (format) => {
        const dataToExport = selected.length > 0 ? selectedGRNs : grns;
        const columns = [
            { header: 'GRN Number', accessor: 'grnNumber' },
            { header: 'PO Ref', accessor: 'poId' },
            { header: 'Vendor', accessor: 'vendor' },
            { header: 'Date', accessor: 'date' },
            { header: 'Items', accessor: 'items' },
            { header: 'Amount', accessor: 'amount' },
            { header: 'Received By', accessor: 'receivedBy' }
        ];

        if (format === 'excel') {
            exportToExcel(dataToExport, 'GRN_List', columns);
        } else {
            exportToPDF(dataToExport, 'GRN List & History', columns);
        }
    };

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

    const filtered = grns.filter(g => {
        const matchF = filter === 'all' || g.status === filter;
        const matchS = g.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
            g.vendor.toLowerCase().includes(search.toLowerCase());
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
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8 pb-32" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1600px] mx-auto">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-[24px] font-bold text-[#1e293b]">GRN List & History</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setAdvMode(!advMode)}
                            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg border transition-all shadow-sm ${advMode ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            <Settings className={`w-4 h-4 ${advMode ? 'animate-spin' : ''}`} />
                            {advMode ? 'Config Active' : 'View Config'}
                        </button>
                        <div className="relative group">
                            <button className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2 text-[13px] text-gray-600 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors font-bold uppercase tracking-wider group-hover:border-blue-400 group-hover:text-blue-600">
                                <Upload className="w-4 h-4 rotate-180" />
                                Export
                                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 border-b-4 border-b-blue-600">
                                <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    Export Excel
                                </button>
                                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <FileText className="w-4 h-4 text-rose-600" />
                                    Export PDF
                                </button>
                            </div>
                        </div>
                        <button onClick={() => navigate(VENDOR_ROUTES.grnEntry)}
                            className="bg-blue-600 px-5 py-2 rounded-lg flex items-center gap-2 text-[13px] text-white font-bold shadow-sm hover:bg-blue-700 transition-all">
                            <span className="text-lg">📷</span> New GRN Scan
                        </button>
                    </div>
                </div>

                <ColumnConfig cols={cols} onChange={toggleCol} advMode={advMode} setAdvMode={setAdvMode} />

                {/* ── Search & Filter ── */}
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div className="md:col-span-3 relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by GRN Number or Vendor Name..."
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-transparent rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 outline-none focus:bg-white focus:border-blue-200 transition-all"
                            />
                        </div>
                        <div className="flex gap-1 p-1 bg-gray-100/50 rounded-lg">
                            {FILTERS.map(f => (
                                <button
                                    key={f.value}
                                    onClick={() => { setFilter(f.value); setCurrentPage(1); }}
                                    className={`flex-1 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${filter === f.value
                                        ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                                        : 'text-gray-500 hover:bg-gray-200/50'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Table Section ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
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
                                            onClick={() => col.sortable && requestSort(col.id)}
                                            className={`px-4 py-4 uppercase tracking-wider transition-all 
                                                ${col.sortable && !advMode ? 'cursor-pointer hover:bg-gray-100/50 hover:text-gray-700' : ''}
                                                ${advMode ? 'bg-blue-50/50 cursor-move border-x border-blue-50/20' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                {col.label} {col.sortable && !advMode && <SortIndicator column={col.id} />}
                                                {advMode && <span className="ml-auto opacity-40 text-[10px]">⋮⋮</span>}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-[13px] divide-y divide-gray-50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="w-4 h-4 bg-slate-200 rounded" /></td>
                                            {visibleCols.map(col => (
                                                <td key={col.id} className="px-4 py-4">
                                                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleCols.length} className="py-20 text-center">
                                            <EmptyState icon="📦" title="No results found" desc="Adjust your filters or search keywords" />
                                        </td>
                                    </tr>
                                ) : paginatedData.map((grn) => (
                                    <tr key={grn.id} className="hover:bg-gray-50/50 transition-colors group">
                                        {visibleCols.map(col => (
                                            <td key={col.id} className="px-4 py-4">
                                                {col.id === 'id' && (
                                                    <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded inline-block border border-blue-100/50">
                                                        {grn.grnNumber}
                                                    </span>
                                                )}
                                                {col.id === 'poId' && <span className="font-mono text-[11px] text-gray-500 font-bold">{grn.poId}</span>}
                                                {col.id === 'vendor' && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-blue-600 font-bold text-[10px] border border-gray-200/50 group-hover:scale-110 transition-transform">
                                                            {grn.vendor.charAt(0)}
                                                        </div>
                                                        <span className="font-semibold text-gray-700">{grn.vendor}</span>
                                                    </div>
                                                )}
                                                {col.id === 'date' && <span className="text-gray-500 font-medium whitespace-nowrap">{formatDate(grn.date)}</span>}
                                                {col.id === 'items' && <span className="px-2 py-0.5 bg-gray-100 rounded text-[11px] font-bold text-gray-600">{grn.items} Items</span>}
                                                {col.id === 'amount' && <span className="font-bold text-gray-800">{formatCurrency(grn.amount)}</span>}
                                                {col.id === 'receivedBy' && <span className="text-gray-600 font-semibold">{grn.receivedBy}</span>}
                                                {col.id === 'actions' && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => navigate(`/vendors/grn/${grn.id}`)}
                                                            title="View GRN"
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-blue-100/50">
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(VENDOR_ROUTES.grnEntry, { state: { grn, mode: 'edit' } })}
                                                            title="Edit GRN"
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-amber-100/50">
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => printData([grn], `GRN: ${grn.id}`, [
                                                                { header: 'GRN #', accessor: 'id' },
                                                                { header: 'PO Ref', accessor: 'poId' },
                                                                { header: 'Vendor', accessor: 'vendor' },
                                                                { header: 'Date', accessor: 'date' },
                                                                { header: 'Items', accessor: 'items' },
                                                                { header: 'Amount', accessor: 'amount' },
                                                            ])}
                                                            title="Print GRN"
                                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-purple-50 text-purple-500 hover:bg-purple-500 hover:text-white transition-all shadow-sm border border-purple-100/50">
                                                            <Printer className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>



                {/* ── Pagination ── */}
                <div className="flex items-center justify-between py-6 px-2">
                    <div className="text-[12px] font-medium text-gray-400">
                        Showing <span className="font-bold text-gray-700">{paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="font-bold text-gray-700">{sortedData.length}</span> entries
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-bold text-gray-500 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-all">
                            ← <span className="hidden sm:inline">Prev</span>
                        </button>

                        <div className="flex items-center gap-1 mx-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)}
                                    className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all shadow-sm ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-gray-400 hover:text-gray-700 border border-gray-50'}`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[12px] font-bold text-gray-500 bg-white border border-gray-100 shadow-sm hover:bg-gray-50 disabled:opacity-30 transition-all">
                            <span className="hidden sm:inline">Next</span> →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
