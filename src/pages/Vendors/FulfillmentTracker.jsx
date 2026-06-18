import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import { fetchPurchaseOrders } from '../../api/vendorService';
import { PageHeader, VCard, SectionTitle, StatusBadge, SecondaryBtn } from './VendorComponents';

const PIPELINE_STAGES = [
    { key: 'created', label: 'PO Created', color: '#94a3b8' },
    { key: 'approved', label: 'PO Approved', color: '#3b82f6' },
    { key: 'sent', label: 'Sent to Vendor', color: '#8b5cf6' },
    { key: 'grn', label: 'GRN Done', color: '#f59e0b' },
    { key: 'invoice', label: 'Invoice Matched', color: '#F97316' },
    { key: 'paid', label: 'Payment Done', color: '#16a34a' },
];

export default function FulfillmentTracker() {
    const navigate = useNavigate();
    const [view, setView] = useState('pipeline');
    const [currentPage, setCurrentPage] = useState(1);
    const [advMode, setAdvMode] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'id', dir: 'asc' });
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    useEffect(() => {
        setLoading(true);
        fetchPurchaseOrders()
            .then(data => {
                if (Array.isArray(data)) {
                    const mapped = data.filter(d => d.type === 'PURCHASE' || !d.type).map(d => {
                        const stat = (d.status || '').toUpperCase();
                        let stageIdx = 0; // 'created'
                        if (stat === 'APPROVED') stageIdx = 1;
                        else if (stat === 'SENT') stageIdx = 2;
                        else if (stat === 'GRN_DONE' || stat === 'DELIVERED' || stat === 'RECEIVED' || stat === 'PARTIALLY_RECEIVED') stageIdx = 3;
                        else if (stat === 'INVOICED' || stat === 'INVOICE_MATCHED') stageIdx = 4;
                        else if (stat === 'PAID' || stat === 'COMPLETED') stageIdx = 5;
                        else if (stat === 'PENDING') stageIdx = 0;

                        return {
                            id: d.id,
                            poNumber: d.invoiceNumber || `PO-${d.id.substring(0, 8).toUpperCase()}`,
                            vendor: d.partyName || 'Unknown Vendor',
                            amount: d.amount || 0,
                            stage: stageIdx,
                            status: stat || 'PENDING',
                            items: d.itemCount || 0,
                            delivery: d.invoiceDate || d.createdAt || new Date().toISOString(),
                            duration: d.createdAt ? Math.max(0, Math.floor((new Date() - new Date(d.createdAt)) / (1000 * 60 * 60 * 24))) : 0
                        };
                    });
                    setPurchaseOrders(mapped);
                } else {
                    setPurchaseOrders([]);
                }
            })
            .catch(() => setPurchaseOrders([]))
            .finally(() => setLoading(false));
    }, []);

    const [cols, setCols] = useState([
        { id: 'id', label: 'PO #', visible: true, sortable: true },
        { id: 'vendor', label: 'Vendor', visible: true, sortable: true },
        { id: 'amount', label: 'Amount', visible: true, sortable: true },
        { id: 'stage', label: 'Current Stage', visible: true, sortable: true },
        { id: 'duration', label: 'Duration', visible: true, sortable: true },
        { id: 'sla', label: 'SLA', visible: true, sortable: false },
        { id: 'status', label: 'Overall Status', visible: true, sortable: false },
    ]);

    const handleSort = (key) => {
        if (advMode) return;
        const dir = sortConfig.key === key && sortConfig.dir === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, dir });
    };

    const SortIcon = ({ currentKey }) => {
        if (sortConfig.key !== currentKey) return <span className="ml-1 opacity-20 text-[8px]">⇅</span>;
        return <span className="ml-1 text-blue-500 text-[8px]">{sortConfig.dir === 'asc' ? '▲' : '▼'}</span>;
    };

    const toggleCol = (id) => {
        setCols(cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
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

    const sortedData = [...purchaseOrders].sort((a, b) => {
        const { key, dir } = sortConfig;
        let valA = a[key] || '';
        let valB = b[key] || '';

        if (key === 'amount') {
            valA = Number(a.amount);
            valB = Number(b.amount);
        } else if (key === 'duration') {
            valA = Math.floor(Math.random() * 10); // Mocking duration for sort
            valB = Math.floor(Math.random() * 10);
        }

        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const visibleCols = cols.filter(c => c.visible);

    const fulfillmentRate = 94.2;

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[24px] font-bold text-[#1e293b]">Fulfillment Tracker</h1>
                        <nav className="text-[12px] text-[#64748b] mt-1 font-medium">
                            vendors / <span className="text-[#3b82f6]">order pipeline</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setAdvMode(!advMode)}
                            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg border transition-all shadow-sm ${advMode ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            ⚙️ {advMode ? 'Config Active' : 'View Config'}
                        </button>
                        <button onClick={() => setView(v => v === 'pipeline' ? 'table' : 'pipeline')}
                            className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2 text-[13px] text-gray-600 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                            {view === 'pipeline' ? '☰ Table View' : '⊞ Pipeline View'}
                        </button>
                    </div>
                </div>
            </div>

            {advMode && (
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm mb-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-50">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase  flex items-center gap-2">
                            <span>🛠️</span> Column Configuration Mode
                        </h3>
                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Drag to reorder • Toggle visibility</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {cols.map(c => (
                            <button key={c.id} onClick={() => toggleCol(c.id)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${c.visible ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'}`}>
                                {c.visible ? '👁️' : '🚫'} {c.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Section */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Fulfillment Rate', value: `${fulfillmentRate}%`, color: 'text-emerald-600', icon: '✅', bg: 'bg-emerald-50' },
                    { label: 'On-Time Delivery', value: '87.3%', color: 'text-blue-600', icon: '⏱', bg: 'bg-blue-50' },
                    { label: 'Avg Cycle Time', value: '8.4 days', color: 'text-amber-600', icon: '🔄', bg: 'bg-amber-50' },
                    { label: 'Stuck > SLA', value: '3', color: 'text-rose-600', icon: '🚨', bg: 'bg-rose-50' },
                ].map((k, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center text-sm mb-3`}>{k.icon}</div>
                        <div className={`text-2xl font-bold ${k.color} tracking-tight`}>{k.value}</div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">{k.label}</div>
                    </div>
                ))}
            </div>

            {view === 'pipeline' ? (
                <div className="flex flex-col h-full space-y-4">
                    <div className="overflow-x-auto pb-4">
                        <div className="min-w-max">
                            {/* Stage Headers */}
                            <div className="flex gap-4 mb-4">
                                {PIPELINE_STAGES.map((stage, i) => (
                                    <div key={i} className="w-64 flex-shrink-0">
                                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
                                            style={{ background: `linear-gradient(135deg, ${stage.color}dd, ${stage.color})` }}>
                                            <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-[10px] shadow-sm">{i + 1}</span>
                                            <span className="uppercase tracking-wider">{stage.label}</span>
                                            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-md text-[10px]">
                                                {purchaseOrders.filter(po => po.stage === i).length}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* PO Cards */}
                            <div className="flex gap-4 min-h-[400px]">
                                {PIPELINE_STAGES.map((stage, si) => {
                                    const stagePOs = paginatedData.filter(po => po.stage === si);

                                    return (
                                        <div key={si} className="w-64 flex-shrink-0 flex flex-col gap-3">
                                            {stagePOs.map(po => {
                                                const daysInStage = Math.floor(Math.random() * 10) + 1;
                                                const sla = daysInStage > 5 ? 'red' : daysInStage > 3 ? 'amber' : 'green';
                                                return (
                                                    <div key={po.id} onClick={() => navigate(`/vendors/purchase-orders/${po.id}`)}
                                                        className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-300 group relative overflow-hidden">
                                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: stage.color }}></div>
                                                        <div className="pl-2">
                                                            <div className="font-mono text-[11px] text-blue-600 font-bold mb-2 flex justify-between items-center">
                                                                <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{po.poNumber}</span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sla === 'red' ? 'bg-rose-50 text-rose-600 border border-rose-100' : sla === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                                    {daysInStage}d
                                                                </span>
                                                            </div>
                                                            <div className="text-[14px] font-bold text-gray-800 line-clamp-1 mb-3 group-hover:text-blue-600 transition-colors">{po.vendor}</div>

                                                            <div className="flex justify-between items-center text-[12px] font-semibold text-gray-500 bg-gray-50 p-2 rounded-lg mb-3">
                                                                <span className="text-gray-900">{formatCurrency(po.amount)}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                <span>{po.items} Items</span>
                                                            </div>

                                                            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                                                                <span className="text-gray-400">📅</span> Delivery: <span className="text-gray-700 font-semibold">{formatDate(po.delivery)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {stagePOs.length === 0 && (
                                                <div className="border border-dashed border-gray-200 bg-gray-50/50 rounded-xl p-6 flex flex-col items-center justify-center text-center h-24 opacity-70 mt-1 transition-all">
                                                    <div className="text-[12px] font-semibold text-gray-400">No Orders</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <VCard noPad>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="text-[11px] text-gray-400 font-bold bg-gray-50/50 border-b border-gray-50">
                                        {visibleCols.map(col => (
                                            <th key={col.id}
                                                draggable={advMode}
                                                onDragStart={(e) => handleDragStart(e, col.id)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleDrop(e, col.id)}
                                                onClick={() => col.sortable && handleSort(col.id)}
                                                className={`px-6 py-4 uppercase tracking-wider transition-all ${col.sortable && !advMode ? 'cursor-pointer hover:text-gray-600' : ''} ${advMode ? 'bg-blue-50/50 cursor-move border-x border-blue-50/20' : ''}`}>
                                                <div className="flex items-center">
                                                    {col.label}
                                                    {col.sortable && !advMode && <SortIcon currentKey={col.id} />}
                                                    {advMode && <span className="ml-auto opacity-40 text-[10px]">⋮⋮</span>}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="text-[13px] divide-y divide-gray-50">
                                    {paginatedData.map((po, i) => {
                                        const stage = PIPELINE_STAGES[Math.min(po.stage, PIPELINE_STAGES.length - 1)];
                                        const days = Math.floor(Math.random() * 10) + 1;
                                        const sla = days > 5 ? 'overdue' : days > 3 ? 'pending' : 'approved';
                                        return (
                                            <tr key={po.id} className="hover:bg-gray-50/50 transition-colors group">
                                                {cols.find(c => c.id === 'id')?.visible && (
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-[11px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded inline-block border border-blue-100/50">
                                                            {po.poNumber}
                                                        </span>
                                                    </td>
                                                )}
                                                {cols.find(c => c.id === 'vendor')?.visible && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-[10px] border border-gray-200/50 group-hover:scale-110 transition-transform">
                                                                {po.vendor.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-700 leading-tight">{po.vendor}</div>
                                                                <div className="text-[10px] text-gray-400 font-medium">Strategic Partner</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}
                                                {cols.find(c => c.id === 'amount')?.visible && (
                                                    <td className="px-6 py-4 font-bold text-gray-900">{formatCurrency(po.amount)}</td>
                                                )}
                                                {cols.find(c => c.id === 'stage')?.visible && (
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                                                            style={{
                                                                backgroundColor: `${stage.color}10`,
                                                                color: stage.color,
                                                                borderColor: `${stage.color}30`
                                                            }}>
                                                            {stage.label}
                                                        </span>
                                                    </td>
                                                )}
                                                {cols.find(c => c.id === 'duration')?.visible && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-700">{po.duration} days</span>
                                                            <span className="text-[10px] text-gray-400 uppercase tracking-tighter">In Queue</span>
                                                        </div>
                                                    </td>
                                                )}
                                                {cols.find(c => c.id === 'sla')?.visible && (
                                                    <td className="px-6 py-4"><StatusBadge status={sla} size="xs" /></td>
                                                )}
                                                {cols.find(c => c.id === 'status')?.visible && (
                                                    <td className="px-6 py-4"><StatusBadge status={po.status} size="xs" /></td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </VCard>
                </div>
            )}

            {/* ── Common Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-5 py-4 rounded-xl border border-gray-100 shadow-sm mt-6">
                    <div className="text-[13px] font-medium text-gray-500">
                        Showing <span className="font-bold text-blue-600">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-blue-600">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="font-bold text-gray-700">{sortedData.length}</span> entries
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600 transition-all"
                        >
                            <span className="text-lg leading-none">‹</span> Prev
                        </button>
                        <div className="flex items-center gap-1.5 px-2">
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105' : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200'}`}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-gray-600 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-blue-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600 transition-all"
                        >
                            Next <span className="text-lg leading-none">›</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
