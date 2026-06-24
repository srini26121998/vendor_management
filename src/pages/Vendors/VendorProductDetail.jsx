import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Edit3, Trash2, Package, Tag, Info, AlertTriangle, Building,
    DollarSign, Layers, Barcode, Activity, Calendar, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { VCard, PrimaryBtn, SecondaryBtn, VModal, StatusBadge } from './VendorComponents';
import useVendorStore from '../../store/useVendorStore';
import {
    fetchAllVendorProducts,
    updateVendorProduct,
    deleteVendorProduct,
    deactivateVendorProduct
} from '../../api/vendorService';
import { VENDOR_CATEGORIES, TAX_CATEGORIES } from './vendorConstants';

const MOCK_VENDORS_FALLBACK = [
    { id: 'v1', legalName: 'Acme Agro Foods', vendorCode: 'VND001', primaryEmail: 'acme@agro.com', primaryMobile: '+91 98765 43210', category: 'FMCG' },
    { id: 'v2', legalName: 'Dairy Fresh Corp', vendorCode: 'VND002', primaryEmail: 'fresh@dairy.com', primaryMobile: '+91 87654 32109', category: 'Dairy' },
    { id: 'v3', legalName: 'Hindustan Distributors', vendorCode: 'VND003', primaryEmail: 'contact@hindustan.com', primaryMobile: '+91 76543 21098', category: 'FMCG' },
    { id: 'v4', legalName: 'Nestle FMCG Supply', vendorCode: 'VND004', primaryEmail: 'supply@nestle.com', primaryMobile: '+91 65432 10987', category: 'FMCG' }
];

const BASE_MOCK_PRODUCTS = [
    { name: "Amul Gold Milk 1L", brand: "Amul", category: "Dairy", price: 64, sku: "AMUL-GOLD-1L", uom: "PACK", packSize: "1L", hsn: "04012000" },
    { name: "Britannia Marie Gold 250g", brand: "Britannia", category: "Bakery", price: 30, sku: "BRIT-MARIE-250", uom: "PCS", packSize: "250g", hsn: "19059020" },
    { name: "Maggi 2-Min Noodles 70g", brand: "Maggi", category: "FMCG", price: 14, sku: "MAGGI-70G", uom: "PCS", packSize: "70g", hsn: "19023010" },
    { name: "Cadbury Dairy Milk 100g", brand: "Cadbury", category: "Confectionery", price: 100, sku: "CAD-DM-100", uom: "PCS", packSize: "100g", hsn: "18063100" },
    { name: "Tata Salt 1kg", brand: "Tata", category: "FMCG", price: 28, sku: "TATA-SALT-1K", uom: "PACK", packSize: "1kg", hsn: "25010020" },
    { name: "Fortune Soya Health Oil 1L", brand: "Fortune", category: "FMCG", price: 145, sku: "FORT-SOYA-1L", uom: "LTR", packSize: "1L", hsn: "15079010" },
    { name: "Dettol Liquid Handwash 200ml", brand: "Dettol", category: "Personal Care", price: 99, sku: "DET-HW-200", uom: "PCS", packSize: "200ml", hsn: "34013011" },
    { name: "Colgate MaxFresh Paste 150g", brand: "Colgate", category: "Personal Care", price: 110, sku: "COLG-MF-150", uom: "PCS", packSize: "150g", hsn: "33061020" },
    { name: "Surf Excel Easy Wash 1kg", brand: "Surf Excel", category: "Household", price: 140, sku: "SURF-EW-1K", uom: "PACK", packSize: "1kg", hsn: "34022010" },
    { name: "Aashirvaad Shudh Chakki Atta 5kg", brand: "Aashirvaad", category: "FMCG", price: 260, sku: "ASH-ATTA-5K", uom: "PACK", packSize: "5kg", hsn: "11010000" },
    { name: "Red Label Tea 500g", brand: "Red Label", category: "Beverages", price: 210, sku: "RED-TEA-500", uom: "PACK", packSize: "500g", hsn: "09024020" },
    { name: "Nescafe Classic Coffee 100g", brand: "Nescafe", category: "Beverages", price: 320, sku: "NES-COF-100", uom: "PCS", packSize: "100g", hsn: "21011110" },
    { name: "Haldiram Bhujia Sev 400g", brand: "Haldiram", category: "Snacks", price: 110, sku: "HALD-BHU-400", uom: "PACK", packSize: "400g", hsn: "21069099" },
    { name: "Lays Potato Chips Classic 50g", brand: "Lays", category: "Snacks", price: 20, sku: "LAYS-CLA-50", uom: "PCS", packSize: "50g", hsn: "20052000" },
    { name: "Coca Cola Pet Bottle 750ml", brand: "Coca Cola", category: "Beverages", price: 40, sku: "COCA-750", uom: "PCS", packSize: "750ml", hsn: "22021010" },
    { name: "Vim Dishwash Gel 250ml", brand: "Vim", category: "Household", price: 55, sku: "VIM-GEL-250", uom: "PCS", packSize: "250ml", hsn: "34022090" },
    { name: "Parle-G Biscuits 800g Combo", brand: "Parle", category: "Bakery", price: 80, sku: "PARLE-G-800", uom: "PACK", packSize: "800g", hsn: "19059010" },
    { name: "Good Day Cashew Cookies 200g", brand: "Britannia", category: "Bakery", price: 45, sku: "BRIT-GD-200", uom: "PCS", packSize: "200g", hsn: "19059020" },
    { name: "Mother Dairy Paneer 200g", brand: "Mother Dairy", category: "Dairy", price: 85, sku: "MD-PAN-200", uom: "PACK", packSize: "200g", hsn: "04069000" },
    { name: "Kissan Tomato Ketchup 1kg", brand: "Kissan", category: "FMCG", price: 120, sku: "KIS-KET-1K", uom: "PCS", packSize: "1kg", hsn: "21032000" },
    { name: "Lizol Disinfectant 500ml", brand: "Lizol", category: "Household", price: 115, sku: "LIZ-DIS-500", uom: "PCS", packSize: "500ml", hsn: "38089400" },
    { name: "Pears Pure Soap 125g", brand: "Pears", category: "Personal Care", price: 75, sku: "PEARS-125", uom: "PCS", packSize: "125g", hsn: "34011110" },
    { name: "Whisper Choice Ultra 6s", brand: "Whisper", category: "Personal Care", price: 45, sku: "WHIS-CHO-6", uom: "PACK", packSize: "6s", hsn: "96190010" },
    { name: "Dano Milk Powder 400g", brand: "Dano", category: "Dairy", price: 290, sku: "DANO-MILK-400", uom: "PCS", packSize: "400g", hsn: "04021010" }
];

export default function VendorProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { vendors, loadVendors } = useVendorStore();

    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Form fields for editing
    const [formData, setFormData] = useState({
        vendorId: '',
        productName: '',
        vendorSku: '',
        purchasePrice: '',
        unitOfMeasure: 'PCS',
        packSize: '',
        gstRate: '18',
        hsnCode: '',
        brand: '',
        category: 'FMCG',
        minOrderQty: '1',
        description: '',
        batchNumber: '',
        expiryDate: ''
    });

    const loadProductData = async () => {
        setIsLoading(true);
        try {
            const loadedVendors = await loadVendors();
            const activeVendors = loadedVendors?.length > 0 ? loadedVendors : (vendors.length > 0 ? vendors : MOCK_VENDORS_FALLBACK);

            const res = await fetchAllVendorProducts();
            const fetchedList = Array.isArray(res) ? res : res?.data || [];

            const mockProducts = BASE_MOCK_PRODUCTS.map((bp, index) => {
                const vendor = activeVendors[index % activeVendors.length];
                const existing = fetchedList.find(x => x.vendorSku === bp.sku);
                if (existing) {
                    const qty = existing.quantity !== undefined ? existing.quantity : (5 + (index * 7) % 75);
                    return {
                        ...existing,
                        quantity: qty,
                        stockStatus: qty === 0 ? 'Out of Stock' : qty < 10 ? 'Low Stock' : 'In Stock'
                    };
                }

                return {
                    id: `mock-prod-${index + 1}`,
                    productName: bp.name,
                    vendorSku: bp.sku,
                    brand: bp.brand,
                    category: bp.category,
                    purchasePrice: bp.price,
                    unitOfMeasure: bp.uom,
                    packSize: bp.packSize,
                    gstRate: 18,
                    hsnCode: bp.hsn,
                    minOrderQty: 5,
                    batchNumber: `BAT-${2026}-${index + 1}`,
                    expiryDate: `2026-12-15`,
                    isActive: true,
                    vendorLegalName: vendor.legalName || vendor.name,
                    vendorCode: vendor.vendorCode,
                    vendorId: vendor.id,
                    quantity: 5 + (index * 7) % 75,
                    stockStatus: (5 + (index * 7) % 75) === 0 ? 'Out of Stock' : (5 + (index * 7) % 75) < 10 ? 'Low Stock' : 'In Stock'
                };
            });

            const remainingFetched = fetchedList.filter(fp => !BASE_MOCK_PRODUCTS.some(bp => bp.sku === fp.vendorSku));
            const decoratedRemaining = remainingFetched.map((fp, i) => {
                const qty = fp.quantity !== undefined ? fp.quantity : (3 + (i * 11) % 60);
                return {
                    ...fp,
                    quantity: qty,
                    stockStatus: qty === 0 ? 'Out of Stock' : qty < 10 ? 'Low Stock' : 'In Stock'
                };
            });

            const allProducts = [...mockProducts, ...decoratedRemaining];
            const found = allProducts.find(p => p.id === id);
            
            if (found) {
                setProduct(found);
                
                // Find matching vendor ID
                const matchingVendor = activeVendors.find(v => v.vendorCode === found.vendorCode || v.legalName === found.vendorLegalName);
                
                setFormData({
                    vendorId: matchingVendor?.id || found.vendorId || '',
                    productName: found.productName || '',
                    vendorSku: found.vendorSku || '',
                    purchasePrice: found.purchasePrice ? found.purchasePrice.toString() : '',
                    unitOfMeasure: found.unitOfMeasure || 'PCS',
                    packSize: found.packSize || '',
                    gstRate: found.gstRate ? found.gstRate.toString() : '18',
                    hsnCode: found.hsnCode || '',
                    brand: found.brand || '',
                    category: found.category || 'FMCG',
                    minOrderQty: found.minOrderQty ? found.minOrderQty.toString() : '1',
                    description: found.description || '',
                    batchNumber: found.batchNumber || '',
                    expiryDate: found.expiryDate || ''
                });
            } else {
                toast.error("Product not found in registry.");
            }
        } catch (err) {
            console.error("Failed to load product details:", err);
            toast.error("Failed to sync catalog details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadProductData();
        }
    }, [id]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!formData.productName.trim()) return toast.error("Product name is required.");
        if (!formData.vendorSku.trim()) return toast.error("SKU is required.");
        if (!formData.batchNumber.trim()) return toast.error("Batch number is required.");
        if (!formData.expiryDate) return toast.error("Expiry date is required.");
        if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
            return toast.error("Purchase price must be greater than 0.");
        }

        const payload = {
            productName: formData.productName.trim(),
            vendorSku: formData.vendorSku.trim(),
            purchasePrice: parseFloat(formData.purchasePrice),
            unitOfMeasure: formData.unitOfMeasure,
            packSize: formData.packSize.trim(),
            gstRate: parseFloat(formData.gstRate),
            hsnCode: formData.hsnCode.trim(),
            brand: formData.brand.trim(),
            category: formData.category,
            minOrderQty: parseFloat(formData.minOrderQty) || 1,
            description: formData.description.trim(),
            batchNumber: formData.batchNumber.trim(),
            expiryDate: formData.expiryDate
        };

        toast.loading("Saving changes...", { id: "product-save" });

        try {
            await updateVendorProduct(product.id, payload);
            toast.success("Product updated successfully!", { id: "product-save" });
            setShowEditModal(false);
            loadProductData();
        } catch (err) {
            console.error("Save failure details:", err);
            const errDetail = err.response?.data?.message || err.message || "Operation failed.";
            toast.error(`Failed to save: ${errDetail}`, { id: "product-save" });
        }
    };

    const confirmDelete = async () => {
        if (!product) return;
        toast.loading("Removing product...", { id: "product-delete" });
        try {
            await deleteVendorProduct(product.id);
            toast.success("Product removed from registry.", { id: "product-delete" });
            setShowDeleteModal(false);
            navigate('/vendors/products');
        } catch (err) {
            console.error("Deletion failed, trying deactivate:", err);
            try {
                await deactivateVendorProduct(product.id);
                toast.success("Product status set to Inactive (soft deleted).", { id: "product-delete" });
                setShowDeleteModal(false);
                navigate('/vendors/products');
            } catch (err2) {
                const errDetail = err2.response?.data?.message || err2.message || "Failed to remove.";
                toast.error(`Failed to delete: ${errDetail}`, { id: "product-delete" });
            }
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#F3F5F9] z-50 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-green-800 border-t-transparent rounded-full animate-spin" />
                <p className="text-[13px] font-bold text-slate-600">Syncing product data dossier...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="w-full bg-[#F3F5F9] min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4 shadow-sm">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-[18px] font-medium text-slate-800">Product Not Found</h3>
                <p className="text-[13px] text-slate-500 mt-2 max-w-sm">
                    The requested product ID does not exist or may have been deleted.
                </p>
                <Link
                    to="/vendors/products"
                    className="mt-6 px-6 py-2.5 bg-green-800 hover:bg-green-950 text-white font-bold text-[11px] rounded-xl shadow-md transition-all uppercase tracking-wider"
                >
                    Back to Catalog
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen pb-12" style={{ fontFamily: '"Inter", sans-serif' }}>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');`}
            </style>

            <div className="max-w-[1400px] mx-auto p-4 space-y-4 pt-3">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/vendors/products')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ArrowLeft size={12} /> Back
                    </button>
                    <div className="h-3 w-px bg-slate-300" />
                    <nav className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                        <Link to="/" className="hover:text-green-800">Home</Link>
                        <span>/</span>
                        <Link to="/vendors/products" className="hover:text-green-800">Products</Link>
                        <span>/</span>
                        <span className="text-slate-600">{product.productName}</span>
                    </nav>
                </div>

                {/* Main Header / Banner Card */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-green-50/20 rounded-full blur-3xl -z-10 pointer-events-none" />
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-green-50 border border-green-100 rounded-xl flex items-center justify-center text-green-800 shadow-sm shrink-0">
                            <Package className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider border border-slate-200/40">
                                    SKU: {product.vendorSku}
                                </span>
                                <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase border
                                    ${product.quantity === 0 ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                      product.quantity < 10 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                      'bg-emerald-50 text-emerald-700 border-emerald-100'}
                                `}>
                                    {product.stockStatus}
                                </span>
                            </div>
                            <h1 className="text-[17px] font-medium text-slate-800 leading-tight">{product.productName}</h1>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                                {product.brand || 'No Brand'} • {product.category}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons shown inside the view */}
                    <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 text-amber-700 rounded-lg text-[10px] font-bold transition-all shadow-sm uppercase tracking-wider"
                        >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Details
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-600 rounded-lg text-[10px] font-bold transition-all shadow-sm uppercase tracking-wider"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Product
                        </button>
                    </div>
                </div>

                {/* Simple Dossier View */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-4 sm:p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-[12px]">
                        {Object.entries(product)
                            .filter(([k]) => !['description', 'createdAt', 'updatedAt', 'id', 'vendorId'].includes(k))
                            .map(([key, value]) => {
                                const displayKey = key.replace(/([A-Z])/g, ' $1').trim();
                                const formattedKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);
                                
                                let displayValue = value;
                                if (value === null || value === undefined || value === '') {
                                    displayValue = <span className="text-slate-300 font-medium">—</span>;
                                } else if (typeof value === 'boolean') {
                                    displayValue = (
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${value ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                            {value ? 'True' : 'False'}
                                        </span>
                                    );
                                } else {
                                    displayValue = String(value);
                                }

                                return (
                                    <div key={key} className="bg-slate-50/50 rounded-lg p-3 border border-slate-100/60 hover:bg-white hover:shadow-md hover:shadow-slate-200/40 hover:border-green-100 transition-all group">
                                        <p className="text-[9px] font-bold text-slate-400 group-hover:text-green-800 transition-colors mb-0.5 uppercase tracking-wide">{formattedKey}</p>
                                        <p className="font-semibold text-slate-700 break-words leading-tight text-[12px]">
                                            {displayValue}
                                        </p>
                                    </div>
                                );
                            })}
                    </div>

                    {product.description && (
                        <div className="mt-4 space-y-1 bg-gradient-to-br from-slate-50 to-slate-50/50 p-4 rounded-lg border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                                <Info className="w-3.5 h-3.5 text-green-800" />
                                Product Description / Notes
                            </p>
                            <p className="text-slate-600 leading-relaxed text-[12px] font-medium pt-0.5">{product.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Product Modal */}
            <VModal
                open={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Catalog Product"
                width="max-w-2xl"
            >
                <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 p-4 bg-green-50/50 border border-green-100 rounded-xl flex items-center gap-3">
                            <Building className="w-5 h-5 text-green-800" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Link</p>
                                <p className="text-[13px] font-bold text-slate-800">{product.vendorLegalName} ({product.vendorCode})</p>
                            </div>
                        </div>

                        {/* Product Name */}
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Product Name*</label>
                            <input
                                type="text"
                                value={formData.productName}
                                onChange={(e) => setFormData(f => ({ ...f, productName: e.target.value }))}
                                required
                                maxLength={255}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {/* SKU */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Vendor SKU / SKU Code*</label>
                            <input
                                type="text"
                                value={formData.vendorSku}
                                onChange={(e) => setFormData(f => ({ ...f, vendorSku: e.target.value.toUpperCase().replace(/\s+/g, '-') }))}
                                required
                                maxLength={100}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm font-mono uppercase"
                            />
                        </div>

                        {/* Purchase Price */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Purchase Cost Price (INR)*</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[13px]">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.purchasePrice}
                                    onChange={(e) => setFormData(f => ({ ...f, purchasePrice: e.target.value }))}
                                    required
                                    className="w-full pl-8 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Brand */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Brand Name</label>
                            <input
                                type="text"
                                value={formData.brand}
                                onChange={(e) => setFormData(f => ({ ...f, brand: e.target.value }))}
                                maxLength={100}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm cursor-pointer"
                            >
                                {VENDOR_CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* UOM */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unit of Measure (UOM)</label>
                            <select
                                value={formData.unitOfMeasure}
                                onChange={(e) => setFormData(f => ({ ...f, unitOfMeasure: e.target.value }))}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm cursor-pointer"
                            >
                                <option value="PCS">PCS (Pieces)</option>
                                <option value="KG">KG (Kilograms)</option>
                                <option value="LTR">LTR (Liters)</option>
                                <option value="BOX">BOX</option>
                                <option value="PACK">PACK</option>
                                <option value="CASE">CASE</option>
                            </select>
                        </div>

                        {/* Pack Size */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pack Size Description</label>
                            <input
                                type="text"
                                value={formData.packSize}
                                onChange={(e) => setFormData(f => ({ ...f, packSize: e.target.value }))}
                                maxLength={50}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {/* GST Rate */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">GST Tax Rate (%)</label>
                            <select
                                value={formData.gstRate}
                                onChange={(e) => setFormData(f => ({ ...f, gstRate: e.target.value }))}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm cursor-pointer"
                            >
                                {TAX_CATEGORIES.map(t => (
                                    <option key={t} value={t.replace('%', '')}>{t}</option>
                                ))}
                            </select>
                        </div>

                        {/* HSN Code */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">HSN Classification Code</label>
                            <input
                                type="text"
                                value={formData.hsnCode}
                                onChange={(e) => setFormData(f => ({ ...f, hsnCode: e.target.value.replace(/\s+/g, '') }))}
                                maxLength={20}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm font-mono"
                            />
                        </div>

                        {/* Min Order Qty */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Minimum Order Quantity (MOQ)</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.minOrderQty}
                                onChange={(e) => setFormData(f => ({ ...f, minOrderQty: e.target.value }))}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {/* Batch Number */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Batch Number*</label>
                            <input
                                type="text"
                                value={formData.batchNumber}
                                onChange={(e) => setFormData(f => ({ ...f, batchNumber: e.target.value.toUpperCase() }))}
                                required
                                maxLength={100}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm font-mono uppercase"
                            />
                        </div>

                        {/* Expiry Date */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expiry Date*</label>
                            <input
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData(f => ({ ...f, expiryDate: e.target.value }))}
                                required
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Product Description / Notes</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                                maxLength={500}
                                className="w-full p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium h-24 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                        <SecondaryBtn onClick={() => setShowEditModal(false)}>Cancel</SecondaryBtn>
                        <PrimaryBtn onClick={handleFormSubmit} className="!bg-green-800 hover:!bg-green-950 shadow-md">
                            Save Changes
                        </PrimaryBtn>
                    </div>
                </form>
            </VModal>

            {/* Confirm Delete Modal */}
            <VModal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Remove Product"
                width="max-w-md"
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center py-2">
                        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                            <AlertTriangle size={28} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-1">Delete Catalog Product?</h3>
                        <p className="text-slate-500 text-[13px] leading-relaxed">
                            You are about to remove <span className="font-bold text-slate-800">"{product.productName}"</span> from the catalog list.
                            This will disconnect the SKU from any pending purchase order pipelines.
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
                        <SecondaryBtn onClick={() => setShowDeleteModal(false)}>Cancel</SecondaryBtn>
                        <PrimaryBtn onClick={confirmDelete} className="!bg-rose-600 hover:!bg-rose-700">Confirm Deletion</PrimaryBtn>
                    </div>
                </div>
            </VModal>
        </div>
    );
}
