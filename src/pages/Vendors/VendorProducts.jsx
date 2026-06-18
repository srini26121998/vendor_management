import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    StatusBadge, PrimaryBtn, SecondaryBtn, VModal, ColumnConfig
} from './VendorComponents';
import {
    Search, Trash2, Edit3, Eye, FileSpreadsheet, FileText, Download,
    Plus, Package, Building, Tag, ShoppingBag, Info, AlertTriangle, RefreshCw, UploadCloud
} from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import useVendorStore from '../../store/useVendorStore';
import {
    fetchAllVendorProducts,
    createVendorProduct,
    updateVendorProduct,
    deleteVendorProduct,
    deactivateVendorProduct
} from '../../api/vendorService';
import { VENDOR_CATEGORIES, TAX_CATEGORIES } from './vendorConstants';
import VendorBulkImportModal from './VendorBulkImportModal';

const SearchableSelect = ({ options, value, onChange, placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div 
                className="w-full pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 outline-none hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all cursor-pointer shadow-sm flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <span className="pointer-events-none text-slate-400">▼</span>
            </div>
            
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-500 focus:bg-white transition-colors"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`px-4 py-2.5 text-[13px] cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors ${value === opt.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 font-medium'}`}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-[13px] text-slate-500 text-center">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function VendorProducts() {
    const navigate = useNavigate();
    const { vendors, loadVendors } = useVendorStore();

    // Catalog States
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('All Vendors');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [sortConfig, setSortConfig] = useState({ key: 'productName', dir: 'asc' });

    // Modals
    const [showAddEditModal, setShowAddEditModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [productToView, setProductToView] = useState(null);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);

    // Form fields
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

    const [cols, setCols] = useState([
        { id: 'batch', label: 'Batch No.', visible: true },
        { id: 'sku', label: 'SKU Code', visible: true },
        { id: 'name', label: 'Product Name', visible: true },
        { id: 'brand', label: 'Brand', visible: true },
        { id: 'vendor', label: 'Supplier / Vendor', visible: true },
        { id: 'price', label: 'Purchase Price', visible: true },
        { id: 'unit', label: 'UOM / Pack', visible: true },
        { id: 'gst', label: 'GST / HSN', visible: true },
        { id: 'moq', label: 'Min Qty', visible: true },
        { id: 'actions', label: 'Actions', visible: true }
    ]);

    // ── Load Initial Data ──
    const loadCatalogData = async () => {
        setIsLoading(true);
        try {
            await loadVendors();
            const res = await fetchAllVendorProducts();
            setProducts(Array.isArray(res) ? res : res?.data || []);
        } catch (err) {
            console.error("Failed to load catalog data:", err);
            toast.error("Failed to sync vendor product catalog from database.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCatalogData();
    }, []);

    // ── Form Handlers ──
    const openAddModal = () => {
        setModalMode('add');
        setFormData({
            vendorId: vendors[0]?.id || '',
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
        setShowAddEditModal(true);
    };

    const openEditModal = (p) => {
        setModalMode('edit');
        setSelectedProduct(p);
        
        // Find matching vendor ID by vendor code/name
        const matchingVendor = vendors.find(v => v.vendorCode === p.vendorCode || v.legalName === p.vendorLegalName);
        
        setFormData({
            vendorId: matchingVendor?.id || '',
            productName: p.productName || '',
            vendorSku: p.vendorSku || '',
            purchasePrice: p.purchasePrice ? p.purchasePrice.toString() : '',
            unitOfMeasure: p.unitOfMeasure || 'PCS',
            packSize: p.packSize || '',
            gstRate: p.gstRate ? p.gstRate.toString() : '18',
            hsnCode: p.hsnCode || '',
            brand: p.brand || '',
            category: p.category || 'FMCG',
            minOrderQty: p.minOrderQty ? p.minOrderQty.toString() : '1',
            description: p.description || '',
            batchNumber: p.batchNumber || '',
            expiryDate: p.expiryDate || ''
        });
        setShowAddEditModal(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();

        if (!formData.productName.trim()) return toast.error("Product name is required.");
        if (!formData.vendorSku.trim()) return toast.error("SKU is required.");
        if (!formData.batchNumber.trim()) return toast.error("Batch number is required.");
        if (!formData.expiryDate) return toast.error("Expiry date is required.");
        if (!formData.purchasePrice || parseFloat(formData.purchasePrice) <= 0) {
            return toast.error("Purchase price must be greater than 0.");
        }
        if (!formData.vendorId && modalMode === 'add') {
            return toast.error("Please select a vendor.");
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

        const actionText = modalMode === 'add' ? "Creating product..." : "Saving details...";
        const successText = modalMode === 'add' ? "Product added successfully!" : "Product updated successfully!";
        
        toast.loading(actionText, { id: "product-save" });

        try {
            if (modalMode === 'add') {
                await createVendorProduct(formData.vendorId, payload);
            } else {
                await updateVendorProduct(selectedProduct.id, payload);
            }
            toast.success(successText, { id: "product-save" });
            setShowAddEditModal(false);
            loadCatalogData();
        } catch (err) {
            console.error("Save failure details:", err);
            if (err.response) {
                console.error("Server responded with:", err.response.status, err.response.data);
            }
            const errDetail = err.response?.data?.message || 
                              err.response?.data?.error || 
                              (err.response?.data ? (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data) : null) || 
                              err.message || 
                              "Operation failed.";
            toast.error(`Failed to save: ${errDetail}`, { id: "product-save" });
        }
    };

    const handleDeleteClick = (p) => {
        setProductToDelete(p);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        toast.loading("Removing product...", { id: "product-delete" });
        try {
            await deleteVendorProduct(productToDelete.id);
            toast.success("Product removed from registry.", { id: "product-delete" });
            setShowDeleteModal(false);
            setProductToDelete(null);
            loadCatalogData();
        } catch (err) {
            console.error("Deletion failed, trying deactivate:", err);
            try {
                // Fallback to deactivate (soft delete) if hard delete fails due to reference keys
                await deactivateVendorProduct(productToDelete.id);
                toast.success("Product status set to Inactive (soft deleted).", { id: "product-delete" });
                setShowDeleteModal(false);
                setProductToDelete(null);
                loadCatalogData();
            } catch (err2) {
                const errDetail = err2.response?.data?.message || err2.message || "Failed to remove.";
                toast.error(`Failed to delete: ${errDetail}`, { id: "product-delete" });
            }
        }
    };

    // ── Filtering & Sorting ──
    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = !searchTerm ||
                (p.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.vendorSku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesVendor = vendorFilter === 'All Vendors' || p.vendorLegalName === vendorFilter || p.vendorCode === vendorFilter;
            const matchesCategory = categoryFilter === 'All Categories' || p.category === categoryFilter;

            return matchesSearch && matchesVendor && matchesCategory && p.isActive !== false;
        });
    }, [products, searchTerm, vendorFilter, categoryFilter]);

    const sortedProducts = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const { key, dir } = sortConfig;
            let valA = a[key] ?? '';
            let valB = b[key] ?? '';
            
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filtered, sortConfig]);

    const handleSort = (key) => {
        const dir = sortConfig.key === key && sortConfig.dir === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, dir });
    };

    const paginated = useMemo(() => {
        return sortedProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    }, [sortedProducts, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(sortedProducts.length / rowsPerPage) || 1;

    // ── Export Handlers ──
    const handleExcelExport = () => {
        const dataToExport = filtered.map(p => ({
            "Product SKU": p.vendorSku,
            "Product Name": p.productName,
            "Brand": p.brand || 'N/A',
            "Category": p.category || 'N/A',
            "Vendor / Supplier": p.vendorLegalName,
            "Purchase Price (INR)": p.purchasePrice,
            "Unit of Measure": p.unitOfMeasure,
            "Pack Size": p.packSize || 'N/A',
            "GST Rate (%)": p.gstRate || 0,
            "HSN Code": p.hsnCode || 'N/A'
        }));
        exportToExcel(dataToExport, 'Vendor_Product_Catalog', []);
    };

    const handlePDFExport = () => {
        const colsForPDF = [
            { header: 'SKU', accessor: 'vendorSku' },
            { header: 'Product Name', accessor: 'productName' },
            { header: 'Brand', accessor: 'brand' },
            { header: 'Vendor', accessor: 'vendorLegalName' },
            { header: 'Price (INR)', accessor: 'purchasePrice' },
            { header: 'UOM', accessor: 'unitOfMeasure' }
        ];
        exportToPDF(filtered, 'Vendor Product Catalog', colsForPDF);
    };

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen pb-12" style={{ fontFamily: '"Inter", sans-serif' }}>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');`}
            </style>

            {isLoading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border border-slate-100">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[13px] font-bold text-slate-600">Syncing product master...</p>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 pt-4">
                
                {/* ── Page Title / Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[22px] font-extrabold text-[#1e293b] tracking-tight">Vendor Product Master</h1>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                            Central catalog mapping supplier SKUs, price lists, tax codes, and warehouse alignments.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <SecondaryBtn onClick={handleExcelExport} icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />} className="!rounded-xl hover:!border-emerald-300">
                            Excel
                        </SecondaryBtn>
                        <SecondaryBtn onClick={handlePDFExport} icon={<FileText className="w-4 h-4 text-rose-600" />} className="!rounded-xl hover:!border-rose-300">
                            PDF
                        </SecondaryBtn>
                        <SecondaryBtn onClick={() => setShowBulkImportModal(true)} className="!rounded-full !font-bold !px-6 !py-2.5 !text-[11px] !border-blue-200 !text-blue-700 bg-blue-50 shadow-sm hover:bg-blue-100 hover:border-blue-300">
                            <UploadCloud className="w-4 h-4 mr-1 inline-block" />
                            BULK IMPORT
                        </SecondaryBtn>
                        <PrimaryBtn onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="!rounded-xl !bg-blue-600 shadow-md shadow-blue-200">
                            ADD NEW PRODUCT
                        </PrimaryBtn>
                    </div>
                </div>

                {/* ── Filter / Search Master Bar ── */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
                    <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                            <Search className="w-5 h-5" />
                        </span>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Quick search by product name, vendor SKU, or brand..."
                            className="w-full pl-14 pr-6 h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-[14px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                        <div className="flex-1 min-w-[200px] relative">
                            <SearchableSelect
                                value={vendorFilter}
                                onChange={(val) => setVendorFilter(val)}
                                options={[
                                    { value: 'All Vendors', label: 'All Vendors / Suppliers' },
                                    ...vendors.map(v => ({ value: v.legalName, label: `${v.legalName} (${v.vendorCode})` }))
                                ]}
                                placeholder="Select Vendor"
                            />
                        </div>

                        <div className="flex-1 min-w-[200px] relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full appearance-none pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="All Categories">All Categories</option>
                                {VENDOR_CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</span>
                        </div>

                        <div className="relative">
                            <select
                                value={rowsPerPage}
                                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="appearance-none pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer shadow-sm"
                            >
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</span>
                        </div>
                    </div>
                </div>

                {/* ── Table Container ── */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[11px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 bg-[#F8FAFC]">
                                    {cols.filter(c => c.visible).map(col => (
                                        <th 
                                            key={col.id} 
                                            onClick={() => col.id !== 'actions' && handleSort(col.id === 'batch' ? 'batchNumber' : col.id === 'sku' ? 'vendorSku' : col.id === 'name' ? 'productName' : col.id === 'vendor' ? 'vendorLegalName' : col.id === 'price' ? 'purchasePrice' : col.id)}
                                            className="px-6 py-4.5 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {col.label}
                                                {sortConfig.key === (col.id === 'batch' ? 'batchNumber' : col.id === 'sku' ? 'vendorSku' : col.id === 'name' ? 'productName' : col.id === 'vendor' ? 'vendorLegalName' : col.id === 'price' ? 'purchasePrice' : col.id) && (
                                                    <span className="text-blue-600">{sortConfig.dir === 'asc' ? '▲' : '▼'}</span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[13px]">
                                {paginated.length > 0 ? (
                                    paginated.map((p) => (
                                        <tr key={p.id} className="hover:bg-blue-50/15 transition-all group">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                                                {p.batchNumber || '—'}
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                                                {p.vendorSku}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-[14px] text-slate-800">{p.productName}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{p.category}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-500 whitespace-nowrap">
                                                {p.brand || '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-700">{p.vendorLegalName}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono tracking-tighter">{p.vendorCode}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">
                                                ₹{p.purchasePrice ? p.purchasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 font-bold text-[11px]">
                                                    {p.unitOfMeasure} {p.packSize ? `(${p.packSize})` : ''}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col font-medium">
                                                    <span className="text-[11px] font-bold text-emerald-600">{p.gstRate}% GST</span>
                                                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">HSN: {p.hsnCode || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-500 text-center whitespace-nowrap">
                                                {p.minOrderQty || 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <button 
                                                        onClick={() => { setProductToView(p); setShowViewModal(true); }}
                                                        title="View Details"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => openEditModal(p)}
                                                        title="Edit Product"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(p)}
                                                        title="Delete Product"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={cols.length} className="py-24 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
                                                    <Package className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-[16px] font-bold text-slate-700">No active products match search filters</h3>
                                                <button 
                                                    onClick={() => { setSearchTerm(''); setVendorFilter('All Vendors'); setCategoryFilter('All Categories'); }} 
                                                    className="text-blue-600 text-[13px] font-bold hover:underline"
                                                >
                                                    Reset all filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Pagination ── */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-12">
                    <div className="text-[12px] font-bold text-slate-400 uppercase">
                        Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, sortedProducts.length)} of {sortedProducts.length} items
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(s => s - 1)} 
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                        >
                            Previous
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button 
                                key={i} 
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-10 h-10 rounded-xl text-[12px] font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-white border border-slate-100 text-slate-400 hover:border-slate-300'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button 
                            disabled={currentPage === totalPages} 
                            onClick={() => setCurrentPage(s => s + 1)} 
                            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Add / Edit Product Modal ── */}
            <VModal 
                open={showAddEditModal} 
                onClose={() => setShowAddEditModal(false)} 
                title={modalMode === 'add' ? "Add Vendor Product" : "Edit Vendor Product"}
                width="max-w-2xl"
            >
                <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Vendor Selection (Creation Only) */}
                        {modalMode === 'add' ? (
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Supplier / Vendor*</label>
                                <div className="relative">
                                    <select
                                        value={formData.vendorId}
                                        onChange={(e) => setFormData(f => ({ ...f, vendorId: e.target.value }))}
                                        required
                                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                                    >
                                        <option value="" disabled>-- Select Supplier --</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.legalName} ({v.vendorCode})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="md:col-span-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-3">
                                <Building className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Link</p>
                                    <p className="text-[13px] font-bold text-slate-800">{selectedProduct?.vendorLegalName} ({selectedProduct?.vendorCode})</p>
                                </div>
                            </div>
                        )}

                        {/* Product Name */}
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Product Name*</label>
                            <input
                                type="text"
                                value={formData.productName}
                                onChange={(e) => setFormData(f => ({ ...f, productName: e.target.value }))}
                                required
                                maxLength={255}
                                placeholder="e.g. Amul Butter 500g Classic"
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
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
                                placeholder="e.g. AMUL-BUT-500"
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm font-mono uppercase"
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
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
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
                                placeholder="e.g. Amul"
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm cursor-pointer"
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
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm cursor-pointer"
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
                                placeholder="e.g. 500g / 1 Litre / Pack of 12"
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {/* GST Rate */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">GST Tax Rate (%)</label>
                            <select
                                value={formData.gstRate}
                                onChange={(e) => setFormData(f => ({ ...f, gstRate: e.target.value }))}
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm cursor-pointer"
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
                                placeholder="e.g. 04051000"
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm font-mono"
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
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
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
                                placeholder="e.g. BTX-2023-A"
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm font-mono uppercase"
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
                                className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Product Description / Notes</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                                maxLength={500}
                                placeholder="Provide optional remarks, shelf life specifications, or packaging requirements..."
                                className="w-full p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium h-24 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
                        <SecondaryBtn onClick={() => setShowAddEditModal(false)}>Cancel</SecondaryBtn>
                        <PrimaryBtn onClick={handleFormSubmit} className="!bg-blue-600 hover:!bg-blue-700 shadow-md">
                            {modalMode === 'add' ? 'Confirm & Create' : 'Save Changes'}
                        </PrimaryBtn>
                    </div>
                </form>
            </VModal>

            {/* ── View Details Modal ── */}
            <VModal
                open={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Product Catalog Dossier"
                width="max-w-xl"
            >
                {productToView && (
                    <div className="space-y-6">
                        <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50/30 border border-indigo-100 rounded-3xl flex items-start gap-4">
                            <div className="w-12 h-12 bg-white border border-indigo-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                <Package className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">SKU: {productToView.vendorSku}</p>
                                <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{productToView.productName}</h3>
                                <p className="text-xs text-slate-500 font-semibold">{productToView.brand || 'No Brand'} • {productToView.category}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[13px] border-b border-slate-50 pb-6 mt-4">
                            {Object.entries(productToView)
                                .filter(([k]) => !['description', 'createdAt', 'updatedAt', 'id'].includes(k))
                                .map(([key, value]) => {
                                    const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
                                    
                                    let displayValue = value;
                                    if (value === null) {
                                        displayValue = <span className="text-slate-300 font-medium">—</span>;
                                    } else if (typeof value === 'boolean') {
                                        displayValue = (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${value ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                                {value ? 'True' : 'False'}
                                            </span>
                                        );
                                    } else {
                                        displayValue = String(value);
                                    }

                                    return (
                                        <div key={key} className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100/60 hover:bg-white hover:shadow-md hover:shadow-slate-200/40 hover:border-blue-100 transition-all group">
                                            <p className="text-[11px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors mb-1">{displayKey}</p>
                                            <p className="font-bold text-slate-700 break-words leading-tight">
                                                {displayValue}
                                            </p>
                                        </div>
                                    );
                                })}
                        </div>

                        {productToView.description && (
                            <div className="space-y-2 bg-gradient-to-br from-slate-50 to-slate-50/50 p-4.5 rounded-2xl border border-slate-100">
                                <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                    <Info className="w-4 h-4 text-blue-500" />
                                    Description
                                </p>
                                <p className="text-slate-700 leading-relaxed text-[13px] font-medium">{productToView.description}</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <SecondaryBtn onClick={() => setShowViewModal(false)}>Close Dossier</SecondaryBtn>
                        </div>
                    </div>
                )}
            </VModal>

            {/* ── Confirm Delete Modal ── */}
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
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Catalog Product?</h3>
                        <p className="text-slate-500 text-[13px] leading-relaxed">
                            You are about to remove <span className="font-bold text-slate-800">"{productToDelete?.productName}"</span> from the catalog list.
                            This will disconnect the SKU from any pending purchase order pipelines.
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
                        <SecondaryBtn onClick={() => setShowDeleteModal(false)}>Cancel</SecondaryBtn>
                        <PrimaryBtn onClick={confirmDelete} className="!bg-rose-600 hover:!bg-rose-700">Confirm Deletion</PrimaryBtn>
                    </div>
                </div>
            </VModal>

            <VendorBulkImportModal
                isOpen={showBulkImportModal}
                onClose={() => setShowBulkImportModal(false)}
                onSuccess={async () => {
                    await loadCatalogData();
                    setShowBulkImportModal(false);
                }}
                importType="product"
            />
        </div>
    );
}
