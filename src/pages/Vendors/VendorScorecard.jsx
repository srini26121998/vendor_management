import React, { useState, useEffect } from 'react';
import { VENDOR_ROUTES } from './vendorConstants';
import { PageHeader, VCard, SectionTitle, TierBadge, StatusBadge, MultiChart } from './VendorComponents';
import { fetchVendors, fetchVendorScorecard } from '../../api/vendorService';
import toast from 'react-hot-toast';

export default function VendorScorecard() {
    const [vendorsList, setVendorsList] = useState([]);
    const [selected, setSelected] = useState('');
    const [scorecardData, setScorecardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Fetch the master list of registered vendors on mount
    useEffect(() => {
        fetchVendors()
            .then(res => {
                const list = Array.isArray(res.data || res) ? (res.data || res) : [];
                setVendorsList(list);
                if (list.length > 0) {
                    setSelected(list[0].id);
                } else {
                    setIsLoading(false);
                }
            })
            .catch(err => {
                console.error("Failed to load vendors list", err);
                toast.error("Failed to sync vendor directory");
                setIsLoading(false);
            });
    }, []);

    // 2. Fetch the calculated real-time operational scorecard whenever selection changes
    useEffect(() => {
        if (!selected) return;
        setIsLoading(true);
        fetchVendorScorecard(selected)
            .then(res => {
                setScorecardData(res.data || res);
            })
            .catch(err => {
                console.error("Failed to load scorecard metrics", err);
                toast.error("Failed to calculate real-time performance");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [selected]);

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[#F3F5F9] flex items-center justify-center" style={{ fontFamily: '"Inter", sans-serif' }}>
                <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 max-w-sm border border-slate-100/50">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">Syncing performance metrics...</h3>
                    <p className="text-xs text-slate-400 font-medium text-center leading-relaxed">Aggregating PO timelines, GRN receipts, quality audits, and compliance indices to update the performance dashboard in real-time.</p>
                </div>
            </div>
        );
    }

    if (!scorecardData) {
        return (
            <div className="w-full bg-[#F3F5F9] min-h-screen p-8 text-center flex flex-col items-center justify-center font-bold text-slate-500">
                No performance data available. Please onboard a vendor first.
            </div>
        );
    }

    // 3. Map dynamic API values to existing visual properties
    const overallScore = scorecardData.overallScore || 0;
    const vendorTier = scorecardData.tier || 'SILVER';

    const metrics = [
        { metric: 'On-Time Delivery', value: scorecardData.onTimeDelivery || 0, benchmark: scorecardData.onTimeBenchmark || 88 },
        { metric: 'Quality Score', value: scorecardData.qualityScore || 0, benchmark: scorecardData.qualityBenchmark || 80 },
        { metric: 'Price Competitiveness', value: scorecardData.priceCompetitiveness || 0, benchmark: scorecardData.priceBenchmark || 82 },
        { metric: 'GST Compliance', value: scorecardData.gstCompliance || 0, benchmark: scorecardData.gstBenchmark || 90 },
        { metric: 'Response Time', value: scorecardData.responseTime || 0, benchmark: scorecardData.responseBenchmark || 85 },
        { metric: 'Fulfillment Rate', value: scorecardData.fulfillmentRate || 0, benchmark: scorecardData.fulfillmentBenchmark || 91 },
    ];

    const radarData = metrics.map(m => ({
        metric: m.metric.split(' ')[0],
        self: m.value,
        benchmark: m.benchmark
    }));

    const peerVendors = (scorecardData.peers || []).map(p => ({
        name: p.name ? (p.name.split(' ').slice(0, 2).join(' ')) : 'Peer',
        score: p.score,
        fulfillment: p.fulfillment,
        tier: p.tier
    }));

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[24px] font-bold text-[#1e293b]">Vendor Scorecard</h1>
                        <nav className="text-[12px] text-[#64748b] mt-1 font-medium">
                            vendors / <span className="text-[#3b82f6]">performance analytics</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={selected} onChange={e => setSelected(e.target.value)}
                            className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-[13px] text-gray-700 shadow-sm outline-none focus:border-blue-400 transition-all cursor-pointer">
                            {vendorsList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <TierBadge tier={vendorTier} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Radar Chart */}
                <VCard className="lg:col-span-1 flex flex-col items-center">
                    <MultiChart
                        title="Performance Radar"
                        data={radarData}
                        series={[
                            { key: 'self', label: 'Vendor', color: '#3b82f6' },
                            { key: 'benchmark', label: 'Benchmark', color: '#cbd5e1' }
                        ]}
                        xAxisKey="metric"
                        height={250}
                        defaultType="radar"
                    />
                    <div className="text-center my-4">
                        <div className="text-4xl font-bold text-gray-900 tracking-tighter">
                            {overallScore}
                        </div>
                        <div className="text-[11px] font-bold text-gray-400 uppercase mt-1">Overall Integrity</div>
                    </div>
                </VCard>

                {/* Metrics Breakdown */}
                <VCard className="lg:col-span-2">
                    <SectionTitle>Metric Breakdown</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 mt-6">
                        {metrics.map((m, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between text-[12px] mb-2 font-bold uppercase tracking-wider">
                                    <span className="text-gray-500">{m.metric}</span>
                                    <div className="flex gap-3">
                                        <span className={m.value >= m.benchmark ? 'text-emerald-600' : 'text-rose-600'}>{m.value}%</span>
                                        <span className="text-gray-300">/</span>
                                        <span className="text-gray-400">{m.benchmark}%</span>
                                    </div>
                                </div>
                                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`absolute h-full rounded-full transition-all duration-1000 ${m.value >= 90 ? 'bg-emerald-500' : m.value >= 75 ? 'bg-blue-500' : 'bg-rose-500'}`}
                                        style={{ width: `${m.value}%` }} />
                                    {/* Benchmark marker */}
                                    <div className="absolute top-0 w-px h-full bg-white z-10" style={{ left: `${m.benchmark}%` }} />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <div className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Real-time Performance</div>
                                    {m.value < m.benchmark && <div className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Action Required</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </VCard>
            </div>

            {/* Peer Comparison */}
            <VCard className="mt-6">
                <MultiChart
                    title="Global Peer Comparison"
                    data={peerVendors}
                    series={[
                        { key: 'score', label: 'Overall Score', color: '#3b82f6' }
                    ]}
                    xAxisKey="name"
                    height={250}
                />
            </VCard>
        </div>
    );
}
