import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VENDOR_ROUTES, formatCurrency, formatDate } from './vendorConstants';
import { PageHeader, VCard, PrimaryBtn, SecondaryBtn, VendorBreadcrumb } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Box, Scale, Droplets, CheckCircle2, AlertTriangle, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchPurchaseOrders, fetchPOById, createGRN, approveGRN } from '../../api/vendorService';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';

const STATUS_OPTIONS = [
    { label: 'Matched', value: 'Matched', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { label: 'Short', value: 'Short', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { label: 'Excess', value: 'Excess', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { label: 'Damaged', value: 'Damaged', color: 'bg-rose-50 text-rose-600 border-rose-200' }
];

export default function GRNEntry() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const userId = user?.id;

    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [storeProducts, setStoreProducts] = useState([]);
    const [selectedPO, setSelectedPO] = useState('');
    const [selectedPOData, setSelectedPOData] = useState(null);
    const [items, setItems] = useState([]);
    const [progress, setProgress] = useState(0);
    const [remarks, setRemarks] = useState('');

    // Inline Product Creation State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [mappingItemIndex, setMappingItemIndex] = useState(null);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);
    const [newProductData, setNewProductData] = useState({
        name: '',
        sku: '',
        unit: 'PCS',
        purchaseRate: '',
        sellingPrice: '',
        brand: '',
        gstRate: '18',
        hsnCode: '',
        minStock: '10',
        mrp: '',
        categoryId: null
    });

    useEffect(() => {
        const loadPOs = async () => {
            try {
                const [poRes, grnRes] = await Promise.all([
                    fetchPurchaseOrders(),
                    api.get('/grn')
                ]);
                const poData = poRes.data || poRes;
                const grnData = grnRes.data || grnRes;

                if (Array.isArray(poData)) {
                    // Extract PO IDs that already have a pending or draft GRN
                    const activePOIds = Array.isArray(grnData)
                        ? grnData.filter(g => ['pending', 'draft'].includes(g.status?.toLowerCase())).map(g => g.purchaseOrderId)
                        : [];

                    // Filter approved, sent, or partially_received POs that DO NOT have a pending/draft GRN
                    const filtered = poData.filter(p =>
                        (p.status?.toLowerCase() === 'active' ||
                            p.status?.toLowerCase() === 'approved' ||
                            p.status?.toLowerCase() === 'sent' ||
                            p.status?.toLowerCase() === 'partially_received') &&
                        !activePOIds.includes(p.id)
                    );
                    setPurchaseOrders(filtered);
                }
            } catch (err) {
                console.error("Failed to load approved POs:", err);
            }
        };
        const loadProducts = async () => {
            try {
                const response = await api.get('/products');
                const data = response.data || response;
                if (Array.isArray(data)) {
                    setStoreProducts(data);
                }
            } catch (err) {
                console.error("Failed to fetch store products:", err);
            }
        };
        loadPOs();
        loadProducts();
    }, []);

    const handlePOChange = async (poId) => {
        setSelectedPO(poId);
        if (!poId) {
            setItems([]);
            setSelectedPOData(null);
            return;
        }
        try {
            const poData = await fetchPOById(poId);
            const po = poData?.data || poData;
            if (po && Array.isArray(po.items)) {
                setSelectedPOData(po);
                // Map PO items to GRN items state
                const mappedItems = po.items.map(it => {
                    const poQty = it.quantity || 0;
                    const previouslyReceived = it.receivedQuantity || 0;
                    const remainingQty = Math.max(0, poQty - previouslyReceived);

                    return {
                        purchaseItemId: it.id,
                        productId: it.product?.id || null, // Will let user map if null
                        vendorProductId: it.vendorProductId || null,
                        name: it.productName || it.product?.name || 'Unknown Product',
                        barcode: it.product?.barcode || '',
                        poQty: poQty,
                        unit: it.product?.unitOfMeasure || 'PCS',
                        received: remainingQty,
                        accepted: remainingQty,
                        rejected: 0,
                        unitPrice: it.purchaseRate || 0,
                        status: 'Matched',
                        isUnmapped: !it.product?.id
                    };
                });
                setItems(mappedItems);
                setRemarks(`Receipt against PO ${po.invoiceNumber}`);
                setProgress(0);
            }
        } catch (err) {
            console.error("Failed to load PO details:", err);
            toast.error("Failed to load PO items");
        }
    };

    const updateQty = (idx, val) => {
        const updated = items.map((item, i) => {
            if (i !== idx) return item;
            const rec = parseFloat(val) || 0;
            const ratio = rec / item.poQty;
            let status = item.status;
            let acc = rec;
            let rej = 0;
            if (rec > 0) {
                if (status === 'Damaged') {
                    acc = 0;
                    rej = rec;
                } else {
                    status = ratio === 1 ? 'Matched' : ratio < 1 ? 'Short' : 'Excess';
                }
            }
            return { ...item, received: val, accepted: acc, rejected: rej, status };
        });
        setItems(updated);
        const verifiedCount = updated.filter(item => parseFloat(item.received) > 0).length;
        setProgress(Math.round((verifiedCount / updated.length) * 100));
    };

    const handleQCAction = (idx, code) => {
        const statusMap = { M: 'Matched', S: 'Short', E: 'Excess', D: 'Damaged' };
        const newStatus = statusMap[code];
        setItems(items.map((itm, i) => {
            if (i !== idx) return itm;
            let acc = parseFloat(itm.received) || 0;
            let rej = 0;
            if (code === 'D') {
                acc = 0;
                rej = parseFloat(itm.received) || 0;
            }
            return { ...itm, status: newStatus, accepted: acc, rejected: rej };
        }));
    };

    const handleCreateProduct = async () => {
        if (!newProductData.name || !newProductData.sku) {
            toast.error("Name and SKU are required");
            return;
        }

        const existingProd = storeProducts.find(p => p.sku === newProductData.sku || p.barcode === newProductData.sku);
        setIsCreatingProduct(true);
        try {
            const payload = {
                name: newProductData.name,
                sku: newProductData.sku,
                barcode: newProductData.sku,
                unit: newProductData.unit,
                purchaseRate: parseFloat(newProductData.purchaseRate) || 0,
                sellingPrice: parseFloat(newProductData.sellingPrice) || 0,
                brand: newProductData.brand || '',
                gstRate: parseFloat(newProductData.gstRate) || 0,
                hsnCode: newProductData.hsnCode || '',
                minStock: parseFloat(newProductData.minStock) || 0,
                mrp: parseFloat(newProductData.mrp) || 0,
                isActive: true
            };

            let res;
            let isUpdate = false;
            if (existingProd) {
                res = await api.put(`/products/${existingProd.id}`, payload);
                isUpdate = true;
            } else {
                res = await api.post('/products', payload);
            }
            const savedProd = res.data || res;

            if (isUpdate) {
                setStoreProducts(prev => prev.map(p => p.id === savedProd.id ? savedProd : p));
            } else {
                setStoreProducts(prev => [...prev, savedProd]);
            }

            // Auto map to the item
            if (mappingItemIndex !== null) {
                setItems(items.map((itm, idx) => {
                    if (idx !== mappingItemIndex) return itm;
                    return {
                        ...itm,
                        productId: savedProd.id,
                        name: savedProd.name,
                        barcode: savedProd.barcode
                    };
                }));
                toast.success(isUpdate
                    ? `Existing product ${savedProd.name} updated and mapped successfully!`
                    : `Product created and mapped to ${savedProd.name}`
                );
            }
            setShowCreateModal(false);
            setMappingItemIndex(null);
        } catch (err) {
            console.error("Failed to save product:", err);
            toast.error(err.response?.data?.message || "Failed to save product");
        } finally {
            setIsCreatingProduct(false);
        }
    };

    const complete = async (status = "PENDING") => {
        if (!selectedPO) {
            toast.error("Please select a Purchase Order.");
            return;
        }

        const unmappedItem = items.find(item => !item.productId);
        if (unmappedItem) {
            toast.error(`Please map "${unmappedItem.name}" to a store product.`);
            return;
        }

        try {
            toast.loading(status === "DRAFT" ? "Saving GRN Draft..." : "Initiating Goods Receipt Note...", { id: "grn-submit" });

            const itemDtos = items.map(item => ({
                purchaseItemId: item.purchaseItemId,
                productId: item.productId,
                vendorProductId: item.vendorProductId,
                orderedQuantity: item.poQty,
                receivedQuantity: parseFloat(item.received) || 0,
                acceptedQuantity: parseFloat(item.accepted) || 0,
                rejectedQuantity: parseFloat(item.rejected) || 0,
                unitPrice: item.unitPrice || 0,
                remarks: item.remarks || ''
            }));

            const payload = {
                purchaseOrderId: selectedPO,
                receivedDate: new Date().toISOString().split('.')[0],
                vendorInvoiceNumber: `INV-${Date.now()}`,
                remarks: remarks,
                status: status,
                items: itemDtos
            };

            const activeUserId = userId || '00000000-0000-0000-0000-000000000000';
            const grnResponse = await createGRN(payload, activeUserId);
            const grn = grnResponse.data || grnResponse;

            if (grn && grn.id) {
                if (status === "DRAFT") {
                    toast.success("GRN Draft saved successfully!", { id: "grn-submit" });
                } else {
                    toast.success("GRN initiated successfully! Awaiting verification/approval.", { id: "grn-submit" });
                }
                navigate(VENDOR_ROUTES.grnList);
            } else {
                throw new Error("Invalid response received from backend");
            }
        } catch (err) {
            console.error("Failed to process GRN:", err);
            console.error("Detailed Validation Error:", err.response?.data);

            let errMsg = "Failed to process GRN";
            if (err.response?.data) {
                const data = err.response.data;
                if (Array.isArray(data.errors)) {
                    errMsg = data.errors.map(e => `${e.field || 'Error'}: ${e.defaultMessage || e}`).join(' | ');
                } else {
                    errMsg = data.message || data.error || errMsg;
                }
            } else {
                errMsg = err.message || errMsg;
            }

            toast.error(errMsg, { id: "grn-submit", duration: 6000 });
        }
    };

    const completedCount = items.filter(i => parseFloat(i.received) > 0).length;

    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm";
    const labelCls = "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5";

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>

                        <h1 className="text-[20px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            GRN Entry — Mobile Flow

                        </h1>
                    </div>
                    <button onClick={() => navigate(VENDOR_ROUTES.grnList)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 font-bold text-[12px] rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
                        <ArrowLeft size={14} /> Back to List
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* ── Left Sidebar ── */}
                    <div className="space-y-6">
                        {/* Reference & Scan Card */}
                        <VCard>
                            <h3 className={labelCls}>PO REFERENCE</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Source Order</label>
                                    <select value={selectedPO} onChange={e => handlePOChange(e.target.value)}
                                        className={`${inputCls} ${purchaseOrders.length === 0 ? 'bg-slate-50 cursor-not-allowed text-slate-400' : 'cursor-pointer'}`}
                                        disabled={purchaseOrders.length === 0}>
                                        <option value="">
                                            {purchaseOrders.length === 0 ? "-- No Data Available --" : "-- Select Approved PO --"}
                                        </option>
                                        {purchaseOrders.map(p => (
                                            <option key={p.id} value={p.id}>{p.invoiceNumber} — {p.vendorName || p.vendor?.legalName}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedPOData && (
                                    <div className="mt-4 p-4 bg-white border border-slate-200 shadow-sm rounded-xl space-y-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Vendor Information</p>
                                            <p className="text-[14px] font-bold text-slate-800">{selectedPOData.vendor?.legalName || '—'}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{selectedPOData.vendor?.vendorCode || '—'}</span>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">GSTIN: {selectedPOData.vendor?.gstin || '—'}</span>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100"></div>

                                        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">PO Date</p>
                                                <p className="text-[12px] font-bold text-slate-700">{selectedPOData.invoiceDate ? formatDate(selectedPOData.invoiceDate) : '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Exp. Delivery</p>
                                                <p className="text-[12px] font-bold text-slate-700">{selectedPOData.expectedDeliveryDate ? formatDate(selectedPOData.expectedDeliveryDate) : '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Grand Total</p>
                                                <p className="text-[13px] font-extrabold text-blue-600">{formatCurrency(selectedPOData.grandTotal || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">GST Amount</p>
                                                <p className="text-[12px] font-bold text-amber-600">{formatCurrency(selectedPOData.gstAmount || 0)}</p>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100"></div>

                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</p>
                                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{selectedPOData.paymentMode || '—'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </VCard>
                        {/* Verification Progress */}
                        <VCard>
                            <div className="flex items-end justify-between mb-4">
                                <span className={labelCls}>VERIFICATION STATUS</span>
                                <span className="text-2xl font-bold text-blue-600 leading-none">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                                    <div className="text-[16px] font-bold text-slate-800">{completedCount}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Verified</div>
                                </div>
                                <div className="p-3 bg-white border border-slate-100 rounded-xl text-center shadow-sm">
                                    <div className="text-[16px] font-bold text-slate-800">{items.length - completedCount}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pending</div>
                                </div>
                            </div>
                        </VCard>
                    </div>

                    {/* ── Right Content ── */}
                    <div className="lg:col-span-3 space-y-4">
                        {items.map((item, idx) => (
                            <VCard key={idx} className={item.received > 0 ? 'border-blue-200 ring-1 ring-blue-50' : ''}>
                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">

                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                            {item.unit === 'Kg' ? <Scale size={24} /> : <Droplets size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-[15px] font-bold text-slate-800 leading-tight mb-1">{item.name}</h3>
                                            <div className="flex gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase border border-slate-200">
                                                    Target: {item.poQty} {item.unit}
                                                </span>
                                                {item.received > 0 && (
                                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase border ${STATUS_OPTIONS.find(o => o.value === item.status)?.color}`}>
                                                        {item.status}
                                                    </span>
                                                )}
                                            </div>
                                            {item.isUnmapped && (
                                                <div className="mt-2.5 p-2 bg-amber-50 rounded-lg border border-amber-200/50 space-y-1.5 max-w-[280px]">
                                                    <p className="text-[10px] font-bold text-amber-800 flex items-center justify-between">
                                                        <span className="flex items-center gap-1">
                                                            <AlertTriangle size={12} className="text-amber-600 animate-pulse" />
                                                            Unmapped Item
                                                        </span>
                                                        <button onClick={() => {
                                                            setMappingItemIndex(idx);
                                                            setNewProductData({
                                                                name: item.name,
                                                                sku: item.barcode || `SKU-${Date.now()}`,
                                                                unit: item.unit || 'PCS',
                                                                purchaseRate: item.unitPrice || 0,
                                                                sellingPrice: item.unitPrice ? (item.unitPrice * 1.2).toFixed(2) : 0,
                                                                brand: '',
                                                                gstRate: '18',
                                                                hsnCode: '',
                                                                minStock: '10',
                                                                mrp: item.unitPrice ? (item.unitPrice * 1.3).toFixed(2) : 0,
                                                                categoryId: null
                                                            });
                                                            setShowCreateModal(true);
                                                        }} className="text-[9px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                            + Create New
                                                        </button>
                                                    </p>
                                                    <select
                                                        value={item.productId || ''}
                                                        onChange={(e) => {
                                                            const prodId = e.target.value;
                                                            const matchedProd = storeProducts.find(p => p.id === prodId);
                                                            setItems(items.map((itm, idx2) => {
                                                                if (idx2 !== idx) return itm;
                                                                return {
                                                                    ...itm,
                                                                    productId: prodId,
                                                                    name: matchedProd ? matchedProd.name : itm.name,
                                                                    barcode: matchedProd ? matchedProd.barcode : itm.barcode
                                                                };
                                                            }));
                                                        }}
                                                        className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-md text-[11px] font-semibold text-slate-700 outline-none focus:border-amber-400 cursor-pointer shadow-sm"
                                                    >
                                                        <option value="">-- Map to Store Product --</option>
                                                        {storeProducts.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} ({p.barcode || p.sku || 'No SKU'})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">Receipt Qty</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateQty(idx, Math.max(0, (parseFloat(item.received) || 0) - 1))}
                                                    className="w-9 h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                                    −
                                                </button>
                                                <input type="number" value={item.received} onChange={e => updateQty(idx, e.target.value)}
                                                    className="w-16 h-9 text-center bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-sm outline-none focus:border-blue-500 shadow-sm" />
                                                <button onClick={() => updateQty(idx, (parseFloat(item.received) || 0) + 1)}
                                                    className="w-9 h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 transition-all">
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">QC Action</span>
                                            <div className="flex gap-1.5">
                                                {['M', 'S', 'E', 'D'].map((code) => {
                                                    const statusMap = { M: 'Matched', S: 'Short', E: 'Excess', D: 'Damaged' };
                                                    const isSelected = item.status === statusMap[code];
                                                    return (
                                                        <button key={code}
                                                            onClick={() => handleQCAction(idx, code)}
                                                            className={`w-9 h-9 flex items-center justify-center text-[11px] font-bold rounded-lg border transition-all ${isSelected
                                                                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                                                                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>
                                                            {code}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                {item.status === 'Damaged' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Damaged Goods Triage</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Specify how many of the {item.received} units are damaged:</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                <span className="text-[11px] font-bold text-slate-500">Accepted (Good):</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.received}
                                                    value={item.accepted}
                                                    onChange={e => {
                                                        const acc = parseFloat(e.target.value) || 0;
                                                        const rec = parseFloat(item.received) || 0;
                                                        setItems(items.map((itm, i) => i === idx ? { ...itm, accepted: Math.min(rec, acc), rejected: Math.max(0, rec - Math.min(rec, acc)) } : itm));
                                                    }}
                                                    className="w-16 h-8 text-center bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-xs outline-none focus:border-emerald-500 shadow-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 bg-rose-50/50 px-3 py-1.5 rounded-xl border border-rose-100">
                                                <span className="text-[11px] font-bold text-rose-600">Damaged (Rejected):</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.received}
                                                    value={item.rejected}
                                                    onChange={e => {
                                                        const rej = parseFloat(e.target.value) || 0;
                                                        const rec = parseFloat(item.received) || 0;
                                                        setItems(items.map((itm, i) => i === idx ? { ...itm, rejected: Math.min(rec, rej), accepted: Math.max(0, rec - Math.min(rec, rej)) } : itm));
                                                    }}
                                                    className="w-16 h-8 text-center bg-white border border-slate-200 rounded-lg font-bold text-rose-600 text-xs outline-none focus:border-rose-500 shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </VCard>
                        ))}

                        {/* Submission Panel */}
                        <VCard>
                            <div className="space-y-4">
                                <div>
                                    <label className={labelCls}>Delivery Remarks</label>
                                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)}
                                        placeholder="Note shortages, damages, or specific QC findings here..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all h-24 resize-none" />
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                                    <SecondaryBtn onClick={() => complete("DRAFT")} className="px-6">
                                        Save Draft
                                    </SecondaryBtn>
                                    <PrimaryBtn onClick={() => complete("PENDING")} className="px-8 !bg-emerald-600 hover:!bg-emerald-700 shadow-emerald-100 shadow-lg whitespace-nowrap" icon={<CheckSquare size={16} />}>
                                        Finalize GRN
                                    </PrimaryBtn>
                                </div>
                            </div>
                        </VCard>
                    </div>

                    {/* Inline Product Creation Modal */}
                    <AnimatePresence>
                        {showCreateModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col"
                                >
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">Create Store Product</h3>
                                            <p className="text-[11px] text-slate-500 font-medium">Add a new item to your master catalog</p>
                                        </div>
                                        <button onClick={() => {
                                            setShowCreateModal(false);
                                            setMappingItemIndex(null);
                                        }} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                                    </div>
                                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Product Name *</label>
                                                <input type="text" value={newProductData.name} onChange={e => setNewProductData({ ...newProductData, name: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">SKU / Barcode *</label>
                                                <input type="text" value={newProductData.sku} onChange={e => setNewProductData({ ...newProductData, sku: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Brand Name</label>
                                                <input type="text" placeholder="e.g. Sprite" value={newProductData.brand} onChange={e => setNewProductData({ ...newProductData, brand: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Unit of Measure</label>
                                                <input type="text" value={newProductData.unit} onChange={e => setNewProductData({ ...newProductData, unit: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">HSN Code</label>
                                                <input type="text" placeholder="e.g. 22021010" value={newProductData.hsnCode} onChange={e => setNewProductData({ ...newProductData, hsnCode: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">GST Rate (%)</label>
                                                <input type="number" placeholder="18" value={newProductData.gstRate} onChange={e => setNewProductData({ ...newProductData, gstRate: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Min Stock Alert Qty</label>
                                                <input type="number" placeholder="10" value={newProductData.minStock} onChange={e => setNewProductData({ ...newProductData, minStock: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Purchase Price</label>
                                                <input type="number" step="0.01" value={newProductData.purchaseRate} onChange={e => setNewProductData({ ...newProductData, purchaseRate: e.target.value })} className={inputCls} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">MRP (Max Retail Price)</label>
                                                <input type="number" step="0.01" value={newProductData.mrp} onChange={e => setNewProductData({ ...newProductData, mrp: e.target.value })} className={inputCls} />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block font-extrabold text-blue-600">Store Selling Price (Editable) *</label>
                                                <input type="number" step="0.01" value={newProductData.sellingPrice} onChange={e => setNewProductData({ ...newProductData, sellingPrice: e.target.value })} className={`${inputCls} border-blue-200 focus:border-blue-500 bg-blue-50/20`} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                                        <SecondaryBtn onClick={() => {
                                            setShowCreateModal(false);
                                            setMappingItemIndex(null);
                                        }}>Cancel</SecondaryBtn>
                                        <PrimaryBtn onClick={handleCreateProduct} disabled={isCreatingProduct}>
                                            {isCreatingProduct ? 'Creating...' : 'Create & Map'}
                                        </PrimaryBtn>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
