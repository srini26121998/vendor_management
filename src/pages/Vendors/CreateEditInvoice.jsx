import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VENDOR_ROUTES, formatCurrency } from './vendorConstants';
import { VCard, PrimaryBtn, SecondaryBtn, VendorBreadcrumb } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Receipt, Link2, Plus, Trash2, ShieldCheck, Calculator, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchVendors, fetchPurchaseOrders, fetchGRNs, submitInvoice, fetchPOById } from '../../api/vendorService';

const ITEMS_INIT = [{ id: Date.now(), description: 'Basmati Rice (Premium)', qty: 50, unit: 'Kg', rate: 120, gstRate: 5, amount: 6000 }];

export default function CreateEditInvoice() {
    const navigate = useNavigate();
    const [vendorList, setVendorList] = useState([]);
    const [poList, setPoList] = useState([]);
    const [grnList, setGrnList] = useState([]);

    const [vendor, setVendor] = useState('');
    const [linkedPO, setLinkedPO] = useState('');
    const [linkedGRN, setLinkedGRN] = useState('');
    const [invNumber, setInvNumber] = useState('');
    const [invDate, setInvDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [items, setItems] = useState(ITEMS_INIT);
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchVendors(), fetchPurchaseOrders(), fetchGRNs()])
            .then(([vRes, pRes, gRes]) => {
                setVendorList(vRes.data || vRes || []);
                setPoList(pRes.data || pRes || []);
                setGrnList(gRes.data || gRes || []);
                setLoading(false);
            }).catch(err => {
                console.error("Failed to load reference data", err);
                setLoading(false);
            });
    }, []);

    const updateItem = (id, field, val) =>
        setItems(it => it.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: val };
            updated.amount = (parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0);
            return updated;
        }));

    const addItem = () => {
        setItems(it => [...it, { id: Date.now(), description: '', qty: 1, unit: 'Unit', rate: 0, gstRate: 0, amount: 0 }]);
    };

    const removeItem = (id) => {
        if (items.length === 1) return;
        setItems(it => it.filter(i => i.id !== id));
    };

    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const gst = items.reduce((s, i) => s + ((i.amount || 0) * ((parseFloat(i.gstRate) || 0) / 100)), 0);
    const total = subtotal + gst;

    const submit = async () => {
        if (!invNumber) { toast.error('Please enter an invoice number'); return; }
        if (!vendor) { toast.error('Please select Vendor Entity'); return; }
        if (!linkedPO) { toast.error('Please select Purchase Order'); return; }
        if (!linkedGRN) { toast.error('You must link a GRN to perform the 3-Way Match validation!'); return; }

        const payload = {
            vendorId: vendor,
            purchaseOrderId: linkedPO,
            grnId: linkedGRN,
            invoiceNumber: invNumber,
            invoiceDate: invDate,
            dueDate: dueDate,
            invoiceAmount: subtotal,
            gstAmount: gst,
            irnNumber: ''
        };

        try {
            await submitInvoice(payload);
            toast.success(`Invoice ${invNumber} recorded successfully!`);
            navigate(VENDOR_ROUTES.purchaseInvoice);
        } catch (err) {
            console.error("Failed to submit invoice", err);
            toast.error(err?.response?.data?.message || 'Failed to record invoice');
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm";
    const labelCls = "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1";

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-[#F3F5F9] flex flex-col" style={{ fontFamily: '"Inter", sans-serif' }}>
                <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(VENDOR_ROUTES.purchaseInvoice)} className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all border border-slate-200">
                            <ArrowLeft size={16} strokeWidth={2.5} />
                        </button>
                        <div>
                            <VendorBreadcrumb items={[{ label: 'ACCOUNTING', path: VENDOR_ROUTES.purchaseInvoice }, { label: 'RECORD INVOICE' }]} />
                            <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Record Purchase Invoice</h1>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#F3F5F9] flex flex-col" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(VENDOR_ROUTES.purchaseInvoice)} className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all border border-slate-200">
                        <ArrowLeft size={16} strokeWidth={2.5} />
                    </button>
                    <div>
                        <VendorBreadcrumb items={[{ label: 'ACCOUNTING', path: VENDOR_ROUTES.purchaseInvoice }, { label: 'RECORD INVOICE' }]} />
                        <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Record Purchase Invoice</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left Sidebar: Settings */}
                <div className="w-full lg:w-[380px] bg-white border-r border-slate-200 p-8 overflow-y-auto">
                    <div className="space-y-6">
                        <VCard noPad className="border-slate-100 bg-slate-50/30 p-5">
                            <h3 className={labelCls}>Invoice Reference</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Vendor Entity</label>
                                    <select value={vendor} onChange={e => { setVendor(e.target.value); setLinkedPO(''); setLinkedGRN(''); }} className={inputCls}>
                                        <option value="">-- Select Vendor --</option>
                                        {vendorList.map(v => <option key={v.id} value={v.id}>{v.legalName || v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Purchase Order</label>
                                    <select value={linkedPO} onChange={async (e) => {
                                        const poId = e.target.value;
                                        setLinkedPO(poId);
                                        setLinkedGRN('');

                                        if (poId) {
                                            try {
                                                const poRes = await fetchPOById(poId);
                                                const selectedPo = poRes.data || poRes;

                                                if (selectedPo && selectedPo.items && selectedPo.items.length > 0) {
                                                    const mappedItems = selectedPo.items.map((item, idx) => ({
                                                        id: item.id || (Date.now() + idx),
                                                        description: item.productName || 'Unknown Product',
                                                        qty: item.quantity || 1,
                                                        unit: 'Unit',
                                                        rate: item.purchaseRate || 0,
                                                        gstRate: item.gstRate || 0,
                                                        amount: (item.quantity || 1) * (item.purchaseRate || 0)
                                                    }));
                                                    setItems(mappedItems);
                                                } else {
                                                    setItems([{ id: Date.now(), description: 'No items found', qty: 1, unit: 'Unit', rate: 0, gstRate: 0, amount: 0 }]);
                                                }
                                            } catch (err) {
                                                console.error("Failed to load PO details", err);
                                                setItems([{ id: Date.now(), description: 'Failed to load items', qty: 1, unit: 'Unit', rate: 0, gstRate: 0, amount: 0 }]);
                                            }
                                        } else {
                                            setItems(ITEMS_INIT);
                                        }
                                    }} className={inputCls} disabled={!vendor}>
                                        <option value="">-- Select PO --</option>
                                        {poList
                                            .filter(p => !vendor || p.vendorId === vendor || (p.partyName && vendorList.find(v => v.id === vendor)?.legalName === p.partyName))
                                            .map(p => <option key={p.id} value={p.id}>{p.invoiceNumber}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Invoice Number</label>
                                    <input value={invNumber} onChange={e => setInvNumber(e.target.value)} placeholder="e.g. SUN/24/012" className={inputCls} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Invoice Date</label>
                                    <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Due Date</label>
                                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
                                </div>
                            </div>
                        </VCard>

                        <VCard noPad className="border-slate-100 p-5">
                            <h3 className={labelCls}>3-Way Matching</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Link to GRN</label>
                                    <select value={linkedGRN} onChange={e => setLinkedGRN(e.target.value)} className={inputCls} disabled={!linkedPO}>
                                        <option value="">-- Select GRN --</option>
                                        {grnList
                                            .filter(g => g.purchaseOrderId === linkedPO || g.purchaseOrderNumber === poList.find(p => p.id === linkedPO)?.invoiceNumber)
                                            .filter(g => g.status !== 'DRAFT')
                                            .map(g => <option key={g.id} value={g.id}>{g.grnNumber}</option>)}
                                    </select>
                                </div>
                                {linkedGRN && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-emerald-600" />
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase">GRN Linked: {grnList.find(g => g.id === linkedGRN)?.grnNumber}</span>
                                    </div>
                                )}
                            </div>
                        </VCard>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-[40px] opacity-60 -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full blur-[40px] opacity-40 -ml-10 -mb-10 pointer-events-none"></div>
                            <h4 className="text-[11px] font-bold text-slate-800 uppercase mb-4 flex items-center gap-2 relative z-10">
                                <Calculator size={14} className="text-blue-600" /> Financial Summary
                            </h4>
                            <div className="space-y-3 pt-2 relative z-10">
                                <div className="flex justify-between text-[13px] font-semibold text-slate-500"><span>Subtotal</span><span className="text-slate-700">{formatCurrency(subtotal)}</span></div>
                                <div className="flex justify-between text-[13px] font-semibold text-slate-500"><span>Total GST</span><span className="text-slate-700">{formatCurrency(gst)}</span></div>
                                <div className="flex justify-between text-[18px] font-extrabold text-slate-800 pt-4 border-t border-slate-100"><span>Total</span><span className="text-blue-600">{formatCurrency(total)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content: Line Items */}
                <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-[#F3F5F9]">
                    <div className="max-w-[1000px] mx-auto space-y-6">
                        <VCard>
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                                <h3 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
                                    <FileText size={18} className="text-blue-600" /> Line Item Details
                                </h3>
                                <SecondaryBtn onClick={addItem} icon={<Plus size={14} />} className="!py-1.5 !px-3 !text-[11px] whitespace-nowrap">
                                    Add Item
                                </SecondaryBtn>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl group relative">
                                        <div className="flex-1">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                                            <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Item description..." className="w-full bg-transparent font-bold text-slate-800 text-[14px] outline-none" />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-24">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Qty</label>
                                                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1.5">
                                                    <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} className="w-full bg-transparent text-center font-bold text-slate-700 outline-none text-xs" />
                                                    <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                                                </div>
                                            </div>
                                            <div className="w-24">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Rate</label>
                                                <input type="number" value={item.rate} onChange={e => updateItem(item.id, 'rate', e.target.value)} className={`${inputCls} !py-1.5 text-right !bg-white`} />
                                            </div>
                                            <div className="w-16">
                                                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">GST %</label>
                                                <input type="number" value={item.gstRate || 0} onChange={e => updateItem(item.id, 'gstRate', e.target.value)} className={`${inputCls} !py-1.5 text-center !bg-white`} />
                                            </div>
                                            <div className="w-28 text-right pt-5">
                                                <span className="text-[14px] font-bold text-slate-800">{formatCurrency(item.amount)}</span>
                                            </div>
                                            <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors mt-5">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </VCard>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <VCard className="flex-1">
                                <label className={labelCls}>Internal Remarks</label>
                                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Audit notes or discrepancies..." className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[13px] outline-none focus:border-blue-500 transition-all resize-none" />
                            </VCard>
                            <VCard className="w-full sm:w-[300px] flex flex-col justify-center gap-3">
                                <PrimaryBtn onClick={submit} icon={<Receipt size={18} />} className="w-full justify-center !py-4 shadow-blue-100 shadow-xl whitespace-nowrap">
                                    Record & Post
                                </PrimaryBtn>
                                <SecondaryBtn onClick={() => navigate(VENDOR_ROUTES.purchaseInvoice)} className="w-full justify-center">
                                    Save Draft
                                </SecondaryBtn>
                            </VCard>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
