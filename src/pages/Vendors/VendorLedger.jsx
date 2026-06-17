import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import { VCard, SectionTitle, SecondaryBtn, PrimaryBtn, VTabs, MultiChart } from './VendorComponents';
import { ArrowLeft, Filter, Download, Printer, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchVendors, fetchInvoices, fetchPayments } from '../../api/vendorService';

const TYPE_COLORS = {
    purchase: 'bg-blue-50 text-blue-700 border-blue-100',
    payment: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    adjustment: 'bg-amber-50 text-amber-700 border-amber-100',
    balance: 'bg-slate-100 text-slate-500 border-slate-200',
};

const SortIcon = ({ col, sortConfig }) => {
    if (!sortConfig || sortConfig.key !== col) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-blue-500" /> : <ChevronDown size={12} className="text-blue-500" />;
};

/* ─── Per-Vendor Ledger Data ──────────────────────────────────────────── */
const VENDOR_LEDGER_DATA = {
    V001: {
        chart: [
            { month: 'Nov', debit: 320000, credit: 280000 }, { month: 'Dec', debit: 410000, credit: 390000 },
            { month: 'Jan', debit: 275000, credit: 260000 }, { month: 'Feb', debit: 340000, credit: 310000 },
            { month: 'Mar', debit: 480000, credit: 450000 }, { month: 'Apr', debit: 420000, credit: 385000 },
        ],
        rows: [
            { date: '2026-01-05', desc: 'Opening Balance', debit: 0, credit: 0, type: 'balance' },
            { date: '2026-01-12', desc: 'PO-2026-0101 Purchase', debit: 125000, credit: 0, type: 'purchase' },
            { date: '2026-01-20', desc: 'Payment PAY-2026-0021', debit: 0, credit: 125000, type: 'payment' },
            { date: '2026-02-08', desc: 'PO-2026-0156 Purchase', debit: 180000, credit: 0, type: 'purchase' },
            { date: '2026-02-18', desc: 'Payment PAY-2026-0044', debit: 0, credit: 180000, type: 'payment' },
            { date: '2026-03-02', desc: 'PO-2026-0280 Purchase', debit: 220000, credit: 0, type: 'purchase' },
            { date: '2026-03-15', desc: 'GRN-2026-0290 — Price diff', debit: 3500, credit: 0, type: 'adjustment' },
            { date: '2026-03-22', desc: 'Payment PAY-2026-0068', debit: 0, credit: 220000, type: 'payment' },
            { date: '2026-04-10', desc: 'PO-2026-0409 Purchase', debit: 95000, credit: 0, type: 'purchase' },
            { date: '2026-04-15', desc: 'Payment PAY-2026-0086', debit: 0, credit: 95000, type: 'payment' },
            { date: '2026-04-22', desc: 'GRN-2026-0310 — Price diff', debit: 2000, credit: 0, type: 'adjustment' },
            { date: '2026-04-28', desc: 'PO-2026-0421 Purchase', debit: 84500, credit: 0, type: 'purchase' },
            { date: '2026-05-03', desc: 'Payment PAY-2026-0092', debit: 0, credit: 84500, type: 'payment' },
            { date: '2026-05-06', desc: 'PO-2026-0510 Purchase', debit: 67000, credit: 0, type: 'purchase' },
        ],
    },
    V002: {
        chart: [
            { month: 'Nov', debit: 180000, credit: 170000 }, { month: 'Dec', debit: 220000, credit: 200000 },
            { month: 'Jan', debit: 160000, credit: 155000 }, { month: 'Feb', debit: 195000, credit: 190000 },
            { month: 'Mar', debit: 250000, credit: 240000 }, { month: 'Apr', debit: 210000, credit: 195000 },
        ],
        rows: [
            { date: '2026-02-01', desc: 'Opening Balance', debit: 0, credit: 0, type: 'balance' },
            { date: '2026-02-10', desc: 'PO-2026-0200 Purchase', debit: 95000, credit: 0, type: 'purchase' },
            { date: '2026-02-20', desc: 'Payment PAY-2026-0040', debit: 0, credit: 95000, type: 'payment' },
            { date: '2026-03-05', desc: 'PO-2026-0289 Purchase', debit: 128000, credit: 0, type: 'purchase' },
            { date: '2026-03-18', desc: 'Payment PAY-2026-0062', debit: 0, credit: 128000, type: 'payment' },
            { date: '2026-04-02', desc: 'PO-2026-0390 Purchase', debit: 72000, credit: 0, type: 'purchase' },
            { date: '2026-04-15', desc: 'Payment PAY-2026-0081', debit: 0, credit: 72000, type: 'payment' },
            { date: '2026-04-22', desc: 'PO-2026-0415 Purchase', debit: 38000, credit: 0, type: 'purchase' },
            { date: '2026-05-01', desc: 'Payment PAY-2026-0089', debit: 0, credit: 38000, type: 'payment' },
        ],
    },
    V003: {
        chart: [
            { month: 'Nov', debit: 420000, credit: 380000 }, { month: 'Dec', debit: 510000, credit: 470000 },
            { month: 'Jan', debit: 380000, credit: 360000 }, { month: 'Feb', debit: 460000, credit: 420000 },
            { month: 'Mar', debit: 580000, credit: 540000 }, { month: 'Apr', debit: 520000, credit: 480000 },
        ],
        rows: [
            { date: '2026-03-01', desc: 'Opening Balance', debit: 0, credit: 0, type: 'balance' },
            { date: '2026-03-08', desc: 'PO-2026-0270 Purchase', debit: 245000, credit: 0, type: 'purchase' },
            { date: '2026-03-20', desc: 'Payment PAY-2026-0058', debit: 0, credit: 200000, type: 'payment' },
            { date: '2026-04-05', desc: 'PO-2026-0395 Purchase', debit: 156000, credit: 0, type: 'purchase' },
            { date: '2026-04-18', desc: 'GRN-2026-0305 — Qty diff', debit: 0, credit: 8000, type: 'adjustment' },
            { date: '2026-04-25', desc: 'Payment PAY-2026-0083', debit: 0, credit: 156000, type: 'payment' },
            { date: '2026-04-30', desc: 'PO-2026-0430 Purchase', debit: 142000, credit: 0, type: 'purchase' },
            { date: '2026-05-05', desc: 'Payment PAY-2026-0091', debit: 0, credit: 142000, type: 'payment' },
        ],
    },
};

const DATE_RANGES = ['This Month', 'Last 3 Months', 'This FY', 'Custom'];
const TABS = [{ key: 'ledger', label: 'Ledger', icon: '📊' }, { key: 'gst', label: 'GST Register', icon: '📋' }];

function getDateRange(range) {
    const now = new Date();
    let start;
    switch (range) {
        case 'This Month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'Last 3 Months':
            start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
        case 'This FY':
            start = now.getMonth() >= 3
                ? new Date(now.getFullYear(), 3, 1)
                : new Date(now.getFullYear() - 1, 3, 1);
            break;
        default:
            return null;
    }
    return { start, end: now };
}

export default function VendorLedger() {
    const navigate = useNavigate();
    
    const [vendors, setVendors] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [tab, setTab] = useState('ledger');
    const [dateRange, setDateRange] = useState('This FY');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const itemsPerPage = 8;

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetchVendors(),
            fetchInvoices(),
            fetchPayments()
        ]).then(([vRes, iRes, pRes]) => {
            const vData = Array.isArray(vRes.data || vRes) ? (vRes.data || vRes) : [];
            const iData = Array.isArray(iRes.data || iRes) ? (iRes.data || iRes) : [];
            const pData = Array.isArray(pRes.data || pRes) ? (pRes.data || pRes) : [];
            
            setVendors(vData);
            setInvoices(iData);
            setPayments(pData);

            if (vData.length > 0) {
                setSelectedVendorId(vData[0].id);
            }
        }).catch(err => {
            console.error("Failed to load live ledger data", err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    const selectedVendor = useMemo(() => {
        return vendors.find(v => v.id === selectedVendorId) || vendors[0] || null;
    }, [vendors, selectedVendorId]);

    const processedRows = useMemo(() => {
        if (!selectedVendorId) return [];

        const vInvoices = invoices.filter(inv => inv.vendorId === selectedVendorId);
        const vPayments = payments.filter(pay => pay.vendorId === selectedVendorId);

        const invoiceRows = vInvoices.map(inv => ({
            date: inv.invoiceDate,
            desc: `Purchase Invoice ${inv.invoiceNumber} (${inv.submissionStatus})`,
            debit: inv.totalAmount,
            credit: 0,
            type: 'purchase'
        }));

        const paymentRows = vPayments.map(pay => ({
            date: pay.createdAt ? pay.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            desc: `Payment ${pay.paymentNumber} via ${pay.paymentMode} ${pay.holdAmount > 0 ? `(Deducted hold amount: ${formatCurrency(pay.holdAmount)})` : ''}`,
            debit: 0,
            credit: pay.paymentAmount,
            type: 'payment'
        }));

        const combined = [...invoiceRows, ...paymentRows];
        combined.sort((a, b) => new Date(a.date) - new Date(b.date));

        let currentBalance = 0;
        const withBalance = combined.map(r => {
            currentBalance += (r.debit - r.credit);
            return { ...r, runningBalance: currentBalance };
        });

        const range = getDateRange(dateRange);
        let rows = withBalance.filter(r => {
            const d = new Date(r.date);
            const dateMatch = !range || (d >= range.start && d <= range.end);
            const typeMatch = typeFilter === 'all' || r.type === typeFilter;
            return dateMatch && typeMatch;
        });

        rows.sort((a, b) => {
            if (sortConfig.key === 'date') {
                const da = new Date(a.date), db = new Date(b.date);
                return sortConfig.direction === 'asc' ? da - db : db - da;
            }
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return rows;
    }, [invoices, payments, selectedVendorId, dateRange, typeFilter, sortConfig]);

    const totalPages = Math.ceil(processedRows.length / itemsPerPage);
    const paginatedRows = processedRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const filteredChart = useMemo(() => {
        if (!selectedVendorId) return [];

        const vInvoices = invoices.filter(inv => inv.vendorId === selectedVendorId);
        const vPayments = payments.filter(pay => pay.vendorId === selectedVendorId);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = {};
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = months[d.getMonth()];
            monthlyData[label] = { month: label, debit: 0, credit: 0 };
        }

        vInvoices.forEach(inv => {
            const d = new Date(inv.invoiceDate);
            const label = months[d.getMonth()];
            if (monthlyData[label]) {
                monthlyData[label].debit += inv.totalAmount;
            }
        });

        vPayments.forEach(pay => {
            const dateStr = pay.createdAt || new Date().toISOString();
            const d = new Date(dateStr);
            const label = months[d.getMonth()];
            if (monthlyData[label]) {
                monthlyData[label].credit += pay.paymentAmount;
            }
        });

        return Object.values(monthlyData);
    }, [invoices, payments, selectedVendorId]);

    const gstSummary = useMemo(() => {
        if (!selectedVendorId) return { igst: 0, cgst: 0, sgst: 0 };
        const vInvoices = invoices.filter(inv => inv.vendorId === selectedVendorId);
        const totalGst = vInvoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0);
        return {
            igst: totalGst * 0.6,
            cgst: totalGst * 0.2,
            sgst: totalGst * 0.2
        };
    }, [invoices, selectedVendorId]);

    const totalDebit = processedRows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = processedRows.reduce((s, r) => s + r.credit, 0);
    const netBalance = totalDebit - totalCredit;

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };


    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[#F3F5F9] flex items-center justify-center" style={{ fontFamily: '"Inter", sans-serif' }}>
                <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 max-w-sm border border-slate-100/50">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">Syncing financial ledger...</h3>
                    <p className="text-xs text-slate-400 font-medium text-center leading-relaxed">Retrieving real-time purchase invoices, GST schedules, and payment logs from the server.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#F3F5F9] p-4 sm:p-6 pb-20" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto space-y-4">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-[#1e293b]">Vendor Ledger</h1>
                            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Purchase & payment history per vendor</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={selectedVendorId}
                            onChange={e => { setSelectedVendorId(e.target.value); setCurrentPage(1); }}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 outline-none shadow-sm cursor-pointer hover:border-blue-300 transition-all">
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name || v.legalName}</option>)}
                        </select>
                        <button onClick={() => setShowFilters(s => !s)}
                            className={`p-2 rounded-lg border transition-all shadow-sm ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            <Filter size={16} />
                        </button>
                        <button onClick={() => window.print()} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-all shadow-sm" title="Print Ledger">
                            <Printer size={16} />
                        </button>
                        <button onClick={() => {
                            const lines = processedRows.map(r =>
                                `${r.date}\t${r.desc}\t${r.debit || '-'}\t${r.credit || '-'}\t${r.runningBalance}`
                            );
                            const blob = new Blob([['Date\tDescription\tDebit\tCredit\tBalance', ...lines].join('\n')], { type: 'text/plain' });
                            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                            a.download = `${selectedVendor?.name || selectedVendor?.legalName || 'Vendor'}_Ledger.txt`; a.click();
                        }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-all shadow-sm" title="Download Ledger">
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Filters Panel ── */}
                {showFilters && (
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap gap-5 items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</label>
                            <div className="flex gap-1 flex-wrap">
                                {DATE_RANGES.map(r => (
                                    <button key={r} onClick={() => { setDateRange(r); setCurrentPage(1); }}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${dateRange === r ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</label>
                            <div className="flex gap-1 flex-wrap">
                                {['all', 'purchase', 'payment', 'adjustment', 'balance'].map(t => (
                                    <button key={t} onClick={() => { setTypeFilter(t); setCurrentPage(1); }}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${typeFilter === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Summary KPIs ── */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total Purchases', value: formatCurrency(totalDebit), color: '#2563eb', bg: '#EFF6FF' },
                        { label: 'Total Payments', value: formatCurrency(totalCredit), color: '#16a34a', bg: '#F0FDF4' },
                        { label: 'Net Balance', value: `${formatCurrency(Math.abs(netBalance))} ${netBalance > 0 ? 'Dr' : 'Cr'}`, color: netBalance > 0 ? '#dc2626' : '#16a34a', bg: netBalance > 0 ? '#FEF2F2' : '#F0FDF4' },
                    ].map(kpi => (
                        <div key={kpi.label} className="rounded-xl p-4 text-center border border-white shadow-sm" style={{ background: kpi.bg }}>
                            <div className="text-xl font-bold tracking-tight" style={{ color: kpi.color }}>{kpi.value}</div>
                            <div className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{kpi.label}</div>
                        </div>
                    ))}
                </div>

                {/* ── Chart ── */}
                {filteredChart.length > 0 && (
                    <VCard>
                        <MultiChart
                            title={`Purchase vs Payment Timeline — ${selectedVendor?.name || selectedVendor?.legalName || 'Vendor'}`}
                            data={filteredChart}
                            series={[
                                { key: 'debit', label: 'Purchases', color: '#2563eb' },
                                { key: 'credit', label: 'Payments', color: '#16a34a' }
                            ]}
                            xAxisKey="month"
                            height={220}
                            yAxisFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                        />
                    </VCard>
                )}

                <VTabs tabs={TABS} active={tab} onChange={setTab} />

                {/* ── Ledger Table ── */}
                {tab === 'ledger' && (
                    <VCard noPad>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead style={{ background: '#F8FAFC' }}>
                                    <tr className="border-b border-slate-100 text-[11px] text-slate-500 uppercase font-bold">
                                        <th className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort('date')}>
                                            <div className="flex items-center gap-1.5">Date <SortIcon col="date" sortConfig={sortConfig} /></div>
                                        </th>
                                        <th className="px-5 py-4 text-left cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('desc')}>
                                            <div className="flex items-center gap-1.5">Description <SortIcon col="desc" sortConfig={sortConfig} /></div>
                                        </th>
                                        <th className="px-5 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort('debit')}>
                                            <div className="flex items-center gap-1.5 justify-end">Debit (Dr) <SortIcon col="debit" sortConfig={sortConfig} /></div>
                                        </th>
                                        <th className="px-5 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap" onClick={() => handleSort('credit')}>
                                            <div className="flex items-center gap-1.5 justify-end">Credit (Cr) <SortIcon col="credit" sortConfig={sortConfig} /></div>
                                        </th>
                                        <th className="px-5 py-4 text-right whitespace-nowrap">Balance (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-16 text-center text-slate-400 text-[13px]">
                                                No transactions found for the selected criteria
                                            </td>
                                        </tr>
                                    ) : paginatedRows.map((row, i) => (
                                        <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors">
                                            <td className="px-5 py-3.5 text-[12px] text-slate-500 font-medium whitespace-nowrap">{formatDate(row.date)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[13px] font-semibold text-slate-700">{row.desc}</span>
                                                    <span className={`w-fit text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${TYPE_COLORS[row.type] || TYPE_COLORS.balance}`}>
                                                        {row.type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                                                {row.debit > 0 ? <span className="text-rose-600">{formatCurrency(row.debit)}</span> : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold whitespace-nowrap">
                                                {row.credit > 0 ? <span className="text-emerald-600">{formatCurrency(row.credit)}</span> : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className={`px-5 py-3.5 text-right font-bold whitespace-nowrap ${row.runningBalance <= 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                {formatCurrency(Math.abs(row.runningBalance))}
                                                <span className="text-[9px] ml-1 font-black">{row.runningBalance > 0 ? 'Dr' : 'Cr'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {processedRows.length > itemsPerPage && (
                            <div className="p-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-bold">
                                    Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, processedRows.length)} of {processedRows.length}
                                </span>
                                <div className="flex gap-1">
                                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all">← Prev</button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button key={i} onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded-lg text-[11px] font-bold transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}
                                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-all">Next →</button>
                                </div>
                            </div>
                        )}
                    </VCard>
                )}

                {/* ── GST Register Tab ── */}
                {tab === 'gst' && (
                    <VCard>
                        <SectionTitle>GST Register — {selectedVendor?.name || selectedVendor?.legalName || 'Vendor'}</SectionTitle>
                        <div className="text-[13px] text-slate-500 py-4 text-center">
                            GST register export available — click the Download button above
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-2">
                            {[['IGST', '₹28,500'], ['CGST', '₹7,200'], ['SGST', '₹6,480']].map(([tax, val]) => (
                                <div key={tax} className="p-4 bg-blue-50 rounded-xl text-center border border-blue-100">
                                    <div className="text-xl font-bold text-blue-700">{val}</div>
                                    <div className="text-[11px] font-bold text-blue-500 uppercase mt-0.5">{tax}</div>
                                </div>
                            ))}
                        </div>
                    </VCard>
                )}

            </div>
        </div>
    );
}
