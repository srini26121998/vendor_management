import re

file_path = r'c:\Billing_Software\vendor-management-app\src\pages\StockManagement\WarehouseMap.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update activeTab initial state
content = content.replace(
    "const [activeTab, setActiveTab] = useState('MAP');",
    "const [activeTab, setActiveTab] = useState('MAPPING');"
)

# 2. Add Mapping States
state_insertion = """
    // Update Forms State
    const [stockUpdateForm, setStockUpdateForm] = useState({ rack_id: '', product_id: '', type: 'IN', quantity: '' });

    // Warehouse Mapping State
    const [warehouses, setWarehouses] = useState([
        { id: 'WH-01', name: 'Central Hub', type: 'Common', address: 'Mumbai', dockCount: 8, zoneLayout: 'Standard', status: 'Active', utilization: 85 },
        { id: 'WH-02', name: 'Pune Regional', type: 'Individual', address: 'Pune', dockCount: 4, zoneLayout: 'Cold Storage', status: 'Active', utilization: 60 },
        { id: 'WH-03', name: 'Andheri Express', type: 'Individual', address: 'Andheri', dockCount: 2, zoneLayout: 'Express', status: 'Inactive', utilization: 0 },
    ]);
    const [supermarkets, setSupermarkets] = useState([
        { id: 'SM-01', name: 'Supermarket A (Mumbai Central)' },
        { id: 'SM-02', name: 'Supermarket B (Andheri)' },
        { id: 'SM-03', name: 'Supermarket C (Pune)' },
        { id: 'SM-04', name: 'Supermarket D (Thane)' },
    ]);
    const [warehouseMapping, setWarehouseMapping] = useState({
        'WH-01': ['SM-01', 'SM-02', 'SM-03', 'SM-04'],
        'WH-02': ['SM-03'],
        'WH-03': ['SM-02']
    });
    const [selectedMappingWarehouseId, setSelectedMappingWarehouseId] = useState('WH-01');

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
"""
content = content.replace(
    "    // Update Forms State\n    const [stockUpdateForm, setStockUpdateForm] = useState({ rack_id: '', product_id: '', type: 'IN', quantity: '' });",
    state_insertion
)

# 3. Update tabs array
tabs_insertion = """        const tabs = [
            { id: 'MAPPING', label: 'Warehouse Mapping', icon: Navigation },
            { id: 'MAP', label: 'Floor Map', icon: MapIcon },
            { id: 'CATEGORIES', label: 'Categories', icon: Layers },
            { id: 'RACKS', label: 'Rack Setup', icon: GridIcon },
            { id: 'PRODUCTS', label: 'Product Catalog', icon: Package },
            { id: 'STOCK_UPDATE', label: 'Stock Movements', icon: ArrowRightLeft },
            { id: 'LOW_STOCK', label: 'Low Stock Report', icon: AlertTriangle },
        ];"""

content = content.replace(
    """        const tabs = [
            { id: 'MAP', label: 'Floor Map', icon: MapIcon },
            { id: 'CATEGORIES', label: 'Categories', icon: Layers },
            { id: 'RACKS', label: 'Rack Setup', icon: GridIcon },
            { id: 'PRODUCTS', label: 'Product Catalog', icon: Package },
            { id: 'STOCK_UPDATE', label: 'Stock Movements', icon: ArrowRightLeft },
            { id: 'LOW_STOCK', label: 'Low Stock Report', icon: AlertTriangle },
        ];""",
    tabs_insertion
)

# 4. Add renderWarehouseMapping function and render block
render_mapping = """

    const renderWarehouseMapping = () => {
        const selectedWH = warehouses.find(w => w.id === selectedMappingWarehouseId);
        const mappedSMs = warehouseMapping[selectedMappingWarehouseId] || [];

        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Warehouse List */}
                    <div className="lg:col-span-4 space-y-6">
                        <VCard className="h-full">
                            <div className="flex justify-between items-center mb-6">
                                <SectionTitle>Warehouse List</SectionTitle>
                                <PrimaryBtn icon={<Plus size={16} />} small>New</PrimaryBtn>
                            </div>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {warehouses.map(wh => {
                                    const linkedCount = (warehouseMapping[wh.id] || []).length;
                                    const isSelected = selectedMappingWarehouseId === wh.id;
                                    return (
                                        <div 
                                            key={wh.id}
                                            onClick={() => setSelectedMappingWarehouseId(wh.id)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-300 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-extrabold text-[14px] text-slate-800">{wh.name}</h4>
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${wh.type === 'Common' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>{wh.type}</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">{wh.id}</p>
                                                </div>
                                                <StatusBadge status={wh.status === 'Active' ? 'Active' : 'Inactive'} size="xs" />
                                            </div>
                                            <div className="mt-4">
                                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                                    <span className="text-slate-500">Stock Utilization</span>
                                                    <span className={wh.utilization > 80 ? 'text-rose-600' : 'text-emerald-600'}>{wh.utilization}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${wh.utilization > 80 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${wh.utilization}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-200/60 flex justify-between items-center text-[11px] font-bold">
                                                <span className="text-slate-500">Linked Supermarkets:</span>
                                                <span className="text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">{linkedCount} Stores</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </VCard>
                    </div>

                    {/* Mapping Config */}
                    <div className="lg:col-span-4 space-y-6">
                        <VCard className="h-full">
                            <SectionTitle>Mapping Configuration</SectionTitle>
                            <p className="text-[12px] text-slate-500 mt-1 mb-6">Assign supermarkets to <span className="font-bold text-slate-800">{selectedWH?.name}</span>.</p>
                            
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {supermarkets.map(sm => {
                                    const isMapped = mappedSMs.includes(sm.id);
                                    return (
                                        <div 
                                            key={sm.id}
                                            onClick={() => handleToggleSupermarket(selectedWH.id, sm.id)}
                                            className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${isMapped ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${isMapped ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300'}`}>
                                                    {isMapped && <CheckCircle2 size={12} />}
                                                </div>
                                                <div>
                                                    <h5 className={`font-bold text-[13px] ${isMapped ? 'text-emerald-900' : 'text-slate-700'}`}>{sm.name}</h5>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{sm.id}</p>
                                                </div>
                                            </div>
                                            {isMapped && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">Assigned</span>}
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                                <Info size={16} className="text-blue-500 mt-0.5" />
                                <p className="text-[11px] font-medium text-slate-600">Supports both a single common warehouse and individual warehouses per supermarket. Common warehouses can serve all stores simultaneously.</p>
                            </div>
                        </VCard>
                    </div>

                    {/* Warehouse Detail */}
                    <div className="lg:col-span-4 space-y-6">
                        <VCard className="h-full bg-slate-800 text-white border-slate-700">
                            <SectionTitle className="text-white">Warehouse Detail</SectionTitle>
                            
                            {selectedWH && (
                                <div className="mt-6 space-y-6">
                                    <div className="space-y-4 pb-6 border-b border-slate-700">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Location Address</p>
                                            <p className="text-[13px] font-bold text-slate-200 mt-1">{selectedWH.address} Logistics Park, Phase 2</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Dock Count</p>
                                                <p className="text-[14px] font-extrabold text-white mt-1">{selectedWH.dockCount} Active Docks</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Zone Layout</p>
                                                <p className="text-[14px] font-extrabold text-white mt-1">{selectedWH.zoneLayout}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pb-6 border-b border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Linked Supermarkets</p>
                                        {mappedSMs.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {mappedSMs.map(smId => {
                                                    const sm = supermarkets.find(s => s.id === smId);
                                                    return (
                                                        <span key={smId} className="px-2.5 py-1 bg-slate-700 text-[11px] font-bold rounded-lg border border-slate-600">{sm?.name.split(' (')[0]}</span>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-[12px] text-slate-500 italic">No supermarkets linked.</p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Pending Operations</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600 text-center">
                                                <p className="text-[20px] font-extrabold text-blue-400 mb-1">12</p>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase">Inbound</p>
                                            </div>
                                            <div className="bg-slate-700/50 p-3 rounded-xl border border-slate-600 text-center">
                                                <p className="text-[20px] font-extrabold text-amber-400 mb-1">5</p>
                                                <p className="text-[10px] font-bold text-slate-300 uppercase">Outbound</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </VCard>
                    </div>
                </div>
            </motion.div>
        );
    };

    return ("""

content = content.replace("    return (", render_mapping)

animate_presence_injection = """            <AnimatePresence mode="wait">
                {activeTab === 'MAPPING' && renderWarehouseMapping()}
                {activeTab === 'MAP' && renderMap()}"""

content = content.replace(
    """            <AnimatePresence mode="wait">\n                {activeTab === 'MAP' && renderMap()}""",
    animate_presence_injection
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("File updated successfully.")
