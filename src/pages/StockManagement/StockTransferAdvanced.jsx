import React, { useState, useEffect } from 'react';
import {
    Search,
    ArrowRightLeft,
    Calendar,
    Filter,
    Store,
    Package,
    Truck,
    AlertCircle,
    Plus,
    History,
    TrendingUp,
    Clock,
    FileText,
    CheckCircle2
} from 'lucide-react';
import {
    PageHeader,
    VCard,
    SectionTitle,
    PrimaryBtn,
    SecondaryBtn,
    VendorBreadcrumb,
    StatusBadge
} from '../Vendors/VendorComponents';
import toast from 'react-hot-toast';
import { fetchSTOs, createSTO, updateSTOStatus, fetchProducts } from '../../api/vendorService';
import useAuthStore from '../../store/useAuthStore';

const STORES = ['Main Warehouse', 'Downtown Store', 'Suburb Outlet', 'Airport Hub', 'Regional Distribution Center'];
const TRANSFER_MODES = ['Own Vehicle', 'Third-party Logistics', 'Manual Carry (small items)'];
const PRIORITIES = ['Normal', 'Urgent', 'Critical'];

export default function StockTransferAdvanced() {
    // Search & Filter State
    const [searchSKU, setSearchSKU] = useState('');
    const [sourceStoreFilter, setSourceStoreFilter] = useState('All Stores (auto-identify surplus)');
    const [destStoreFilter, setDestStoreFilter] = useState('All Stores (auto-identify shortage)');
    const [varianceThreshold, setVarianceThreshold] = useState('10');
    const [dateRange, setDateRange] = useState('This Month');

    // Creation Form State
    const [sourceStore, setSourceStore] = useState('');
    const [destStore, setDestStore] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchProductQuery, setSearchProductQuery] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [transferQty, setTransferQty] = useState('');
    const [transferDate, setTransferDate] = useState('');
    const [transferMode, setTransferMode] = useState('');
    const [priority, setPriority] = useState('Normal');
    const [notes, setNotes] = useState('');
    const [stos, setStos] = useState([]);
    const [products, setProducts] = useState([]);

    const { user } = useAuthStore();

    useEffect(() => {
        loadSTOs();
        loadProducts();
    }, []);

    const loadSTOs = () => {
        fetchSTOs()
            .then(res => {
                const list = Array.isArray(res.data || res) ? (res.data || res) : [];
                setStos(list);
            })
            .catch(err => {
                console.error("Failed to load STOs from backend", err);
            });
    };

    const loadProducts = () => {
        fetchProducts()
            .then(res => {
                const list = Array.isArray(res.data || res) ? (res.data || res) : [];
                setProducts(list);
            })
            .catch(err => {
                console.error("Failed to load products from backend", err);
            });
    };

    const handleCreateSTO = () => {
        if (!sourceStore || !destStore || !transferQty || !selectedProduct) {
            toast.error('Please fill in all mandatory fields (*) and select a product');
            return;
        }

        if (sourceStore === destStore) {
            toast.error('Source and Destination stores cannot be the same');
            return;
        }

        const qty = parseFloat(transferQty);
        if (isNaN(qty) || qty <= 0) {
            toast.error('Transfer quantity must be a positive number');
            return;
        }

        createSTO({
            productId: selectedProduct.id,
            sourceBranchName: sourceStore,
            destBranchName: destStore,
            transferQuantity: qty,
            transferDate: transferDate || new Date().toISOString().split('T')[0],
            transferMode: transferMode || 'Own Vehicle',
            priority: priority,
            capitalSaved: 0
        }, user?.id)
        .then(() => {
            toast.success('STO saved to Spring Boot database! 🚀');
            setTransferQty('');
            setNotes('');
            setSelectedProduct(null);
            setSearchProductQuery('');
            loadSTOs();
        })
        .catch(err => {
            console.error("Failed to create STO in backend", err);
            toast.error(err.response?.data?.message || 'Failed to create STO in backend');
        });
    };

    const handleUpdateStatus = (id, newStatus) => {
        updateSTOStatus(id, newStatus, user?.id)
            .then(() => {
                toast.success(`STO updated to ${newStatus}! ✅`);
                loadSTOs();
            })
            .catch(err => {
                console.error("Failed to update STO status", err);
                toast.error(err.response?.data?.message || "Failed to update status on server");
            });
    };

    const filteredSTOs = stos.filter(sto => {
        // Filter by SKU / Product Name
        if (searchSKU && !sto.productName?.toLowerCase().includes(searchSKU.toLowerCase())) {
            return false;
        }
        // Filter by Source Store
        if (sourceStoreFilter !== 'All Stores (auto-identify surplus)' && sto.sourceBranchName !== sourceStoreFilter) {
            return false;
        }
        // Filter by Destination Store
        if (destStoreFilter !== 'All Stores (auto-identify shortage)' && sto.destBranchName !== destStoreFilter) {
            return false;
        }
        return true;
    });

    const breadcrumbs = [
        { label: 'Inventory', path: '/inventory' },
        { label: 'Stock Management', path: '#' },
        { label: 'Inter-Store Transfer' }
    ];

    return (
        <div className="w-full bg-[#F8FAFC] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <PageHeader
                title="Inter-Store Stock Transfer (STO) Screen"
                subtitle="Comparison dashboard for identifying surplus/shortage across stores with one-click STO generation."
                badge="High Performance"
            />

            {/* SECTION 1: STO SEARCH & FILTER CONTROLS */}
            <VCard className="mb-6">
                <SectionTitle>STO Search & Filter Controls</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                    {/* Search / Product */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search STO Product</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter log by product..."
                                className="w-full pl-9 pr-4 py-2.5 text-[12px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                value={searchSKU}
                                onChange={e => setSearchSKU(e.target.value)}
                            />
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium leading-tight">Filters active transfers table dynamically</p>
                    </div>

                    {/* Source Store */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source Store</label>
                        <div className="relative">
                            <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                className="w-full pl-9 pr-4 py-2.5 text-[12px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all appearance-none"
                                value={sourceStoreFilter}
                                onChange={e => setSourceStoreFilter(e.target.value)}
                            >
                                <option>All Stores (auto-identify surplus)</option>
                                {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Destination Store */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Destination Store</label>
                        <div className="relative">
                            <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                className="w-full pl-9 pr-4 py-2.5 text-[12px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all appearance-none"
                                value={destStoreFilter}
                                onChange={e => setDestStoreFilter(e.target.value)}
                            >
                                <option>All Stores (auto-identify shortage)</option>
                                {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Stock Variance Threshold */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Variance Threshold</label>
                        <div className="relative">
                            <TrendingUp size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="number"
                                className="w-full pl-9 pr-4 py-2.5 text-[12px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                value={varianceThreshold}
                                onChange={e => setVarianceThreshold(e.target.value)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium leading-tight">Min surplus % above max level to flag for STO</p>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Range</label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                className="w-full pl-9 pr-4 py-2.5 text-[12px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all appearance-none"
                                value={dateRange}
                                onChange={e => setDateRange(e.target.value)}
                            >
                                <option>This Month</option>
                                <option>Last Month</option>
                                <option>Last 90 Days</option>
                                <option>Custom Range</option>
                            </select>
                        </div>
                    </div>
                </div>
            </VCard>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Comparison Dashboard (Visual Aid) */}
                <div className="lg:col-span-4 space-y-6">
                    <VCard className="h-full bg-slate-900 text-white border-0">
                        <div className="flex items-center justify-between mb-6">
                            <SectionTitle><span className="text-slate-400">Comparison Dashboard</span></SectionTitle>
                            <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-lg animate-pulse">LIVE ANALYTICS</span>
                        </div>

                        <div className="space-y-6">
                            {STORES.map((s, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase ">{i === 0 ? 'Surplus Source' : i === 1 ? 'Target Destination' : 'Balanced'}</div>
                                            <div className="text-[13px] font-bold group-hover:text-blue-400 transition-colors">{s}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-[15px] font-extrabold ${i === 0 ? 'text-emerald-400' : i === 1 ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {i === 0 ? '+142' : i === 1 ? '-58' : '405'}
                                            </div>
                                            <div className="text-[8px] font-bold text-slate-500">UNITS</div>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-emerald-500 w-[95%]' : i === 1 ? 'bg-rose-500 w-[20%]' : 'bg-slate-600 w-[60%]'}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden">
                            {/* Header strip */}
                            <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm">💡</div>
                                <div>
                                    <div className="text-[11px] font-bold text-white uppercase  leading-none">Smart Recommendation</div>
                                    <div className="text-[9px] text-blue-200 font-bold mt-0.5">AI-Optimised Transfer Suggestion</div>
                                </div>
                                <span className="ml-auto px-2 py-0.5 bg-white/20 text-white text-[9px] font-bold rounded-full uppercase tracking-wider border border-white/30">Auto</span>
                            </div>

                            {/* Body */}
                            <div className="px-5 py-4 text-slate-900">
                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="text-center p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                                        <div className="text-[18px] font-bold text-blue-700 leading-none">60</div>
                                        <div className="text-[8px] font-bold text-blue-500 uppercase tracking-wider mt-1">Units</div>
                                    </div>
                                    <div className="text-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="text-[9px] font-bold text-slate-700 leading-tight">Main Warehouse</div>
                                        <div className="text-[7px] font-bold text-slate-400 uppercase tracking-wider mt-1">Source</div>
                                    </div>
                                    <div className="text-center p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <div className="text-[9px] font-bold text-emerald-700 leading-tight">Downtown</div>
                                        <div className="text-[7px] font-bold text-emerald-500 uppercase tracking-wider mt-1">Destination</div>
                                    </div>
                                </div>

                                {/* Recommendation text */}
                                <p className="text-[11px] text-slate-500 leading-relaxed font-bold mb-1">
                                    Moving <span className="text-slate-800">60 units</span> from <span className="text-slate-800">Main Warehouse</span> → <span className="text-slate-800">Downtown Store</span>
                                </p>
                                <div className="flex items-center gap-1.5 mb-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="text-[11px] font-bold text-emerald-600">Optimises delivery latency by 14%</span>
                                </div>

                                <button
                                    onClick={() => {
                                        setSourceStore('Main Warehouse');
                                        setDestStore('Downtown Store');
                                        setTransferQty('60');
                                        if (products.length > 0) {
                                            const p = products[0];
                                            setSelectedProduct(p);
                                            setSearchProductQuery(`${p.name} (${p.sku})`);
                                        }
                                        toast.success('Suggestion applied! STO pre-filled.');
                                    }}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-all uppercase  shadow-sm hover:shadow-md hover:shadow-blue-100">
                                    Apply Suggestion
                                </button>
                            </div>
                        </div>
                    </VCard>
                </div>

                {/* STO Creation Form */}
                <div className="lg:col-span-8">
                    <VCard>
                        <SectionTitle>STO Creation Form</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            {/* Source Store */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Source Store <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all appearance-none"
                                        value={sourceStore}
                                        onChange={e => setSourceStore(e.target.value)}
                                    >
                                        <option value="">Select Store with surplus...</option>
                                        {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic">Pre-filled from comparison view; editable</p>
                            </div>

                            {/* Destination Store */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Destination Store <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all appearance-none"
                                        value={destStore}
                                        onChange={e => setDestStore(e.target.value)}
                                    >
                                        <option value="">Select Store with shortage...</option>
                                        {STORES.filter(s => s !== sourceStore).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic">Cannot be same as source store</p>
                            </div>

                            {/* Searchable Product Autocomplete Dropdown */}
                            <div className="space-y-2 relative">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Select Catalog Product <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search product by name or SKU..."
                                        className="w-full pl-9 pr-24 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                        value={searchProductQuery}
                                        onChange={e => {
                                            setSearchProductQuery(e.target.value);
                                            setShowProductDropdown(true);
                                        }}
                                        onFocus={() => setShowProductDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                                    />
                                    {selectedProduct && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setSelectedProduct(null);
                                                setSearchProductQuery('');
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-2 py-1 rounded-lg"
                                        >
                                            Clear Selection
                                        </button>
                                    )}
                                </div>

                                {showProductDropdown && (
                                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl divide-y divide-slate-50">
                                        {products.filter(p => 
                                            p.name?.toLowerCase().includes(searchProductQuery.toLowerCase()) || 
                                            p.sku?.toLowerCase().includes(searchProductQuery.toLowerCase())
                                        ).length === 0 ? (
                                            <div className="p-4 text-center text-[12px] text-slate-400 font-bold italic">
                                                No matching products found.
                                            </div>
                                        ) : (
                                            products.filter(p => 
                                                p.name?.toLowerCase().includes(searchProductQuery.toLowerCase()) || 
                                                p.sku?.toLowerCase().includes(searchProductQuery.toLowerCase())
                                            ).map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedProduct(p);
                                                        setSearchProductQuery(`${p.name} (${p.sku})`);
                                                        setShowProductDropdown(false);
                                                    }}
                                                    className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center"
                                                >
                                                    <div>
                                                        <div className="text-[12px] font-bold text-slate-800">{p.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} | HSN: {p.hsnCode || 'N/A'}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[11px] font-extrabold text-blue-600">Stock: {p.currentStock || 0}</div>
                                                        <div className="text-[9px] text-slate-400 uppercase font-bold">MRP: ₹{p.mrp || 0}</div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-400 font-medium italic">Dynamically loaded from Spring Boot catalog</p>
                            </div>

                            {/* Transfer Quantity */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Transfer Quantity <span className="text-rose-500">*</span></label>
                                <input
                                    type="number"
                                    placeholder="Units to transfer..."
                                    className="w-full px-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                    value={transferQty}
                                    onChange={e => setTransferQty(e.target.value)}
                                />
                                <p className="text-[10px] text-emerald-500 font-bold italic leading-tight">Checks bin and store capacity limits automatically</p>
                            </div>

                            {/* Transfer Date */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Transfer Date <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="date"
                                        className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                        value={transferDate}
                                        onChange={e => setTransferDate(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic">Defaults to today's date if left empty</p>
                            </div>

                            {/* Transfer Mode */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Transfer Mode <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all appearance-none"
                                        value={transferMode}
                                        onChange={e => setTransferMode(e.target.value)}
                                    >
                                        <option value="">Select mode...</option>
                                        {TRANSFER_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Priority</label>
                                <div className="flex gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    {PRIORITIES.map(p => (
                                        <label key={p} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="radio"
                                                name="priority"
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                                checked={priority === p}
                                                onChange={() => setPriority(p)}
                                            />
                                            <span className={`text-[12px] font-bold transition-colors ${priority === p ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`}>{p}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic">Critical flags logistics team; Urgent requires supervisor review</p>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Notes</label>
                                <div className="relative">
                                    <FileText size={14} className="absolute left-3 top-4 text-slate-400" />
                                    <textarea
                                        placeholder="Transfer instructions..."
                                        rows={3}
                                        className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all resize-none"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic">Max 200 chars; visible to both stores</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-50 flex justify-end gap-3">
                            <SecondaryBtn onClick={() => {
                                setSourceStore('');
                                setDestStore('');
                                setSelectedProduct(null);
                                setSearchProductQuery('');
                                setTransferQty('');
                                setNotes('');
                            }} className="px-8">Reset Form</SecondaryBtn>
                            <PrimaryBtn onClick={handleCreateSTO} className="px-12" icon={<ArrowRightLeft size={16} />}>
                                Confirm & Create STO
                            </PrimaryBtn>
                        </div>
                    </VCard>
                </div>
            </div>

            {/* SECTION 3: ACTIVE TRANSFERS LOG */}
            <div className="mt-8">
                <VCard>
                    <div className="flex items-center justify-between mb-4">
                        <SectionTitle>Active Stock Transfer Orders (STO) Log</SectionTitle>
                        <span className="text-[10px] font-bold bg-[#1e293b] text-white px-2 py-0.5 rounded-lg border border-slate-700">REALTIME SYNCED</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="py-3 px-4 text-[10px] font-extrabold uppercase text-slate-400">STO Number</th>
                                    <th className="py-3 px-4 text-[10px] font-extrabold uppercase text-slate-400">Source Store</th>
                                    <th className="py-3 px-4 text-[10px] font-extrabold uppercase text-slate-400">Dest Store</th>
                                    <th className="py-3 px-4 text-[10px] font-extrabold uppercase text-slate-400">Product Name</th>
                                    <th className="py-3 px-4 text-[10px] font-extrabold uppercase text-slate-400">Qty</th>
                                    <th className="py-3 px-4 text-[10px] font-extrabold uppercase text-slate-400">Priority</th>
                                    <th className="py-3 px-4 text-[10px] font-extrabold uppercase text-slate-400">Status</th>
                                    <th className="py-3 px-4 text-[10px] font-extrabold uppercase text-slate-400 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSTOs.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="py-8 text-center text-[12px] text-slate-400 font-bold italic">
                                            No active stock transfer orders found in backend database matching current search filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSTOs.map((sto) => (
                                        <tr key={sto.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-4 text-[11px] font-bold text-blue-600 font-mono">
                                                {sto.stoNumber || (sto.id ? sto.id.substring(0, 8).toUpperCase() : 'PENDING')}
                                            </td>
                                            <td className="py-4 px-4 text-[12px] font-bold text-slate-700">{sto.sourceBranchName}</td>
                                            <td className="py-4 px-4 text-[12px] font-bold text-slate-700">{sto.destBranchName}</td>
                                            <td className="py-4 px-4 text-[11px] font-bold text-slate-600">{sto.productName || 'Unknown Product'}</td>
                                            <td className="py-4 px-4 text-[12px] font-extrabold text-slate-800">{sto.transferQuantity}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase ${
                                                    sto.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    sto.priority === 'Urgent' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                    {sto.priority}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border uppercase ${
                                                    sto.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    sto.status === 'IN_TRANSIT' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    sto.status === 'DRAFT' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {sto.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                {sto.status === 'DRAFT' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(sto.id, 'IN_TRANSIT')}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg uppercase shadow-sm transition-all animate-pulse"
                                                    >
                                                        Dispatch
                                                    </button>
                                                )}
                                                {sto.status === 'IN_TRANSIT' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(sto.id, 'RECEIVED')}
                                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg uppercase shadow-sm transition-all"
                                                    >
                                                        Receive
                                                    </button>
                                                )}
                                                {sto.status === 'RECEIVED' && (
                                                    <span className="text-[10px] font-bold text-slate-400 italic">Completed</span>
                                                )}
                                                {sto.status !== 'DRAFT' && sto.status !== 'IN_TRANSIT' && sto.status !== 'RECEIVED' && (
                                                    <span className="text-[10px] font-bold text-slate-400 italic">{sto.status}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </VCard>
            </div>
        </div>
    );
}
