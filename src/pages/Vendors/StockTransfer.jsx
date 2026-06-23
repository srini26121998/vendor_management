import React, { useState, useEffect } from 'react';
import { PageHeader, VCard, SectionTitle, PrimaryBtn, SecondaryBtn } from './VendorComponents';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ArrowRight, Package, Box, MapPin, Search, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { searchGlobalInventory, createSTO } from '../../api/vendorService';

const OUTLETS = ['HQ', 'Main Branch — Andheri', 'Bandra West Outlet', 'Powai Branch', 'Thane Branch'];

export default function StockTransfer() {
    const [step, setStep] = useState(1);
    const [source, setSource] = useState('HQ');
    const [dest, setDest] = useState('Powai Branch');
    
    const [searchQuery, setSearchQuery] = useState('');
    const [availableItems, setAvailableItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    
    const [selectedItems, setSelectedItems] = useState([]);

    // Fetch real inventory for the selected source branch
    useEffect(() => {
        if (step === 2) {
            setLoadingItems(true);
            // Search all items to find what's in the source outlet
            // For a real app, we might want a specific endpoint to list all items in an outlet.
            // But we will use searchGlobalInventory with a broad query or just fetch a few items for demo.
            searchGlobalInventory(searchQuery || 'a') // dummy query to get some products
                .then(products => {
                    if (Array.isArray(products)) {
                        // Filter products that have stock in the selected source outlet
                        const sourceProducts = products.filter(p => 
                            p.outlets && p.outlets.some(o => o.outletId === source && o.quantity > 0)
                        ).map(p => {
                            const stockInSource = p.outlets.find(o => o.outletId === source).quantity;
                            return {
                                id: p.id,
                                name: p.name,
                                sku: p.sku || p.barcode || 'N/A',
                                available: stockInSource,
                                unit: 'Units' // Fallback
                            };
                        });
                        setAvailableItems(sourceProducts);
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch inventory", err);
                })
                .finally(() => {
                    setLoadingItems(false);
                });
        }
    }, [step, source, searchQuery]);

    const handleNextStep = () => {
        if (source === dest) {
            toast.error("Source and Destination cannot be the same!");
            return;
        }
        setStep(2);
    };

    const addItemToTransfer = (item) => {
        if (!selectedItems.find(i => i.id === item.id)) {
            setSelectedItems([...selectedItems, { ...item, transferQty: 1 }]);
        }
    };

    const updateQty = (id, v) => {
        setSelectedItems(prev => prev.map(item => 
            item.id === id ? { ...item, transferQty: v } : item
        ));
    };

    const removeSelectedItem = (id) => {
        setSelectedItems(prev => prev.filter(i => i.id !== id));
    };

    const generate = async () => {
        if (selectedItems.length === 0) {
            toast.error('Please select at least one item to transfer.');
            return;
        }

        const invalidItems = selectedItems.filter(i => i.transferQty <= 0 || i.transferQty > i.available);
        if (invalidItems.length > 0) {
            toast.error('Invalid transfer quantities detected.');
            return;
        }

        try {
            // For now, create an STO for the first item (assuming backend supports 1 item per STO request)
            const item = selectedItems[0];
            const payload = {
                productId: item.id,
                sourceBranchName: source,
                destBranchName: dest,
                transferQuantity: item.transferQty,
                transferDate: new Date().toISOString().split('T')[0],
                transferMode: "ROAD",
                priority: "HIGH",
                capitalSaved: 0
            };
            
            await createSTO(payload, "123e4567-e89b-12d3-a456-426614174000"); // using a dummy UUID for userId
            toast.success('Stock Transfer Order created successfully! 🚛');
            
            // Reset
            setStep(1);
            setSelectedItems([]);
            setSearchQuery('');
        } catch (err) {
            console.error("STO Creation Failed", err);
            toast.error("Failed to create STO. Please try again.");
        }
    };

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1200px] mx-auto">
                <PageHeader 
                    title="Intelligent Stock Transfer" 
                    subtitle="Seamlessly move physical stock between your warehouses and branch outlets."
                />

                {/* Progress Tracker */}
                <div className="flex items-center justify-center mb-8 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
                    <div className="flex justify-between w-full max-w-md">
                        <div className={`flex flex-col items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-200'}`}>1</div>
                            <span className="text-[11px] font-bold uppercase tracking-wider bg-[#F3F5F9] px-2">Route</span>
                        </div>
                        <div className={`flex flex-col items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-200'}`}>2</div>
                            <span className="text-[11px] font-bold uppercase tracking-wider bg-[#F3F5F9] px-2">Items</span>
                        </div>
                        <div className={`flex flex-col items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-200'}`}>3</div>
                            <span className="text-[11px] font-bold uppercase tracking-wider bg-[#F3F5F9] px-2">Confirm</span>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <VCard className="relative overflow-hidden border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 p-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-blue-600 mb-6">
                                            <div className="p-2.5 bg-blue-50 rounded-xl"><MapPin size={20} /></div>
                                            <h3 className="text-[18px] font-bold text-gray-800">Select Source</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {OUTLETS.map(o => (
                                                <div 
                                                    key={`src-${o}`} 
                                                    onClick={() => setSource(o)}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${source === o ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'}`}
                                                >
                                                    <span className="text-[14px] font-bold text-gray-800">{o}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-purple-600 mb-6">
                                            <div className="p-2.5 bg-purple-50 rounded-xl"><Truck size={20} /></div>
                                            <h3 className="text-[18px] font-bold text-gray-800">Select Destination</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {OUTLETS.map(o => (
                                                <div 
                                                    key={`dest-${o}`} 
                                                    onClick={() => setDest(o)}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${dest === o ? 'border-purple-500 bg-purple-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'} ${source === o ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                                >
                                                    <span className="text-[14px] font-bold text-gray-800">{o}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-end">
                                    <PrimaryBtn onClick={handleNextStep} className="px-8 py-3.5 shadow-lg shadow-blue-200">
                                        Next: Select Items <ChevronRight size={18} className="ml-2" />
                                    </PrimaryBtn>
                                </div>
                            </VCard>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <VCard className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                {/* Route Summary */}
                                <div className="flex items-center gap-4 py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl mb-8 border border-white shadow-sm">
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">From</div>
                                        <div className="text-[15px] font-bold text-blue-900">{source}</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white text-blue-500 flex items-center justify-center shadow-sm"><ArrowRight size={18} /></div>
                                    <div className="flex-1 text-right">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">To</div>
                                        <div className="text-[15px] font-bold text-purple-900">{dest}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Search Panel */}
                                    <div className="space-y-4">
                                        <SectionTitle>Inventory at {source}</SectionTitle>
                                        <div className="relative">
                                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Search by SKU or Name..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[13px] font-bold text-gray-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                            {loadingItems ? (
                                                <div className="text-center py-10 text-gray-400 font-bold text-[12px] animate-pulse">Scanning Inventory...</div>
                                            ) : availableItems.length > 0 ? (
                                                availableItems.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer" onClick={() => addItemToTransfer(item)}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><Package size={18} /></div>
                                                            <div>
                                                                <div className="text-[14px] font-bold text-gray-800">{item.name}</div>
                                                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">SKU: {item.sku}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[14px] font-extrabold text-blue-600">{item.available}</div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase">In Stock</div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10">
                                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-3"><AlertTriangle size={24} /></div>
                                                    <div className="text-[13px] font-bold text-gray-500">No products found</div>
                                                    <div className="text-[11px] text-gray-400 mt-1">Try a different search term.</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cart Panel */}
                                    <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
                                        <SectionTitle>Transfer List</SectionTitle>
                                        
                                        {selectedItems.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-64 text-gray-400 opacity-60">
                                                <Box size={48} className="mb-4" />
                                                <p className="text-[13px] font-bold">Select items from inventory</p>
                                            </div>
                                        ) : (
                                            <div className="mt-6 space-y-4">
                                                {selectedItems.map((item, idx) => (
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        key={item.id} 
                                                        className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden"
                                                    >
                                                        {item.transferQty > item.available && (
                                                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
                                                        )}
                                                        <div className="flex justify-between items-start mb-4 pl-2">
                                                            <div>
                                                                <div className="text-[14px] font-bold text-gray-800">{item.name}</div>
                                                                <div className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">Max Available: <span className="text-blue-600">{item.available}</span></div>
                                                            </div>
                                                            <button onClick={() => removeSelectedItem(item.id)} className="text-gray-300 hover:text-rose-500 transition-colors">✕</button>
                                                        </div>
                                                        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl">
                                                            <button onClick={() => updateQty(item.id, Math.max(1, item.transferQty - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm hover:text-blue-600 font-bold">－</button>
                                                            <input 
                                                                type="number" 
                                                                value={item.transferQty} 
                                                                onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)}
                                                                className="flex-1 bg-transparent text-center font-bold text-[14px] outline-none text-blue-900" 
                                                            />
                                                            <button onClick={() => updateQty(item.id, Math.min(item.available, item.transferQty + 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm hover:text-blue-600 font-bold">＋</button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
                                            <SecondaryBtn onClick={() => setStep(1)} className="flex-1 !py-3.5">Back</SecondaryBtn>
                                            <PrimaryBtn onClick={generate} disabled={selectedItems.length === 0} className={`flex-1 !py-3.5 shadow-lg ${selectedItems.length > 0 ? 'shadow-blue-200' : 'opacity-50'}`}>
                                                Execute Transfer
                                            </PrimaryBtn>
                                        </div>
                                    </div>
                                </div>
                            </VCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
