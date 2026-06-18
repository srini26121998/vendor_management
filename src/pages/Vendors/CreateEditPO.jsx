import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { VENDOR_ROUTES } from './vendorConstants';
import { PageHeader, VCard, PrimaryBtn, SecondaryBtn, VendorBreadcrumb } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Box, Package, Trash2, Sparkles, ReceiptText, Calendar, Wallet, AlertCircle, Loader2, PlusCircle, ChevronDown, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import useVendorStore from '../../store/useVendorStore';
import purchaseService from '../../api/purchaseService';
import { fetchVendorProducts } from '../../api/vendorService';
import { useEffect, useRef } from 'react';

const ITEMS_INIT = [{ id: Date.now(), productId: '', description: '', qty: 1, unit: 'PCS', rate: 0, amount: 0, gstRate: 18 }];

export default function CreateEditPO() {
    const navigate = useNavigate();
    const location = useLocation();
    const { vendors, loadVendors } = useVendorStore();
    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const editData = location.state?.po;
    const isEdit = location.state?.mode === 'edit';

    const [vendor, setVendor] = useState(editData?.vendor?.id || '');
    const [deliveryDate, setDeliveryDate] = useState(editData?.dueDate || new Date().toISOString().split('T')[0]);
    const [paymentTerms, setPaymentTerms] = useState(editData?.paymentMode || 'Net 30');
    const [items, setItems] = useState(editData?.items?.map(it => ({
        id: it.id,
        productId: it.product?.id || it.vendorProductId || it.id,
        storeProductId: it.product?.id,
        description: it.productName || it.product?.name,
        qty: it.quantity,
        unit: it.product?.unitOfMeasure || 'PCS',
        rate: it.purchaseRate,
        amount: it.totalAmount,
        gstRate: it.gstRate
    })) || ITEMS_INIT);
    const [remarks, setRemarks] = useState(editData?.remarks || '');
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
    const [vendorSearchQuery, setVendorSearchQuery] = useState('');
    const vendorDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
                setIsVendorDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (vendors.length === 0) loadVendors();
    }, []);

    useEffect(() => {
        if (!vendor) {
            setProducts([]);
            return;
        }

        // Only call API if vendor ID is a valid UUID to avoid 400 errors with mock data
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(vendor)) {
            console.warn('Selected vendor ID is not a valid UUID. Mock data detected?', vendor);
            setProducts([]);
            return;
        }

        const loadVendorItems = async () => {
            setIsLoadingProducts(true);
            try {
                const data = await fetchVendorProducts(vendor);
                setProducts(Array.isArray(data) ? data : []);
                if (!isEdit && items.length === 1 && !items[0].productId) {
                   // Keep initial empty item
                }
            } catch (err) {
                console.error('Failed to load vendor products:', err);
                const errorMsg = err?.response?.data?.message || err?.message || 'Server error';
                toast.error(`Could not load catalog: ${errorMsg}`);
            } finally {
                setIsLoadingProducts(false);
            }
        };
        loadVendorItems();
    }, [vendor]);

    const updateItem = (id, field, val) =>
        setItems(it => it.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: val };
            updated.amount = (parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0);
            return updated;
        }));

    const addItem = () => {
        setItems(it => [...it, { id: Date.now(), description: '', qty: 1, unit: 'Kg', rate: 0, amount: 0 }]);
        toast.success('New line item added');
    };

    const removeItem = (id) => {
        if (items.length === 1) {
            toast.error('At least one item is required');
            return;
        }
        setItems(it => it.filter(i => i.id !== id));
    };

    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const gst = items.reduce((s, i) => s + ((i.amount || 0) * (i.gstRate || 0) / 100), 0);
    const total = subtotal + gst;

    const activeItems = items.filter(i => i.productId);
    const uniqueGstRates = [...new Set((activeItems.length > 0 ? activeItems : items).map(i => i.gstRate || 0))];
    const gstLabel = uniqueGstRates.length === 1 ? `GST (${uniqueGstRates[0]}%)` : `Total GST`;

    const submit = async () => {
        if (!vendor) {
            toast.error('Please select a vendor');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                vendorId: vendor,
                paymentMode: 'CREDIT', 
                invoiceDate: new Date().toISOString().split('T')[0],
                status: 'pending',
                items: items.map(it => ({
                    productId: it.storeProductId || it.productId,
                    productName: it.description,
                    quantity: parseFloat(it.qty),
                    purchaseRate: parseFloat(it.rate),
                    gstRate: it.gstRate || 0,
                    discountPct: 0
                }))
            };

            if (isEdit) {
                await purchaseService.updatePurchase(editData.id, payload);
                toast.success('Purchase Order updated successfully');
            } else {
                await purchaseService.createPurchase(payload);
                toast.success('Purchase Order created successfully');
            }
            navigate(VENDOR_ROUTES.poList);
        } catch (err) {
            console.error('Failed to submit PO:', err);
            toast.error(err?.response?.data?.message || 'Failed to generate Purchase Order');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm";
    const labelCls = "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 ml-1";

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-[20px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            {isEdit ? `Edit Purchase Order #${editData.id}` : 'Create Purchase Order'}
                        </h1>
                    </div>
                    <button onClick={() => navigate(VENDOR_ROUTES.poList)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 font-bold text-[12px] rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                        <ArrowLeft size={14} /> Back to Registry
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* ── Left Sidebar ── */}
                    <div className="space-y-6">
                        <VCard>
                            <h3 className={labelCls}>Order Configuration</h3>
                            <div className="space-y-4">
                                <div className="relative" ref={vendorDropdownRef}>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Primary Vendor</label>
                                    <div 
                                        className={`${inputCls} cursor-pointer flex justify-between items-center`}
                                        onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                                    >
                                        <span className={vendor ? 'text-slate-700' : 'text-slate-500'}>{vendors.find(v => v.id === vendor)?.name || 'Select Vendor...'}</span>
                                        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isVendorDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                    
                                    <AnimatePresence>
                                        {isVendorDropdownOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
                                            >
                                                <div className="p-2 border-b border-slate-100 bg-slate-50">
                                                    <div className="relative">
                                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                        <input 
                                                            type="text" 
                                                            autoFocus
                                                            placeholder="Search vendors..." 
                                                            value={vendorSearchQuery}
                                                            onChange={(e) => setVendorSearchQuery(e.target.value)}
                                                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-[12px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto py-1">
                                                    {vendors.filter(v => (v.status || '').toLowerCase() === 'active' && v.name?.toLowerCase().includes(vendorSearchQuery.toLowerCase())).length === 0 ? (
                                                        <div className="px-4 py-3 text-center text-[12px] text-slate-500">
                                                            No vendors found
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div 
                                                                className={`px-4 py-2 text-[13px] cursor-pointer hover:bg-slate-50 transition-colors ${!vendor ? 'bg-blue-50/50 text-blue-600 font-medium' : 'text-slate-700'}`}
                                                                onClick={() => {
                                                                    setVendor('');
                                                                    setIsVendorDropdownOpen(false);
                                                                    setVendorSearchQuery('');
                                                                }}
                                                            >
                                                                Select Vendor...
                                                            </div>
                                                            {vendors.filter(v => (v.status || '').toLowerCase() === 'active' && v.name?.toLowerCase().includes(vendorSearchQuery.toLowerCase())).map(v => (
                                                                <div 
                                                                    key={v.id} 
                                                                    className={`px-4 py-2 text-[13px] cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between ${vendor === v.id ? 'bg-blue-50/50 text-blue-600 font-medium' : 'text-slate-700'}`}
                                                                    onClick={() => {
                                                                        setVendor(v.id);
                                                                        setIsVendorDropdownOpen(false);
                                                                        setVendorSearchQuery('');
                                                                    }}
                                                                >
                                                                    <span>{v.name}</span>
                                                                    {vendor === v.id && <Check size={14} className="text-blue-600" />}
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Expected Delivery</label>
                                    <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                                        className={inputCls} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Terms</label>
                                        <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                                            className={`${inputCls} appearance-none text-[12px]`}>
                                            {['Net 7', 'Net 14', 'Net 30', 'COD'].map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Priority</label>
                                        <select className={`${inputCls} appearance-none text-[12px]`}>
                                            <option>Normal</option><option>Urgent</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </VCard>

                        <VCard>
                            <h3 className={labelCls}>Financial Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[13px] font-bold text-slate-500">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px] font-bold text-slate-500">
                                    <span>{gstLabel}</span>
                                    <span>₹{gst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Total Payable</p>
                                        <p className="text-[20px] font-bold text-blue-600">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>
                        </VCard>
                    </div>

                    {/* ── Right Content ── */}
                    <div className="lg:col-span-3 space-y-4">
                        <VCard>
                            <div className="space-y-2">
                                <div className="hidden lg:flex items-center gap-4 px-2 pb-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <div className="flex-1 ml-2">Product Details</div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 text-center">Rate</div>
                                        <div className="w-[90px] text-center">Qty</div>
                                        <div className="w-24 text-right">Amount</div>
                                        <div className="w-28 text-right">GST</div>
                                        <div className="w-8"></div>
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {items.map((item, idx) => (
                                        <div key={item.id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                                <div className="flex-1 w-full group flex flex-col justify-center">
                                                    <div className="relative w-full">
                                                        {/* Visual Layer: Icon + Label */}
                                                        <div className="flex items-center gap-3 pointer-events-none absolute inset-0">
                                                            <PlusCircle size={20} className={`${!vendor || isLoadingProducts ? 'text-slate-300' : 'text-blue-500 group-hover:scale-110'} transition-all`} />
                                                            <span className={`text-[16px] font-bold ${!vendor || isLoadingProducts ? 'text-slate-400' : 'text-slate-800 group-hover:text-blue-600'} transition-colors`}>
                                                                {items.find(it => it.id === item.id)?.description || 'Select Product...'}
                                                            </span>
                                                        </div>

                                                        {/* Interactive Layer: Hidden Select */}
                                                        <select
                                                            value={item.productId}
                                                            onChange={e => {
                                                                const p = products.find(prod => prod.id === e.target.value);
                                                                updateItem(item.id, 'productId', e.target.value);
                                                                if (p) {
                                                                    updateItem(item.id, 'description', p.productName);
                                                                    updateItem(item.id, 'rate', p.purchasePrice || 0);
                                                                    updateItem(item.id, 'unit', p.unitOfMeasure || 'PCS');
                                                                    updateItem(item.id, 'gstRate', p.gstRate !== undefined ? p.gstRate : 18);
                                                                    if (p.mappedProductId) {
                                                                        updateItem(item.id, 'storeProductId', p.mappedProductId);
                                                                    }
                                                                }
                                                            }}
                                                            disabled={!vendor || isLoadingProducts}
                                                            className="w-full h-8 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                        >
                                                            <option value="">{isLoadingProducts ? 'Loading Catalog...' : !vendor ? 'Select Vendor First' : 'Select Product...'}</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id}>{p.productName}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="text-[10px] font-bold mt-2.5 uppercase tracking-wider ml-8 flex items-center gap-2">
                                                        <span className="bg-blue-50/60 text-blue-600 px-2.5 py-0.5 rounded-md shadow-sm border border-blue-100/50">ITEM #{idx + 1}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="w-24">
                                                        <input type="number" value={item.rate} onChange={e => updateItem(item.id, 'rate', e.target.value)}
                                                            placeholder="Rate" className={`${inputCls} !py-1.5 text-center`} />
                                                    </div>
                                                    <div className="w-[90px]">
                                                        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                                                            <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)}
                                                                className="w-10 bg-transparent text-center text-[13px] font-bold outline-none" />
                                                            <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}
                                                                className="bg-transparent text-[11px] font-bold text-slate-500 outline-none border-l border-slate-200 pl-1 flex-1">
                                                                {['Kg', 'L', 'Pcs'].map(u => <option key={u}>{u}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="w-24 text-right">
                                                        <span className="text-[14px] font-bold text-slate-700">₹{(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="w-28 text-right">
                                                        {item.productId && item.gstRate !== undefined ? (
                                                            <span className="text-[13px] font-bold text-emerald-600">
                                                                + ₹{((item.amount || 0) * (item.gstRate || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-semibold opacity-75">({item.gstRate}%)</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[13px] font-bold text-slate-300">-</span>
                                                        )}
                                                    </div>
                                                    <div className="w-8 flex justify-end">
                                                        <button onClick={() => removeItem(item.id)}
                                                            className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </AnimatePresence>
                                <button onClick={addItem}
                                    className="w-full py-2 border border-dashed border-blue-200 rounded-lg text-blue-600 bg-blue-50/30 text-[11px] font-bold uppercase hover:bg-blue-50 transition-all">
                                    + Add New Line Item
                                </button>
                            </div>
                        </VCard>

                        <VCard>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelCls}>Delivery & QC Instructions</label>
                                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                                        placeholder="Add special instructions for the vendor..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all h-24 resize-none" />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <SecondaryBtn onClick={() => navigate(VENDOR_ROUTES.poList)} className="!px-4 !py-1.5 !text-[9px]">
                                        Save Draft
                                    </SecondaryBtn>
                                    <PrimaryBtn onClick={submit} disabled={isSubmitting} className="!px-4 !py-1.5 !text-[9px] !shadow-blue-200 shadow-lg disabled:opacity-50">
                                        <div className="flex items-center gap-2">
                                            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                                            <span>{isEdit ? 'Update PO' : 'Submit PO'}</span>
                                        </div>
                                    </PrimaryBtn>
                                </div>
                            </div>
                        </VCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
