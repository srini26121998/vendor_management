import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import {
    PageHeader, StatusBadge, FilterBar, SearchBar, VCard,
    PrimaryBtn, SecondaryBtn, EmptyState, VModal, ColumnConfig
} from './VendorComponents';
import { printData, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { Settings, ChevronDown, FileSpreadsheet, FileText, Share2, Send, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import purchaseService from '../../api/purchaseService';

const STATUS_FILTERS = [
    { label: 'All', value: 'all' }, { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' }, { label: 'Rejected', value: 'rejected' },
];

const STAGES = ['Draft', 'Approved', 'Sent', 'GRN Init', 'GRN Done', 'Invoice Rcvd', 'Matched', 'Paid'];

const GRN_STATUS_LABEL = { not_started: 'Pending', partial: 'Partial', complete: 'Received' };

export default function PurchaseOrderList() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState([]);
    const [view, setView] = useState('table');
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [advMode, setAdvMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [poToDelete, setPoToDelete] = useState(null);
    const [pos, setPos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingPo, setIsFetchingPo] = useState(false);
    const [cols, setCols] = useState([
        { id: 'id', label: 'PO Number', visible: true, sortable: true },
        { id: 'vendor', label: 'Vendor', visible: true, sortable: true },
        { id: 'date', label: 'Date', visible: true, sortable: true },
        { id: 'items', label: 'SKUs', visible: true, sortable: false },
        { id: 'amount', label: 'Total Amount', visible: true, sortable: true },
        { id: 'status', label: 'Status', visible: true, sortable: false },
        { id: 'actions', label: 'Actions', visible: true, sortable: false },
    ]);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const toggleSelect = (id) => {
        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    };

    const selectAll = () => {
        if (selected.length === paginatedData.length && paginatedData.length > 0) setSelected([]);
        else setSelected(paginatedData.map(v => v.id));
    };

    const selectedPOs = pos.filter(po => selected.includes(po.id));
    const totalSelectedAmount = selectedPOs.reduce((sum, po) => sum + po.amount, 0);

    const handleEdit = async (id) => {
        setIsFetchingPo(true);
        try {
            const fullPo = await purchaseService.getPurchaseById(id);
            navigate(VENDOR_ROUTES.poCreate, { state: { po: fullPo, mode: 'edit' } });
        } catch (err) {
            toast.error('Failed to fetch PO details for editing');
        } finally {
            setIsFetchingPo(false);
        }
    };


    const handleDelete = (id) => {
        setPoToDelete(pos.find(p => p.id === id));
        setShowDeleteModal(true);
    };

    const loadPurchases = async () => {
        setIsLoading(true);
        try {
            const data = await purchaseService.getPurchases();
            // Filter only PURCHASE types and map to UI fields
            const purchaseOrders = data
                .filter(item => item.type === 'PURCHASE')
                .map(item => ({
                    id: item.id,
                    vendor: item.partyName,
                    date: item.invoiceDate || item.createdAt,
                    amount: item.amount || 0,
                    status: item.status?.toLowerCase() || 'pending',
                    items: item.itemCount || 0
                }));
            setPos(purchaseOrders);
        } catch (err) {
            console.error('Failed to load purchases:', err);
            toast.error('Failed to sync purchase orders with server');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPurchases();
    }, []);

    const confirmDelete = async () => {
        try {
            await purchaseService.deletePurchase(poToDelete.id);
            setPos(prev => prev.filter(p => p.id !== poToDelete.id));
            setShowDeleteModal(false);
            setPoToDelete(null);
            toast.success('Purchase Order deleted successfully');
        } catch (err) {
            toast.error('Failed to delete purchase order');
        }
    };

    const handlePrint = (po) => {
        printData([po], `Purchase Order: ${po.id}`, [
            { header: 'PO Number', accessor: 'id' },
            { header: 'Vendor', accessor: 'vendor' },
            { header: 'Date', accessor: 'date' },
            { header: 'Items', accessor: 'items' },
            { header: 'Amount', accessor: 'amount' },
            { header: 'Status', accessor: 'status' }
        ]);
    };

    const handleExport = (format) => {
        const dataToExport = selected.length > 0 ? selectedPOs : pos;
        const columns = [
            { header: 'PO Number', accessor: 'id' },
            { header: 'Vendor', accessor: 'vendor' },
            { header: 'Date', accessor: 'date' },
            { header: 'Items', accessor: 'items' },
            { header: 'Amount', accessor: 'amount' },
            { header: 'Status', accessor: 'status' }
        ];

        if (format === 'excel') {
            exportToExcel(dataToExport, 'Purchase_Orders', columns);
        } else {
            exportToPDF(dataToExport, 'Purchase Order Registry', columns);
        }
    };

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

    const filtered = pos.filter(po => {
        const matchFilter = filter === 'all' || po.status === filter;
        const matchSearch = po.id.toLowerCase().includes(search.toLowerCase()) ||
            po.vendor.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
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
                        <h1 className="text-[20px] font-bold text-[#1e293b]">Purchase Order Registry</h1>
                        <p className="text-[11px] text-[#64748b] mt-0.5">Manage procurement, tracking, and approval cycles</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setAdvMode(!advMode)}
                            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg border transition-all shadow-sm ${advMode ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            <Settings className={`w-4 h-4 ${advMode ? 'animate-spin' : ''}`} />
                            {advMode ? 'Config Active' : 'View Config'}
                        </button>
                        <div className="relative group">
                            <button className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2 text-[13px] text-gray-600 shadow-sm hover:bg-gray-50 transition-colors font-bold group-hover:border-blue-400 group-hover:text-blue-600">
                                <Share2 className="w-4 h-4" />
                                Share & Export
                                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 border-b-4 border-b-blue-600">
                                <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    Export Excel
                                </button>
                                <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <FileText className="w-4 h-4 text-rose-600" />
                                    Export PDF
                                </button>
                                <button onClick={() => toast.success('Dispatching to Vendor...')} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-blue-50 rounded-xl font-bold text-blue-600 flex items-center gap-2 transition-all">
                                    <Send className="w-4 h-4 text-blue-600" />
                                    Push to Portal
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setView(v => v === 'table' ? 'kanban' : 'table')}
                            className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2 text-[13px] text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
                            {view === 'table' ? 'Kanban View' : 'Table View'}
                        </button>
                        <button onClick={loadPurchases} disabled={isLoading}
                            className="bg-white p-2 rounded-lg border border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => navigate(VENDOR_ROUTES.poCreate)}
                            className="bg-blue-600 px-5 py-2 rounded-lg text-white text-[13px] font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                            + Generate New PO
                        </button>
                    </div>
                </div>

                {/* ── Search & Filters ── */}
                <div className="space-y-4">
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by PO Number or Vendor Name..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-400 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {STATUS_FILTERS.map(f => (
                            <button key={f.value} onClick={() => { setFilter(f.value); setCurrentPage(1); }}
                                className={`px-5 py-1.5 text-[12px] font-bold rounded-full transition-all whitespace-nowrap ${filter === f.value ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <ColumnConfig cols={cols} onChange={toggleCol} advMode={advMode} setAdvMode={setAdvMode} />

                {/* ── Content View ── */}
                {view === 'table' ? (
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[11px] text-gray-400 font-bold border-b border-gray-50">

                                            {visibleCols.map(col => (
                                                <th key={col.id} draggable={advMode}
                                                    onDragStart={(e) => handleDragStart(e, col.id)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => handleDrop(e, col.id)}
                                                    onClick={() => col.sortable && requestSort(col.id)}
                                                    className={`px-6 py-4 uppercase tracking-wider ${col.sortable && !advMode ? 'cursor-pointer hover:text-gray-600' : ''}`}>
                                                    <div className="flex items-center gap-1">
                                                        {col.label} {col.sortable && !advMode && <SortIndicator column={col.id} />}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="text-[13px] divide-y divide-gray-50">
                                        {paginatedData.length === 0 ? (
                                            <tr>
                                                <td colSpan={visibleCols.length} className="py-20 text-center">
                                                    <EmptyState icon="📋" title="No results found" desc="Adjust your filters or search keywords" />
                                                </td>
                                            </tr>
                                        ) : paginatedData.map((po) => (
                                            <tr key={po.id} className="hover:bg-gray-50/50 transition-colors group">
                                                {visibleCols.map(col => (
                                                    <td key={col.id} className="px-6 py-4">
                                                        {col.id === 'id' && (
                                                            <span className="px-2 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-md text-[11px] font-mono font-bold">
                                                                {po.id}
                                                            </span>
                                                        )}
                                                        {col.id === 'vendor' && (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-[11px]">
                                                                    {po.vendor.charAt(0)}
                                                                </div>
                                                                <span className="font-medium text-gray-700">{po.vendor}</span>
                                                            </div>
                                                        )}
                                                        {col.id === 'date' && <span className="text-gray-500 font-medium">{formatDate(po.date)}</span>}
                                                        {col.id === 'items' && <span className="text-gray-700 font-bold">{po.items} Items</span>}
                                                        {col.id === 'amount' && <span className="text-gray-700 font-bold">{formatCurrency(po.amount)}</span>}
                                                        {col.id === 'status' && <StatusBadge status={po.status} size="sm" />}
                                                        {col.id === 'actions' && (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button onClick={() => navigate(`/vendors/purchase-orders/${po.id}`)}
                                                                    className="p-1.5 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all shadow-sm border border-blue-100/50">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                </button>
                                                                <button onClick={() => handleEdit(po.id)}
                                                                    className="p-1.5 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all shadow-sm border border-amber-100/50">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                </button>
                                                                <button onClick={() => handleDelete(po.id)}
                                                                    className="p-1.5 rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all shadow-sm border border-rose-100/50">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                                <button onClick={() => handlePrint(po)}
                                                                    className="p-1.5 rounded-md bg-purple-50 text-purple-500 hover:bg-purple-100 transition-all shadow-sm border border-purple-100/50">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
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
                        <div className="flex items-center justify-end gap-2 pb-8">
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)}
                                    className={`w-9 h-9 rounded-lg text-[12px] font-bold transition-all shadow-sm border ${currentPage === i + 1 ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-white text-gray-400 hover:text-gray-900 border-gray-100 hover:border-gray-300'}`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Kanban View */
                    <div className="overflow-x-auto pb-8">
                        <div className="flex gap-6 min-w-max">
                            {STATUS_FILTERS.slice(1).map(sf => {
                                const stagePOs = sortedData.filter(p => p.status === sf.value);
                                return (
                                    <div key={sf.value} className="w-80 flex-shrink-0">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${sf.value === 'approved' ? 'bg-green-500' : sf.value === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{sf.label}</h3>
                                            </div>
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[12px] font-bold rounded-full">
                                                {stagePOs.length}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {stagePOs.map(po => (
                                                <div key={po.id} onClick={() => navigate(`/vendors/purchase-orders/${po.id}`)}
                                                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all cursor-pointer group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-[10px] text-blue-600 font-mono tracking-tight">{po.id}</span>
                                                        <span className="text-[10px] font-medium text-gray-400">{formatDate(po.date)}</span>
                                                    </div>
                                                    <div className="font-bold text-gray-700 text-[13px] mb-2 group-hover:text-blue-600 transition-colors">{po.vendor}</div>
                                                    <div className="flex justify-between items-center text-[11px] mt-4 pt-3 border-t border-gray-50">
                                                        <span className="text-gray-500">{po.items} SKUs</span>
                                                        <span className="font-bold text-gray-900">{formatCurrency(po.amount)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {stagePOs.length === 0 && (
                                                <div className="h-24 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-xl text-[11px] text-gray-400">
                                                    Empty Stage
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <VModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
                    <div className="space-y-6">
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-rose-200">⚠️</div>
                            <div>
                                <p className="text-[13px] font-bold text-rose-900 uppercase">Warning: Irreversible Action</p>
                                <p className="text-[12px] text-rose-700 font-medium mt-0.5">Deleting Purchase Order <span className="font-bold">#{poToDelete?.id}</span> will permanently remove it from the registry.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <PrimaryBtn onClick={confirmDelete} className="flex-1 !bg-rose-600 hover:!bg-rose-700 shadow-rose-100">Permanently Delete</PrimaryBtn>
                            <SecondaryBtn onClick={() => setShowDeleteModal(false)} className="flex-1">Keep Record</SecondaryBtn>
                        </div>
                    </div>
                </VModal>
            </div>
        </div>
    );
}
