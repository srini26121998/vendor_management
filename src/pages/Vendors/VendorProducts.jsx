import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    StatusBadge, PrimaryBtn, SecondaryBtn, VModal, ColumnConfig
} from './VendorComponents';
import {
    Search, Trash2, Edit3, Eye, FileSpreadsheet, FileText, Download,
    Plus, Package, Building, Tag, ShoppingBag, Info, AlertTriangle, RefreshCw, UploadCloud,
    LayoutGrid, List, ChevronLeft, ChevronRight
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

const getVendorDetails = (vendor, vendorProducts) => {
    const vendorProds = vendorProducts.filter(p => p.vendorCode === vendor.vendorCode || p.vendorId === vendor.id);
    const skuCount = vendorProds.length;
    const inStock = vendorProds.filter(p => p.quantity > 0).length;
    const outOfStock = vendorProds.filter(p => p.quantity === 0).length;

    const contractRef = `CTR-2026-${vendor.vendorCode || '001'}`;
    const contractPeriod = "01-Jan-2026 to 31-Dec-2027";
    const contractValue = vendor.category === 'FMCG' ? "₹25,00,000" : vendor.category === 'Beverages' ? "₹18,50,000" : "₹12,00,000";
    const renewalType = vendor.category === 'FMCG' ? "Automatic (30 days notice)" : "Manual Review";
    const paymentTerms = vendor.category === 'FMCG' ? "Net 30" : "Net 45";
    const earlyPayDiscount = "2/10 Net 30 (2% discount if paid within 10 days)";
    
    const leadTimes = {
        standard: "5 business days",
        express: "2 business days",
        bulk: "10 business days"
    };

    return {
        name: vendor.legalName || vendor.name,
        email: vendor.primaryEmail || vendor.email || 'info@vendor.com',
        phone: vendor.primaryMobile || vendor.mobile || '+91 99999 99999',
        contractRef,
        contractPeriod,
        contractValue,
        renewalType,
        paymentTerms,
        earlyPayDiscount,
        leadTimes,
        snapshot: {
            skus: skuCount,
            inStock,
            outOfStock
        }
    };
};

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

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-[13px] font-bold text-slate-600 cursor-pointer shadow-sm focus:border-green-800"
            >
                <span className="truncate">{options.find(o => o.value === value)?.label || placeholder}</span>
                <span className="text-slate-400">▼</span>
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 max-h-60 overflow-y-auto">
                    <input
                        type="text"
                        placeholder="Search vendor..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-medium outline-none focus:border-green-800 mb-2"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                    setSearchQuery('');
                                }}
                                className={`px-3 py-2 text-[12px] font-semibold hover:bg-green-50 hover:text-green-800 rounded-xl cursor-pointer ${value === opt.value ? 'bg-green-50 text-green-800' : 'text-slate-600'}`}
                            >
                                {opt.label}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-[13px] text-slate-500 text-center">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function VendorProducts() {
    const navigate = useNavigate();
    const { vendors, loadVendors } = useVendorStore();

    const handleCarouselScroll = (vendorCodeOrId, direction) => {
        const container = document.getElementById(`carousel-container-${vendorCodeOrId}`);
        if (container) {
            const scrollAmount = direction === 'next' ? 320 : -320;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Catalog States
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorFilter, setVendorFilter] = useState('All Vendors');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [sortConfig, setSortConfig] = useState({ key: 'productName', dir: 'asc' });

    // Layout and Drag states
    const [viewMode, setViewMode] = useState('grid');
    const [draggedProduct, setDraggedProduct] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [dragOverVendor, setDragOverVendor] = useState(null);
    const [activeDrawerVendor, setActiveDrawerVendor] = useState(null);

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
            const loadedVendors = await loadVendors();
            const res = await fetchAllVendorProducts();
            const fetchedList = Array.isArray(res) ? res : res?.data || [];
            
            const activeVendors = loadedVendors?.length > 0 ? loadedVendors : (vendors.length > 0 ? vendors : MOCK_VENDORS_FALLBACK);
            
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

            setProducts([...mockProducts, ...decoratedRemaining]);
        } catch (err) {
            console.error("Failed to load catalog data:", err);
            toast.error("Failed to sync vendor product catalog from database.");
            
            const activeVendors = vendors.length > 0 ? vendors : MOCK_VENDORS_FALLBACK;
            const mockProducts = BASE_MOCK_PRODUCTS.map((bp, index) => {
                const vendor = activeVendors[index % activeVendors.length];
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
            setProducts(mockProducts);
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

    // Group sorted products by vendor shelf
    const sortedProductsByShelf = useMemo(() => {
        const groups = {};
        
        const activeVendors = vendors.length > 0 ? vendors : MOCK_VENDORS_FALLBACK;
        activeVendors.forEach(v => {
            const code = v.vendorCode || v.id;
            groups[code] = [];
        });

        filtered.forEach(p => {
            const vCode = p.vendorCode;
            if (vCode) {
                if (groups[vCode]) {
                    groups[vCode].push(p);
                } else {
                    groups[vCode] = [p];
                }
            }
        });

        Object.keys(groups).forEach(vCode => {
            const savedOrder = localStorage.getItem(`vendor-shelf-order-${vCode}`);
            if (savedOrder) {
                try {
                    const orderedIds = JSON.parse(savedOrder);
                    groups[vCode].sort((a, b) => {
                        const indexA = orderedIds.indexOf(a.id);
                        const indexB = orderedIds.indexOf(b.id);
                        
                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;
                        return 0;
                    });
                } catch (e) {
                    console.error("Error parsing shelf order from localStorage", e);
                }
            }
        });

        return groups;
    }, [filtered, vendors]);

    // ── Drag and Drop handlers ──
    const handleDragStart = (e, product, index) => {
        setDraggedProduct(product);
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index, vendorCode) => {
        if (draggedProduct && draggedProduct.vendorCode === vendorCode) {
            e.preventDefault();
            if (dragOverIndex !== index || dragOverVendor !== vendorCode) {
                setDragOverIndex(index);
                setDragOverVendor(vendorCode);
            }
        }
    };

    const handleDragEnd = () => {
        setDraggedProduct(null);
        setDraggedIndex(null);
        setDragOverIndex(null);
        setDragOverVendor(null);
    };

    const handleDrop = (e, targetIndex, vendorCode) => {
        e.preventDefault();
        if (!draggedProduct || draggedProduct.vendorCode !== vendorCode) return;

        const sourceIndex = draggedIndex;
        if (sourceIndex === targetIndex) return;

        const shelfProducts = sortedProductsByShelf[vendorCode] || [];
        const newProductsList = [...shelfProducts];
        
        const [movedProduct] = newProductsList.splice(sourceIndex, 1);
        newProductsList.splice(targetIndex, 0, movedProduct);

        const orderedIds = newProductsList.map(p => p.id);
        localStorage.setItem(`vendor-shelf-order-${vendorCode}`, JSON.stringify(orderedIds));

        setProducts(prevProducts => {
            const otherProducts = prevProducts.filter(p => p.vendorCode !== vendorCode);
            return [...otherProducts, ...newProductsList];
        });

        toast.success(`Position updated for ${movedProduct.productName}`, {
            style: {
                border: '1px solid #c084fc',
                padding: '12px',
                color: '#6b21a8',
                backgroundColor: '#faf5ff',
                fontWeight: 'bold',
            },
            icon: '✨',
        });

        handleDragEnd();
    };

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
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                `}
            </style>

            {isLoading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border border-slate-100">
                        <div className="w-10 h-10 border-4 border-green-800 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[13px] font-bold text-slate-600">Syncing product master...</p>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6 pt-4">
                
                {/* ── Page Title / Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[22px] font-medium text-[#1e293b] tracking-tight">Vendor Product Master</h1>
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
                        <SecondaryBtn onClick={() => setShowBulkImportModal(true)} className="!rounded-full !font-bold !px-6 !py-2.5 !text-[11px] !border-green-200 !text-green-800 bg-green-50 shadow-sm hover:bg-green-100 hover:border-green-300">
                            <UploadCloud className="w-4 h-4 mr-1 inline-block" />
                            BULK IMPORT
                        </SecondaryBtn>
                        
                        {/* View Mode Toggle Button */}
                        <button
                            onClick={() => setViewMode(viewMode === 'rack' ? 'grid' : 'rack')}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                            title={viewMode === 'rack' ? "Switch to Sortable Grid Table" : "Switch to Rack Shelf View"}
                        >
                            {viewMode === 'rack' ? <LayoutGrid className="w-4 h-4 text-green-800" /> : <List className="w-4 h-4 text-green-800" />}
                        </button>

                        <PrimaryBtn onClick={openAddModal} icon={<Plus className="w-4 h-4" />} className="!rounded-xl !bg-green-800 shadow-md shadow-green-200">
                            ADD NEW PRODUCT
                        </PrimaryBtn>
                    </div>
                </div>

                {/* ── Filter / Search Master Bar ── */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
                    <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-800 transition-colors">
                            <Search className="w-5 h-5" />
                        </span>
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Quick search by product name, vendor SKU, or brand..."
                            className="w-full pl-14 pr-6 h-14 bg-slate-50/50 border border-slate-200 rounded-2xl text-[14px] font-medium text-slate-700 outline-none focus:border-green-800 focus:bg-white focus:ring-4 focus:ring-green-50/50 transition-all placeholder:text-slate-400"
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
                                className="w-full appearance-none pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 outline-none focus:border-green-800 focus:ring-4 focus:ring-green-50/50 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="All Categories">All Categories</option>
                                {VENDOR_CATEGORIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</span>
                        </div>

                        {viewMode === 'grid' && (
                            <div className="relative">
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="appearance-none pl-4 pr-10 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 outline-none focus:border-green-800 focus:ring-4 focus:ring-green-50/50 transition-all cursor-pointer shadow-sm"
                                >
                                    <option value={25}>25 per page</option>
                                    <option value={50}>50 per page</option>
                                    <option value={100}>100 per page</option>
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Rack View ── */}
                {viewMode === 'rack' && (
                    <div className="space-y-8 animate-fadeIn">
                        {(() => {
                            const activeVendors = vendors.length > 0 ? vendors : MOCK_VENDORS_FALLBACK;
                            
                            return activeVendors.map((vendor) => {
                                const vendorProds = sortedProductsByShelf[vendor.vendorCode || vendor.id] || [];
                                
                                // Hide shelf if filtered and has no matching products
                                if (vendorProds.length === 0 && (searchTerm || categoryFilter !== 'All Categories')) {
                                    return null;
                                }

                                const isCarousel = vendorProds.length > 5;

                                return (
                                    <div key={vendor.id} className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-4">
                                        {/* Rack Header */}
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-800 text-lg font-bold">
                                                    🏢
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-slate-800 text-[15px]">{vendor.legalName || vendor.name}</h3>
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                                        Code: {vendor.vendorCode} • {vendor.category}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isCarousel && (
                                                    <div className="flex items-center gap-1.5 mr-1">
                                                        <button
                                                            id={`carousel-prev-${vendor.vendorCode || vendor.id}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCarouselScroll(vendor.vendorCode || vendor.id, 'prev');
                                                            }}
                                                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:border-green-800"
                                                            title="Previous Products"
                                                        >
                                                            <ChevronLeft className="w-4 h-4 text-green-800" />
                                                        </button>
                                                        <button
                                                            id={`carousel-next-${vendor.vendorCode || vendor.id}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCarouselScroll(vendor.vendorCode || vendor.id, 'next');
                                                            }}
                                                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:border-green-800"
                                                            title="Next Products"
                                                        >
                                                            <ChevronRight className="w-4 h-4 text-green-800" />
                                                        </button>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setActiveDrawerVendor(vendor)}
                                                    className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-[11px] font-bold text-green-700 hover:bg-green-100 hover:border-green-300 transition-all shadow-sm"
                                                >
                                                    Details
                                                </button>
                                            </div>
                                        </div>

                                        {/* Shelf Slot */}
                                        <div 
                                            id={`carousel-container-${vendor.vendorCode || vendor.id}`}
                                            className={isCarousel 
                                                ? "flex overflow-x-auto gap-4 p-2 rounded-2xl bg-slate-50/50 border border-slate-100/40 no-scrollbar scroll-smooth min-h-[140px]" 
                                                : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-[120px] p-2 rounded-2xl bg-slate-50/50 border border-slate-100/40"
                                            }
                                            onDragOver={(e) => e.preventDefault()}
                                        >
                                            {vendorProds.length > 0 ? (
                                                vendorProds.map((p, index) => {
                                                    const isDragOver = dragOverIndex === index && dragOverVendor === vendor.vendorCode;
                                                    
                                                    return (
                                                        <div
                                                            key={p.id}
                                                            id={`carousel-item-${p.id}`}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, p, index)}
                                                            onDragOver={(e) => handleDragOver(e, index, vendor.vendorCode)}
                                                            onDragEnd={handleDragEnd}
                                                            onDrop={(e) => handleDrop(e, index, vendor.vendorCode)}
                                                            onClick={() => navigate(`/vendors/products/${p.id}`)}
                                                            className={`bg-white border rounded-2xl p-4.5 transition-all relative flex flex-col justify-between cursor-pointer hover:border-green-800 hover:shadow-lg
                                                                ${isCarousel ? 'w-[285px] shrink-0' : ''}
                                                                ${isDragOver ? 'border-2 border-dashed border-purple-500 bg-purple-50/30 scale-[1.02]' : 'border-slate-100'}
                                                            `}
                                                        >
                                                            {/* Card Header with Grip Handle */}
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-slate-300 font-bold text-base select-none pr-1">
                                                                        ⠿
                                                                    </span>
                                                                    <span className="font-mono text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider border border-slate-200/40">
                                                                        {p.vendorSku}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Card Body */}
                                                            <div className="space-y-1">
                                                                <h4 className="font-medium text-slate-800 text-[13px] leading-tight truncate">{p.productName}</h4>
                                                                <p className="text-[10px] text-slate-400 font-semibold">{p.brand || 'No Brand'} • {p.category}</p>
                                                            </div>

                                                            {/* Card Footer */}
                                                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                                                <span className="font-extrabold text-slate-800 text-[13px]">
                                                                    ₹{p.purchasePrice ? p.purchasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                                                </span>
                                                                <div className="flex flex-col items-end">
                                                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border
                                                                        ${p.quantity === 0 ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                          p.quantity < 10 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                          'bg-emerald-50 text-emerald-700 border-emerald-100'}
                                                                    `}>
                                                                        {p.stockStatus}
                                                                    </span>
                                                                    <span className="text-[9px] text-slate-400 font-bold mt-0.5">
                                                                        Qty: {p.quantity} {p.unitOfMeasure}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="col-span-full py-8 text-center text-slate-400 text-[12px] italic">
                                                    No products currently on this shelf.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                {/* ── Table / Grid View ── */}
                {viewMode === 'grid' && (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-fadeIn">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 bg-slate-50/75">
                                        {[
                                            { id: 'productName', label: 'Product' },
                                            { id: 'vendorLegalName', label: 'Vendor' },
                                            { id: 'purchasePrice', label: 'Price' },
                                            { id: 'stockStatus', label: 'Status' },
                                            { id: 'quantity', label: 'Qty' }
                                        ].map(col => (
                                            <th 
                                                key={col.id} 
                                                onClick={() => handleSort(col.id)}
                                                className={`${['productName', 'vendorLegalName'].includes(col.id) ? 'px-8' : 'px-4'} py-4 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {col.label.toUpperCase()}
                                                    {sortConfig.key === col.id && (
                                                        <span className="text-green-800 text-[10px]">{sortConfig.dir === 'asc' ? '▲' : '▼'}</span>
                                                    )}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="">
                                    {paginated.length > 0 ? (
                                        paginated.map((p) => (
                                            <tr key={p.id} onClick={() => navigate(`/vendors/products/${p.id}`)} className="bg-white even:bg-slate-50/50 hover:bg-green-50/30 transition-all duration-200 group cursor-pointer border-b border-slate-200 last:border-0">
                                                <td className="px-8 py-3.5 whitespace-nowrap bg-inherit border-b border-slate-200">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800 text-[14px] group-hover:text-green-800 transition-colors">{p.productName}</span>
                                                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{p.brand || 'No Brand'} • {p.category}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-3.5 whitespace-nowrap bg-inherit border-b border-slate-200">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800 text-[14px]">{p.vendorLegalName}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter mt-0.5">{p.vendorCode}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap bg-inherit border-b border-slate-200 font-bold text-slate-700">
                                                    ₹{p.purchasePrice ? p.purchasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap bg-inherit border-b border-slate-200">
                                                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border
                                                        ${p.quantity === 0 ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                          p.quantity < 10 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                          'bg-emerald-50 text-emerald-700 border-emerald-100'}
                                                    `}>
                                                        {p.stockStatus}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 whitespace-nowrap bg-inherit border-b border-slate-200 font-bold text-slate-700">
                                                    {p.quantity} {p.unitOfMeasure}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-24 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
                                                        <Package className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="text-[16px] font-medium text-slate-700">No active products match search filters</h3>
                                                    <button 
                                                        onClick={() => { setSearchTerm(''); setVendorFilter('All Vendors'); setCategoryFilter('All Categories'); }} 
                                                        className="text-green-800 text-[13px] font-bold hover:underline"
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
                )}

                {/* ── Pagination ── */}
                {viewMode === 'grid' && (
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
                                    className={`w-10 h-10 rounded-xl text-[12px] font-bold transition-all ${currentPage === i + 1 ? 'bg-green-800 text-white shadow-md shadow-green-100' : 'bg-white border border-slate-100 text-slate-400 hover:border-slate-300'}`}
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
                )}
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
                                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm"
                                    >
                                        <option value="" disabled>-- Select Supplier --</option>
                                        {vendors.map(v => (
                                            <option key={v.id} value={v.id}>{v.legalName} ({v.vendorCode})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="md:col-span-2 p-4 bg-green-50/50 border border-green-100 rounded-xl flex items-center gap-3">
                                <Building className="w-5 h-5 text-green-800" />
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
                                placeholder="e.g. AMUL-BUT-500"
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
                                    placeholder="0.00"
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
                                placeholder="e.g. Amul"
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
                                placeholder="e.g. 500g / 1 Litre / Pack of 12"
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
                                placeholder="e.g. 04051000"
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
                                placeholder="e.g. BTX-2023-A"
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
                                placeholder="Provide optional remarks, shelf life specifications, or packaging requirements..."
                                className="w-full p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl text-[13px] font-medium h-24 outline-none focus:border-green-800 focus:bg-white transition-all shadow-sm placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-50">
                        <SecondaryBtn onClick={() => setShowAddEditModal(false)}>Cancel</SecondaryBtn>
                        <PrimaryBtn onClick={handleFormSubmit} className="!bg-green-800 hover:!bg-green-950 shadow-md">
                            {modalMode === 'add' ? 'Confirm & Create' : 'Save Changes'}
                        </PrimaryBtn>
                    </div>
                </form>
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
                        <h3 className="text-lg font-medium text-slate-800 mb-1">Delete Catalog Product?</h3>
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

            {/* ── Slide-Over Vendor Details Drawer ── */}
            {activeDrawerVendor && (() => {
                const details = getVendorDetails(activeDrawerVendor, products);
                return (
                    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
                        <div className="absolute inset-0 overflow-hidden">
                            {/* Backdrop filter overlay */}
                            <div 
                                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out opacity-100"
                                onClick={() => setActiveDrawerVendor(null)}
                            />

                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                                <div className="pointer-events-auto w-screen max-w-md transform transition-all duration-300 ease-in-out sm:duration-300 translate-x-0">
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl border-l border-slate-100">
                                        
                                        {/* Drawer Header */}
                                        <div className="bg-gradient-to-br from-green-800 to-green-950 px-6 py-8 text-white relative">
                                            <button 
                                                onClick={() => setActiveDrawerVendor(null)}
                                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center transition-all text-lg font-bold"
                                            >
                                                ✕
                                            </button>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-extrabold text-green-300 uppercase tracking-widest">
                                                    Vendor Details
                                                </p>
                                                <h2 className="text-xl font-medium tracking-tight">{details.name}</h2>
                                                <p className="text-xs text-white/80 font-medium">
                                                    Code: {activeDrawerVendor.vendorCode || 'N/A'} • {activeDrawerVendor.category || 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Drawer Content */}
                                        <div className="flex-1 px-6 py-6 space-y-6 text-[13px] text-slate-600">
                                            
                                            {/* Contact Info Group */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Contact Information</h4>
                                                <div className="bg-slate-50 rounded-2xl p-4 space-y-3.5 border border-slate-100">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-400">Primary Contact</span>
                                                        <span className="font-bold text-slate-700">{details.name}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-400">Email Address</span>
                                                        <a href={`mailto:${details.email}`} className="font-bold text-green-700 hover:underline break-all max-w-[200px] text-right">{details.email}</a>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-400">Phone Number</span>
                                                        <span className="font-bold text-slate-700">{details.phone}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contract Metadata Group */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Contract Details</h4>
                                                <div className="bg-slate-50 rounded-2xl p-4 space-y-3.5 border border-slate-100">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-400">Contract Reference</span>
                                                        <span className="font-mono font-bold text-slate-700">{details.contractRef}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-400">Validity Period</span>
                                                        <span className="font-bold text-slate-700">{details.contractPeriod}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-400">Annual Value</span>
                                                        <span className="font-bold text-slate-700">{details.contractValue}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-400">Renewal Type</span>
                                                        <span className="font-bold text-slate-700">{details.renewalType}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Commercial Terms Group */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Commercial Terms</h4>
                                                <div className="bg-slate-50 rounded-2xl p-4 space-y-3.5 border border-slate-100">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-400">Payment Terms</span>
                                                        <span className="font-bold text-slate-700">{details.paymentTerms}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/40">
                                                        <span className="font-semibold text-slate-400">Early-Pay Discounts</span>
                                                        <span className="font-medium text-slate-600 bg-purple-50 text-purple-700 px-3 py-2 rounded-xl border border-purple-100/60 mt-1">
                                                            {details.earlyPayDiscount}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lead Times Group */}
                                            <div className="space-y-3">
                                                <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Lead Times</h4>
                                                <div className="grid grid-cols-3 gap-2.5">
                                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Standard</span>
                                                        <span className="block mt-1 font-bold text-slate-700">{details.leadTimes.standard}</span>
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Express</span>
                                                        <span className="block mt-1 font-bold text-green-700">{details.leadTimes.express}</span>
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Bulk Order</span>
                                                        <span className="block mt-1 font-bold text-slate-700">{details.leadTimes.bulk}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Catalogue Snapshot */}
                                            <div className="space-y-3 pb-8">
                                                <h4 className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Live Catalogue Snapshot</h4>
                                                <div className="bg-[#FAF5FF] border border-[#F3E8FF] rounded-2xl p-4.5 flex items-center justify-between">
                                                    <div className="text-center flex-1">
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Active SKUs</span>
                                                        <span className="block mt-1 text-lg font-extrabold text-slate-800">{details.snapshot.skus}</span>
                                                    </div>
                                                    <div className="w-px h-8 bg-purple-200/50" />
                                                    <div className="text-center flex-1">
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">In Stock</span>
                                                        <span className="block mt-1 text-lg font-extrabold text-emerald-700">{details.snapshot.inStock}</span>
                                                    </div>
                                                    <div className="w-px h-8 bg-purple-200/50" />
                                                    <div className="text-center flex-1">
                                                        <span className="block text-[10px] font-bold text-slate-400 uppercase">Out of Stock</span>
                                                        <span className="block mt-1 text-lg font-extrabold text-rose-600">{details.snapshot.outOfStock}</span>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
