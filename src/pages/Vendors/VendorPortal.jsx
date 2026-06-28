import React, { useState, useEffect } from 'react';
import { formatCurrency, VENDOR_ROUTES } from './vendorConstants';
import { fetchPurchaseOrders, fetchPOById, fetchInvoices, vendorRespondToPO, raiseDispute, fetchVendors, fetchPayments, fetchVendorReturns, fetchRTVRequests, updateRTVStatus } from '../../api/vendorService';
import { VCard, SectionTitle, StatusBadge, PrimaryBtn, SecondaryBtn, VModal, VendorBreadcrumb } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, FileText, Scale, CreditCard, Settings, Download, CheckCircle, Info, ShieldCheck, RotateCcw, Package, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
    { key: 'po', label: 'PO Inbox', icon: <Layout size={18} /> },
    { key: 'returns', label: 'Returns Inbox', icon: <RotateCcw size={18} /> },
    { key: 'docs', label: 'Documents', icon: <FileText size={18} /> },
    { key: 'dispute', label: 'Disputes', icon: <Scale size={18} /> },
    { key: 'payments', label: 'Payments', icon: <CreditCard size={18} /> }
];

export default function VendorPortal() {
    const [tab, setTab] = useState('po');
    const [pos, setPos] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [returns, setReturns] = useState([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [currentVendorId, setCurrentVendorId] = useState(null);
    const [poPage, setPoPage] = useState(1);
    const [returnsPage, setReturnsPage] = useState(1);
    const [expandedReturn, setExpandedReturn] = useState(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [showDisputeInput, setShowDisputeInput] = useState(false);
    const [disputeForm, setDisputeForm] = useState({
        relatedInstrument: '',
        category: 'Payment not received',
        category: 'Payment not received',
        narrative: ''
    });

    const [expandedPo, setExpandedPo] = useState(null);
    const [fullPos, setFullPos] = useState({});
    const [ackModalOpen, setAckModalOpen] = useState(false);
    const [ackPoId, setAckPoId] = useState(null);
    const [ackForm, setAckForm] = useState({ expectedDeliveryDate: '', vendorNotes: '' });

    useEffect(() => {
        fetchPurchaseOrders().then(d => setPos(Array.isArray(d) ? d : []));
        fetchInvoices().then(d => setInvoices(Array.isArray(d) ? d : []));
        fetchPayments().then(d => {
            const data = d.data || d;
            setPayments(Array.isArray(data) ? data : []);
        });

        // Fetch the first available vendor to act as the "Logged In" vendor for disputes
        fetchVendors().then(res => {
            const data = res.data || res;
            if (Array.isArray(data) && data.length > 0) {
                setCurrentVendorId(data[0].id);
                // Temporary: fetch all returns instead of just for the mocked vendor ID
                fetchRTVRequests().then(r => setReturns(Array.isArray(r.data || r) ? (r.data || r) : []));
            }
        }).catch(err => console.error("Failed to fetch mock vendor ID", err));
    }, []);

    const openAckModal = (id) => {
        setAckPoId(id);
        setAckForm({ expectedDeliveryDate: '', vendorNotes: '' });
        setAckModalOpen(true);
    };

    const handleAcknowledgeSubmit = async () => {
        if (!ackPoId) return;
        try {
            await vendorRespondToPO(ackPoId, 'ACCEPTED', ackForm.expectedDeliveryDate, ackForm.vendorNotes);
            toast.success(`PO Acknowledged successfully!`);
            setPos(prev => prev.map(po => po.id === ackPoId ? { ...po, status: 'ACCEPTED', expectedDeliveryDate: ackForm.expectedDeliveryDate } : po));
            setAckModalOpen(false);
            setAckPoId(null);
        } catch (error) {
            toast.error('Failed to acknowledge PO');
        }
    };

    const togglePoExpand = async (id) => {
        if (expandedPo === id) {
            setExpandedPo(null);
        } else {
            setExpandedPo(id);
            if (!fullPos[id]) {
                const poData = await fetchPOById(id);
                if (poData && poData.data) {
                    setFullPos(prev => ({ ...prev, [id]: poData.data }));
                } else if (poData) {
                    setFullPos(prev => ({ ...prev, [id]: poData }));
                }
            }
        }
    };

    const handleDisputeSubmit = async () => {
        if (!currentVendorId) {
            toast.error('No vendor context found. Cannot raise dispute.');
            return;
        }
        if (!disputeForm.relatedInstrument || !disputeForm.narrative) {
            toast.error('Please fill in all dispute fields.');
            return;
        }

        try {
            await raiseDispute(currentVendorId, disputeForm);
            toast.success('Dispute raised and logged successfully!');
            setDisputeForm({ relatedInstrument: '', category: 'Payment not received', narrative: '' });
        } catch (err) {
            toast.error('Failed to raise dispute.');
            console.error(err);
        }
    };

    const [settings, setSettings] = useState({
        allowPOAck: true,
        allowDisputes: true,
        allowInvoices: true,
        notifyWhatsApp: true,
        notifyEmail: true,
        sessionExpiry: '4h',
        portalStatus: 'active'
    });

    const toggleSetting = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
    const saveSettings = () => {
        toast.success('Portal settings updated successfully!');
        setSettingsOpen(false);
    };

    const labelCls = "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1";

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div><h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Vendor Portal (Self-Service)</h1>
                    </div>
                    <SecondaryBtn onClick={() => setSettingsOpen(true)}>
                        <Settings size={14} /> Portal Settings
                    </SecondaryBtn>
                </div>

                <div>
                    {/* ── Horizontal Navigation ── */}
                    <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {TABS.map(t => {
                            const isActive = tab === t.key;
                            return (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    className={`px-5 py-2.5 ${isActive ? 'bg-[#e2f5e3] border-[#bbf7d0]' : 'bg-white hover:bg-slate-50 border-slate-200'} border text-slate-800 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-sm whitespace-nowrap`}>
                                    {t.icon}
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Main Content Area ── */}
                    <div className="w-full">
                        <AnimatePresence mode="wait">
                            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                {tab === 'po' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">Purchase Order Inbox</h3>
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase  flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
                                            </span>
                                        </div>
                                        {pos.slice((poPage - 1) * 10, poPage * 10).map((po, i) => (
                                            <motion.div
                                                key={po.id || i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                            >
                                                <VCard className="group hover:border-emerald-300 hover:shadow-xl transition-all duration-300 relative overflow-hidden bg-white border border-slate-200 shadow-sm mb-4">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10 cursor-pointer" onClick={() => togglePoExpand(po.id)}>
                                                        <div className="w-14 h-14 bg-[#e2f5e3] rounded-2xl flex items-center justify-center text-emerald-600 border border-[#bbf7d0] transition-all shadow-inner group-hover:scale-110 shrink-0">
                                                            <Layout size={22} className="opacity-80 group-hover:opacity-100" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                                                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-200/50 shadow-sm">{po.id}</span>
                                                                <h3 className="text-[17px] font-extrabold text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">{formatCurrency(po.grandTotal || po.amount || 0)} <span className="text-slate-300 font-normal mx-1">|</span> <span className="text-[13px] font-semibold text-slate-500">{po.itemCount || po.items?.length || 0} Items</span></h3>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Expected: {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN') : 'TBD'}</span>
                                                                <StatusBadge status={po.status} size="xs" />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                                                            <SecondaryBtn onClick={() => toast.success(`PO PDF downloaded`)} className="flex-1 md:flex-none">
                                                                <Download size={14} /> PDF
                                                            </SecondaryBtn>
                                                            {((po.status || '').toUpperCase() === 'ACTIVE' || (po.status || '').toUpperCase() === 'PENDING') ? (
                                                                <button onClick={(e) => { e.stopPropagation(); openAckModal(po.id); }}
                                                                    className="flex-1 px-5 py-2 bg-[#e2f5e3] hover:bg-[#d1f0d3] text-slate-800 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-[#bbf7d0] shadow-sm">
                                                                    <CheckCircle size={14} /> Acknowledge
                                                                </button>
                                                            ) : (
                                                                <div className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold uppercase tracking-wider border border-emerald-100">
                                                                    <CheckCircle size={14} /> Acknowledged
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Expanded PO details */}
                                                    <AnimatePresence>
                                                        {expandedPo === po.id && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden mt-4 pt-4 border-t border-slate-100"
                                                            >
                                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                                    <h4 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                        <Package size={14} /> Purchase Items
                                                                    </h4>
                                                                    {!fullPos[po.id] ? (
                                                                        <div className="text-[12px] font-medium text-slate-500 animate-pulse">Loading items...</div>
                                                                    ) : fullPos[po.id].items?.length === 0 ? (
                                                                        <div className="text-[12px] font-medium text-slate-500">No items found for this PO.</div>
                                                                    ) : (
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-left border-collapse">
                                                                                <thead>
                                                                                    <tr className="border-b border-slate-200">
                                                                                        <th className="pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                                                                                        <th className="pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                                                                                        <th className="pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Rate</th>
                                                                                        <th className="pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {fullPos[po.id].items.map((item, idx) => (
                                                                                        <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                                                            <td className="py-2 text-[12px] font-semibold text-slate-800">{item.productName || 'Unknown Product'}</td>
                                                                                            <td className="py-2 text-[12px] font-bold text-slate-700 text-right">{item.quantity}</td>
                                                                                            <td className="py-2 text-[12px] text-slate-600 text-right">{formatCurrency(item.purchaseRate || 0)}</td>
                                                                                            <td className="py-2 text-[12px] font-bold text-slate-800 text-right">{formatCurrency(item.totalAmount || 0)}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </VCard>
                                            </motion.div>
                                        ))}
                                        {pos.length > 10 && (
                                            <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-sm mt-4">
                                                <span className="text-[12px] font-medium text-slate-500">
                                                    Showing <span className="font-bold text-slate-800">{(poPage - 1) * 10 + 1}</span> to <span className="font-bold text-slate-800">{Math.min(poPage * 10, pos.length)}</span> of <span className="font-bold text-slate-800">{pos.length}</span> entries
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        disabled={poPage === 1}
                                                        onClick={() => setPoPage(p => p - 1)}
                                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                        Prev
                                                    </button>
                                                    <span className="text-[12px] font-bold text-slate-800 px-2">{poPage}</span>
                                                    <button
                                                        disabled={poPage * 10 >= pos.length}
                                                        onClick={() => setPoPage(p => p + 1)}
                                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {tab === 'returns' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">Returns & Claims Inbox</h3>
                                            <span className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Action Required
                                            </span>
                                        </div>
                                        {returns.slice((returnsPage - 1) * 10, returnsPage * 10).map((rtv, i) => (
                                            <motion.div
                                                key={rtv.id || i}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                            >
                                                <VCard className="group hover:border-rose-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-white border border-slate-200 shadow-sm">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-400 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10 cursor-pointer" onClick={() => setExpandedReturn(expandedReturn === rtv.id ? null : rtv.id)}>
                                                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100 transition-all shadow-inner group-hover:scale-110 shrink-0">
                                                            <RotateCcw size={22} className="opacity-80 group-hover:opacity-100" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                                                <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50/80 px-2.5 py-1 rounded-md border border-rose-200/50 shadow-sm">{rtv.rtvNumber}</span>
                                                                <h3 className="text-[17px] font-extrabold text-slate-800 tracking-tight group-hover:text-rose-700 transition-colors">{formatCurrency(rtv.totalReturnValue || 0)} <span className="text-slate-300 font-normal mx-1">|</span> <span className="text-[13px] font-semibold text-slate-500">PO: {rtv.purchaseOrderNumber || 'N/A'}</span></h3>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> GRN: {rtv.grnNumber || 'N/A'}</span>
                                                                <StatusBadge status={rtv.status} size="xs" />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                                                            {['INITIATED', 'DEBIT_NOTE_RAISED', 'FLAGGED'].includes(rtv.status?.toUpperCase()) && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setExpandedReturn(expandedReturn === rtv.id ? null : rtv.id); }}
                                                                    className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[11px] font-bold uppercase tracking-wider hover:bg-rose-100 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                                                                >
                                                                    <ShieldCheck size={14} /> Review & Decide
                                                                </button>
                                                            )}
                                                            <SecondaryBtn onClick={(e) => { e.stopPropagation(); toast.success(`Return details downloaded`); }} className="flex-1 md:flex-none">
                                                                <Download size={14} /> PDF
                                                            </SecondaryBtn>
                                                        </div>
                                                    </div>

                                                    {/* Expanded details and Decision Desk */}
                                                    <AnimatePresence>
                                                        {expandedReturn === rtv.id && (
                                                            <motion.div 
                                                                initial={{ opacity: 0, height: 0 }} 
                                                                animate={{ opacity: 1, height: 'auto' }} 
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="mt-6 pt-6 border-t border-slate-100 overflow-hidden"
                                                            >
                                                                <div className="mb-4">
                                                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Returned Items</h4>
                                                                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                                                        <table className="w-full text-left text-[11px]">
                                                                            <thead>
                                                                                <tr className="bg-slate-100 text-slate-500 font-bold uppercase border-b border-slate-200">
                                                                                    <th className="px-4 py-2">Item</th>
                                                                                    <th className="px-4 py-2">Qty</th>
                                                                                    <th className="px-4 py-2">Unit Price</th>
                                                                                    <th className="px-4 py-2">Total</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {(rtv.returnedProducts || []).map((item, idx) => (
                                                                                    <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                                                        <td className="px-4 py-2 font-medium text-slate-700">{item.productName}</td>
                                                                                        <td className="px-4 py-2 text-rose-600 font-bold">{item.returnedQuantity || item.quantity}</td>
                                                                                        <td className="px-4 py-2">{formatCurrency(item.unitPrice)}</td>
                                                                                        <td className="px-4 py-2 font-bold">{formatCurrency(item.totalValue)}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>

                                                                {['INITIATED', 'DEBIT_NOTE_RAISED', 'FLAGGED'].includes(rtv.status?.toUpperCase()) && (
                                                                    <div className="bg-rose-50/30 rounded-2xl p-5 border border-rose-100">
                                                                        <h4 className="text-[11px] font-bold text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                            <ShieldCheck size={14} /> Vendor Decision Required
                                                                        </h4>
                                                                        <p className="text-[10px] font-bold text-slate-500 mb-5 uppercase tracking-tight">
                                                                            Please review the returned items and choose to accept the debit note or dispute the claim.
                                                                        </p>

                                                                        {!showDisputeInput ? (
                                                                            <div className="flex gap-3">
                                                                                <PrimaryBtn
                                                                                    className="flex-1"
                                                                                    icon={<CheckCircle size={16} />}
                                                                                    onClick={async (e) => {
                                                                                        e.stopPropagation();
                                                                                        try {
                                                                                            const res = await updateRTVStatus(rtv.id, 'RESOLVED');
                                                                                            const updated = res.data || res;
                                                                                            setReturns(prev => prev.map(r => r.id === rtv.id ? updated : r));
                                                                                            toast.success('Return accepted & debit note resolved.');
                                                                                        } catch (err) {
                                                                                            toast.error('Failed to update return status');
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    Accept Return & Debit
                                                                                </PrimaryBtn>
                                                                                <button
                                                                                    onClick={(e) => { e.stopPropagation(); setShowDisputeInput(true); }}
                                                                                    className="flex-1 py-2.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                                                                                >
                                                                                    <XCircle size={16} /> Deny & Dispute
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                                                                <textarea
                                                                                    value={disputeReason}
                                                                                    onChange={(e) => setDisputeReason(e.target.value)}
                                                                                    placeholder="Provide a detailed reason for disputing this return..."
                                                                                    className="w-full bg-white border border-rose-200 rounded-xl p-3 text-xs outline-none focus:border-rose-400 min-h-[80px]"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                />
                                                                                <div className="flex gap-2 justify-end">
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); setShowDisputeInput(false); setDisputeReason(''); }}
                                                                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-50 transition-all"
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={async (e) => {
                                                                                            e.stopPropagation();
                                                                                            if (!disputeReason.trim()) return toast.error('Please enter a dispute reason');
                                                                                            try {
                                                                                                const res = await updateRTVStatus(rtv.id, 'DISPUTED', disputeReason);
                                                                                                const updated = res.data || res;
                                                                                                setReturns(prev => prev.map(r => r.id === rtv.id ? updated : r));
                                                                                                setShowDisputeInput(false);
                                                                                                setDisputeReason('');
                                                                                                toast.success('Dispute raised successfully.');
                                                                                            } catch (err) {
                                                                                                toast.error('Failed to raise dispute');
                                                                                            }
                                                                                        }}
                                                                                        className="px-4 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-rose-700 transition-all shadow-sm"
                                                                                    >
                                                                                        Submit Dispute
                                                                                    </button>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </VCard>
                                            </motion.div>
                                        ))}
                                        {returns.length > 10 && (
                                            <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl shadow-sm mt-4">
                                                <span className="text-[12px] font-medium text-slate-500">
                                                    Showing <span className="font-bold text-slate-800">{(returnsPage - 1) * 10 + 1}</span> to <span className="font-bold text-slate-800">{Math.min(returnsPage * 10, returns.length)}</span> of <span className="font-bold text-slate-800">{returns.length}</span> entries
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        disabled={returnsPage === 1}
                                                        onClick={() => setReturnsPage(p => p - 1)}
                                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                        Prev
                                                    </button>
                                                    <span className="text-[12px] font-bold text-slate-800 px-2">{returnsPage}</span>
                                                    <button
                                                        disabled={returnsPage * 10 >= returns.length}
                                                        onClick={() => setReturnsPage(p => p + 1)}
                                                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}


                                {tab === 'docs' && (
                                    <VCard className="py-16 text-center border-dashed border-slate-200 bg-white shadow-sm">
                                        <div className="w-16 h-16 bg-[#e2f5e3] rounded-full flex items-center justify-center text-emerald-600 mb-4 border border-[#bbf7d0] mx-auto shadow-sm">
                                            <FileText size={28} />
                                        </div>
                                        <h3 className="text-[16px] font-bold text-slate-800">Secure Document Upload</h3>
                                        <p className="text-[12px] text-slate-400 font-medium max-w-sm mx-auto mt-2 leading-relaxed mb-8">
                                            Upload Invoices, GST Certificates, or Legal Agreements for immediate processing.
                                        </p>
                                        <button onClick={() => toast.success('Document uploaded!')}
                                            className="mx-auto px-8 py-3.5 bg-[#e2f5e3] hover:bg-[#d1f0d3] text-slate-800 text-[13px] font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 border border-[#bbf7d0] shadow-sm">
                                            <FileText size={16} /> Select Files to Upload
                                        </button>
                                        <p className="text-[9px] text-slate-300 font-bold uppercase mt-4 tracking-[0.2em]">PDF, JPG, PNG (Max 10MB)</p>
                                    </VCard>
                                )}

                                {tab === 'dispute' && (
                                    <div className="max-w-4xl mx-auto">
                                        <VCard className="relative overflow-hidden bg-white shadow-lg border border-slate-200">
                                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-orange-400 to-amber-400"></div>

                                            <div className="flex items-start gap-5 mb-8">
                                                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 shadow-inner">
                                                    <Scale size={24} />
                                                </div>
                                                <div>
                                                    <h2 className="text-[22px] font-black text-slate-800 tracking-tight leading-tight">Formal Compliance Dispute</h2>
                                                    <p className="text-[13px] font-medium text-slate-500 mt-1">Log a discrepancy regarding payments, quantities, or pricing. This will be routed to the central compliance team for immediate review.</p>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-2xl border border-slate-200 p-6 space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                            <FileText size={12} className="text-slate-400" /> Related Instrument
                                                        </label>
                                                        <select
                                                            value={disputeForm.relatedInstrument}
                                                            onChange={e => setDisputeForm({ ...disputeForm, relatedInstrument: e.target.value })}
                                                            className="w-full text-[14px] font-bold border-2 border-slate-200 rounded-xl px-4 py-3 bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all outline-none text-slate-800 cursor-pointer shadow-sm hover:border-slate-300">
                                                            <option value="">Select an Invoice...</option>
                                                            {invoices.map(i => <option key={i.id} value={i.id}>{i.id} — {formatCurrency(i.totalAmount || i.invoiceAmount || 0)}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Info size={12} className="text-slate-400" /> Dispute Category
                                                        </label>
                                                        <select
                                                            value={disputeForm.category}
                                                            onChange={e => setDisputeForm({ ...disputeForm, category: e.target.value })}
                                                            className="w-full text-[14px] font-bold border-2 border-slate-200 rounded-xl px-4 py-3 bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all outline-none text-slate-800 cursor-pointer shadow-sm hover:border-slate-300">
                                                            <option value="Payment not received">Payment Not Received</option>
                                                            <option value="Wrong quantity">Wrong Quantity</option>
                                                            <option value="Pricing mismatch">Pricing Mismatch</option>
                                                            <option value="Damaged goods">Damaged Goods</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                        <FileText size={12} className="text-slate-400" /> Detailed Narrative
                                                    </label>
                                                    <textarea rows={5} placeholder="Provide a comprehensive description of the discrepancy..."
                                                        value={disputeForm.narrative}
                                                        onChange={e => setDisputeForm({ ...disputeForm, narrative: e.target.value })}
                                                        className="w-full text-[14px] font-medium border-2 border-slate-200 rounded-xl px-4 py-3 bg-white focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all outline-none resize-none leading-relaxed text-slate-800 shadow-sm hover:border-slate-300" />
                                                </div>
                                            </div>

                                            <div className="mt-8 flex justify-end">
                                                <button onClick={handleDisputeSubmit}
                                                    className="px-8 py-3.5 bg-[#e2f5e3] hover:bg-[#d1f0d3] text-slate-800 text-[13px] font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 flex items-center gap-2 border border-[#bbf7d0] shadow-sm">
                                                    <ShieldCheck size={16} />
                                                    Submit Formal Dispute
                                                </button>
                                            </div>
                                        </VCard>
                                    </div>
                                )}

                                {tab === 'payments' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">Real-time Payment View</h3>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase ">Synced: 10m ago</span>
                                        </div>
                                        {(() => {
                                            const combinedItems = [];
                                            payments.forEach(payment => combinedItems.push({ type: 'payment', data: payment }));
                                            invoices.forEach(inv => {
                                                const hasPayment = payments.some(p => p.invoiceId === inv.id || p.invoiceNumber === inv.invoiceNumber);
                                                if (!hasPayment) combinedItems.push({ type: 'invoice', data: inv });
                                            });

                                            if (combinedItems.length === 0) {
                                                return <div className="text-center py-8 text-sm text-slate-500">No pending or completed payments found.</div>;
                                            }

                                            return combinedItems.map((item, i) => {
                                                const isPayment = item.type === 'payment';
                                                const payment = isPayment ? item.data : null;
                                                const inv = isPayment ? null : item.data;

                                                const isPaid = isPayment || (inv && inv.submissionStatus === 'PAID');
                                                const status = isPaid ? 'SUCCESS' : (inv?.submissionStatus === 'APPROVED' ? 'PENDING' : inv?.submissionStatus);

                                                const displayPrefix = isPaid ? 'BATCH:' : 'INV:';
                                                const displayId = isPayment
                                                    ? (payment.bankReference || payment.paymentNumber || payment.id.split('-')[0])
                                                    : (inv.invoiceNumber || inv.id.split('-')[0]);

                                                const amount = isPayment
                                                    ? (payment.netPayment || payment.paymentAmount || 0)
                                                    : (inv.totalAmount || inv.invoiceAmount || 0);

                                                return (
                                                    <VCard key={i} className="group bg-white hover:border-emerald-200 transition-all shadow-sm">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 transition-all shrink-0">
                                                                    <CreditCard size={18} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 group-hover:bg-white">
                                                                            {displayPrefix} {displayId}
                                                                        </span>
                                                                        <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{formatCurrency(amount)}</h3>
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase italic">
                                                                        {isPaid
                                                                            ? `Invoice: ${isPayment ? payment.invoiceNumber || 'N/A' : inv?.invoiceNumber || 'N/A'}`
                                                                            : `Due: ${inv?.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'N/A'}`
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <StatusBadge status={status || 'PENDING'} size="xs" />
                                                                <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-100">
                                                                    <Info size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </VCard>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Portal Settings Modal */}
            <VModal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Portal Configuration Settings" width="max-w-2xl">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-emerald-600 uppercase  mb-3 flex items-center gap-2">
                                <ShieldCheck size={14} /> Self-Service Permissions
                            </h4>
                            {[
                                { key: 'allowPOAck', label: 'Allow PO Acknowledgement', desc: 'Confirm POs digitally' },
                                { key: 'allowDisputes', label: 'Allow Dispute Raising', desc: 'Compliance dispute portal' },
                                { key: 'allowInvoices', label: 'Allow Invoice Upload', desc: 'Direct document sync' },
                            ].map(p => (
                                <div key={p.key} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 transition-all">
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-700">{p.label}</p>
                                        <p className="text-[9px] text-slate-400 font-medium">{p.desc}</p>
                                    </div>
                                    <button onClick={() => toggleSetting(p.key)}
                                        className={`w-9 h-4.5 rounded-full relative transition-colors mt-1 ${settings[p.key] ? 'bg-[#16a34a]' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings[p.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-emerald-600 uppercase  mb-3 flex items-center gap-2">
                                <CheckCircle size={14} /> Communication Prefs
                            </h4>
                            {[
                                { key: 'notifyEmail', label: 'Email Digest', desc: 'Daily settlement logs' },
                            ].map(p => (
                                <div key={p.key} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 transition-all">
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-700">{p.label}</p>
                                        <p className="text-[9px] text-slate-400 font-medium">{p.desc}</p>
                                    </div>
                                    <button onClick={() => toggleSetting(p.key)}
                                        className={`w-9 h-4.5 rounded-full relative transition-colors mt-1 ${settings[p.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings[p.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls}>Portal Status</label>
                                <div className="flex gap-2">
                                    {['active', 'maintenance'].map(s => (
                                        <button key={s} onClick={() => setSettings(prev => ({ ...prev, portalStatus: s }))}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${settings.portalStatus === s ? 'bg-[#16a34a] text-white border-[#16a34a] shadow-md shadow-emerald-100' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-200'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Session Expiry</label>
                                <select value={settings.sessionExpiry} onChange={e => setSettings(s => ({ ...s, sessionExpiry: e.target.value }))}
                                    className="w-full text-[12px] font-bold border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:border-emerald-500 outline-none">
                                    <option value="1h">1 Hour</option>
                                    <option value="4h">4 Hours</option>
                                    <option value="12h">12 Hours</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <SecondaryBtn onClick={() => setSettingsOpen(false)}>
                            Cancel
                        </SecondaryBtn>
                        <button onClick={saveSettings}
                            className="px-6 py-2.5 bg-[#e2f5e3] hover:bg-[#d1f0d3] text-slate-800 text-[12px] font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 border border-[#bbf7d0] shadow-sm">
                            Apply Config
                        </button>
                    </div>
                </div>
            </VModal>
            {/* Acknowledge PO Modal */}
            <VModal open={ackModalOpen} onClose={() => { setAckModalOpen(false); setAckPoId(null); }} title="Acknowledge Purchase Order" width="max-w-md">
                <div className="space-y-4">
                    <div>
                        <label className={labelCls}>Expected Delivery Date</label>
                        <input
                            type="date"
                            value={ackForm.expectedDeliveryDate}
                            onChange={(e) => setAckForm({ ...ackForm, expectedDeliveryDate: e.target.value })}
                            className="w-full text-[12px] font-bold border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:border-emerald-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Vendor Notes (Optional)</label>
                        <textarea
                            value={ackForm.vendorNotes}
                            onChange={(e) => setAckForm({ ...ackForm, vendorNotes: e.target.value })}
                            placeholder="e.g., All products available, except..."
                            rows={3}
                            className="w-full text-[12px] font-bold border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:border-emerald-500 outline-none resize-none"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                        <SecondaryBtn onClick={() => { setAckModalOpen(false); setAckPoId(null); }}>
                            Cancel
                        </SecondaryBtn>
                        <button onClick={handleAcknowledgeSubmit}
                            className="px-6 py-2 bg-[#e2f5e3] hover:bg-[#d1f0d3] text-slate-800 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-[#bbf7d0] shadow-sm">
                            <CheckCircle size={14} /> Confirm
                        </button>
                    </div>
                </div>
            </VModal>
        </div>
    );
}
