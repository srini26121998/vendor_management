import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import { fetchGRNs } from '../../api/vendorService';
import {
    PageHeader, StatusBadge, FilterBar, SearchBar, VCard,
    PrimaryBtn, SecondaryBtn, EmptyState, VModal, ColumnConfig
} from './VendorComponents';
import { exportToExcel, exportToPDF, printData } from '../../utils/exportUtils';
import { Settings, ChevronDown, FileSpreadsheet, FileText, Share2, Send, RefreshCw, Upload, Eye, Edit3, Printer } from 'lucide-react';
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
        { id: 'receivedBy', label: 'Received By', visible: true, sortable: true }
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

    const load = async () => {
        try {
            setLoading(true);
            const response = await fetchGRNs();
            const data = response.data || response;
            if (Array.isArray(data)) {
                setGrns(data.map(adaptGRN));
            }
        } catch (err) {
            console.error("Failed to fetch GRNs from backend:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const toggleSelect = (id) => {
        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    };

    const selectAll = () => {
        if (selected.length === paginatedData.length && paginatedData.length > 0) setSelected([]);
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
        if (sortConfig.key !== column) return <span className="ml-1 opacity-20 text-[8px]">⇅</span>;
        return <span className="ml-1 text-blue-500 text-[8px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    const visibleCols = cols.filter(c => c.visible);

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen" style={{ fontFamily: '"Inter", sans-serif' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');`}</style>
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-4 pt-4">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-[20px] font-bold text-[#1e293b]">GRN List & History</h1>
                        <p className="text-[11px] text-[#64748b] mt-0.5">Manage goods receipt notes and vendor deliveries</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <PrimaryBtn onClick={() => setAdvMode(!advMode)}>
                            <Settings className={`w-4 h-4 ${advMode ? 'animate-spin' : ''}`} />
                            {advMode ? 'Config Active' : 'View Config'}
                        </PrimaryBtn>
                        <div className="relative group/dropdown">
                            <PrimaryBtn className="group/btn">
                                <Share2 className="w-4 h-4" />
                                Share & Export
                                <ChevronDown className="w-4 h-4 transition-transform group-hover/dropdown:rotate-180" />
                            </PrimaryBtn>
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-50 p-2 border-b-4 border-b-blue-600">
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
                        <PrimaryBtn onClick={load} disabled={loading} className="!px-3">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </PrimaryBtn>
                        <PrimaryBtn onClick={() => navigate(VENDOR_ROUTES.grnEntry)}>
                            + New GRN Scan
                        </PrimaryBtn>
                    </div>
                </div>

                {/* ── Search & Filters ── */}
                <div className="space-y-4">
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by GRN Number or Vendor Name..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-400 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {FILTERS.map(f => (
                            <button key={f.value} onClick={() => { setFilter(f.value); setCurrentPage(1); }}
                                className={`group flex items-center justify-center gap-2 px-5 py-1.5 text-[11px] font-bold rounded-full border active:scale-95 transition-all duration-300 whitespace-nowrap uppercase tracking-wider ${
                                    filter === f.value 
                                        ? 'bg-green-50 text-green-800 border-green-200 shadow-sm' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <ColumnConfig cols={cols} onChange={toggleCol} advMode={advMode} setAdvMode={setAdvMode} />

                {/* ── Content View ── */}
                <div className="space-y-4">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 bg-slate-50/75">
                                        {visibleCols.map(col => (
                                            <th key={col.id} draggable={advMode}
                                                onDragStart={(e) => handleDragStart(e, col.id)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleDrop(e, col.id)}
                                                onClick={() => col.sortable && requestSort(col.id)}
                                                className={`${['id', 'vendor'].includes(col.id) ? 'px-8' : 'px-4'} py-4 whitespace-nowrap transition-colors ${col.sortable && !advMode ? 'cursor-pointer hover:text-slate-900' : ''}`}>
                                                <div className="flex items-center gap-1">
                                                    {col.label} {col.sortable && !advMode && <SortIndicator column={col.id} />}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={visibleCols.length} className="py-20 text-center text-slate-500">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={visibleCols.length} className="py-20 text-center">
                                                <EmptyState icon="📋" title="No results found" desc="Adjust your filters or search keywords" />
                                            </td>
                                        </tr>
                                    ) : paginatedData.map((grn) => (
                                        <tr key={grn.id} onClick={() => navigate(`/vendors/grn/${grn.id}`)} className="bg-white even:bg-slate-50/50 hover:bg-green-50/30 transition-all duration-200 group cursor-pointer border-b border-slate-200 last:border-0">
                                            {visibleCols.map(col => (
                                                <td key={col.id} className={`${['id', 'vendor'].includes(col.id) ? 'px-8' : 'px-4'} py-3.5 whitespace-nowrap bg-inherit border-b border-slate-200`}>
                                                    {col.id === 'id' && (
                                                        <span className="px-2 py-1 text-slate-800 rounded-md text-[11px] font-mono font-bold">
                                                            {grn.grnNumber}
                                                        </span>
                                                    )}
                                                    {col.id === 'poId' && (
                                                        <span className="text-slate-500 font-medium">{grn.poId}</span>
                                                    )}
                                                    {col.id === 'vendor' && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-[11px]">
                                                                {grn.vendor.charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-gray-700">{grn.vendor}</span>
                                                        </div>
                                                    )}
                                                    {col.id === 'date' && <span className="text-gray-500 font-medium">{formatDate(grn.date)}</span>}
                                                    {col.id === 'items' && <span className="text-gray-700 font-bold">{grn.items} Items</span>}
                                                    {col.id === 'amount' && <span className="text-gray-700 font-bold">{formatCurrency(grn.amount)}</span>}
                                                    {col.id === 'receivedBy' && <span className="text-gray-600 font-medium">{grn.receivedBy}</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Pagination ── */}
                    <div className="flex items-center justify-end gap-2 pb-8">
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i} onClick={() => setCurrentPage(i + 1)}
                                className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all shadow-sm border ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-white text-gray-400 hover:text-gray-900 border-gray-100 hover:border-gray-300'}`}>
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

