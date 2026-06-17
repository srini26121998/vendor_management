import React, { useState, useEffect } from 'react';
import {
    Map as MapIcon,
    Filter,
    Zap,
    BarChart3,
    Search,
    Navigation,
    Box,
    ArrowRight,
    CheckCircle2,
    Info,
    LayoutGrid,
    Cuboid as Cube
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
import { fetchBinLocations, createBinLocation, slotProductToBin, fetchProducts, fetchVendors, fetchAllVendorProducts } from '../../api/vendorService';

const ZONES = ['Cold Storage', 'Ambient', 'Frozen', 'Receiving Bay', 'Dispatch Area'];
const BIN_STATUS = {
    STOCK_LOW: '#ef4444', // Red
    STOCK_MED: '#f59e0b', // Amber
    STOCK_HIGH: '#3b82f6', // Blue
    EMPTY: 'white',
    FULL: '#1e3a8a', // Deep Blue
    VELOCITY_HIGH: '#ec4899', // Pink
    VELOCITY_MED: '#8b5cf6', // Purple
    VELOCITY_LOW: '#10b981'  // Emerald
};

export default function WarehouseMap() {
    const [mainView, setMainView] = useState('MAP'); // MAP, PRODUCTS, VENDORS
    const [vendors, setVendors] = useState([]);
    const [vendorProducts, setVendorProducts] = useState([]);
    
    const [viewMode, setViewMode] = useState('2D');
    const [velocityOverlay, setVelocityOverlay] = useState(true);
    const [utilisationOverlay, setUtilisationOverlay] = useState(false);
    const [searchSKU, setSearchSKU] = useState('');
    const [searchBin, setSearchBin] = useState('');
    const [selectedZones, setSelectedZones] = useState([]);
    const [bins, setBins] = useState([]);

    // Real master products
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    const [incomingSKU, setIncomingSKU] = useState('');
    const [quantityArriving, setQuantityArriving] = useState('');
    const [overrideBin, setOverrideBin] = useState('');

    const filteredProducts = Array.isArray(products) ? products.filter(p =>
        (p.name?.toLowerCase().includes(incomingSKU.toLowerCase())) ||
        (p.sku?.toLowerCase().includes(incomingSKU.toLowerCase()))
    ) : [];

    const toggleZone = (zone) => {
        setSelectedZones(prev =>
            prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
        );
    };

    useEffect(() => {
        loadBins();
        loadProducts();
        loadVendors();
        loadVendorProducts();
    }, []);

    const loadVendorProducts = () => {
        fetchAllVendorProducts()
            .then(res => {
                const list = Array.isArray(res.data || res) ? (res.data || res) : [];
                setVendorProducts(list);
            })
            .catch(err => console.error("Failed to load vendor products", err));
    };

    const loadVendors = () => {
        fetchVendors()
            .then(res => {
                const list = Array.isArray(res.data || res) ? (res.data || res) : [];
                setVendors(list);
            })
            .catch(err => console.error("Failed to load vendors", err));
    };

    const loadProducts = () => {
        fetchProducts()
            .then(res => {
                const list = Array.isArray(res.data || res) ? (res.data || res) : [];
                setProducts(list);
            })
            .catch(err => {
                console.error("Failed to load products", err);
            });
    };

    const loadBins = () => {
        fetchBinLocations()
            .then(res => {
                const list = Array.isArray(res.data || res) ? (res.data || res) : [];
                if (list.length > 0) {
                    setBins(list.map(b => {
                        const cap = parseFloat(b.capacityUnits || 100);
                        const cur = parseFloat(b.currentUnits || 0);
                        const pct = cap > 0 ? Math.min(100, Math.round((cur / cap) * 100)) : 0;
                        return {
                            id: b.binFullCode || 'Bin',
                            fill: pct,
                            velocity: b.velocityClass || 'LOW',
                            zone: b.zone || 'Ambient',
                            currentProductName: b.currentProductName,
                            currentUnits: cur,
                            capacityUnits: cap,
                            dbId: b.id
                        };
                    }));
                } else {
                    setBins(generateSimulatedBins());
                }
            })
            .catch(() => {
                setBins(generateSimulatedBins());
            });
    };

    const generateSimulatedBins = () => {
        return Array.from({ length: 48 }, (_, i) => ({
            id: `A-03-L${Math.floor(i / 12) + 1}-B${(i % 12) + 1}`,
            fill: Math.floor(Math.random() * 100),
            velocity: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MED' : 'LOW',
            zone: ZONES[Math.floor(Math.random() * ZONES.length)],
            currentProductName: null,
            currentUnits: 0,
            capacityUnits: 100
        }));
    };

    const handlePutAway = () => {
        if (!selectedProduct) {
            toast.error('Please select an Incoming Product from the suggestion dropdown.');
            return;
        }
        if (!selectedProduct.id) {
            toast.error('Selected product does not have a valid ID.');
            return;
        }

        const qty = parseFloat(quantityArriving);
        if (isNaN(qty) || qty <= 0) {
            toast.error('Please enter a valid positive quantity greater than 0.');
            return;
        }

        const binCode = (overrideBin || (bins.length > 0 ? bins[0].id : 'A-03-L1-B01')).trim();
        if (!binCode) {
            toast.error('Please select or specify a valid bin location.');
            return;
        }

        // Search the bin in current local state
        const targetBin = bins.find(b => b.id.toLowerCase() === binCode.toLowerCase());
        if (targetBin) {
            const isSameProduct = targetBin.currentProductName && selectedProduct.name &&
                targetBin.currentProductName.toLowerCase() === selectedProduct.name.toLowerCase();
            const projectedUnits = isSameProduct 
                ? (parseFloat(targetBin.currentUnits || 0) + qty)
                : qty;
            
            const maxCap = parseFloat(targetBin.capacityUnits || 100);
            if (projectedUnits > maxCap) {
                toast.error(`Cannot slot: Projected total of ${projectedUnits} units exceeds bin capacity of ${maxCap} units.`);
                return;
            }
        }
        
        slotProductToBin(binCode, {
            productId: selectedProduct.id,
            quantity: qty
        })
        .then(() => {
            toast.success(`Put-away logged dynamically for ${selectedProduct.name} at Bin ${binCode}! ✅`);
            setIncomingSKU('');
            setSelectedProduct(null);
            setQuantityArriving('');
            setOverrideBin('');
            loadBins();
        })
        .catch(err => {
            console.error("Failed to commit slotting transaction", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to commit slotting transaction";
            toast.error(errorMsg);
        });
    };

    const breadcrumbs = [
        { label: 'Inventory', path: '/inventory' },
        { label: 'Stock Management', path: '#' },
        { label: 'Warehouse Slotting Map' }
    ];

    return (
        <div className="w-full bg-[#F8FAFC] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>

            <PageHeader
                title="Warehouse Bin & Rack Map (Slotting)"
                subtitle="Interactive digital warehouse floor map with bin-level stock visibility and AI-driven put-away suggestions."
            />

            {/* Top View Toggle */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setMainView('MAP')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${mainView === 'MAP' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                    <MapIcon size={16} className="mr-2" /> Map View
                </button>
                <button
                    onClick={() => setMainView('PRODUCTS')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${mainView === 'PRODUCTS' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                    <Box size={16} className="mr-2" /> Products
                </button>
                <button
                    onClick={() => setMainView('VENDORS')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center ${mainView === 'VENDORS' ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                    <LayoutGrid size={16} className="mr-2" /> Vendors
                </button>
            </div>

            {mainView === 'MAP' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Map Controls & Map */}
                <div className="lg:col-span-8 space-y-6">
                    <VCard>
                        <SectionTitle>Warehouse Map Controls</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            {/* View Mode Toggle */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">View Mode</label>
                                <div className="flex p-1 bg-slate-100 rounded-xl">
                                    {['2D', '3D'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setViewMode(m)}
                                            className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${viewMode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            {m === '2D' ? '2D Floor Plan' : '3D Isometric'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Zone Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone Filter</label>
                                <div className="relative group">
                                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <select
                                        className="w-full pl-9 pr-4 py-2.5 text-[12px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all appearance-none"
                                        onChange={(e) => toggleZone(e.target.value)}
                                        value=""
                                    >
                                        <option value="" disabled>Multi-Select Zones...</option>
                                        {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedZones.map(z => (
                                        <span key={z} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-md border border-blue-100 flex items-center gap-1">
                                            {z} <button onClick={() => toggleZone(z)}>✕</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Overlays */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visual Overlays</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setVelocityOverlay(!velocityOverlay)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold rounded-xl border transition-all ${velocityOverlay ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-100' : 'bg-white text-slate-500 border-slate-100'}`}
                                    >
                                        <Zap size={12} /> Velocity
                                    </button>
                                    <button
                                        onClick={() => setUtilisationOverlay(!utilisationOverlay)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold rounded-xl border transition-all ${utilisationOverlay ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-100' : 'bg-white text-slate-500 border-slate-100'}`}
                                    >
                                        <BarChart3 size={12} /> Utilisation
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            {/* SKU Search */}
                            <div className="relative group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">SKU Search (Pulse Animation)</label>
                                <Search size={14} className="absolute left-3 top-[38px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search SKU to locate bin..."
                                    className="w-full pl-9 pr-4 py-2.5 text-[12px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                                    value={searchSKU}
                                    onChange={e => setSearchSKU(e.target.value)}
                                />
                            </div>

                            {/* Bin Search */}
                            <div className="relative group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Bin Search (Direct Nav)</label>
                                <Navigation size={14} className="absolute left-3 top-[38px] text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="e.g. A-03-L2-B04"
                                    className="w-full pl-9 pr-4 py-2.5 text-[12px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                                    value={searchBin}
                                    onChange={e => setSearchBin(e.target.value)}
                                />
                            </div>
                        </div>
                    </VCard>

                    {/* Interactive Map Visual */}
                    <VCard className="overflow-hidden min-h-[600px] bg-[#f1f5f9] border-dashed border-2 border-slate-200 relative">
                        <div className={`w-full h-full transition-all duration-1000 ease-in-out ${viewMode === '3D' ? 'perspective-[1200px] p-16 pt-20 pb-20' : 'p-10'}`}>
                            <div className={`grid grid-cols-12 gap-x-4 gap-y-8 transition-all duration-1000 ${viewMode === '3D' ? 'rotate-x-[45deg] rotate-z-[-15deg] translate-y-[-20px]' : ''}`}
                                style={{ transformStyle: 'preserve-3d' }}>
                                {bins.map((bin, i) => {
                                    let bgColor = 'white';
                                    let stockLevel = 'EMPTY';

                                    if (bin.fill > 0 && bin.fill < 30) stockLevel = 'LOW';
                                    else if (bin.fill >= 30 && bin.fill < 75) stockLevel = 'MED';
                                    else if (bin.fill >= 75 && bin.fill < 100) stockLevel = 'HIGH';
                                    else if (bin.fill === 100) stockLevel = 'FULL';

                                    if (utilisationOverlay) {
                                        bgColor = bin.fill === 0 ? BIN_STATUS.EMPTY : BIN_STATUS[`STOCK_${stockLevel}`] || BIN_STATUS.FULL;
                                    } else if (velocityOverlay) {
                                        bgColor = BIN_STATUS[`VELOCITY_${bin.velocity}`];
                                    }

                                    const isHighlighted = (searchSKU && i % 8 === 0) || (searchBin && bin.id === searchBin);

                                    // Depth calculation for 3D effect
                                    const sideColor = `brightness(0.85)`;
                                    const bottomColor = `brightness(0.7)`;

                                    return (
                                        <div
                                            key={bin.id}
                                            className={`group relative aspect-square transition-all duration-500 cursor-pointer hover:z-[100]
                                                ${isHighlighted ? 'ring-4 ring-blue-400 ring-offset-4 animate-pulse z-20' : ''}`}
                                            style={{
                                                transformStyle: 'preserve-3d',
                                                zIndex: isHighlighted ? 50 : 1
                                            }}
                                        >
                                            {/* 3D BUILDING EFFECT (Top Face) */}
                                            <div
                                                className={`absolute inset-0 rounded-sm border border-slate-200/50 flex flex-col items-center justify-center transition-all duration-500 group-hover:translate-z-[40px] group-hover:shadow-2xl group-hover:scale-105
                                                    ${viewMode === '3D' ? 'shadow-lg' : ''}`}
                                                style={{
                                                    backgroundColor: bgColor,
                                                    transform: viewMode === '3D' ? 'translateZ(10px)' : 'none',
                                                    boxShadow: viewMode === '3D' ? `0 10px 20px -5px rgba(0,0,0,0.1)` : 'none'
                                                }}
                                            >
                                                <span className={`text-[9px] font-bold tracking-tighter ${bin.fill > 30 || (velocityOverlay) ? 'text-white' : 'text-slate-400'} group-hover:scale-110 transition-transform`}>
                                                    {bin.id.split('-').pop()}
                                                </span>

                                                {utilisationOverlay && (
                                                    <div className="absolute bottom-1 left-1 right-1 h-1 bg-white/20 rounded-full overflow-hidden">
                                                        <div className="h-full bg-current opacity-60" style={{ width: `${bin.fill}%`, color: bin.fill > 60 ? '#fff' : '#fff' }} />
                                                    </div>
                                                )}

                                                {/* Hover Info Tag (The "Content") */}
                                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-0 group-hover:scale-100 translate-y-2 group-hover:translate-y-0 z-[150] whitespace-nowrap">
                                                    <div className="bg-[#0f172a] text-white px-4 py-3 rounded-2xl text-[10px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 flex flex-col gap-1 items-center backdrop-blur-xl">
                                                        <div className="font-bold text-blue-400 border-b border-white/10 pb-1.5 w-full text-center mb-1.5 uppercase ">{bin.id}</div>
                                                        <div className="flex gap-4">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Stock Lvl</span>
                                                                <span className={`font-bold ${stockLevel === 'LOW' ? 'text-rose-400' : stockLevel === 'MED' ? 'text-amber-400' : 'text-emerald-400'}`}>{stockLevel} ({bin.fill}%)</span>
                                                            </div>
                                                            <div className="flex flex-col items-center border-l border-white/10 pl-4">
                                                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Flow</span>
                                                                <span className="font-bold text-indigo-400">{bin.velocity}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 font-extrabold italic mt-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/5 w-full text-center">Zone: {bin.zone}</div>
                                                    </div>
                                                    <div className="w-3 h-3 bg-[#0f172a] rotate-45 mx-auto -mt-1.5 border-r border-b border-white/20 shadow-xl"></div>
                                                </div>
                                            </div>

                                            {/* 3D SIDES (Building Walls) - Visible only in 3D Mode */}
                                            {viewMode === '3D' && (
                                                <>
                                                    {/* Right Side */}
                                                    <div className="absolute top-0 right-0 h-full w-[10px] origin-right rotate-y-90 transition-all duration-500 group-hover:w-[40px]"
                                                        style={{
                                                            backgroundColor: bgColor,
                                                            filter: sideColor,
                                                        }}
                                                    />
                                                    {/* Bottom Side */}
                                                    <div className="absolute bottom-0 left-0 w-full h-[10px] origin-bottom rotate-x-[-90deg] transition-all duration-500 group-hover:h-[40px]"
                                                        style={{
                                                            backgroundColor: bgColor,
                                                            filter: bottomColor,
                                                        }}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Map Legend - Horizontal "Left to Right" Combo UI */}
                        <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white shadow-2xl z-[110] transition-all duration-500 transform hover:translate-y-[-2px]">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
                                    <MapIcon size={14} className="text-blue-600" />
                                    <div className="text-[10px] font-bold text-slate-800 uppercase  whitespace-nowrap">Heatmap</div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center gap-2 group cursor-default">
                                        <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-200 group-hover:scale-125 transition-transform"></div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Empty</span>
                                    </div>
                                    <div className="flex items-center gap-2 group cursor-default">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-sm group-hover:scale-125 transition-transform"></div>
                                        <span className="text-[9px] font-bold text-rose-500 uppercase">Low</span>
                                    </div>
                                    <div className="flex items-center gap-2 group cursor-default">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-sm group-hover:scale-125 transition-transform"></div>
                                        <span className="text-[9px] font-bold text-amber-500 uppercase">Med</span>
                                    </div>
                                    <div className="flex items-center gap-2 group cursor-default">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-sm group-hover:scale-125 transition-transform"></div>
                                        <span className="text-[9px] font-bold text-blue-500 uppercase">High</span>
                                    </div>
                                    <div className="flex items-center gap-2 group cursor-default">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a] shadow-sm group-hover:scale-125 transition-transform"></div>
                                        <span className="text-[9px] font-bold text-blue-900 uppercase">Full</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </VCard>
                </div>

                {/* Right: Put-Away Suggestion Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <VCard className="sticky top-8">
                        <SectionTitle>Put-Away Suggestion Panel</SectionTitle>
                        <div className="space-y-5 mt-6">
                            {/* Input Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Incoming SKU <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <Box size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search incoming item..."
                                            className="w-full pl-9 pr-8 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                            value={incomingSKU}
                                            onChange={e => {
                                                setIncomingSKU(e.target.value);
                                                if (selectedProduct) setSelectedProduct(null);
                                            }}
                                        />
                                        {selectedProduct && (
                                            <button 
                                                onClick={() => {
                                                    setSelectedProduct(null);
                                                    setIncomingSKU('');
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold"
                                            >
                                                ✕
                                            </button>
                                        )}
                                        {incomingSKU && !selectedProduct && (
                                            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                                                {filteredProducts.length > 0 ? (
                                                    filteredProducts.map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => {
                                                                setSelectedProduct(p);
                                                                setIncomingSKU(p.name);
                                                            }}
                                                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-[12px] font-bold text-slate-700 flex justify-between items-center transition-colors"
                                                        >
                                                            <span>{p.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">{p.sku || p.skuCode || 'N/A'}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-2.5 text-[11px] text-slate-400 italic">No products found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium italic">From active GRN or manual entry</p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Quantity Arriving <span className="text-rose-500">*</span></label>
                                    <input
                                        type="number"
                                        placeholder="Units being put away..."
                                        className="w-full px-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                        value={quantityArriving}
                                        onChange={e => setQuantityArriving(e.target.value)}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Must be &gt; 0; checks bin capacity</p>
                                </div>
                            </div>

                            {/* Suggestions */}
                            <div className="space-y-3">
                                <label className="block text-[11px] font-bold text-slate-400 uppercase ">AI Suggestions</label>

                                {[
                                    { id: 'A-03-L2-B04', label: 'Suggested Bin 1', sub: 'Best match', dist: '12m', util: '45%', vel: '98%', rank: 'Primary' },
                                    { id: 'A-03-L4-B11', label: 'Suggested Bin 2', sub: 'Second best', dist: '18m', util: '20%', vel: '85%', rank: 'Secondary' },
                                    { id: 'B-01-L1-B02', label: 'Suggested Bin 3', sub: 'Third option', dist: '45m', util: '0%', vel: '70%', rank: 'Alternate' }
                                ].map((s, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setOverrideBin(s.id)}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${overrideBin === s.id ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase  leading-none mb-1">{s.label}</div>
                                                <div className="text-[15px] font-extrabold text-[#1e293b]">{s.id}</div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${i === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {s.rank}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            <div className="text-center p-2 rounded-lg bg-white/50 border border-slate-100">
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Distance</div>
                                                <div className="text-[11px] font-bold text-slate-700">{s.dist}</div>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-white/50 border border-slate-100">
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Util.</div>
                                                <div className="text-[11px] font-bold text-slate-700">{s.util}</div>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-white/50 border border-slate-100">
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">Match</div>
                                                <div className="text-[11px] font-bold text-blue-600">{s.vel}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-slate-50">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Override Bin Selection</label>
                                <input
                                    type="text"
                                    placeholder="Enter preferred bin ID..."
                                    className="w-full px-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all mb-4"
                                    value={overrideBin}
                                    onChange={e => setOverrideBin(e.target.value)}
                                />
                                <PrimaryBtn
                                    className="w-full py-4 rounded-2xl"
                                    icon={<CheckCircle2 size={16} />}
                                    onClick={handlePutAway}
                                >
                                    Confirm Put-Away
                                </PrimaryBtn>
                            </div>
                        </div>
                    </VCard>
                </div>
            </div>
            )}

            {mainView === 'PRODUCTS' && (
                <VCard>
                    <SectionTitle>Warehouse Products</SectionTitle>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-50">
                                    <th className="p-4 font-bold">Product Name</th>
                                    <th className="p-4 font-bold">SKU / Barcode</th>
                                    <th className="p-4 font-bold">Current Stock</th>
                                    <th className="p-4 font-bold">Vendor / Supplier</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] font-medium text-slate-700">
                                {products.length > 0 ? (
                                    products.map(p => {
                                        const vp = vendorProducts.find(vpItem => vpItem.mappedProductId === p.id);
                                        const displayVendor = vp ? (vp.vendorLegalName || vp.vendorCode) : (p.primarySupplier?.name || p.primarySupplier?.legalName || p.vendorName || p.supplierName || 'Not Assigned');
                                        return (
                                            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="p-4 font-bold text-slate-800">{p.name}</td>
                                                <td className="p-4">{p.sku || p.barcode || p.skuCode || 'N/A'}</td>
                                                <td className="p-4 font-bold text-blue-600">{p.currentStock || 0}</td>
                                                <td className="p-4">{displayVendor}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-6 text-center text-slate-400">No products available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </VCard>
            )}

            {mainView === 'VENDORS' && (
                <VCard>
                    <SectionTitle>Warehouse Vendors</SectionTitle>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-50">
                                    <th className="p-4 font-bold">Vendor Name</th>
                                    <th className="p-4 font-bold">Code</th>
                                    <th className="p-4 font-bold">Contact Number</th>
                                    <th className="p-4 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px] font-medium text-slate-700">
                                {vendors.length > 0 ? (
                                    vendors.map(v => (
                                        <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="p-4 font-bold text-slate-800">{v.tradeName || v.legalName || v.name || v.vendorName || 'Unnamed Vendor'}</td>
                                            <td className="p-4">{v.vendorCode || v.code || 'N/A'}</td>
                                            <td className="p-4">{v.primaryMobile || v.phone || v.contactNumber || 'N/A'}</td>
                                            <td className="p-4">
                                                <StatusBadge status={v.kycStatus || v.complianceStatus || v.status || 'ACTIVE'} />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-6 text-center text-slate-400">No vendors available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </VCard>
            )}
        </div>
    );
}
