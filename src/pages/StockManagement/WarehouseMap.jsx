import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Map as MapIcon, Layers, Grid as GridIcon, Package, ArrowRightLeft,
    AlertTriangle, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search,
    Filter, Box, Info, Navigation, Activity, TrendingDown, TrendingUp, ThermometerSnowflake
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createWarehouseEntity, updateWarehouseEntity, fetchUsers } from '../../api/vendorService';
import { PageHeader, VCard, SectionTitle, PrimaryBtn, SecondaryBtn, StatusBadge, VModal } from '../Vendors/VendorComponents';
import useBranchStore from '../../store/useBranchStore';

// Removed Mocks
const DEFAULT_CATEGORIES = [
    { id: 'CAT1', name: 'Dairy', color: '#10b981' },
    { id: 'CAT2', name: 'Beverages', color: '#f59e0b' },
    { id: 'CAT3', name: 'Frozen Foods', color: '#84cc16' },
    { id: 'CAT4', name: 'Packaged Foods', color: '#14b8a6' },
    { id: 'CAT5', name: 'Fresh Produce', color: '#f97316' },
];

const sanitizeCategories = (cats) => {
    const loaded = cats && cats.length > 0 ? cats : DEFAULT_CATEGORIES;
    return loaded.map((cat, idx) => {
        const isLegacyColor = !cat.color || 
            ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
             '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
             '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
             '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'
            ].includes(cat.color.toLowerCase());
        
        if (isLegacyColor) {
            const beautifulColors = ['#10b981', '#f59e0b', '#84cc16', '#14b8a6', '#f97316', '#0d9488', '#22c55e', '#eab308'];
            return {
                ...cat,
                color: beautifulColors[idx % beautifulColors.length]
            };
        }
        return cat;
    });
};

export default function WarehouseMap() {
    const [activeTab, setActiveTab] = useState('MAPPING');

    // System State
    const [categories, setCategories] = useState([]);
    const [racks, setRacks] = useState([]);
    const [products, setProducts] = useState([]);
    const [stock, setStock] = useState([]);
    const [movements, setMovements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);


    const { branches: supermarkets, fetchBranches, updateBranch } = useBranchStore();

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                await fetchBranches();
                const [cats, rks, prods, stk, movs, whRes] = await Promise.all([
                    import('../../api/vendorService').then(m => m.fetchWarehouseCategories()),
                    import('../../api/vendorService').then(m => m.fetchWarehouseRacks()),
                    import('../../api/vendorService').then(m => m.fetchWarehouseProducts()),
                    import('../../api/vendorService').then(m => m.fetchWarehouseStock()),
                    import('../../api/vendorService').then(m => m.fetchWarehouseMovements()),
                    import('../../api/vendorService').then(m => m.fetchWarehouseEntities())
                ]);
                setCategories(sanitizeCategories(cats));
                setRacks(rks || []);
                setProducts(prods || []);
                setStock(stk || []);
                setMovements(movs || []);
                
                const warehousesList = Array.isArray(whRes?.data ?? whRes) ? (whRes?.data ?? whRes) : [];
                
                if (warehousesList.length > 0) {
                    setWarehouses(warehousesList);
                    setSelectedMappingWarehouseId(warehousesList[0].id);
                }
            } catch (err) {
                console.error("Failed to load warehouse data:", err);
                toast.error("Failed to load warehouse data.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [fetchBranches]);

    // UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
    const [is3D, setIs3D] = useState(false);
    const [selectedRack, setSelectedRack] = useState(null);
    const [activeDropdownRackId, setActiveDropdownRackId] = useState(null);
    const [productPage, setProductPage] = useState(1);
    const [isAddingRack, setIsAddingRack] = useState(false);
    const [newRackId, setNewRackId] = useState('');
    const [newRackCategoryId, setNewRackCategoryId] = useState(null);

    
    const [isRackDropdownOpen, setIsRackDropdownOpen] = useState(false);
    const [rackSearchQuery, setRackSearchQuery] = useState('');

    // Update Forms State
    const [stockUpdateForm, setStockUpdateForm] = useState({ rackId: '', productId: '', type: 'IN', quantity: '' });

    // Warehouse Mapping State
    const [warehouses, setWarehouses] = useState([]);
    
    const [warehouseMapping, setWarehouseMapping] = useState({});
    const [selectedMappingWarehouseId, setSelectedMappingWarehouseId] = useState('');

    const handleToggleSupermarket = (whId, smId) => {
        setWarehouseMapping(prev => {
            const currentList = prev[whId] || [];
            if (currentList.includes(smId)) {
                return { ...prev, [whId]: currentList.filter(id => id !== smId) };
            } else {
                return { ...prev, [whId]: [...currentList, smId] };
            }
        });
        toast.success('Mapping updated');
    };

    // ─────────────────────────────────────────────────────────────────
    // Derived Data & Helpers
    // ─────────────────────────────────────────────────────────────────
    
    const getCategoryById = (id) => categories.find(c => c.id === id);
    const getProductById = (id) => products.find(p => p.id === id);
    const getRackById = (id) => racks.find(r => r.id === id);

    const getRackStock = (rackId) => stock.filter(s => s.rackId === rackId);

    // ─────────────────────────────────────────────────────────────────
    // Actions
    // ─────────────────────────────────────────────────────────────────

    const handleStockUpdate = async (e) => {
        e.preventDefault();
        const { rackId, productId, type, quantity } = stockUpdateForm;
        const qty = parseInt(quantity, 10);
        
        if (!rackId || !productId || isNaN(qty) || qty <= 0) {
            toast.error("Please fill all fields with valid data.");
            return;
        }

        try {
            const { adjustWarehouseStock } = await import('../../api/vendorService');
            const updatedStock = await adjustWarehouseStock({ rackId: rackId, productId: productId, type, quantity: qty });
            toast.success(`Stock ${type === 'IN' ? 'added to' : 'removed from'} rack successfully!`);
            setStockUpdateForm({ ...stockUpdateForm, quantity: '' });
            
            // Refresh stock & movements
            const { fetchWarehouseStock, fetchWarehouseMovements } = await import('../../api/vendorService');
            setStock(await fetchWarehouseStock());
            setMovements(await fetchWarehouseMovements());
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to adjust stock.");
        }
    };

    const handleRackCategoryChange = async (rackId, newCategoryId) => {
        try {
            const { updateWarehouseRackCategory, fetchWarehouseRacks } = await import('../../api/vendorService');
            await updateWarehouseRackCategory(rackId, newCategoryId);
            toast.success("Rack category updated.");
            setRacks(await fetchWarehouseRacks());
        } catch (err) {
            toast.error("Failed to update rack category.");
        }
    };
    const handleAddRack = () => {
        setIsAddingRack(true);
        setNewRackId('');
        setNewRackCategoryId(null);
    };

    const handleSaveNewRack = async () => {
        if (!newRackId) return;
        try {
            const { createWarehouseRack, fetchWarehouseRacks } = await import('../../api/vendorService');
            await createWarehouseRack({ id: newRackId, categoryId: newRackCategoryId });
            toast.success("Rack created successfully.");
            setRacks(await fetchWarehouseRacks());
            setIsAddingRack(false);
            setNewRackId('');
            setNewRackCategoryId(null);
        } catch (err) {
            toast.error("Failed to create rack.");
        }
    };


    // ─────────────────────────────────────────────────────────────────
    // Renders
    // ─────────────────────────────────────────────────────────────────

    const renderTabs = () => {
        const tabs = [
            { id: 'MAPPING', label: 'Warehouse Mapping', icon: Navigation },
            { id: 'MAP', label: 'Floor Map', icon: MapIcon },
            { id: 'CATEGORIES', label: 'Categories', icon: Layers },
            { id: 'RACKS', label: 'Rack Setup', icon: GridIcon },
            { id: 'PRODUCTS', label: 'Product Catalog', icon: Package },
            { id: 'STOCK_UPDATE', label: 'Stock Movements', icon: ArrowRightLeft },
            { id: 'LOW_STOCK', label: 'Low Stock Report', icon: AlertTriangle },
        ];

        return (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all flex items-center whitespace-nowrap border ${
                            activeTab === tab.id 
                            ? 'bg-[#e2f5e3] text-slate-800 border-[#bbf7d0] shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        <tab.icon size={16} className={`mr-2 ${activeTab === tab.id ? 'text-[#166534]' : 'text-slate-400'}`} /> 
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    };

    const renderMap = () => {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <VCard className="relative overflow-hidden border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <SectionTitle>Interactive Floor Map</SectionTitle>
                            <p className="text-[13px] text-slate-500 mt-1">Visualize racks grouped by their assigned categories.</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIs3D(!is3D)}
                                className={`px-4 py-2 border rounded-xl text-[12px] font-bold flex items-center gap-2 transition-all shadow-sm ${
                                    is3D 
                                    ? 'bg-[#e2f5e3] border-[#bbf7d0] text-[#166534]' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Box size={16} className={is3D ? 'text-[#166534]' : 'text-slate-400'} />
                                {is3D ? '3D View Active' : '2D View Active'}
                            </button>
                            {/* Legend preview */}
                            <div className="flex bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 items-center gap-4">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Categories Legend</span>
                                <div className="flex -space-x-2">
                                    {categories.slice(0, 5).map(c => (
                                        <div key={c.id} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c.color }} title={c.name} />
                                    ))}
                                    {categories.length > 5 && <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">+{categories.length - 5}</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="bg-[#f8fafc] p-8 rounded-2xl border-2 border-dashed border-slate-200 min-h-[500px] flex items-center justify-center"
                        style={{ perspective: '1500px' }}
                    >
                        <div 
                            className="grid grid-cols-8 gap-4 max-w-5xl mx-auto transition-transform duration-700 ease-out w-full"
                            style={is3D ? {
                                transform: 'rotateX(55deg) rotateZ(-45deg) scale(0.85)',
                                transformStyle: 'preserve-3d'
                            } : {
                                transform: 'rotateX(0deg) rotateZ(0deg) scale(1)',
                                transformStyle: 'flat'
                            }}
                        >
                            {racks.map((rack, idx) => {
                                const cat = getCategoryById(rack.categoryId);
                                const rackStock = getRackStock(rack.id);
                                const isHighlighted = searchQuery && (rack.id.toLowerCase().includes(searchQuery.toLowerCase()) || (cat?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
                                const isSelected = selectedRack === rack.id;

                                return (
                                    <motion.div
                                        key={rack.id}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ 
                                            opacity: 1, 
                                            scale: isSelected ? 1.15 : 1,
                                            z: is3D ? (isSelected ? 30 : 0) : 0
                                        }}
                                        whileHover={{ 
                                            scale: 1.05, 
                                            z: is3D ? 15 : 0 
                                        }}
                                        transition={{ delay: idx * 0.005, type: "spring", stiffness: 300, damping: 20 }}
                                        onClick={() => setSelectedRack(isSelected ? null : rack.id)}
                                        className={`group relative aspect-square rounded-xl transition-colors duration-300 cursor-pointer flex flex-col items-center justify-center border-2
                                            ${isSelected ? 'border-green-300 z-50 ring-4 ring-green-500 ring-offset-2 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'border-white/20 hover:z-50 hover:shadow-2xl'}
                                            ${isHighlighted && !isSelected ? 'ring-4 ring-[#166534] ring-offset-2 animate-pulse' : ''}
                                            ${is3D && !isSelected ? 'shadow-[3px_3px_6px_rgba(0,0,0,0.2)]' : 'shadow-sm'}`}
                                        style={{ 
                                            backgroundColor: isSelected ? '#22c55e' : (cat ? cat.color : ['#10b981', '#f59e0b', '#84cc16', '#14b8a6', '#f97316'][idx % 5]),
                                            transformStyle: 'preserve-3d'
                                        }}
                                    >
                                        {/* Top face content floating on Z-axis in 3D */}
                                        <div 
                                            className="flex flex-col items-center justify-center w-full h-full relative"
                                            style={{ 
                                                transform: is3D ? 'translateZ(20px)' : 'none', 
                                                transformStyle: 'preserve-3d' 
                                            }}
                                        >
                                            <div className="text-white font-extrabold text-[12px] drop-shadow-md z-10">{rack.id}</div>
                                            {cat && (
                                                <div className="text-white/90 font-bold text-[9px] uppercase tracking-wider drop-shadow-md z-10 mt-0.5 truncate px-2 text-center max-w-full">
                                                    {cat.name}
                                                </div>
                                            )}
                                            {rackStock.length > 0 && (
                                                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white z-10 shadow-sm" title="Contains Stock"></div>
                                            )}
                                        </div>

                                        {/* 3D Side Shadows */}
                                        {is3D && (
                                            <>
                                                {/* Left Side Face */}
                                                <div 
                                                    className="absolute bottom-0 left-0 right-0 h-[20px] origin-bottom transition-colors duration-300"
                                                    style={{
                                                        backgroundColor: 'rgba(0,0,0,0.15)',
                                                        transform: 'rotateX(-90deg)',
                                                        transformOrigin: 'bottom',
                                                        borderRadius: '0 0 8px 8px'
                                                    }}
                                                />
                                                {/* Right Side Face */}
                                                <div 
                                                    className="absolute top-0 bottom-0 right-0 w-[20px] origin-right transition-colors duration-300"
                                                    style={{
                                                        backgroundColor: 'rgba(0,0,0,0.25)',
                                                        transform: 'rotateY(90deg)',
                                                        transformOrigin: 'right',
                                                        borderRadius: '0 8px 8px 0'
                                                    }}
                                                />
                                            </>
                                        )}
                                        
                                        {/* Hover Tooltip */}
                                        <div 
                                            className="absolute left-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100] w-48"
                                            style={{
                                                top: '-6rem',
                                                transform: is3D ? 'translateX(-50%) rotateZ(45deg) rotateX(-55deg) translateY(-40px) translateZ(30px)' : 'translateX(-50%)'
                                            }}
                                        >
                                            <div className="bg-[#0f172a] text-white p-3 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-1 backdrop-blur-md">
                                                <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-1.5">
                                                    <span className="font-extrabold text-[12px]">{rack.id}</span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 font-bold">{cat?.name || 'Unassigned'}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {rackStock.length > 0 ? rackStock.map(s => {
                                                        const p = getProductById(s.productId);
                                                        return (
                                                            <div key={s.productId} className="flex justify-between text-[11px]">
                                                                <span className="text-slate-300 truncate max-w-[100px]">{p?.productName}</span>
                                                                <span className="font-bold text-[#166534]">{s.quantity} {p?.unitOfMeasure}</span>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <div className="text-[11px] text-slate-500 italic text-center py-1">Empty Rack</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-3 h-3 bg-[#0f172a] rotate-45 mx-auto -mt-1.5 border-r border-b border-white/10"></div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </VCard>
            </motion.div>
        );
    };

    const renderCategories = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <VCard>
                <div className="flex justify-between items-center mb-6">
                    <SectionTitle>Category Management</SectionTitle>
                    <PrimaryBtn icon={<Plus size={16} />}>Add Category</PrimaryBtn>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories.map(cat => {
                        const racksAssigned = racks.filter(r => r.categoryId === cat.id).length;
                        return (
                            <div key={cat.id} className="p-4 rounded-2xl border border-slate-100 hover:shadow-lg transition-all bg-white group flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl shadow-inner flex-shrink-0 border-2 border-white" style={{ backgroundColor: cat.color }} />
                                <div className="flex-1">
                                    <h4 className="font-bold text-[14px] text-slate-800 leading-tight mb-1">{cat.name}</h4>
                                    <div className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 inline-block px-2 py-0.5 rounded-md">
                                        {racksAssigned} Racks Assigned
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </VCard>
        </motion.div>
    );

    const renderRacks = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <VCard>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <SectionTitle>Rack Setup & Mapping</SectionTitle>
                        <button 
                            onClick={handleAddRack}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#166534] text-white text-[12px] font-bold rounded-lg hover:bg-[#14532d] transition-colors"
                        >
                            + Add Rack
                        </button>
                    </div>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search Racks..." 
                            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-[#bbf7d0] w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-slate-200 shadow-sm bg-white min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                                <th className="p-5 w-1/3">Rack ID</th>
                                <th className="p-5 w-2/3">Assigned Category</th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px]">
                            {isAddingRack && (
                                <tr className="border-b border-slate-100 bg-[#e2f5e3]/30 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white text-slate-500 flex items-center justify-center border border-slate-200">
                                                <GridIcon size={16} />
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Enter Rack ID (e.g. R-01)" 
                                                value={newRackId}
                                                onChange={(e) => setNewRackId(e.target.value)}
                                                autoFocus
                                                className="px-3 py-2 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-[#bbf7d0] font-bold"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex gap-4 justify-between items-center">
                                            <div className="relative flex-1">
                                                <select 
                                                    value={newRackCategoryId || ''}
                                                    onChange={(e) => setNewRackCategoryId(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 hover:border-[#bbf7d0] rounded-xl px-3 py-2 text-[13px] font-bold text-slate-700 outline-none"
                                                >
                                                    <option value="" disabled>Select Category (Optional)</option>
                                                    {categories.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button 
                                                    onClick={() => setIsAddingRack(false)}
                                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg hover:bg-slate-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={handleSaveNewRack}
                                                    className="px-4 py-2 bg-[#166534] text-white text-[12px] font-bold rounded-lg hover:bg-[#14532d] transition-colors shadow-sm"
                                                >
                                                    Save Rack
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {racks.filter(r => r.id.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20).map(rack => {
                                const cat = getCategoryById(rack.categoryId);
                                return (
                                    <tr key={rack.id} className="border-b border-slate-100 hover:bg-[#e2f5e3]/30 transition-colors group">
                                        <td className="p-5 font-extrabold text-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 group-hover:bg-[#e2f5e3] group-hover:text-[#166534] group-hover:border-[#bbf7d0] transition-colors">
                                                    <GridIcon size={16} />
                                                </div>
                                                {rack.id}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="relative w-[220px]">
                                                <button 
                                                    onClick={() => setActiveDropdownRackId(activeDropdownRackId === rack.id ? null : rack.id)}
                                                    className={`flex items-center w-full bg-white border ${activeDropdownRackId === rack.id ? 'border-[#bbf7d0] ring-4 ring-[#e2f5e3]/20' : 'border-slate-200 hover:border-[#bbf7d0]'} rounded-xl px-3 py-2 shadow-sm transition-all text-left outline-none`}
                                                >
                                                    <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm mr-2.5" style={{ backgroundColor: cat?.color }}></div>
                                                    <span className="font-bold text-slate-700 text-[13px] flex-1 truncate">{cat?.name || 'Select Category'}</span>
                                                    <div className={`text-slate-400 transition-transform duration-200 ${activeDropdownRackId === rack.id ? 'rotate-180 text-[#166534]' : ''}`}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                    </div>
                                                </button>

                                                <AnimatePresence>
                                                    {activeDropdownRackId === rack.id && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 5 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1.5"
                                                        >
                                                            <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 px-1">
                                                                {categories.map(c => (
                                                                    <button
                                                                        key={c.id}
                                                                        onClick={() => {
                                                                            handleRackCategoryChange(rack.id, c.id);
                                                                            setActiveDropdownRackId(null);
                                                                        }}
                                                                        className={`flex items-center w-full px-3 py-2 rounded-lg text-left transition-colors ${cat?.id === c.id ? 'bg-[#e2f5e3]' : 'hover:bg-slate-50'}`}
                                                                    >
                                                                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm mr-3" style={{ backgroundColor: c.color }}></div>
                                                                        <span className={`text-[13px] flex-1 truncate ${cat?.id === c.id ? 'font-bold text-[#166534]' : 'font-medium text-slate-600'}`}>{c.name}</span>
                                                                        {cat?.id === c.id && (
                                                                            <CheckCircle2 size={14} className="ml-1 text-[#166534] flex-shrink-0" />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-center text-[12px] text-slate-400 italic">Showing top 20 racks. Use search to find specific racks.</div>
            </VCard>
        </motion.div>
    );

    const renderProducts = () => {
        const filtered = products.filter(p => !selectedCategoryFilter || categories.find(c => c.name === p.category)?.id === selectedCategoryFilter);
        const ITEMS_PER_PAGE = 8;
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const paginatedProducts = filtered.slice((productPage - 1) * ITEMS_PER_PAGE, productPage * ITEMS_PER_PAGE);

        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <VCard className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#e2f5e3] rounded-bl-full opacity-50 pointer-events-none -z-10"></div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <SectionTitle>Product Catalog</SectionTitle>
                            <p className="text-[13px] text-slate-500 mt-1">Browse and manage your warehouse inventory catalog.</p>
                        </div>
                        <div className="relative">
                            <select 
                                className="pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 outline-none focus:border-[#bbf7d0] focus:ring-4 focus:ring-[#e2f5e3]/20 bg-white shadow-sm appearance-none min-w-[200px]"
                                value={selectedCategoryFilter}
                                onChange={(e) => { setSelectedCategoryFilter(e.target.value); setProductPage(1); }}
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {paginatedProducts.map((product, idx) => {
                            const cat = getCategoryById(categories.find(c => c.name === product.category)?.id);
                            const totalStock = stock.filter(s => s.productId === product.id).reduce((sum, s) => sum + s.quantity, 0);
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    transition={{ delay: idx * 0.05 }}
                                    key={product.id} 
                                    className="p-5 rounded-2xl border border-slate-200 hover:border-[#bbf7d0] hover:shadow-xl hover:shadow-[#e2f5e3]/5 transition-all bg-white group hover:-translate-y-1 relative overflow-hidden flex flex-col"
                                >
                                    <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full pointer-events-none transition-colors opacity-10" style={{ backgroundColor: cat?.color }}></div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-[#e2f5e3] group-hover:text-[#166534] group-hover:border-[#bbf7d0] transition-colors shadow-sm relative z-10">
                                            <Package size={22} className="group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1 relative z-10">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-extrabold rounded-lg uppercase border border-slate-200 shadow-sm">{product.unitOfMeasure}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${totalStock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {totalStock > 0 ? `${totalStock} IN STOCK` : 'OUT OF STOCK'}
                                            </span>
                                        </div>
                                    </div>
                                    <h4 className="font-extrabold text-[16px] text-slate-800 leading-tight mb-2 group-hover:text-[#166534] transition-colors relative z-10">{product.productName}</h4>
                                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50 relative z-10">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat?.color }}></div>
                                        <span className="text-[12px] font-bold text-slate-500">{cat?.name}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                            <span className="text-[13px] font-medium text-slate-500">
                                Showing <span className="font-bold text-slate-800">{((productPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-bold text-slate-800">{Math.min(productPage * ITEMS_PER_PAGE, filtered.length)}</span> of <span className="font-bold text-slate-800">{filtered.length}</span> products
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setProductPage(prev => Math.max(prev - 1, 1))}
                                    disabled={productPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setProductPage(i + 1)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-all ${productPage === i + 1 ? 'bg-[#e2f5e3] text-slate-800 border border-[#bbf7d0] shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setProductPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={productPage === totalPages}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </VCard>
            </motion.div>
        );
    };

    const renderStockUpdate = () => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
                <VCard>
                    <SectionTitle>Record Stock Movement</SectionTitle>
                    <form onSubmit={handleStockUpdate} className="space-y-5 mt-6">
                        <div className="relative">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Select Rack <span className="text-rose-500">*</span></label>
                            
                            <button 
                                type="button"
                                onClick={() => setIsRackDropdownOpen(!isRackDropdownOpen)}
                                className={`w-full px-4 py-3 border ${isRackDropdownOpen ? 'border-[#bbf7d0]' : 'border-slate-200 hover:border-[#bbf7d0]'} rounded-xl text-[13px] font-bold bg-slate-50 flex items-center justify-between transition-all outline-none`}
                            >
                                <span className={stockUpdateForm.rackId ? 'text-slate-800' : 'text-slate-400'}>
                                    {stockUpdateForm.rackId ? `${stockUpdateForm.rackId} (${getCategoryById(getRackById(stockUpdateForm.rackId)?.categoryId)?.name})` : 'Search and choose a rack...'}
                                </span>
                                <div className={`text-slate-400 transition-transform duration-200 ${isRackDropdownOpen ? 'rotate-180 text-[#166534]' : ''}`}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                            </button>

                            <AnimatePresence>
                                {isRackDropdownOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Search by Rack ID or Category..."
                                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-[#bbf7d0] focus:ring-2 focus:ring-[#e2f5e3]/20 transition-all"
                                                    value={rackSearchQuery}
                                                    onChange={(e) => setRackSearchQuery(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 p-2">
                                            {racks.filter(r => 
                                                r.id.toLowerCase().includes(rackSearchQuery.toLowerCase()) || 
                                                (getCategoryById(r.categoryId)?.name || '').toLowerCase().includes(rackSearchQuery.toLowerCase())
                                            ).length > 0 ? (
                                                racks.filter(r => 
                                                    r.id.toLowerCase().includes(rackSearchQuery.toLowerCase()) || 
                                                    (getCategoryById(r.categoryId)?.name || '').toLowerCase().includes(rackSearchQuery.toLowerCase())
                                                ).map(r => {
                                                    const cat = getCategoryById(r.categoryId);
                                                    return (
                                                        <button
                                                            key={r.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setStockUpdateForm({ ...stockUpdateForm, rackId: r.id, productId: '' });
                                                                setIsRackDropdownOpen(false);
                                                                setRackSearchQuery('');
                                                            }}
                                                            className={`w-full flex items-center p-3 rounded-lg text-left transition-colors mb-1 last:mb-0 ${stockUpdateForm.rackId === r.id ? 'bg-[#e2f5e3] border border-[#bbf7d0]' : 'hover:bg-slate-50 border border-transparent'}`}
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center mr-3 flex-shrink-0">
                                                                <GridIcon size={14} className="text-slate-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-extrabold text-[13px] text-slate-800">{r.id}</div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color }}></div>
                                                                    <span className="text-[11px] font-bold text-slate-500">{cat?.name}</span>
                                                                </div>
                                                            </div>
                                                            {stockUpdateForm.rackId === r.id && <CheckCircle2 size={16} className="text-[#166534]" />}
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-4 text-center text-slate-500 text-[13px] italic">No racks found matching your search.</div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        {stockUpdateForm.rackId && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Select Product <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <select 
                                        className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-[13px] font-bold bg-slate-50 outline-none focus:border-[#bbf7d0] focus:ring-4 focus:ring-[#e2f5e3]/20 appearance-none transition-all shadow-sm cursor-pointer"
                                        value={stockUpdateForm.productId}
                                        onChange={(e) => setStockUpdateForm({ ...stockUpdateForm, productId: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Choose a product...</option>
                                        {products.filter(p => categories.find(c => c.name === p.category)?.id === getRackById(stockUpdateForm.rackId)?.categoryId).map(p => 
                                            <option key={p.id} value={p.id}>{p.productName}</option>
                                        )}
                                    </select>
                                    <Package size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-2 px-1">
                                    <Info size={12} className="text-[#166534]" />
                                    <p className="text-[10px] text-slate-500 font-medium">Filtered by category: <span className="font-bold text-slate-700">{getCategoryById(getRackById(stockUpdateForm.rackId)?.categoryId)?.name}</span></p>
                                </div>
                            </motion.div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Movement Type</label>
                                <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                                    <button 
                                        type="button"
                                        onClick={() => setStockUpdateForm({ ...stockUpdateForm, type: 'IN' })}
                                        className={`flex-1 py-2.5 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${stockUpdateForm.type === 'IN' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                    ><TrendingUp size={14} /> Stock IN</button>
                                    <button 
                                        type="button"
                                        onClick={() => setStockUpdateForm({ ...stockUpdateForm, type: 'OUT' })}
                                        className={`flex-1 py-2.5 text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${stockUpdateForm.type === 'OUT' ? 'bg-white text-rose-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                    ><TrendingDown size={14} /> Stock OUT</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">Quantity <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        min="1"
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-[13px] font-bold bg-white outline-none focus:border-[#bbf7d0] focus:ring-4 focus:ring-[#e2f5e3]/20 transition-all shadow-sm"
                                        value={stockUpdateForm.quantity}
                                        onChange={(e) => setStockUpdateForm({ ...stockUpdateForm, quantity: e.target.value })}
                                        required
                                        placeholder="e.g. 50"
                                    />
                                    <Box size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full py-4 mt-2 bg-[#e2f5e3] hover:bg-[#d1f0d3] border border-[#bbf7d0] text-slate-800 font-bold rounded-xl text-[13px] transition-colors shadow-sm flex items-center justify-center gap-2"
                        >
                            <ArrowRightLeft size={16} />
                            Commit Stock Movement
                        </button>
                    </form>
                </VCard>
            </div>

            <div className="lg:col-span-7">
                <VCard className="h-full">
                    <SectionTitle>Recent Movements Log</SectionTitle>
                    <div className="mt-4 space-y-3">
                        {movements.length > 0 ? movements.slice(0, 10).map((m, i) => {
                            const p = getProductById(m.productId);
                            const isIN = m.type === 'IN';
                            return (
                                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIN ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                            {isIN ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-[13px] text-slate-800">{p?.productName}</div>
                                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Rack: {m.rackId} • {new Date(m.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                    </div>
                                    <div className={`font-extrabold text-[15px] ${isIN ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isIN ? '+' : '-'}{m.quantity} {p?.unitOfMeasure}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-12 text-slate-400">
                                <Activity size={32} className="mx-auto mb-3 opacity-50" />
                                <p className="text-[13px] font-medium">No movements recorded yet in this session.</p>
                            </div>
                        )}
                    </div>
                </VCard>
            </div>
        </motion.div>
    );

    const renderLowStock = () => {
        const aggregatedStock = stock.reduce((acc, curr) => {
            if (!acc[curr.productId]) acc[curr.productId] = 0;
            acc[curr.productId] += curr.quantity;
            return acc;
        }, {});

        const reportData = products.map(p => {
            const qty = aggregatedStock[p.id] || 0;
            const status = getStockStatus(qty);
            return { ...p, qty, status };
        }).filter(p => p.status === 'LOW' || p.status === 'OUT OF STOCK');

        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <VCard>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <SectionTitle>Action Required: Low Stock</SectionTitle>
                            <p className="text-[12px] text-slate-500 mt-1">Aggregated inventory across all racks.</p>
                        </div>
                        <SecondaryBtn icon={<Info size={16} />}>Export Report</SecondaryBtn>
                    </div>
                    
                    {reportData.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-100 mt-4">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                                        <th className="p-4">Product Name</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4 text-center">Total Quantity</th>
                                        <th className="p-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[13px]">
                                    {reportData.map(item => {
                                        const cat = getCategoryById(categories.find(c => c.name === p.category)?.id);
                                        return (
                                            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-extrabold text-slate-800">{item.name}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color }}></div>
                                                        <span className="font-bold text-slate-600">{cat?.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="font-extrabold text-[14px] text-slate-800">{item.qty}</span> <span className="text-[11px] text-slate-400 font-bold">{item.unit}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${getStockStatusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-emerald-50 rounded-xl border border-emerald-100 mt-4">
                            <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                            <h3 className="text-emerald-800 font-bold text-[16px]">All Stock Levels Healthy</h3>
                            <p className="text-emerald-600 text-[13px] mt-1">No products are currently running low.</p>
                        </div>
                    )}
                </VCard>
            </motion.div>
        );
    };


    // --- Warehouse Config Modal State ---
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [managers, setManagers] = useState([]);
    const [formData, setFormData] = useState({
        name: '', code: '', addressLine1: '', city: '', totalRacks: '', squareFootage: '', temperatureControlled: false, managerId: '', status: 'Active'
    });

    const handleAddWarehouse = async () => {
        setFormData({ name: '', code: '', addressLine1: '', city: '', totalRacks: '', squareFootage: '', temperatureControlled: false, managerId: '', status: 'Active' });
        
        try {
            const userRes = await fetchUsers();
            const users = Array.isArray(userRes?.data ?? userRes) ? (userRes?.data ?? userRes) : [];
            setManagers(users.filter(u => u.role === 'MANAGER' || u.role === 'Branch Manager' || u.role === 'Admin'));
        } catch (e) {
            console.error(e);
        }
        setIsConfigModalOpen(true);
    };

    const handleSaveWarehouse = async () => {
        if (!formData.name || !formData.code || !formData.city) {
            return toast.error("Name, Code, and City are required");
        }
        try {
            await createWarehouseEntity(formData);
            toast.success("Warehouse created successfully");
            setIsConfigModalOpen(false);
            
            // Reload the branches
            const branchesRes = await import('../../api/vendorService').then(m => m.fetchWarehouseEntities());
            const branches = Array.isArray(branchesRes?.data ?? branchesRes) ? (branchesRes?.data ?? branchesRes) : [];
            const mappedBranches = branches.map(b => ({
                id: b.id,
                name: b.name || 'Unknown Branch',
                type: 'Common',
                address: b.city || 'Unknown',
                dockCount: Math.floor(Math.random() * 5) + 2,
                zoneLayout: 'Standard',
                status: b.status === 'active' ? 'Active' : 'Inactive',
                utilization: Math.floor(Math.random() * 100)
            }));
            
            if (mappedBranches.length > 0) {
                setWarehouses(mappedBranches);
                setSupermarkets(mappedBranches);
            }
        } catch (err) {
            toast.error("Failed to save warehouse");
        }
    };


    const renderWarehouseMapping = () => {
        const selectedWH = warehouses.find(w => w.id === selectedMappingWarehouseId);
        const mappedSMs = warehouseMapping[selectedMappingWarehouseId] || [];

        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Warehouse List */}
                    <div className="lg:col-span-6 space-y-6">
                        <VCard className="h-full border-0 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl">
                            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                <div>
                                    <h3 className="text-[16px] font-extrabold text-slate-800 tracking-tight">Warehouse List</h3>
                                    <p className="text-[12px] text-slate-500 font-medium mt-0.5">Select a warehouse to configure.</p>
                                </div>
                                <button 
                                    onClick={handleAddWarehouse}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#e2f5e3] hover:bg-[#d1f0d3] border border-[#bbf7d0] text-slate-800 rounded-xl text-[12px] font-bold transition-all shadow-sm"
                                >
                                    <Plus size={16} /> New
                                </button>
                            </div>
                            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
                                {warehouses.map(wh => {
                                    const linkedCount = (warehouseMapping[wh.id] || []).length;
                                    const isSelected = selectedMappingWarehouseId === wh.id;
                                    return (
                                        <div 
                                            key={wh.id}
                                            onClick={() => setSelectedMappingWarehouseId(wh.id)}
                                            className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${isSelected ? 'bg-white border-[#bbf7d0] shadow-[0_8px_30px_rgb(0,0,0,0.06)] ring-1 ring-[#bbf7d0]' : 'bg-slate-50 border-slate-200 hover:border-[#bbf7d0] hover:bg-white hover:shadow-md'}`}
                                        >
                                            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#166534]"></div>}
                                            
                                            <div className="flex justify-between items-start mb-3 pl-1">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className={`font-extrabold text-[15px] ${isSelected ? 'text-[#166534]' : 'text-slate-800 group-hover:text-[#166534]'} transition-colors`}>{wh.name}</h4>
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${wh.temperatureControlled ? 'Cold Storage' : 'Standard' === 'Common' || true ? 'bg-[#e2f5e3] text-[#166534]' : 'bg-amber-100 text-amber-700'}`}>{wh.temperatureControlled ? 'Cold Storage' : 'Standard'}</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">{wh.id}</p>
                                                </div>
                                                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 ${wh.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${wh.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                                    {wh.status}
                                                </div>
                                            </div>
                                            <div className="mt-5 pl-1">
                                                <div className="flex justify-between text-[11px] font-bold mb-1.5">
                                                    <span className="text-slate-500">Stock Utilization</span>
                                                    <span className={(wh.utilization || Math.floor(Math.random() * 100)) > 80 ? 'text-rose-600' : 'text-emerald-600'}>{wh.utilization || Math.floor(Math.random() * 100)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${(wh.utilization || Math.floor(Math.random() * 100)) > 80 ? 'bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`} style={{ width: `${wh.utilization || Math.floor(Math.random() * 100)}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-[12px] font-bold pl-1">
                                                <span className="text-slate-500">Linked Supermarkets:</span>
                                                <span className="text-[#166534] bg-[#e2f5e3] px-3 py-1 rounded-lg border border-[#bbf7d0]">{linkedCount} Stores</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </VCard>
                    </div>

                    {/* Warehouse Detail */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="h-full rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden flex flex-col border border-slate-200">
                            {/* Decorative background glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e2f5e3]/40 rounded-full blur-[80px] opacity-60 -mr-20 -mt-20 pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#e2f5e3]/30 rounded-full blur-[80px] opacity-60 -ml-20 -mb-20 pointer-events-none"></div>
                            
                            {/* Glass border top */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#bbf7d0] via-emerald-500 to-[#166534]"></div>
                            
                            <div className="p-8 relative z-10 flex-1 flex flex-col">
                                <div className="mb-8 border-b border-slate-100 pb-6">
                                    <h3 className="text-[20px] font-extrabold text-slate-800 tracking-tight">Warehouse Detail</h3>
                                    <p className="text-[13px] text-slate-500 font-medium mt-1">Real-time specs and live operations.</p>
                                </div>
                                
                                {selectedWH ? (
                                    <div className="space-y-8 flex-1 flex flex-col">
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 backdrop-blur-sm">
                                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                    <MapIcon size={12} className="text-[#166534]"/> Location Address
                                                </p>
                                                <p className="text-[14px] font-bold text-slate-800">{selectedWH.addressLine1 || 'Address not provided'} - {selectedWH.city}</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 backdrop-blur-sm">
                                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><GridIcon size={12}/> Total Storage Racks</p>
                                                    <p className="text-[18px] font-black text-slate-800">{selectedWH.totalRacks || 0} <span className="text-[12px] font-bold text-slate-500">Racks</span></p>
                                                </div>
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 backdrop-blur-sm">
                                                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Box size={12}/> Square Footage</p>
                                                    <p className="text-[16px] font-bold text-slate-800 mt-1">{selectedWH.squareFootage || 0} <span className="text-[12px] font-bold text-slate-500">sq. ft</span></p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-3">Linked Supermarkets</p>
                                            {mappedSMs.length > 0 ? (
                                                <div className="flex flex-wrap gap-2.5">
                                                    {mappedSMs.map(smId => {
                                                        const sm = supermarkets.find(s => s.id === smId);
                                                        return (
                                                            <div key={smId} className="px-3 py-1.5 bg-[#e2f5e3] text-[#166534] text-[12px] font-bold rounded-xl border border-[#bbf7d0] flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#166534]"></div>
                                                                {(sm?.branchName || 'Unknown').split(' (')[0]}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 text-[12px] text-slate-500 italic">No supermarkets linked currently.</div>
                                            )}
                                        </div>

                                        <div className="mt-auto">
                                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-3">Live Pending Operations</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-[#e2f5e3]/50 p-4 rounded-2xl border border-[#bbf7d0] text-center relative overflow-hidden group hover:border-[#166534] transition-colors cursor-pointer shadow-sm hover:shadow-md">
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full blur-xl group-hover:bg-[#d1f0d3] transition-all opacity-50"></div>
                                                    <p className="text-[28px] font-black text-[#166534] mb-0.5 relative z-10">12</p>
                                                    <p className="text-[11px] font-bold text-[#166534] uppercase tracking-widest relative z-10">Inbound</p>
                                                </div>
                                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center relative overflow-hidden group hover:border-amber-400 transition-colors cursor-pointer shadow-sm hover:shadow-md">
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full blur-xl group-hover:bg-amber-100 transition-all opacity-50"></div>
                                                    <p className="text-[28px] font-black text-amber-500 mb-0.5 relative z-10">5</p>
                                                    <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest relative z-10">Outbound</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center">
                                        <p className="text-slate-500 font-bold">Select a warehouse.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="w-full bg-[#F8FAFC] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <PageHeader
                title="Warehouse Category & Stock Management"
                subtitle="Complete visualization and tracking of inventory by category assignments."
            />
            {renderTabs()}
            
            <AnimatePresence mode="wait">
                {activeTab === 'MAPPING' && renderWarehouseMapping()}
                {activeTab === 'MAP' && renderMap()}
                {activeTab === 'CATEGORIES' && renderCategories()}
                {activeTab === 'RACKS' && renderRacks()}
                {activeTab === 'PRODUCTS' && renderProducts()}
                {activeTab === 'STOCK_UPDATE' && renderStockUpdate()}
                {activeTab === 'LOW_STOCK' && renderLowStock()}
            </AnimatePresence>

            <VModal open={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} title="Initialize New Warehouse" width="max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Warehouse Name *</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="e.g., Central Distribution Hub" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Facility Code *</label>
                        <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="e.g., WH-CDH-01" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">City / Region *</label>
                        <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="e.g., Mumbai" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Street Address</label>
                        <input type="text" value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="Physical location of the facility..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Total Storage Racks</label>
                        <input type="number" value={formData.totalRacks} onChange={e => setFormData({...formData, totalRacks: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="e.g., 250" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Square Footage (sq. ft.)</label>
                        <input type="number" value={formData.squareFootage} onChange={e => setFormData({...formData, squareFootage: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all" placeholder="e.g., 15000" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Facility Manager</label>
                        <select value={formData.managerId} onChange={e => setFormData({...formData, managerId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all">
                            <option value="">Unassigned</option>
                            {managers.map(m => (
                                <option key={m.id} value={m.id}>{m.name || m.fullName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Operational Status</label>
                        <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-green-500 focus:bg-white transition-all">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={formData.temperatureControlled} onChange={e => setFormData({...formData, temperatureControlled: e.target.checked})} />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.temperatureControlled ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.temperatureControlled ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-700 flex items-center gap-2"><ThermometerSnowflake size={14} className="text-blue-500"/> Cold Storage Capability</div>
                                <div className="text-xs text-slate-500">Enable this if the facility can store temperature-sensitive SKUs like dairy and frozen items.</div>
                            </div>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <SecondaryBtn onClick={() => setIsConfigModalOpen(false)}>Cancel</SecondaryBtn>
                    <PrimaryBtn onClick={handleSaveWarehouse} icon={<CheckCircle2 size={16} />}>Commit Configuration</PrimaryBtn>
                </div>
            </VModal>
        </div>
    );
}

