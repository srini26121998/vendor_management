import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, VENDOR_ROUTES } from './vendorConstants';
import { fetchVendors } from '../../api/vendorService';
import { PageHeader, VCard, SectionTitle, AINudgeBanner, PrimaryBtn, SecondaryBtn } from './VendorComponents';
import toast from 'react-hot-toast';

const REORDER_ITEMS = [
    { name: 'Basmati Rice (Premium)', current: 12, reorder: 50, unit: 'Kg', vendor: 'Sunrise Foods', risk: 'High' },
    { name: 'Sunflower Oil', current: 8, reorder: 30, unit: 'L', vendor: 'Sunrise Foods', risk: 'High' },
    { name: 'Turmeric Powder', current: 4, reorder: 20, unit: 'Kg', vendor: 'SpiceMart', risk: 'Critical' },
];

const ANOMALIES = [
    { vendor: 'Sunrise Foods', sku: 'SKU#4521', item: 'Basmati Rice', offered: 110, market: 95, excess: 15.8 },
    { vendor: 'Metro Grain', sku: 'SKU#2210', item: 'Wheat Flour', offered: 52, market: 45, excess: 15.6 },
];



export default function AIInsightsPanel() {
    const navigate = useNavigate();
    const [generatedPOs, setGeneratedPOs] = useState([]);
    const [vendors, setVendors] = useState([]);

    useEffect(() => {
        fetchVendors().then(data => setVendors(Array.isArray(data) ? data : []));
    }, []);

    const topVendors = useMemo(() =>
        vendors.slice(0, 5).map((v, i) => ({
            name: v.name, score: [98, 94, 91, 85, 78][i] ?? 70, rank: i + 1, trend: ['+2', '+1', '0', '-1', '-3'][i] ?? '0',
        })), [vendors]
    );

    const generatePO = (item) => {
        setGeneratedPOs(g => [...g, item.name]);
        toast.success(`PO Draft generated for ${item.name}`);
    };

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[24px] font-bold text-[#1e293b]">AI Insights Panel</h1>
                        <nav className="text-[12px] text-[#64748b] mt-1 font-medium uppercase tracking-wider">
                            vendors / <span className="text-[#3b82f6]">ai intelligence</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <PrimaryBtn icon="🤖">
                            Intelligence Settings
                        </PrimaryBtn>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Reorder Queue */}
                <div className="space-y-4">
                    <SectionTitle action={<span className="text-[11px] font-bold text-rose-500 uppercase ">{REORDER_ITEMS.length} items requiring immediate action</span>}>
                        Reorder Queue
                    </SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {REORDER_ITEMS.map((item, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${item.risk === 'Critical' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg border border-gray-100 group-hover:scale-110 transition-transform">📦</div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${item.risk === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {item.risk}
                                    </span>
                                </div>
                                <h3 className="text-[15px] font-bold text-[#1e293b] mb-1 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                                <p className="text-[11px] font-bold text-gray-400 uppercase  mb-4">Via {item.vendor}</p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-gray-400 uppercase tracking-wider">Current Stock</span>
                                        <span className="text-rose-600">{item.current} {item.unit}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div className="h-full rounded-full bg-rose-500 transition-all duration-700" style={{ width: `${(item.current / item.reorder) * 100}%` }} />
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Threshold: {item.reorder} {item.unit}</div>
                                </div>

                                {generatedPOs.includes(item.name) ? (
                                    <div className="w-full py-2.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-xl border border-emerald-100 flex items-center justify-center gap-2 uppercase ">
                                        ✓ PO Generated
                                    </div>
                                ) : (
                                    <button onClick={() => generatePO(item)}
                                        className="w-full py-2.5 bg-blue-700 text-white text-[11px] font-bold rounded-xl hover:bg-blue-600 transition-all uppercase  shadow-md shadow-gray-200">
                                        Generate Draft PO
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Price Anomalies */}
                    <div className="space-y-4">
                        <SectionTitle>Price Anomaly Alerts</SectionTitle>
                        <div className="space-y-3">
                            {ANOMALIES.map((a, i) => (
                                <div key={i} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-xl border border-orange-100 transition-transform group-hover:scale-110">💸</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-[14px] font-bold text-[#1e293b] truncate">{a.vendor}</h3>
                                                <span className="text-[10px] font-mono text-gray-400">({a.sku})</span>
                                            </div>
                                            <div className="text-[12px] font-medium text-gray-600 mb-2">{a.item} detected at inflated price</div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">+{a.excess}% excess</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase ">Quoted: ₹{a.offered} · Market: ₹{a.market}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button className="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-gray-50 text-gray-600 border border-gray-100 hover:bg-white transition-all uppercase tracking-wider">View</button>
                                            <button className="px-4 py-1.5 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all uppercase tracking-wider">Flag</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vendor Performance */}
                    <div className="space-y-4">
                        <SectionTitle>Vendor Performance Ranking</SectionTitle>
                        <VCard className="overflow-hidden">
                            <div className="divide-y divide-gray-50">
                                {topVendors.map((v, i) => (
                                    <div key={i} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0 group transition-colors hover:bg-gray-50/30 -mx-6 px-6">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold shadow-sm ${i === 0 ? 'bg-amber-400 text-white' :
                                            i === 1 ? 'bg-slate-300 text-slate-700' :
                                                i === 2 ? 'bg-orange-700 text-white' :
                                                    'bg-gray-50 text-gray-400'
                                            }`}>
                                            {v.rank}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[14px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{v.name}</div>
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                                                    <div className="h-full rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${v.score}%` }} />
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-700 w-8 text-right">{v.score}</span>
                                            </div>
                                        </div>
                                        <div className={`flex flex-col items-end min-w-[40px] ${v.trend.startsWith('+') ? 'text-emerald-500' : v.trend === '0' ? 'text-gray-300' : 'text-rose-500'}`}>
                                            <span className="text-[11px] font-bold">{v.trend}</span>
                                            <span className="text-[8px] font-bold uppercase tracking-tighter">Trend</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </VCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
