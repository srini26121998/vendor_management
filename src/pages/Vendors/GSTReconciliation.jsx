import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader, VCard, PrimaryBtn, SecondaryBtn, VModal } from './VendorComponents';
import { Search, Download, ArrowDownLeft, ArrowUpRight, TrendingUp, Package, ShoppingCart, Users, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Eye, Edit3, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchInputTaxData, fetchOutputTaxData } from '../../api/vendorService';
import { formatCurrency } from './vendorConstants';

export default function GSTReconciliation() {
  const [activeTab, setActiveTab] = useState('input');
  const [inputData, setInputData] = useState([]);
  const [outputData, setOutputData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [search, setSearch] = useState('');

  const loadData = () => {
    setIsLoading(true);
    const params = { period };

    Promise.all([
      fetchInputTaxData(params),
      fetchOutputTaxData(params),
    ])
      .then(([inputRes, outputRes]) => {
        const inp = Array.isArray(inputRes?.data || inputRes) ? (inputRes?.data || inputRes) : [];
        const out = Array.isArray(outputRes?.data || outputRes) ? (outputRes?.data || outputRes) : [];
        setInputData(inp);
        setOutputData(out);
      })
      .catch(err => {
        console.error('Failed to load GST data', err);
        toast.error('Failed to fetch GST tax data');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadData(); }, [period]);

  // ── Filtered Data ──
  const filteredInput = useMemo(() => {
    if (!search) return inputData;
    const s = search.toLowerCase();
    return inputData.filter(r =>
      (r.vendorName || '').toLowerCase().includes(s) ||
      (r.poNumber || '').toLowerCase().includes(s) ||
      (r.batchNumber || '').toLowerCase().includes(s) ||
      (r.productName || '').toLowerCase().includes(s)
    );
  }, [inputData, search]);

  const filteredOutput = useMemo(() => {
    if (!search) return outputData;
    const s = search.toLowerCase();
    return outputData.filter(r =>
      (r.invoiceNumber || '').toLowerCase().includes(s) ||
      (r.category || '').toLowerCase().includes(s) ||
      (r.customerName || '').toLowerCase().includes(s)
    );
  }, [outputData, search]);

  // ── KPI Calculations ──
  const inputKpis = useMemo(() => {
    const totalTax = filteredInput.reduce((s, r) => s + (r.gstAmount || 0), 0);
    const orderIds = new Set(filteredInput.map(r => r.orderId));
    const orderCount = orderIds.size;
    const avgTax = orderCount > 0 ? totalTax / orderCount : 0;

    // Top vendor by tax
    const vendorTax = {};
    filteredInput.forEach(r => {
      vendorTax[r.vendorName] = (vendorTax[r.vendorName] || 0) + (r.gstAmount || 0);
    });
    const topVendor = Object.entries(vendorTax).sort((a, b) => b[1] - a[1])[0];

    return { totalTax, orderCount, avgTax, topVendor: topVendor ? topVendor[0] : '—', topVendorTax: topVendor ? topVendor[1] : 0 };
  }, [filteredInput]);

  const outputKpis = useMemo(() => {
    const totalTax = filteredOutput.reduce((s, r) => s + (r.totalGstAmount || 0), 0);
    const salesCount = filteredOutput.length;
    const avgTax = salesCount > 0 ? totalTax / salesCount : 0;

    // Top category by tax
    const catTax = {};
    filteredOutput.forEach(r => {
      catTax[r.category] = (catTax[r.category] || 0) + (r.totalGstAmount || 0);
    });
    const topCat = Object.entries(catTax).sort((a, b) => b[1] - a[1])[0];

    return { totalTax, salesCount, avgTax, topCategory: topCat ? topCat[0] : '—', topCategoryTax: topCat ? topCat[1] : 0 };
  }, [filteredOutput]);

  const kpis = activeTab === 'input' ? inputKpis : outputKpis;

  // ── Modal State ──
  const [viewModal, setViewModal] = useState({ open: false, row: null, type: null });
  const [editModal, setEditModal] = useState({ open: false, row: null, type: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, row: null, type: null });

  // ── Action Handlers ──
  const handleView = (row, type) => setViewModal({ open: true, row, type });
  const handleEdit = (row, type) => setEditModal({ open: true, row: { ...row }, type });
  const handleDeletePrompt = (row, type) => setDeleteConfirm({ open: true, row, type });

  const handleDeleteConfirm = () => {
    const { row, type } = deleteConfirm;
    if (type === 'input') {
      setInputData(prev => prev.filter(r => r !== row));
      toast.success(`Input tax entry for ${row.vendorName || 'Unknown'} removed`);
    } else {
      setOutputData(prev => prev.filter(r => r !== row));
      toast.success(`Output tax entry ${row.invoiceNumber || ''} removed`);
    }
    setDeleteConfirm({ open: false, row: null, type: null });
  };

  const handleEditSave = (updatedRow) => {
    if (editModal.type === 'input') {
      setInputData(prev => prev.map(r => r === editModal.row ? { ...r, ...updatedRow } : r));
      toast.success('Input tax entry updated');
    } else {
      setOutputData(prev => prev.map(r => r === editModal.row ? { ...r, ...updatedRow } : r));
      toast.success('Output tax entry updated');
    }
    setEditModal({ open: false, row: null, type: null });
  };

  // ── Export ──
  const handleExport = () => {
    toast('Exporting GST data…', { icon: '📤' });
  };

  // ── Styles ──
  const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all";

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F3F5F9] flex items-center justify-center" style={{ fontFamily: '"Inter", sans-serif' }}>
        <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 max-w-sm border border-slate-100/50">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-slate-800 tracking-tight">Loading GST data...</h3>
          <p className="text-xs text-slate-400 font-medium text-center leading-relaxed">Fetching Input Tax Credit and Output Tax records for the selected period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4" style={{ fontFamily: '"Inter", sans-serif' }}>
      <PageHeader
        title="GST Tax Tracker"
        subtitle="Track your Input Tax Credit (purchases) and Output Tax (sales) in one place"
        actions={<>
          <SecondaryBtn onClick={() => loadData()}>Refresh Data</SecondaryBtn>
          <PrimaryBtn onClick={handleExport}>Export Report</PrimaryBtn>
        </>}
      />

      {/* ── Tab Toggle ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => { setActiveTab('input'); setSearch(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wide transition-all duration-300
              ${activeTab === 'input'
                ? 'bg-white text-blue-700 shadow-md shadow-blue-100/50 border border-blue-100'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArrowDownLeft size={14} />
            Input Tax Credit
          </button>
          <button
            onClick={() => { setActiveTab('output'); setSearch(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wide transition-all duration-300
              ${activeTab === 'output'
                ? 'bg-white text-emerald-700 shadow-md shadow-emerald-100/50 border border-emerald-100'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ArrowUpRight size={14} />
            Output Tax
          </button>
        </div>

        {/* Period Picker */}
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period</label>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all bg-white"
          />
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {activeTab === 'input' ? (
          <>
            <KpiCard
              label="Total Input Tax"
              value={formatCurrency(kpis.totalTax)}
              icon={<ArrowDownLeft size={18} />}
              color="#2563eb"
              bg="linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)"
            />
            <KpiCard
              label="Purchase Orders"
              value={kpis.orderCount}
              icon={<Package size={18} />}
              color="#7c3aed"
              bg="linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)"
            />
            <KpiCard
              label="Avg Tax / Order"
              value={formatCurrency(kpis.avgTax)}
              icon={<TrendingUp size={18} />}
              color="#059669"
              bg="linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)"
            />
            <KpiCard
              label="Top Vendor"
              value={kpis.topVendor}
              subtitle={formatCurrency(kpis.topVendorTax)}
              icon={<Users size={18} />}
              color="#d97706"
              bg="linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
            />
          </>
        ) : (
          <>
            <KpiCard
              label="Total Output Tax"
              value={formatCurrency(kpis.totalTax)}
              icon={<ArrowUpRight size={18} />}
              color="#059669"
              bg="linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)"
            />
            <KpiCard
              label="Sales Invoices"
              value={kpis.salesCount}
              icon={<ShoppingCart size={18} />}
              color="#2563eb"
              bg="linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)"
            />
            <KpiCard
              label="Avg Tax / Sale"
              value={formatCurrency(kpis.avgTax)}
              icon={<TrendingUp size={18} />}
              color="#7c3aed"
              bg="linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)"
            />
            <KpiCard
              label="Top Category"
              value={kpis.topCategory}
              subtitle={formatCurrency(kpis.topCategoryTax)}
              icon={<Filter size={18} />}
              color="#d97706"
              bg="linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)"
            />
          </>
        )}
      </div>

      {/* ── Search Bar ── */}
      <VCard>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === 'input'
                ? "Search by vendor name, PO number, batch number, product…"
                : "Search by invoice number, category, customer…"
              }
              className={inp + " pl-9"}
            />
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
            {activeTab === 'input' ? filteredInput.length : filteredOutput.length} records
          </div>
        </div>
      </VCard>

      {/* ── Data Table ── */}
      <VCard noPad>
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
            {activeTab === 'input' ? (
              <><ArrowDownLeft size={14} className="text-blue-600" /> Input Tax Credit Ledger</>
            ) : (
              <><ArrowUpRight size={14} className="text-emerald-600" /> Output Tax Ledger</>
            )}
          </h3>
          <span className="text-[10px] text-slate-400 font-bold">
            {period && new Date(period + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {activeTab === 'input' ? (
          <InputTaxTable data={filteredInput} onView={r => handleView(r, 'input')} onEdit={r => handleEdit(r, 'input')} onDelete={r => handleDeletePrompt(r, 'input')} />
        ) : (
          <OutputTaxTable data={filteredOutput} onView={r => handleView(r, 'output')} onEdit={r => handleEdit(r, 'output')} onDelete={r => handleDeletePrompt(r, 'output')} />
        )}
      </VCard>

      {/* ── Legend ── */}
      {/* <VCard>
        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-500">
          {activeTab === 'input' ? (
            <>
              <div className="flex items-center gap-1.5"><ArrowDownLeft size={11} className="text-blue-600" /> Input Tax = GST paid on purchases (claimable as ITC)</div>
              <div className="flex items-center gap-1.5"><Package size={11} className="text-purple-600" /> Batch # = GRN number linked to the purchase order</div>
              <div className="flex items-center gap-1.5 ml-auto text-slate-400">Data sourced from Purchase Orders & GRN records</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5"><ArrowUpRight size={11} className="text-emerald-600" /> Output Tax = GST collected on sales (liability)</div>
              <div className="flex items-center gap-1.5"><ShoppingCart size={11} className="text-blue-600" /> Category derived from primary product in invoice</div>
              <div className="flex items-center gap-1.5 ml-auto text-slate-400">Data sourced from Sales Invoices</div>
            </>
          )}
        </div>
      </VCard> */}

      {/* ── View Detail Modal ── */}
      <ViewDetailModal
        open={viewModal.open}
        row={viewModal.row}
        type={viewModal.type}
        onClose={() => setViewModal({ open: false, row: null, type: null })}
      />

      {/* ── Edit Modal ── */}
      <EditRecordModal
        open={editModal.open}
        row={editModal.row}
        type={editModal.type}
        onClose={() => setEditModal({ open: false, row: null, type: null })}
        onSave={handleEditSave}
      />

      {/* ── Delete Confirmation ── */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm({ open: false, row: null, type: null })}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle size={22} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">Delete Record</h3>
                <p className="text-[11px] text-slate-400 font-medium">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-[13px] text-slate-600 font-medium mb-6 leading-relaxed">
              Are you sure you want to delete this {deleteConfirm.type === 'input' ? 'input tax' : 'output tax'} record
              {deleteConfirm.row && deleteConfirm.type === 'input'
                ? ` for ${deleteConfirm.row.vendorName}?`
                : deleteConfirm.row ? ` (${deleteConfirm.row.invoiceNumber})?` : '?'
              }
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm({ open: false, row: null, type: null })}
                className="px-4 py-2 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-wide"
              >Cancel</button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-[11px] font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 uppercase tracking-wide flex items-center gap-1.5"
              ><Trash2 size={12} /> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KPI Card Component ────────────────────────────────────────────────────
function KpiCard({ label, value, subtitle, icon, color, bg }) {
  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg border border-white/50 hover:scale-105 cursor-pointer"
      style={{ background: bg }}
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none group-hover:scale-150 transition-transform duration-500" style={{ background: color }} />
      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors duration-300">{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-70 group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-100 transition-all duration-300" style={{ color }}>
          {icon}
        </div>
      </div>
      <div className="text-xl font-bold tracking-tight relative z-10 truncate group-hover:scale-105 origin-left transition-transform duration-300" style={{ color }}>
        {value}
      </div>
      {subtitle && (
        <div className="text-[10px] font-bold text-slate-400 mt-1 relative z-10">{subtitle}</div>
      )}
    </div>
  );
}

// ─── Input Tax Table ───────────────────────────────────────────────────────
function InputTaxTable({ data, onView, onEdit, onDelete }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => { setCurrentPage(1); }, [data]);

  const handleSort = (key) => {
    if (!key) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  if (data.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="text-3xl mb-3">📦</div>
        <div className="text-[13px] font-bold text-slate-600 mb-1">No Input Tax records found</div>
        <div className="text-[11px] text-slate-400 font-medium">Try changing the period or check if purchase orders exist for this month.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm min-w-[900px]">
          <thead style={{ background: '#F8FAFC' }}>
            <tr className="border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
              <SortHeader label="Vendor Name" sortKey="vendorName" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="Batch / GRN #" sortKey="batchNumber" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="PO Number" sortKey="poNumber" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="Product" sortKey="productName" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="Order Date" sortKey="orderDate" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="Taxable Amount" sortKey="taxableAmount" currentSort={sortConfig} onSort={handleSort} align="right" />
              <SortHeader label="GST Rate" sortKey="gstRate" currentSort={sortConfig} onSort={handleSort} align="center" />
              <SortHeader label="Tax Amount" sortKey="gstAmount" currentSort={sortConfig} onSort={handleSort} align="right" />
              <SortHeader label="Actions" align="center" />
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
          <tr key={i} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px] border border-blue-100/50 flex-shrink-0">
                  {(row.vendorName || 'V')[0].toUpperCase()}
                </div>
                <span className="font-bold text-[12px] text-slate-800 truncate max-w-[160px]">{row.vendorName || '—'}</span>
              </div>
            </td>
            <td className="px-4 py-3">
              {row.batchNumber ? (
                <span className="font-mono text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-100/50">
                  {row.batchNumber}
                </span>
              ) : (
                <span className="text-slate-300 text-[11px] font-bold">No GRN</span>
              )}
            </td>
            <td className="px-4 py-3">
              <span className="font-mono text-[11px] text-slate-600 font-bold">{row.poNumber || '—'}</span>
            </td>
            <td className="px-4 py-3">
              <span className="text-[11px] text-slate-600 font-medium truncate max-w-[140px] block">{row.productName || '—'}</span>
            </td>
            <td className="px-4 py-3">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                {row.orderDate ? new Date(row.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-[12px] text-slate-700">{formatCurrency(row.taxableAmount || 0)}</span>
            </td>
            <td className="px-4 py-3 text-center">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {row.gstRate || 0}%
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-[12px] text-blue-700">{formatCurrency(row.gstAmount || 0)}</span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onView(row)} title="View Details"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100/50 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-200">
                  <Eye size={13} />
                </button>
                <button disabled title="Edit Disabled"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100/50 opacity-50 grayscale">
                  <Edit3 size={13} />
                </button>
                <button disabled title="Delete Disabled"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100/50 opacity-50 grayscale">
                  <Trash2 size={13} />
                </button>
              </div>
            </td>
          </tr>
        ))}
            {/* Totals Row (Over entire dataset) */}
            <tr className="bg-blue-50/50 border-t-2 border-blue-100">
              <td colSpan={5} className="px-4 py-3 text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Input Tax (All Records)</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-[12px] text-slate-700">
                  {formatCurrency(data.reduce((s, r) => s + (r.taxableAmount || 0), 0))}
                </span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-[14px] text-blue-700">
                  {formatCurrency(data.reduce((s, r) => s + (r.gstAmount || 0), 0))}
                </span>
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>
      <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalRecords={data.length} onPageChange={setCurrentPage} />
    </div>
  );
}

// ─── Output Tax Table ──────────────────────────────────────────────────────
function OutputTaxTable({ data, onView, onEdit, onDelete }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => { setCurrentPage(1); }, [data]);

  const handleSort = (key) => {
    if (!key) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  if (data.length === 0) {
    return (
      <div className="px-4 py-12 text-center">
        <div className="text-3xl mb-3">🛒</div>
        <div className="text-[13px] font-bold text-slate-600 mb-1">No Output Tax records found</div>
        <div className="text-[11px] text-slate-400 font-medium">No sales invoices found for this period.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm min-w-[1000px]">
          <thead style={{ background: '#F8FAFC' }}>
            <tr className="border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
              <SortHeader label="Sale ID" sortKey="saleId" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="Invoice #" sortKey="invoiceNumber" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="Customer" sortKey="customerName" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="Sale Date" sortKey="saleDate" currentSort={sortConfig} onSort={handleSort} />
              <SortHeader label="Taxable Amount" sortKey="taxableAmount" currentSort={sortConfig} onSort={handleSort} align="right" />
              <SortHeader label="CGST" sortKey="cgstAmount" currentSort={sortConfig} onSort={handleSort} align="right" />
              <SortHeader label="SGST" sortKey="sgstAmount" currentSort={sortConfig} onSort={handleSort} align="right" />
              <SortHeader label="Total GST" sortKey="totalGstAmount" currentSort={sortConfig} onSort={handleSort} align="right" />
              <SortHeader label="Actions" align="center" />
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
          <tr key={i} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors group">
            <td className="px-4 py-3">
              <span className="font-mono text-[10px] text-slate-500 font-bold">
                {row.saleId ? row.saleId.substring(0, 8) + '…' : '—'}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="font-mono text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">
                {row.invoiceNumber || '—'}
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {row.category || 'General'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-[9px] border border-emerald-100/50 flex-shrink-0">
                  {(row.customerName || 'W')[0].toUpperCase()}
                </div>
                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[130px]">{row.customerName || 'Walk-in'}</span>
              </div>
            </td>
            <td className="px-4 py-3">
              <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                {row.saleDate ? new Date(row.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-[12px] text-slate-700">{formatCurrency(row.taxableAmount || 0)}</span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-[11px] text-slate-600">{formatCurrency(row.cgstAmount || 0)}</span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-[11px] text-slate-600">{formatCurrency(row.sgstAmount || 0)}</span>
            </td>
            <td className="px-4 py-3 text-right">
              <span className="font-bold text-[12px] text-emerald-700">{formatCurrency(row.totalGstAmount || 0)}</span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onView(row)} title="View Details"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100/50 hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-200">
                  <Eye size={13} />
                </button>
                <button disabled title="Edit Disabled"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100/50 opacity-50 grayscale">
                  <Edit3 size={13} />
                </button>
                <button disabled title="Delete Disabled"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100/50 opacity-50 grayscale">
                  <Trash2 size={13} />
                </button>
              </div>
            </td>
          </tr>
        ))}
            {/* Totals Row (Over entire dataset) */}
            <tr className="bg-emerald-50/50 border-t-2 border-emerald-100">
              <td colSpan={5} className="px-4 py-3 text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Output Tax (All Records)</span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-[12px] text-slate-700">
                  {formatCurrency(data.reduce((s, r) => s + (r.taxableAmount || 0), 0))}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-[11px] text-slate-600">
                  {formatCurrency(data.reduce((s, r) => s + (r.cgstAmount || 0), 0))}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-[11px] text-slate-600">
                  {formatCurrency(data.reduce((s, r) => s + (r.sgstAmount || 0), 0))}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-bold text-[14px] text-emerald-700">
                  {formatCurrency(data.reduce((s, r) => s + (r.totalGstAmount || 0), 0))}
                </span>
              </td>
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>
      <TablePagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalRecords={data.length} onPageChange={setCurrentPage} />
    </div>
  );
}

// ─── View Detail Modal ─────────────────────────────────────────────────────
function ViewDetailModal({ open, row, type, onClose }) {
  if (!open || !row) return null;

  const isInput = type === 'input';
  const accentColor = isInput ? '#2563eb' : '#059669';

  const fields = isInput
    ? [
      { label: 'Vendor Name', value: row.vendorName || '—' },
      { label: 'Batch / GRN #', value: row.batchNumber || 'No GRN linked' },
      { label: 'PO Number', value: row.poNumber || '—' },
      { label: 'Product', value: row.productName || '—' },
      { label: 'Order Date', value: row.orderDate ? new Date(row.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
      { label: 'Taxable Amount', value: formatCurrency(row.taxableAmount || 0), highlight: true },
      { label: 'GST Rate', value: `${row.gstRate || 0}%` },
      { label: 'Tax Amount', value: formatCurrency(row.gstAmount || 0), highlight: true, accent: true },
    ]
    : [
      { label: 'Sale ID', value: row.saleId || '—' },
      { label: 'Invoice Number', value: row.invoiceNumber || '—' },
      { label: 'Category', value: row.category || 'General' },
      { label: 'Customer', value: row.customerName || 'Walk-in Customer' },
      { label: 'Sale Date', value: row.saleDate ? new Date(row.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
      { label: 'Payment Mode', value: row.paymentMode || '—' },
      { label: 'Taxable Amount', value: formatCurrency(row.taxableAmount || 0), highlight: true },
      { label: 'CGST', value: formatCurrency(row.cgstAmount || 0) },
      { label: 'SGST', value: formatCurrency(row.sgstAmount || 0) },
      { label: 'Total GST', value: formatCurrency(row.totalGstAmount || 0), highlight: true, accent: true },
      { label: 'Grand Total', value: formatCurrency(row.grandTotal || 0), highlight: true },
    ];

  return (
    <VModal open={open} onClose={onClose} title={isInput ? 'Input Tax Detail' : 'Output Tax Detail'} width="max-w-lg">
      <div className="space-y-1">
        {fields.map((f, i) => (
          <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</span>
            <span className={`text-[13px] font-bold ${f.accent ? 'text-lg' : ''} ${f.highlight ? '' : 'text-slate-700'}`}
              style={f.accent ? { color: accentColor } : f.highlight ? { color: '#1e293b' } : {}}>
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </VModal>
  );
}

// ─── Edit Record Modal ─────────────────────────────────────────────────────
function EditRecordModal({ open, row, type, onClose, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (row) setForm({ ...row });
  }, [row]);

  if (!open || !row) return null;

  const isInput = type === 'input';
  const inputCls = "w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all";
  const labelCls = "text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1";

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <VModal open={open} onClose={onClose} title={isInput ? 'Edit Input Tax Record' : 'Edit Output Tax Record'} width="max-w-lg">
      <div className="space-y-4">
        {isInput ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Vendor Name</label>
                <input value={form.vendorName || ''} onChange={e => handleChange('vendorName', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>PO Number</label>
                <input value={form.poNumber || ''} onChange={e => handleChange('poNumber', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Batch / GRN #</label>
                <input value={form.batchNumber || ''} onChange={e => handleChange('batchNumber', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Product Name</label>
                <input value={form.productName || ''} onChange={e => handleChange('productName', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Taxable Amount</label>
                <input type="number" value={form.taxableAmount || 0} onChange={e => handleChange('taxableAmount', parseFloat(e.target.value) || 0)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>GST Rate (%)</label>
                <input type="number" value={form.gstRate || 0} onChange={e => handleChange('gstRate', parseFloat(e.target.value) || 0)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tax Amount</label>
                <input type="number" value={form.gstAmount || 0} onChange={e => handleChange('gstAmount', parseFloat(e.target.value) || 0)} className={inputCls} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Invoice Number</label>
                <input value={form.invoiceNumber || ''} className={inputCls} disabled />
              </div>
              <div>
                <label className={labelCls}>Customer Name</label>
                <input value={form.customerName || ''} onChange={e => handleChange('customerName', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category</label>
                <input value={form.category || ''} onChange={e => handleChange('category', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Payment Mode</label>
                <input value={form.paymentMode || ''} onChange={e => handleChange('paymentMode', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Taxable Amount</label>
                <input type="number" value={form.taxableAmount || 0} onChange={e => handleChange('taxableAmount', parseFloat(e.target.value) || 0)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CGST Amount</label>
                <input type="number" value={form.cgstAmount || 0} onChange={e => handleChange('cgstAmount', parseFloat(e.target.value) || 0)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>SGST Amount</label>
                <input type="number" value={form.sgstAmount || 0} onChange={e => handleChange('sgstAmount', parseFloat(e.target.value) || 0)} className={inputCls} />
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 text-[11px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-wide">
            Cancel
          </button>
          <button onClick={() => onSave(form)}
            className="px-4 py-2 text-[11px] font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase tracking-wide flex items-center gap-1.5">
            <Save size={12} /> Save Changes
          </button>
        </div>
      </div>
    </VModal>
  );
}

// ─── Reusable Sort Header & Pagination ─────────────────────────────────────
function SortHeader({ label, sortKey, currentSort, onSort, align = 'left' }) {
  if (!sortKey) {
    return <th className={`px-4 py-3 text-${align}`}>{label}</th>;
  }
  const isActive = currentSort?.key === sortKey;
  return (
    <th className={`px-4 py-3 text-${align} cursor-pointer hover:bg-slate-100/50 transition-colors group select-none`} onClick={() => onSort(sortKey)}>
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {label}
        <div className="flex flex-col text-slate-300">
          {isActive ? (
            currentSort.direction === 'asc' ? <ChevronUp size={12} className="text-blue-600" /> : <ChevronDown size={12} className="text-blue-600" />
          ) : (
            <ChevronUp size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </th>
  );
}

function TablePagination({ currentPage, totalPages, pageSize, totalRecords, onPageChange }) {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
      <div className="text-[11px] font-bold text-slate-500">
        Showing {start} to {end} of {totalRecords} entries
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(p => Math.max(1, p - 1))} disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          <ChevronLeft size={14} />
        </button>
        <div className="text-[11px] font-bold text-slate-700 px-2">Page {currentPage} of {totalPages}</div>
        <button onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
