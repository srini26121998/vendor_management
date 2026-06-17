import React, { useState } from 'react';
import { PageHeader, VCard, SectionTitle, PrimaryBtn, SecondaryBtn } from './VendorComponents';
import toast from 'react-hot-toast';

const OUTLETS = ['Main Branch — Andheri', 'Bandra West', 'Powai Branch', 'Thane Branch'];
const ITEMS_POOL = [
    { name: 'Basmati Rice (Premium)', available: 145, unit: 'Kg' },
    { name: 'Sunflower Oil', available: 62, unit: 'L' },
    { name: 'Wheat Flour (Maida)', available: 380, unit: 'Kg' },
    { name: 'Turmeric Powder', available: 28, unit: 'Kg' },
];

export default function StockTransfer() {
    const [source, setSource] = useState(OUTLETS[0]);
    const [dest, setDest] = useState(OUTLETS[2]);
    const [items, setItems] = useState(ITEMS_POOL.map(i => ({ ...i, transferQty: 0 })));

    const updateQty = (idx, v) => setItems(it => it.map((item, i) => i === idx ? { ...item, transferQty: v } : item));

    const generate = () => {
        toast.success('Transfer Challan CHAL-2026-0041 generated! 📄');
    };

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="w-full">
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-[24px] font-bold text-[#1e293b]">Stock Transfer</h1>
                            <nav className="text-[12px] text-[#64748b] mt-1 font-medium uppercase tracking-wider">
                                inventory / <span className="text-[#3b82f6]">inter-outlet movement</span>
                            </nav>
                        </div>
                        <div className="flex items-center gap-3">
                            <SecondaryBtn onClick={() => { }}>
                                View History
                            </SecondaryBtn>
                        </div>
                    </div>
                </div>

                <VCard className="overflow-visible">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase  mb-2">Source Outlet</label>
                            <div className="relative">
                                <select value={source} onChange={e => setSource(e.target.value)}
                                    className="w-full px-4 py-3 text-[14px] font-bold border border-gray-100 rounded-xl bg-gray-50/50 focus:border-blue-500 transition-all outline-none appearance-none">
                                    {OUTLETS.map(o => <option key={o}>{o}</option>)}
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase  mb-2">Destination Outlet</label>
                            <div className="relative">
                                <select value={dest} onChange={e => setDest(e.target.value)}
                                    className="w-full px-4 py-3 text-[14px] font-bold border border-gray-100 rounded-xl bg-gray-50/50 focus:border-blue-500 transition-all outline-none appearance-none">
                                    {OUTLETS.filter(o => o !== source).map(o => <option key={o}>{o}</option>)}
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 py-6 border-y border-gray-50 mb-8 bg-gray-50/30 -mx-6 px-6">
                        <div className="flex-1 text-center">
                            <div className="text-[10px] font-bold text-gray-400 uppercase  mb-1">From</div>
                            <div className="text-[13px] font-bold text-gray-800">{source}</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-sm border border-blue-100">→</div>
                        <div className="flex-1 text-center">
                            <div className="text-[10px] font-bold text-gray-400 uppercase  mb-1">To</div>
                            <div className="text-[13px] font-bold text-blue-600">{dest}</div>
                        </div>
                    </div>

                    <SectionTitle>Select Items to Transfer</SectionTitle>
                    <div className="grid grid-cols-1 gap-3 mt-4">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-100 transition-all group">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg border border-gray-100 group-hover:scale-105 transition-transform">📦</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[14px] text-gray-800">{item.name}</div>
                                    <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Stock: {item.available} {item.unit}</div>
                                    {item.transferQty > 0 && item.transferQty > item.available && (
                                        <div className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-tighter">⚠️ Limit Exceeded</div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                                    <button onClick={() => updateQty(idx, Math.max(0, item.transferQty - 1))}
                                        className="w-8 h-8 rounded-lg bg-white text-gray-400 hover:text-gray-700 hover:shadow-sm transition-all flex items-center justify-center border border-gray-100">－</button>
                                    <input type="number" value={item.transferQty}
                                        onChange={e => updateQty(idx, parseInt(e.target.value) || 0)}
                                        className="w-12 text-center text-[13px] font-bold bg-transparent outline-none text-gray-800" />
                                    <button onClick={() => updateQty(idx, Math.min(item.available, item.transferQty + 1))}
                                        className="w-8 h-8 rounded-lg bg-white text-gray-400 hover:text-gray-700 hover:shadow-sm transition-all flex items-center justify-center border border-gray-100">＋</button>
                                </div>
                                <div className="w-8 text-[11px] font-bold text-gray-400 text-right">{item.unit}</div>
                            </div>
                        ))}
                    </div>

                    {items.some(i => i.transferQty > 0) && (
                        <div className="mt-8 p-6 rounded-xl bg-blue-50/50 border border-blue-100 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="text-[11px] font-bold text-blue-600 mb-3 uppercase  flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Transfer Summary
                            </div>
                            <div className="space-y-2">
                                {items.filter(i => i.transferQty > 0).map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-[13px]">
                                        <span className="text-gray-600 font-medium">{item.name}</span>
                                        <span className="font-bold text-blue-700">{item.transferQty} {item.unit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <PrimaryBtn onClick={generate} className="flex-1 py-4">Generate Challan & Transfer</PrimaryBtn>
                        <SecondaryBtn onClick={() => setItems(ITEMS_POOL.map(i => ({ ...i, transferQty: 0 })))} className="px-8">Reset</SecondaryBtn>
                    </div>
                </VCard>
            </div>
        </div>
    );
}
