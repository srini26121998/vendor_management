import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import { fetchGRNById, fetchPOById, approveGRN } from '../../api/vendorService';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Package, FileText, Building2, Calendar, Hash,
    User, DollarSign, ClipboardList, CheckCircle2, Clock,
    AlertCircle, Printer, Edit3, Download, Truck, BarChart3,
    ShoppingBag, TrendingUp, Tag
} from 'lucide-react';

const STATUS_CONFIG = {
    matched:  { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Matched' },
    partial:  { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',   dot: 'bg-amber-500',   label: 'Partial' },
    pending:  { bg: 'bg-slate-50',    text: 'text-slate-600',    border: 'border-slate-200',   dot: 'bg-slate-400',   label: 'Pending' },
    active:   { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function InfoRow({ icon: Icon, label, value, mono = false, highlight = false }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={15} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className={`text-[14px] font-bold truncate ${highlight ? 'text-blue-600' : 'text-slate-800'} ${mono ? 'font-mono' : ''}`}>
                    {value || '—'}
                </p>
            </div>
        </div>
    );
}

function SectionCard({ title, icon: Icon, children }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center">
                    <Icon size={16} />
                </div>
                <h3 className="text-slate-800 font-bold text-[14px] uppercase tracking-wide">{title}</h3>
            </div>
            <div className="p-5 flex-1">{children}</div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, sub }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-2 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <Icon size={16} />
                </div>
            </div>
            <p className="text-[24px] font-extrabold text-slate-800 leading-none mt-1">{value}</p>
            {sub && <p className="text-[11px] text-slate-400 font-medium">{sub}</p>}
        </div>
    );
}

export default function GRNDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [grn, setGrn] = useState(null);
    const [po, setPo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await fetchGRNById(id);
                const grnData = res?.data || res;
                if (grnData) {
                    setGrn(grnData);
                    if (grnData.purchaseOrderId) {
                        const poRes = await fetchPOById(grnData.purchaseOrderId);
                        const poData = poRes?.data || poRes;
                        if (poData) {
                            setPo(poData);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load GRN details:", err);
                toast.error("Failed to load GRN details");
            } finally {
                setLoading(false);
            }
        };
        if (id) load();
    }, [id]);

    const handleApprove = async () => {
        try {
            toast.loading("Approving & finalizing GRN...", { id: "grn-approve" });
            const res = await approveGRN(grn.id);
            toast.success("GRN Approved successfully! Store stocks updated.", { id: "grn-approve" });
            
            // Reload the GRN details to update UI state
            const grnData = res?.data || res;
            if (grnData) {
                setGrn(grnData);
                if (grnData.purchaseOrderId) {
                    const poRes = await fetchPOById(grnData.purchaseOrderId);
                    const poData = poRes?.data || poRes;
                    if (poData) {
                        setPo(poData);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to approve GRN:", err);
            const errMsg = err.response?.data?.message || err.message || "Failed to approve GRN";
            toast.error(errMsg, { id: "grn-approve" });
        }
    };

    if (loading) {
        return (
            <div className="w-full bg-[#F3F5F9] min-h-screen p-8 animate-pulse" style={{ fontFamily: '"Inter", sans-serif' }}>
                <div className="max-w-[1400px] mx-auto space-y-6">
                    <div className="h-10 bg-slate-200 rounded-xl w-1/4" />
                    <div className="grid grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="h-80 bg-slate-200 rounded-2xl" />
                        <div className="col-span-2 h-80 bg-slate-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!grn) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" style={{ fontFamily: '"Inter", sans-serif' }}>
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertCircle size={36} className="text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-700">GRN Not Found</h2>
                <p className="text-slate-400 text-sm">GRN <span className="font-mono font-bold">{id}</span> does not exist.</p>
                <button
                    onClick={() => navigate(VENDOR_ROUTES.grnList)}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all"
                >
                    ← Back to GRN List
                </button>
            </div>
        );
    }

    const lineItems = grn.items || [];
    
    let subtotal = 0;
    let totalTax = 0;
    
    lineItems.forEach(i => {
        const qty = (i.acceptedQuantity !== undefined && i.acceptedQuantity !== null) 
            ? i.acceptedQuantity 
            : (i.receivedQuantity || 0);
        const itemSubtotal = i.unitPrice * qty;
        const taxRate = i.gstRate !== undefined && i.gstRate !== null ? i.gstRate : 5;
        const itemTax = itemSubtotal * (taxRate / 100);
        
        subtotal += itemSubtotal;
        totalTax += itemTax;
    });
    
    const grandTotal = subtotal + totalTax;

    const matchPct = lineItems.length > 0 ? Math.round(
        (lineItems.filter(i => i.orderedQuantity === i.receivedQuantity).length / lineItems.length) * 100
    ) : 100;

    const statusCfg = STATUS_CONFIG[grn.status?.toLowerCase()] || STATUS_CONFIG.pending;

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen pb-16" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* ── Top Navigation Bar ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(VENDOR_ROUTES.grnList)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-[13px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                                    {grn.grnNumber || grn.id?.substring(0, 8)}
                                </span>
                                <StatusBadge status={grn.status?.toLowerCase()} />
                            </div>
                            <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                                GRN Detail View &nbsp;·&nbsp; Received on {formatDate(grn.receivedDate || grn.createdAt)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">

                        <button
                            onClick={() => navigate(VENDOR_ROUTES.grnEntry, { state: { grn, mode: 'edit' } })}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <Edit3 size={14} /> Edit GRN
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                            <Download size={14} /> Export
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-[13px] font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm">
                            <Printer size={14} /> Print GRN
                        </button>
                    </div>
                </div>

                {/* ── Summary Stats Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard label="Total Amount" value={formatCurrency(grandTotal)} icon={DollarSign} color="blue" sub="Including GST" />
                    <StatCard label="Line Items" value={lineItems.length} icon={Package} color="purple" sub="Items received" />
                    <StatCard label="Match Rate" value={`${matchPct}%`} icon={BarChart3} color={matchPct === 100 ? 'emerald' : 'amber'} sub="Vs ordered PO quantities" />
                    <StatCard label="PO Reference" value={po?.invoiceNumber || grn.purchaseOrderNumber || '—'} icon={ClipboardList} color="slate" sub="Linked purchase order" />
                </div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                    {/* Column 1 — GRN Info */}
                    <SectionCard title="GRN Information" icon={FileText}>
                        <InfoRow icon={Hash}           label="GRN Number"    value={grn.grnNumber || grn.id} mono highlight />
                        <InfoRow icon={Calendar}       label="Received Date"  value={formatDate(grn.receivedDate || grn.createdAt)} />
                        <InfoRow icon={User}           label="Received By"    value={grn.receivedByUserName || 'System User'} />
                        <InfoRow icon={CheckCircle2}   label="Match Status"
                            value={
                                <StatusBadge status={grn.status?.toLowerCase()} />
                            }
                        />
                        <InfoRow icon={Package}        label="Total Items"    value={`${lineItems.length} line items`} />
                        <InfoRow icon={DollarSign}     label="Total Amount"   value={formatCurrency(grandTotal)} highlight />
                    </SectionCard>

                    {/* Column 2 — Linked Purchase Order */}
                    <SectionCard title="Linked Purchase Order" icon={ClipboardList}>
                        <InfoRow icon={Hash}       label="PO Number"      value={po?.invoiceNumber || grn.purchaseOrderNumber || '—'} mono highlight />
                        <InfoRow icon={Calendar}   label="PO Date"        value={po?.invoiceDate ? formatDate(po.invoiceDate) : '—'} />
                        <InfoRow icon={Calendar}   label="Delivery Date"  value={po?.dueDate ? formatDate(po.dueDate) : '—'} />
                        <InfoRow icon={DollarSign} label="PO Amount"      value={po?.grandTotal ? formatCurrency(po.grandTotal) : '—'} />
                        <div className="mt-5">
                            <button
                                onClick={() => navigate(`/vendors/purchase-orders/${grn.purchaseOrderId}`)}
                                className="w-full py-2.5 text-[12px] font-bold text-blue-600 bg-white hover:bg-slate-50 rounded-xl border border-blue-200 transition-all shadow-sm"
                            >
                                View Full PO →
                            </button>
                        </div>
                    </SectionCard>

                    {/* Column 3 — Vendor Details */}
                    <SectionCard title="Vendor Details" icon={Building2}>
                        <InfoRow icon={Building2}  label="Vendor"         value={grn.vendorName || po?.vendor?.legalName || '—'} highlight />
                        <InfoRow icon={Hash}       label="Vendor Code"    value={po?.vendor?.vendorCode || '—'} mono />
                        <InfoRow icon={Truck}      label="Category"       value="Food & Beverages" />
                        <InfoRow icon={Tag}        label="Supplier Status" value="Active Supplier" />
                    </SectionCard>
                </div>

                {/* ── Line Items Table ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                <ShoppingBag size={15} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-bold text-slate-800">Line Item Details</h3>
                                <p className="text-[11px] text-slate-400">Ordered vs. Received quantities per SKU</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[11px] font-bold">
                            {lineItems.length} Items
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60 border-b border-slate-100">
                                    <th className="px-6 py-3">#</th>
                                    <th className="px-4 py-3">SKU / Barcode</th>
                                    <th className="px-4 py-3">Product Name</th>
                                    <th className="px-4 py-3">UOM</th>
                                    <th className="px-4 py-3 text-right">Ordered Qty</th>
                                    <th className="px-4 py-3 text-right">Received Qty</th>
                                    <th className="px-4 py-3 text-right">Accepted Qty</th>
                                    <th className="px-4 py-3 text-right">Rejected Qty</th>
                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                    <th className="px-4 py-3 text-right">Tax %</th>
                                    <th className="px-4 py-3 text-right">Amount</th>
                                    <th className="px-4 py-3 text-center">Match</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {lineItems.map((item, i) => {
                                    const isMatch = item.orderedQuantity === item.receivedQuantity;
                                    const qty = (item.acceptedQuantity !== undefined && item.acceptedQuantity !== null) 
                                        ? item.acceptedQuantity 
                                        : (item.receivedQuantity || 0);
                                    const taxRate = item.gstRate !== undefined && item.gstRate !== null ? item.gstRate : 5;
                                    const itemAmt = qty * item.unitPrice * (1 + taxRate / 100);
                                    return (
                                        <tr key={item.id || i} className="hover:bg-slate-50/40 transition-colors group">
                                            <td className="px-6 py-4 text-[12px] text-slate-400 font-bold">{i + 1}</td>
                                            <td className="px-4 py-4">
                                                <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                    {item.productBarcode || item.vendorProductSku || 'No SKU'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-[13px] font-semibold text-slate-700 whitespace-nowrap">{item.productName || 'Unknown Product'}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-bold">PCS</span>
                                            </td>
                                            <td className="px-4 py-4 text-right text-[13px] font-bold text-slate-600">{item.orderedQuantity}</td>
                                            <td className="px-4 py-4 text-right text-[13px] font-bold text-slate-600">{item.receivedQuantity}</td>
                                            <td className="px-4 py-4 text-right">
                                                <span className={`text-[13px] font-bold ${isMatch ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {item.acceptedQuantity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right text-[13px] font-semibold text-rose-600">{item.rejectedQuantity}</td>
                                            <td className="px-4 py-4 text-right text-[13px] font-semibold text-slate-600">
                                                {formatCurrency(item.unitPrice)}
                                            </td>
                                            <td className="px-4 py-4 text-right text-[12px] text-slate-400 font-bold">
                                                {item.gstRate !== undefined && item.gstRate !== null ? `${item.gstRate}%` : '5%'}
                                            </td>
                                            <td className="px-4 py-4 text-right text-[13px] font-bold text-slate-800">
                                                {formatCurrency(itemAmt)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {isMatch ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold">
                                                        <CheckCircle2 size={10} /> Match
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-bold">
                                                        <AlertCircle size={10} /> Short
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50 border-t-2 border-slate-100">
                                    <td colSpan={10} className="px-6 py-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-right">
                                        Grand Total
                                    </td>
                                    <td className="px-4 py-4 text-right text-[16px] font-extrabold text-blue-700">
                                        {formatCurrency(grandTotal)}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                            {matchPct}% Matched
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* ── Summary Footer Cards ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subtotal (Before Tax)</p>
                        <p className="text-[20px] font-extrabold text-slate-800">{formatCurrency(subtotal)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">GST / Tax Amount</p>
                        <p className="text-[20px] font-extrabold text-amber-600">{formatCurrency(totalTax)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grand Total</p>
                        <p className="text-[20px] font-extrabold text-blue-600">{formatCurrency(grandTotal)}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Includes all applicable taxes</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
