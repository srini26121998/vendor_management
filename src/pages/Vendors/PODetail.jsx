import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import { VCard, Stepper, StatusBadge, SectionTitle } from './VendorComponents';
import { ArrowLeft, Download, Package, Loader2, Send, CheckCircle, FileText, ThumbsUp, CheckSquare, Receipt, Link, CreditCard } from 'lucide-react';
import purchaseService from '../../api/purchaseService';
import toast from 'react-hot-toast';

const PO_STAGES = [
    { label: 'PO Created', icon: <FileText size={16} /> },
    { label: 'PO Approved', icon: <ThumbsUp size={16} /> },
    { label: 'Sent to Vendor', icon: <Send size={16} /> }, { label: 'GRN Initiated', icon: <Package size={16} /> },
    { label: 'GRN Complete', icon: <CheckSquare size={16} /> }, { label: 'Invoice Rcvd', icon: <Receipt size={16} /> },
    { label: 'Invoice Matched', icon: <Link size={16} /> }, { label: 'Payment Done', icon: <CreditCard size={16} /> },
];

const STATUS_TO_STAGE = {
    'pending': 0,
    'approved': 1,
    'accepted': 1,
    'sent': 2,
    'grn_initiated': 3,
    'grn_complete': 4,
    'invoice_received': 5,
    'matched': 6,
    'paid': 7
};

export default function PODetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [po, setPo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [expectedDate, setExpectedDate] = useState('');

    useEffect(() => {
        const fetchPo = async () => {
            setIsLoading(true);
            try {
                const data = await purchaseService.getPurchaseById(id);
                setPo(data);
            } catch (err) {
                console.error('Failed to fetch PO:', err);
                toast.error('Failed to load purchase order details');
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchPo();
    }, [id]);

    const handleMarkAsSent = async () => {
        try {
            setIsSubmitting(true);
            const res = await purchaseService.updatePurchaseStatus(po.id, 'sent');
            const updated = res?.data || res;
            if (updated) {
                setPo(updated);
                toast.success('Purchase Order marked as Sent to Vendor! 📤');
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            toast.error('Failed to update status');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproveClick = () => {
        setShowApproveModal(true);
        if (po?.dueDate) {
            setExpectedDate(po.dueDate.split('T')[0]);
        } else {
            setExpectedDate('');
        }
    };

    const handleConfirmApprove = async () => {
        if (!expectedDate) {
            toast.error('Please select an expected delivery date');
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await purchaseService.vendorRespondToPO(po.id, 'accepted', expectedDate);
            const updated = res?.data || res;
            if (updated) {
                setPo(updated);
                toast.success('Purchase Order Approved! ✅');
                setShowApproveModal(false);
            }
        } catch (err) {
            console.error('Failed to approve PO:', err);
            toast.error('Failed to approve PO');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDecline = () => {
        setShowApproveModal(false);
    };

    if (isLoading) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-[13px] font-bold text-slate-500">Syncing Purchase Data...</p>
            </div>
        );
    }

    if (!po) {
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl">❓</div>
                <p className="text-[15px] font-bold text-slate-800">Purchase Order not found</p>
                <button onClick={() => navigate(VENDOR_ROUTES.poList)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-[13px]">Back to Registry</button>
            </div>
        );
    }

    const currentStage = STATUS_TO_STAGE[po.status?.toLowerCase()] || 0;

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen" style={{ fontFamily: '"Inter", sans-serif' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');`}</style>

            {/* ── Top Bar ── */}
            <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(VENDOR_ROUTES.poList)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-100 transition-all">
                        <ArrowLeft size={13} /> Back
                    </button>
                    <div className="h-4 w-px bg-slate-200" />
                    <nav className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <button onClick={() => navigate(VENDOR_ROUTES.poList)} className="hover:text-blue-600 transition-colors">Purchase Orders</button>
                        <span className="mx-1">/</span>
                        <span className="text-slate-700">{po.invoiceNumber || po.id}</span>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(VENDOR_ROUTES.poCreate, { state: { po: po, mode: 'edit' } })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Edit
                    </button>
                    <button onClick={async () => {
                        if(window.confirm('Are you sure you want to delete this PO?')) {
                            await purchaseService.deletePurchase(po.id);
                            toast.success('PO Deleted');
                            navigate(VENDOR_ROUTES.poList);
                        }
                    }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                    </button>
                    <button onClick={() => toast.success('Printing...')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-all">
                        <Download size={13} /> Export PDF
                    </button>
                    {po.status?.toLowerCase() === 'pending' && (
                        <button onClick={handleApproveClick} disabled={isSubmitting}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 rounded-lg text-[11px] font-bold text-white hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50">
                            <CheckCircle size={13} /> Approve PO
                        </button>
                    )}
                    {(po.status?.toLowerCase() === 'approved' || po.status?.toLowerCase() === 'accepted') && (
                        <button onClick={handleMarkAsSent} disabled={isSubmitting}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 rounded-lg text-[11px] font-bold text-white hover:bg-purple-700 transition-all shadow-sm disabled:opacity-50">
                            <Send size={13} /> Mark as Sent / Vendor Accepted
                        </button>
                    )}
                    {(po.status?.toLowerCase() === 'approved' || po.status?.toLowerCase() === 'accepted' || po.status?.toLowerCase() === 'sent') && (
                        <button onClick={() => navigate(VENDOR_ROUTES.grnEntry)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 rounded-lg text-[11px] font-bold text-white hover:bg-blue-700 transition-all shadow-sm">
                            <Package size={13} /> Create GRN
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full px-6 py-4 space-y-4">
                {/* ── Title Row ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">{po.invoiceNumber || 'PO RECORD'}</h1>
                        <p className="text-[12px] text-slate-500 mt-0.5">
                            Vendor: <span className="font-bold text-slate-700">{po.vendor?.legalName || 'N/A'}</span>
                            <span className="mx-2 text-slate-300">·</span>
                            {formatDate(po.invoiceDate || po.createdAt)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <StatusBadge status={po.status} />
                    </div>
                </div>

                {/* ── Fulfillment Stepper ── */}
                <VCard>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Fulfillment Pipeline</p>
                    <Stepper steps={PO_STAGES} current={currentStage} />
                </VCard>

                {/* ── Top Row: PO Details & Vendor Info ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Details */}
                    <VCard className="relative overflow-hidden group h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <Package size={14} className="text-blue-500" /> Purchase Order Details
                        </p>
                        <div className="space-y-3 relative z-10">
                            {[
                                ['PO ID', po.id.substring(0, 8).toUpperCase(), true],
                                ['Order Date', formatDate(po.invoiceDate || po.createdAt)],
                                ['Expected Delivery', po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : 'Not Set'],
                                ['Due Date', po.dueDate ? formatDate(po.dueDate) : 'Not Set'],
                                ['Payment Terms', po.paymentMode || 'CREDIT'],
                            ].map(([l, v, isId]) => (
                                <div key={l} className="flex justify-between items-center py-0.5">
                                    <span className="text-[12px] text-slate-500 font-medium">{l}</span>
                                    <span className={`text-[12px] font-bold ${isId ? 'font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100' : 'text-slate-800'}`}>{v}</span>
                                </div>
                            ))}
                        </div>
                    </VCard>

                    {/* Vendor Information */}
                    {po.vendor ? (
                        <VCard className="relative overflow-hidden group h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px]">V</span>
                                Vendor Information
                            </p>
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-[12px] text-slate-500 font-medium">Legal Name</span>
                                    <span className="text-[12px] font-bold text-slate-800 text-right">{po.vendor.legalName}</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-[12px] text-slate-500 font-medium">Vendor Code</span>
                                    <span className="text-[12px] font-bold text-slate-800 text-right">{po.vendor.vendorCode}</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-[12px] text-slate-500 font-medium">GSTIN</span>
                                    <span className="text-[12px] font-bold text-slate-800 text-right">{po.vendor.gstin || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-[12px] text-slate-500 font-medium">Email</span>
                                    <a href={`mailto:${po.vendor.primaryEmail}`} className="text-[12px] font-bold text-blue-600 hover:text-blue-800 hover:underline text-right transition-colors">{po.vendor.primaryEmail || 'N/A'}</a>
                                </div>
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="text-[12px] text-slate-500 font-medium">Phone</span>
                                    <span className="text-[12px] font-bold text-slate-800 text-right">{po.vendor.primaryMobile || 'N/A'}</span>
                                </div>
                            </div>
                        </VCard>
                    ) : (
                        <VCard className="flex items-center justify-center h-full">
                            <span className="text-slate-400 text-sm font-medium">No Vendor Linked</span>
                        </VCard>
                    )}
                </div>

                {/* ── Middle Row: Line Items ── */}
                <div className="mt-6">
                    <VCard noPad className="overflow-hidden shadow-sm border border-slate-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Package size={16} />
                                </div>
                                <p className="text-[13px] font-extrabold text-slate-800 uppercase tracking-wide">Line Items & Taxes</p>
                            </div>
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50/80 border border-blue-100 px-2.5 py-1 rounded-md shadow-sm">
                                {po.items?.length || 0} SKUs
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/80 border-b border-slate-200">
                                    <tr className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">
                                        <th className="px-5 py-3 text-left">Item Details</th>
                                        <th className="px-3 py-3 text-center">Ordered</th>
                                        <th className="px-3 py-3 text-center">Received</th>
                                        <th className="px-3 py-3 text-right">Rate</th>
                                        <th className="px-3 py-3 text-center">Disc %</th>
                                        <th className="px-3 py-3 text-center">GST %</th>
                                        <th className="px-5 py-3 text-right">Net Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {po.items?.map((item, i) => (
                                        <tr key={i} className="bg-white hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-[12px] text-slate-800 group-hover:text-blue-600 transition-colors">{item.productName || item.product?.name || 'Unknown Product'}</div>
                                                {item.vendorProductId && (
                                                    <div className="text-[10px] text-slate-400 mt-1 font-mono bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-100">ID: {item.vendorProductId}</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="font-bold text-[12px] text-slate-700">{item.quantity}</span>
                                                <span className="text-[10px] text-slate-400 ml-1 font-semibold uppercase">{item.product?.unitOfMeasure || 'PCS'}</span>
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded text-[11px] font-bold ${item.receivedQuantity > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                                    {item.receivedQuantity || 0}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-right text-[12px] text-slate-600 font-mono font-medium">{formatCurrency(item.purchaseRate)}</td>
                                            <td className="px-3 py-4 text-center text-[12px] text-slate-500 font-medium">
                                                {item.discountPct > 0 ? (
                                                    <span className="text-rose-600 font-bold">{item.discountPct}%</span>
                                                ) : (
                                                    <span>-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                                                    {item.gstRate || 0}%
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right text-[13px] font-black text-slate-800">{formatCurrency(item.totalAmount)}</td>
                                        </tr>
                                    ))}
                                    {(!po.items || po.items.length === 0) && (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-[12px] font-medium">
                                                No line items found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </VCard>
                </div>

                {/* ── Bottom Row: Audit Log & Amount Summary ── */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* System Audit Log */}
                    <VCard className="h-full">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">System Audit Log</p>
                        <div className="space-y-3">
                            <div className="flex gap-3 items-start">
                                <div className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 shadow-sm">
                                    S
                                </div>
                                <div className="flex-1 pb-3 border-b border-slate-50 last:border-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[12px] font-bold text-slate-800">PO Created</span>
                                        <span className="text-[10px] text-slate-400">by System</span>
                                        <span className="ml-auto text-[10px] font-semibold text-slate-400">{formatDate(po.createdAt)}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-400 italic mt-0.5">"Purchase order record synchronized with database."</div>
                                </div>
                            </div>
                        </div>
                    </VCard>

                    {/* Amount Summary */}
                    <VCard className="bg-gradient-to-b from-white to-slate-50/50 shadow-sm border border-slate-200 h-full flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                            <span className="text-emerald-500 text-lg leading-none">₹</span>
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Amount Summary</p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-0.5">
                                <span className="text-[12px] text-slate-500 font-medium">Subtotal</span>
                                <span className="text-[13px] font-bold text-slate-700">{formatCurrency(po.totalAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                                <span className="text-[12px] text-slate-500 font-medium">GST Amount</span>
                                <span className="text-[13px] font-bold text-slate-700">{formatCurrency(po.gstAmount || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-200">
                                <span className="text-[13px] text-slate-800 font-extrabold uppercase tracking-wide">Grand Total</span>
                                <span className="text-[20px] font-black text-blue-600 drop-shadow-sm">{formatCurrency(po.grandTotal || 0)}</span>
                            </div>
                        </div>
                    </VCard>
                </div>
            </div>

            {/* ── Approve PO Modal ── */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-[16px] font-bold text-slate-800">Approve Purchase Order</h2>
                            <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <div className="p-6">
                            <label className="block text-[12px] font-bold text-slate-700 mb-2">
                                Expected Delivery Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={expectedDate}
                                onChange={(e) => setExpectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-[11px] text-slate-500 mt-2">
                                Please specify the expected date when the product will get received.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                            <button
                                onClick={handleDecline}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleConfirmApprove}
                                disabled={isSubmitting || !expectedDate}
                                className="px-4 py-2 text-[12px] font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
