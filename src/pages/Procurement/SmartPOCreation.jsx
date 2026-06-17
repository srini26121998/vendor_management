import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    VENDOR_ROUTES, formatCurrency,
    PO_TYPES, PAYMENT_TERMS, TAX_CATEGORIES
} from '../Vendors/vendorConstants';
import { fetchVendors, fetchProducts } from '../../api/vendorService';

const STORE_LIST = [
    { id: 'S001', name: 'Main Warehouse - Mumbai', address: 'Plot 45, MIDC Industrial Area, Andheri East, Mumbai 400069' },
    { id: 'S002', name: 'Bandra Retail Outlet', address: '12/B, Hill Road, Bandra West, Mumbai 400050' },
    { id: 'S003', name: 'Pune Fulfillment Center', address: 'Gate 7, Chakan MIDC Phase 2, Pune 410501' },
    { id: 'S004', name: 'Bangalore Hub', address: '102, Hosur Road, Electronic City Phase 1, Bangalore 560100' },
];

const mapProductToSku = (p) => ({
    id: p.itemCode || String(p.id),
    name: p.productName || p.name || 'Unknown Product',
    uom: p.unitOfMeasure || p.uom || 'PCS',
    hsn: p.hsnCode || p.hsn || '--',
    price90d: p.purchasePrice || p.price || 0,
    safetyStock: p.minStock || p.reorderLevel || 0,
    stock: p.currentStock || p.stockQuantity || 0,
    doc: p.daysOfCover || 14,
});
import { VCard, PrimaryBtn, SecondaryBtn, VendorBreadcrumb } from '../Vendors/VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Box, Package, Trash2, Sparkles, ReceiptText,
    Wallet, AlertCircle, Search, ShieldCheck,
    Calculator, Info, CheckCircle2, XCircle,
    Calendar, Truck, CreditCard, DollarSign,
    FileUp, Plus, Hash, Tag, FileText, Database,
    MoreVertical, HelpCircle, AlertTriangle, Eye, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SmartPOCreation() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [vendors, setVendors] = useState([]);
    const [skus, setSkus] = useState([]);

    useEffect(() => {
        fetchVendors().then(d => setVendors(Array.isArray(d) ? d : []));
        fetchProducts().then(d => setSkus(Array.isArray(d) ? d.map(mapProductToSku) : []));
    }, []);

    // Header States
    const [poType, setPoType] = useState('Standard PO');
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [vendorLocation, setVendorLocation] = useState('');
    const [deliveryStoreId, setDeliveryStoreId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('Net 30');
    const [poRef, setPoRef] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [selectedDetailSku, setSelectedDetailSku] = useState(null);

    const [items, setItems] = useState([{
        id: Date.now(),
        skuId: '',
        qty: 1,
        rate: 0,
        discount: 0,
        taxCategory: '18%',
        remarks: '',
        uom: '--',
        hsn: '--',
        name: '',
        suggestedQty: 0
    }]);

    // Summary States
    const [freightCharges, setFreightCharges] = useState(0);
    const [otherCharges, setOtherCharges] = useState(0);
    const [otherChargesLabel, setOtherChargesLabel] = useState('Miscellaneous');

    const selectedVendor = useMemo(() =>
        vendors.find(v => v.id === selectedVendorId), [selectedVendorId, vendors]
    );

    const selectedStore = useMemo(() =>
        STORE_LIST.find(s => s.id === deliveryStoreId), [deliveryStoreId]
    );

    const updateItem = (id, field, val) => {
        setItems(it => it.map(item => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: val };

            if (field === 'skuId') {
                const sku = skus.find(s => s.id === val);
                if (sku) {
                    updated.name = sku.name;
                    updated.uom = sku.uom;
                    updated.hsn = sku.hsn;
                    updated.rate = sku.price90d;
                    updated.suggestedQty = Math.max(0, sku.safetyStock * 2 - sku.stock);
                }
            }
            return updated;
        }));
    };

    const addItem = () => {
        setItems(it => [...it, {
            id: Date.now(),
            skuId: '',
            qty: 1,
            rate: 0,
            discount: 0,
            taxCategory: '18%',
            remarks: '',
            uom: '--',
            hsn: '--',
            name: '',
            suggestedQty: 0
        }]);
    };

    const removeItem = (id) => {
        if (items.length === 1) {
            toast.error('Cannot delete last line item');
            return;
        }
        setItems(it => it.filter(i => i.id !== id));
    };

    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => {
            const lineBase = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
            const afterDiscount = lineBase * (1 - (parseFloat(item.discount) || 0) / 100);
            return sum + afterDiscount;
        }, 0);

        // Group GST by tax slab
        const gstBreakdown = {};
        items.forEach(item => {
            const rate = parseFloat(item.taxCategory) || 0;
            const lineBase = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
            const afterDiscount = lineBase * (1 - (parseFloat(item.discount) || 0) / 100);
            const lineGst = afterDiscount * (rate / 100);

            const key = item.taxCategory;
            gstBreakdown[key] = (gstBreakdown[key] || 0) + lineGst;
        });

        const totalGst = Object.values(gstBreakdown).reduce((a, b) => a + b, 0);
        const finalBeforeRound = subtotal + totalGst + parseFloat(freightCharges || 0) + parseFloat(otherCharges || 0);
        const grandTotal = Math.round(finalBeforeRound);
        const roundOff = grandTotal - finalBeforeRound;

        // Days of Cover calculation
        const avgDoc = items.reduce((sum, item) => {
            const sku = skus.find(s => s.id === item.skuId);
            return sum + (sku?.doc || 0);
        }, 0) / (items.filter(i => i.skuId).length || 1);

        return {
            subtotal,
            gstBreakdown,
            totalGst,
            roundOff,
            grandTotal,
            avgDoc,
            landedEstimate: grandTotal * 1.02 // 2% overhead as per spec
        };
    }, [items, freightCharges, otherCharges]);

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024); // 10MB limit per user request
        if (validFiles.length < files.length) toast.warning('Some files exceeded 10MB and were skipped');
        setAttachments(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handlePreview = (file) => {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
    };

    const isPPVBreach = items.some(item => {
        const sku = skus.find(s => s.id === item.skuId);
        return sku && item.rate > sku.price90d * 1.05;
    });

    const isAllMandatoryFilled = selectedVendorId && vendorLocation && deliveryStoreId && expectedDate && paymentTerms && items.every(i => i.skuId && i.qty > 0 && i.rate > 0);

    return (
        <div className="min-h-screen w-full bg-[#F3F5F9] flex flex-col pb-10" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Professional Sticky Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-2 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm">
                            <ArrowLeft size={16} />
                        </button>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h1 className="text-[18px] font-bold text-slate-800 tracking-tight">Create Purchase Order</h1>

                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <SecondaryBtn small onClick={() => navigate(-1)} icon={<XCircle size={14} />} className="!text-rose-600 !border-rose-100 hover:!bg-rose-50">
                            Discard
                        </SecondaryBtn>
                        <SecondaryBtn small onClick={() => toast.success('Draft Saved')} icon={<Database size={14} />}>
                            Draft
                        </SecondaryBtn>
                        <PrimaryBtn
                            small
                            disabled={!isAllMandatoryFilled}
                            className={`!bg-blue-600 ${!isAllMandatoryFilled ? 'opacity-50 grayscale' : ''}`}
                            icon={<CheckCircle2 size={14} />}
                        >
                            Submit PO
                        </PrimaryBtn>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-5 max-w-[1600px] mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Form Sections */}
                    <div className="lg:col-span-9 space-y-6">

                        {/* 1. Header Fields Section */}
                        <VCard className="border-slate-200 shadow-md bg-white p-6">
                            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-5">
                                <h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                    <ReceiptText size={20} className="text-blue-600" /> PO Header Fields
                                </h2>
                                <div className="text-[11px] font-bold text-slate-400 italic bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    * Indicates Required Field
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {/* PO Type */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">PO Type <span className="text-rose-500">*</span></label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PO_TYPES.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setPoType(type)}
                                                className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all text-center ${poType === type ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Vendor */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Vendor <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                                        <select
                                            value={selectedVendorId}
                                            onChange={e => setSelectedVendorId(e.target.value)}
                                            className="w-full pl-9 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none appearance-none shadow-sm"
                                        >
                                            <option value="">Search vendor name or ID...</option>
                                            {vendors.map(v => (
                                                <option key={v.id} value={v.id} disabled={v.status === 'blocked'} className={v.status === 'blocked' ? 'text-slate-300' : ''}>
                                                    {v.name} {v.status === 'blocked' ? '(Compliance Hold)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Vendor Location */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Vendor Location <span className="text-red-500">*</span></label>
                                    <select
                                        value={vendorLocation}
                                        onChange={e => setVendorLocation(e.target.value)}
                                        disabled={!selectedVendorId}
                                        className="w-full px-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none disabled:bg-slate-50 disabled:opacity-60 shadow-sm"
                                    >
                                        <option value="">Select shipping point...</option>
                                        {selectedVendor?.factoryLocations?.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                        {selectedVendor?.shippingPoints?.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                                    </select>
                                </div>

                                {/* Delivery Store */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Delivery Store <span className="text-red-500">*</span></label>
                                    <select
                                        value={deliveryStoreId}
                                        onChange={e => setDeliveryStoreId(e.target.value)}
                                        className="w-full px-6 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
                                    >
                                        <option value="">Select destination store...</option>
                                        {STORE_LIST.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">
                                {/* Delivery Address (Read-only) */}
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 ml-1">
                                        Delivery Address <Info size={10} className="text-slate-400" title="Auto-populated from store selection" />
                                    </label>
                                    <div className="px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-medium text-slate-500 flex items-center shadow-inner">
                                        {selectedStore?.address || 'Select a store to view full address'}
                                    </div>
                                </div>

                                {/* Expected Delivery Date */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Expected Delivery Date <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            type="date"
                                            value={expectedDate}
                                            onChange={e => setExpectedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-indigo-500">Min: Today + Vendor Lead Time</p>
                                </div>

                                {/* Payment Terms */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Payment Terms <span className="text-red-500">*</span></label>
                                    <select
                                        value={paymentTerms}
                                        onChange={e => setPaymentTerms(e.target.value)}
                                        className="w-full px-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
                                    >
                                        <option value="">Select terms...</option>
                                        {PAYMENT_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">
                                {/* Currency (Read-only) */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Currency</label>
                                    <div className="px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-400 flex items-center justify-between shadow-inner">
                                        INR <span>🇮🇳</span>
                                    </div>
                                </div>

                                {/* PO Reference */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">PO Reference / Buyer Ref</label>
                                    <input
                                        type="text"
                                        maxLength={30}
                                        placeholder="Internal reference number..."
                                        value={poRef}
                                        onChange={e => setPoRef(e.target.value)}
                                        className="w-full px-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
                                    />
                                </div>

                                {/* Special Instructions */}
                                <div className="md:col-span-4 space-y-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Special Instructions</label>
                                    <div className="relative">
                                        <textarea
                                            rows={4}
                                            maxLength={500}
                                            placeholder="Enter any specific packaging instructions, delivery time-slots, quality inspection requirements, or other buyer notes here..."
                                            value={specialInstructions}
                                            onChange={e => setSpecialInstructions(e.target.value)}
                                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-[14px] font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none resize-none shadow-sm min-h-[120px]"
                                        />
                                        <div className="absolute bottom-4 right-5 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg shadow-inner">
                                            <span className="text-[10px] font-bold text-slate-400 tracking-tight">{specialInstructions.length} / 500 characters</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments - Full Width */}
                                <div className="md:col-span-4 space-y-4">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Supporting Documents / Attachments</label>
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                            {attachments.length} / 5 Files
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Upload Area */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group relative h-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-400 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden"
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                multiple
                                                hidden
                                            />
                                            <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <FileUp size={20} />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[12px] font-bold text-slate-600">Click to upload or drag and drop</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter">PDF, DOC, XLS up to 10MB each</p>
                                            </div>
                                        </div>

                                        {/* File List */}
                                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                            {attachments.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center border-2 border-slate-100 border-dotted rounded-2xl bg-slate-50/30 opacity-60">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">No files attached yet</p>
                                                </div>
                                            ) : (
                                                <AnimatePresence>
                                                    {attachments.map((file, idx) => (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            key={`${file.name}-${idx}`}
                                                            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all group"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-bold text-slate-700 truncate">{file.name}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handlePreview(file);
                                                                    }}
                                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                                    title="Preview File"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeAttachment(idx);
                                                                    }}
                                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                                    title="Delete File"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </VCard>

                        {/* 2. Line Item Grid Section */}
                        <VCard noPad className="overflow-hidden border-slate-200 shadow-lg bg-white">
                            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                                <h2 className="text-[14px] font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                    <Box size={18} className="text-blue-600" /> PO Line Item Grid
                                </h2>
                                <div className="flex items-center gap-3">
                                    <button onClick={addItem} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-all bg-white px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                                        <Plus size={14} /> ADD ROW
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[1200px]">
                                    <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase  border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-4 w-[250px]">SKU / Item Code <span className="text-red-500">*</span></th>
                                            <th className="px-4 py-4 w-[200px]">Description</th>
                                            <th className="px-3 py-4 text-center">UOM</th>
                                            <th className="px-3 py-4 text-center">Order Qty <span className="text-red-500">*</span></th>
                                            <th className="px-3 py-4 text-right">Unit Price <span className="text-red-500">*</span></th>
                                            <th className="px-3 py-4 text-center">Disc %</th>
                                            <th className="px-3 py-4 text-center">Tax Category <span className="text-red-500">*</span></th>
                                            <th className="px-4 py-4 text-right">Line Total</th>
                                            <th className="px-3 py-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <AnimatePresence initial={false}>
                                            {items.map((item, idx) => {
                                                const sku = skus.find(s => s.id === item.skuId);
                                                const lineBase = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                                                const afterDiscount = lineBase * (1 - (parseFloat(item.discount) || 0) / 100);
                                                const lineTotal = afterDiscount * (1 + (parseFloat(item.taxCategory) || 0) / 100);
                                                const isPriceHigh = sku && item.rate > sku.price90d * 1.05;

                                                return (
                                                    <motion.tr
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="hover:bg-blue-50/20 transition-colors group relative"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="space-y-1.5">
                                                                <div className="relative">
                                                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                                                                    <select
                                                                        value={item.skuId}
                                                                        onChange={e => updateItem(item.id, 'skuId', e.target.value)}
                                                                        className="w-full pl-8 pr-3 h-10 bg-white border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all appearance-none shadow-sm"
                                                                    >
                                                                        <option value="">Search SKU...</option>
                                                                        {skus.map(s => <option key={s.id} value={s.id}>{s.id} - {s.name}</option>)}
                                                                    </select>
                                                                </div>
                                                                {sku && (
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">HSN: {sku.hsn}</span>
                                                                        <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                            <Calculator size={9} /> DoC: {sku.doc}d
                                                                        </span>
                                                                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">Stock: {sku.stock}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <p className="text-[12px] font-bold text-slate-600 line-clamp-2 leading-tight">
                                                                {sku ? sku.name : <span className="text-slate-300 italic">Select SKU to load description</span>}
                                                            </p>
                                                            {sku && (
                                                                <button
                                                                    onClick={() => setSelectedDetailSku(sku)}
                                                                    className="text-[10px] font-bold text-indigo-500 mt-1 cursor-pointer hover:underline flex items-center gap-1 bg-transparent border-none outline-none"
                                                                >
                                                                    <HelpCircle size={10} /> View Details
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span className="px-2 py-1 bg-slate-100 rounded-lg text-[11px] font-bold text-slate-500 uppercase">
                                                                {item.uom}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <div className="space-y-1">
                                                                <input
                                                                    type="number"
                                                                    value={item.qty}
                                                                    onChange={e => updateItem(item.id, 'qty', e.target.value)}
                                                                    className="w-24 text-center bg-white border border-slate-200 rounded-lg h-9 text-[13px] font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                                                />
                                                                {sku && (
                                                                    <p className="text-[9px] font-bold text-slate-400 italic">
                                                                        Sug: {item.suggestedQty}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 text-right">
                                                            <div className="space-y-1">
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        value={item.rate}
                                                                        onChange={e => updateItem(item.id, 'rate', e.target.value)}
                                                                        className={`w-32 text-right pl-6 pr-3 h-9 bg-white border rounded-lg text-[13px] font-semibold outline-none transition-all shadow-sm ${isPriceHigh ? 'border-rose-300 text-rose-600 focus:border-rose-500 focus:ring-4 focus:ring-rose-50' : 'border-slate-200 text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
                                                                    />
                                                                </div>
                                                                {sku && (
                                                                    <p className="text-[9px] font-bold text-slate-400">
                                                                        90D: {formatCurrency(sku.price90d)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {isPriceHigh && (
                                                                <div className="absolute top-1 right-2 bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse">
                                                                    <AlertTriangle size={8} /> PPV ALERT
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <input
                                                                type="number"
                                                                value={item.discount}
                                                                onChange={e => updateItem(item.id, 'discount', e.target.value)}
                                                                className="w-14 text-center bg-transparent border-b border-slate-100 px-1 py-1 text-[13px] font-bold text-slate-600 outline-none focus:border-blue-300"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <select
                                                                value={item.taxCategory}
                                                                onChange={e => updateItem(item.id, 'taxCategory', e.target.value)}
                                                                className="bg-white border border-slate-200 rounded-lg h-9 px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                                            >
                                                                {TAX_CATEGORIES.map(tax => <option key={tax} value={tax}>{tax}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <span className="text-[14px] font-bold text-slate-900">{formatCurrency(lineTotal)}</span>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>

                            {/* Remarks per Row - Compact Footer */}
                            <div className="p-4 bg-slate-50/30 border-t border-slate-100">
                                <div className="flex items-center gap-3 overflow-x-auto py-1">
                                    {items.map((item, idx) => item.skuId && (
                                        <div key={item.id} className="shrink-0 flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                                            <span className="text-[9px] font-bold text-blue-600">{item.skuId}:</span>
                                            <input
                                                type="text"
                                                placeholder="Row remark..."
                                                maxLength={100}
                                                value={item.remarks}
                                                onChange={e => updateItem(item.id, 'remarks', e.target.value)}
                                                className="text-[10px] font-bold text-slate-600 outline-none border-none bg-transparent w-32"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </VCard>

                        {/* PPV Shield Alert Banner */}
                        {isPPVBreach && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-6 shadow-sm ring-2 ring-rose-100 ring-offset-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200 shrink-0">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-rose-900 font-bold text-[15px]">PPV Shield Active: High Deviation Alert</h3>
                                        <p className="text-rose-600 text-[12px] font-bold mt-0.5">Some items exceed 5% weighted average price. Internal approval workflow will be triggered on submission.</p>
                                    </div>
                                </div>
                                <button className="px-6 py-2.5 bg-rose-600 text-white font-bold text-[13px] rounded-xl hover:bg-rose-700 transition-all shadow-md shadow-rose-100 active:scale-95 whitespace-nowrap">
                                    ATTACH JUSTIFICATION
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column: Summary Panel */}
                    <div className="lg:col-span-3 space-y-6">

                        {/* PO Summary Dashboard */}
                        <VCard className="border-slate-200 shadow-xl bg-white p-6 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-[0.15em] flex items-center gap-2">
                                    <Wallet size={18} className="text-blue-500" /> PO Summary
                                </h3>
                                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                                    <Calculator size={14} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider">Sub-Total</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(totals.subtotal)}</span>
                                </div>

                                {/* GST Breakdown */}
                                <div className="py-3 border-y border-slate-50 space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase ">Tax Breakdown (GST)</p>
                                    {Object.entries(totals.gstBreakdown).map(([rate, amount]) => (
                                        <div key={rate} className="flex justify-between items-center text-[12px]">
                                            <span className="text-slate-500 font-bold">GST @ {rate}</span>
                                            <span className="font-bold text-slate-700">{formatCurrency(amount)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-1 border-t border-slate-50 mt-1">
                                        <span className="text-slate-600 font-bold text-[13px]">Total GST</span>
                                        <span className="font-bold text-blue-600 text-[13px]">{formatCurrency(totals.totalGst)}</span>
                                    </div>
                                </div>

                                {/* Charges Inputs */}
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase ">Freight Charges</label>
                                        <div className="relative">
                                            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input
                                                type="number"
                                                value={freightCharges}
                                                onChange={e => setFreightCharges(e.target.value)}
                                                className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={otherChargesLabel}
                                                onChange={e => setOtherChargesLabel(e.target.value)}
                                                className="text-[10px] font-bold text-slate-400 uppercase  border-none bg-transparent w-24 focus:text-blue-500 outline-none"
                                            />
                                            <div className="h-px flex-1 bg-slate-50" />
                                        </div>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                            <input
                                                type="number"
                                                value={otherCharges}
                                                onChange={e => setOtherCharges(e.target.value)}
                                                className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[12px] pt-2">
                                    <span className="text-slate-400 font-bold">Round Off</span>
                                    <span className="font-bold text-slate-500">{formatCurrency(totals.roundOff)}</span>
                                </div>

                                <div className="pt-6 mt-4 border-t-2 border-slate-100">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[11px] font-bold text-blue-500 uppercase  mb-1">Grand Total</p>
                                            <p className="text-[32px] font-bold text-slate-900 leading-none tracking-tighter">
                                                {formatCurrency(totals.grandTotal)}
                                            </p>
                                        </div>
                                        <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-bold text-emerald-600">
                                            INR
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Metrics Widgets */}
                                <div className="mt-8 space-y-4">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-full -mr-8 -mt-8 blur-2xl opacity-50"></div>
                                        <div className="flex items-center justify-between mb-2 relative z-10">
                                            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Avg Days of Cover</span>
                                            <Calculator size={14} className="text-indigo-400" />
                                        </div>
                                        <div className="flex items-baseline gap-2 relative z-10">
                                            <span className="text-[20px] font-bold text-slate-800">{totals.avgDoc.toFixed(1)}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Days</span>
                                        </div>
                                        <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min((totals.avgDoc / 20) * 100, 100)}%` }}
                                                className={`h-full rounded-full ${totals.avgDoc < 7 ? 'bg-rose-500' : totals.avgDoc < 14 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            />
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 mt-2 relative z-10 uppercase tracking-tighter">Range across all line items</p>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Landed Cost Est.</span>
                                            <Truck size={14} className="text-slate-300" />
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-[16px] font-bold text-slate-700">{formatCurrency(totals.landedEstimate)}</span>
                                            <span className="text-[9px] font-bold text-slate-400 italic">+2% overhead</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Action Buttons */}
                                <div className="mt-8 space-y-3">
                                    <button
                                        disabled={!isAllMandatoryFilled}
                                        className={`w-full py-4 rounded-2xl font-bold text-[14px] uppercase  shadow-xl transition-all active:scale-[0.98] ${!isAllMandatoryFilled ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300'}`}
                                    >
                                        Submit for Approval
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => toast.success('Draft Saved Successfully')}
                                            className="flex-1 py-3 bg-white border border-amber-200 rounded-xl font-bold text-[11px] text-amber-600 uppercase  hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm"
                                        >
                                            Save Draft
                                        </button>
                                        <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-500 transition-all">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </VCard>

                        {/* Validation Scenarios Helper */}
                        <VCard className="border border-slate-200 bg-white p-4 shadow-lg text-slate-800">
                            <h3 className="text-[11px] font-bold text-slate-500 mb-3 flex items-center gap-2 uppercase ">
                                <Zap size={14} className="text-amber-500" /> Dev Scenarios
                            </h3>
                            <div className="space-y-2">
                                <button onClick={() => updateItem(items[0].id, 'rate', 150)} className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-all group">
                                    <p className="text-[10px] font-bold text-amber-600 group-hover:text-amber-700">Trigger PPV Alert</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">Set Basmati Rice rate to ₹150</p>
                                </button>
                                <button onClick={() => setSelectedVendorId('V005')} className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-all group">
                                    <p className="text-[10px] font-bold text-rose-600 group-hover:text-rose-700">Compliance Hold</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5">Select National Dairy (Blocked)</p>
                                </button>
                            </div>
                        </VCard>
                    </div>
                </div>
            </div>

            {/* SKU Detail Popup - Premium UI */}
            <AnimatePresence>
                {selectedDetailSku && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDetailSku(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
                        >
                            {/* Modal Header */}
                            <div className="bg-white p-6 border-b border-slate-100">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase ">
                                            <Package size={12} /> SKU Insights
                                        </div>
                                        <h3 className="text-[18px] font-bold text-slate-800 tracking-tight leading-tight">
                                            {selectedDetailSku.name}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-bold tracking-wider uppercase">Item ID: {selectedDetailSku.id}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDetailSku(null)}
                                        className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                                    >
                                        <XCircle size={22} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase  mb-1">HSN Code</p>
                                        <p className="text-[14px] font-bold text-slate-700">{selectedDetailSku.hsn}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase  mb-1">UOM</p>
                                        <p className="text-[14px] font-bold text-slate-700">KG</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-bold text-slate-500 uppercase ">Stock & Inventory</h4>
                                        <div className="h-px flex-1 bg-slate-100 ml-4" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Database size={14} className="text-emerald-500" />
                                                <span className="text-[13px] font-bold text-slate-700">{selectedDetailSku.stock} Units</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Current On-Hand</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Truck size={14} className="text-blue-500" />
                                                <span className="text-[13px] font-bold text-slate-700">{selectedDetailSku.doc} Days</span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Days of Cover</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-bold text-slate-500 uppercase ">Price History (90D)</h4>
                                        <div className="h-px flex-1 bg-slate-100 ml-4" />
                                    </div>

                                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[20px] font-bold text-blue-900 tracking-tight">{formatCurrency(selectedDetailSku.price90d)}</p>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase ">Avg Purchase Price</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                                                <Sparkles size={10} /> Market Low
                                            </div>
                                            <p className="text-[12px] font-bold text-slate-500 mt-1">{formatCurrency(selectedDetailSku.price90d * 0.95)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedDetailSku(null)}
                                    className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-100 transition-all shadow-sm"
                                >
                                    Close Details
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

const Zap = ({ size, className }) => (
    <Sparkles size={size} className={className} />
);
