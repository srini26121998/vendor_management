import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatCurrency, formatDate, VENDOR_ROUTES } from './vendorConstants';
import { PageHeader, VCard, StatusBadge, PrimaryBtn, SecondaryBtn, VendorBreadcrumb } from './VendorComponents';
import { ArrowLeft, Search, CheckCircle2, XCircle, AlertTriangle, ChevronDown, CreditCard, Building2, Calendar, FileText, Shield, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchInvoices, fetchVendorById, recordPayment, approveInvoice } from '../../api/vendorService';

const PAYMENT_MODES = ['Full', 'Partial', 'Advance', 'On-Account'];
const STATUSES = ['Pending Match', 'Matched', 'Approved', 'Paid', 'On Hold', 'Disputed'];

function MatchBadge({ status }) {
  if (status === 'matched') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 size={10} /> Matched
    </span>
  );
  if (status === 'mismatch') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
      <XCircle size={10} /> Mismatch
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle size={10} /> Partial
    </span>
  );
}

function InvoiceForm({ inv, bankAccounts = [], onApprove }) {
  const [mode, setMode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [bank, setBank] = useState('');
  const [reference, setReference] = useState('');
  const [dueDate, setDueDate] = useState(inv.paymentDueDate);

  const holdAmt = mode === 'Partial' ? Math.max(0, inv.invoiceAmount - Number(paymentAmount || 0)) : 0;
  const needHoldReason = holdAmt > 0;
  const allMatched = inv.poMatchStatus === 'matched' && inv.grnMatchStatus === 'matched' && inv.invoiceMatchStatus === 'matched';
  const canApprove = allMatched && mode && bank && (mode !== 'Partial' || (paymentAmount && Number(paymentAmount) <= inv.invoiceAmount));

  const lbl = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";
  const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-800 bg-white focus:outline-none focus:border-blue-500 font-bold";

  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-4 bg-slate-50/40">
      {/* Read-only fields */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Invoice Number</label>
          <div className={inp + " cursor-pointer text-blue-600 hover:bg-blue-50 transition-colors"}
            onClick={() => toast('Opening invoice preview…', { icon: '📄' })}>
            {inv.id}
          </div>
        </div>
        <div>
          <label className={lbl}>Invoice Date</label>
          <div className={inp + " bg-slate-100 text-slate-500"}>{formatDate(inv.invoiceDate)}</div>
        </div>
        <div>
          <label className={lbl}>Invoice Amount</label>
          <div className={inp + " bg-slate-100 text-slate-700"}>{formatCurrency(inv.invoiceAmount)}</div>
        </div>
      </div>

      {/* Match status badges */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={lbl}>PO Match Status</label>
          <div className="mt-1"><MatchBadge status={inv.poMatchStatus} /></div>
        </div>
        <div>
          <label className={lbl}>GRN Match Status</label>
          <div className="mt-1"><MatchBadge status={inv.grnMatchStatus} /></div>
        </div>
        <div>
          <label className={lbl}>Invoice Match Status</label>
          <div className="mt-1 flex items-center gap-1">
            <MatchBadge status={inv.invoiceMatchStatus} />
            {!allMatched && <span className="text-[9px] text-amber-600 font-bold">All 3 must be ✓</span>}
          </div>
        </div>
      </div>

      {/* Payment Mode */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className={lbl}>Payment Mode <span className="text-red-500">*</span></label>
          <div className="relative">
            <select value={mode} onChange={e => setMode(e.target.value)}
              className={inp + " appearance-none pr-7 border-2 border-blue-200"}>
              <option value="">Select mode…</option>
              {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {mode === 'Partial' && (
          <div>
            <label className={lbl}>Payment Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-[12px] text-slate-500 font-bold">₹</span>
              <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                placeholder="0.00" max={inv.invoiceAmount}
                className={inp + " pl-6 border-2 border-blue-200"} />
            </div>
          </div>
        )}

        <div>
          <label className={lbl}>Hold Amount</label>
          <div className={inp + " bg-slate-100 text-amber-700"}>
            {mode === 'Partial' ? formatCurrency(holdAmt) : '—'}
          </div>
        </div>

        <div>
          <label className={lbl}>ITC Hold Amount</label>
          <div className={inp + " bg-slate-100 text-rose-600"}>
            {inv.itcHoldAmount > 0 ? formatCurrency(inv.itcHoldAmount) : '—'}
          </div>
          {inv.itcHoldAmount > 0 && <p className="text-[9px] text-rose-500 mt-0.5 font-bold">GSTR-1 not filed/mismatched</p>}
        </div>
      </div>

      {/* Hold Reason */}
      {needHoldReason && (
        <div>
          <label className={lbl}>Hold Reason <span className="text-red-500">*</span></label>
          <input value={holdReason} onChange={e => setHoldReason(e.target.value)}
            placeholder="Reason for hold… (max 200 chars)" maxLength={200}
            className={inp} />
        </div>
      )}

      {/* Payment Due Date + Bank + Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Payment Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inp} />
        </div>
        <div>
          <label className={lbl}>Bank Account for Payment <span className="text-red-500">*</span></label>
          <div className="relative">
            <select value={bank} onChange={e => setBank(e.target.value)}
              className={inp + " appearance-none pr-7 border-2 border-blue-200"}>
              <option value="">Select vendor bank account…</option>
              {bankAccounts.map(b => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumberMasked} ({b.accountType})
                </option>
              ))}
              {bankAccounts.length === 0 && (
                <option disabled>Loading bank accounts...</option>
              )}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={lbl}>Payment Reference</label>
          <input value={reference} onChange={e => setReference(e.target.value)}
            placeholder="UTR / NEFT Ref no…"
            className={inp} />
          <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Entered post-payment for reconciliation</p>
        </div>
      </div>

      {/* Approve Button */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
        <button
          disabled={!canApprove}
          onClick={() => onApprove(inv.id, { mode, paymentAmount, bank, reference, dueDate })}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${canApprove
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}>
          <Shield size={13} /> Approve Payment
        </button>
        {!canApprove && (
          <span className="text-[10px] text-slate-400 font-bold">
            {!allMatched ? '3-way match incomplete' : !mode ? 'Select payment mode' : !bank ? 'Select bank account' : 'Enter valid amount'}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PaymentProcessing() {
  const navigate = useNavigate();
  const location = useLocation();

  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendorBankAccounts, setVendorBankAccounts] = useState({});

  // Filter state
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedModes, setSelectedModes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [amountMin, setAmountMin] = useState(0);
  const [amountMax, setAmountMax] = useState(500000);
  const [itcHoldOnly, setItcHoldOnly] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const toggleMode = (m) => setSelectedModes(s => s.includes(m) ? s.filter(x => x !== m) : [...s, m]);
  const toggleStatus = (s) => setSelectedStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const loadInvoicesQueue = () => {
    setIsLoading(true);
    fetchInvoices().then(res => {
      const data = Array.isArray(res.data || res) ? (res.data || res) : [];
      const mapped = data.filter(inv => inv.submissionStatus !== 'PAID').map(inv => ({
        id: inv.invoiceNumber,
        realId: inv.id,
        vendor: inv.vendorName,
        vendorId: inv.vendorId,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate || inv.invoiceDate,
        invoiceAmount: inv.totalAmount,
        poMatchStatus: inv.poMatchStatus ? inv.poMatchStatus.toLowerCase() : 'pending',
        grnMatchStatus: inv.grnMatchStatus ? inv.grnMatchStatus.toLowerCase() : 'pending',
        invoiceMatchStatus: inv.invoiceMatchStatus ? inv.invoiceMatchStatus.toLowerCase() : 'pending',
        itcHoldAmount: 0,
        paymentTerms: 30,
        mode: null,
        status: inv.submissionStatus === 'APPROVED' ? 'Approved' : (inv.submissionStatus === 'UNDER_REVIEW' ? 'Under Review' : 'Pending Match'),
        holdAmount: 0,
        paymentDueDate: inv.dueDate || inv.invoiceDate,
        paymentReference: '',
        gstin: inv.irnNumber || '',
      }));
      setInvoices(mapped);
      if (location.state && location.state.invoiceId) {
        setExpandedId(location.state.invoiceId);
      }
    }).catch(err => {
      console.error("Failed to load invoices", err);
      toast.error("Failed to load live payables queue");
    }).finally(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadInvoicesQueue();
  }, []);

  // Fetch vendor bank accounts dynamically when expanded
  useEffect(() => {
    if (expandedId) {
      const selectedInvoice = invoices.find(inv => inv.id === expandedId);
      if (selectedInvoice && selectedInvoice.vendorId) {
        const vId = selectedInvoice.vendorId;
        if (!vendorBankAccounts[vId]) {
          fetchVendorById(vId).then(vendor => {
            if (vendor && vendor.bankAccounts) {
              setVendorBankAccounts(prev => ({
                ...prev,
                [vId]: vendor.bankAccounts
              }));
            }
          }).catch(err => {
            console.error("Failed to fetch vendor bank accounts", err);
          });
        }
      }
    }
  }, [expandedId, invoices, vendorBankAccounts]);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (location.state && location.state.invoiceId && inv.id === location.state.invoiceId) {
        return true;
      }
      if (vendorSearch && !inv.vendor.toLowerCase().includes(vendorSearch.toLowerCase()) && !inv.vendorId.toLowerCase().includes(vendorSearch.toLowerCase())) return false;
      if (selectedModes.length && !selectedModes.some(m => inv.mode === m)) return false;
      if (selectedStatuses.length && !selectedStatuses.includes(inv.status)) return false;
      if (dateFrom && inv.dueDate < dateFrom) return false;
      if (dateTo && inv.dueDate > dateTo) return false;
      if (inv.invoiceAmount < amountMin || inv.invoiceAmount > amountMax) return false;
      if (itcHoldOnly && inv.itcHoldAmount === 0) return false;
      return true;
    });
  }, [invoices, vendorSearch, selectedModes, selectedStatuses, dateFrom, dateTo, amountMin, amountMax, itcHoldOnly, location.state]);

  const handleApprove = (id, data) => {
    const selectedInvoice = invoices.find(inv => inv.id === id);
    if (!selectedInvoice) return;

    const payload = {
      invoiceId: selectedInvoice.realId,
      vendorId: selectedInvoice.vendorId,
      paymentMode: data.mode.toUpperCase(), // FULL, PARTIAL
      paymentAmount: data.mode === 'Partial' ? Number(data.paymentAmount) : selectedInvoice.invoiceAmount,
      bankAccountId: data.bank,
      paymentDueDate: data.dueDate
    };

    toast.promise(
      recordPayment(payload).then(() => {
        loadInvoicesQueue();
        setExpandedId(null);
      }),
      {
        loading: 'Processing vendor payment...',
        success: 'Payment successfully processed!',
        error: (err) => `Failed to process payment: ${err?.response?.data?.message || err.message}`
      }
    );
  };

  const handleManualApprove = (realId) => {
    toast.promise(
      approveInvoice(realId).then(() => {
        loadInvoicesQueue();
      }),
      {
        loading: 'Approving & matching invoice...',
        success: 'Invoice successfully approved for payment!',
        error: (err) => `Failed to approve invoice: ${err?.response?.data?.message || err.message}`
      }
    );
  };

  const lbl = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <div className="w-full bg-white min-h-screen" style={{ fontFamily: '"Inter", sans-serif' }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <VendorBreadcrumb items={[{ label: 'ACCOUNTING', path: VENDOR_ROUTES.payablesDash }, { label: 'PAYMENT PROCESSING' }]} />
            <h1 className="text-[18px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Wallet size={18} className="text-blue-600" />
              Payment Processing Dashboard
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded uppercase tracking-wider">Secure</span>
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5 font-bold">Multi-mode payment queue management with 3-way match validation and batch payment controls</p>
          </div>
          <button onClick={() => navigate(VENDOR_ROUTES.payablesDash)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 font-bold text-[12px] rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
            <ArrowLeft size={14} /> Back to Payables
          </button>
        </div>

        {/* ── Filter Controls ── */}
        <VCard>
          <h3 className="text-[11px] font-bold text-slate-400 uppercase  mb-3">Payment Queue Filter Controls</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

            {/* Vendor Search */}
            <div>
              <label className={lbl}>Vendor Search</label>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
                <input value={vendorSearch} onChange={e => setVendorSearch(e.target.value)}
                  placeholder="Search vendor…"
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 focus:outline-none focus:border-blue-500" />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Name or vendor ID; debounce 300ms</p>
            </div>

            {/* Payment Mode Multi-Select */}
            <div>
              <label className={lbl}>Payment Mode</label>
              <div className="flex flex-wrap gap-1">
                {PAYMENT_MODES.map(m => (
                  <button key={m} onClick={() => toggleMode(m)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${selectedModes.includes(m) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                    {m}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Filter: Full, Partial, Advance, On-Account</p>
            </div>

            {/* Status Filter Multi-Select */}
            <div>
              <label className={lbl}>Status Filter</label>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => toggleStatus(s)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded-full border transition-all ${selectedStatuses.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date Range */}
            <div>
              <label className={lbl}>Due Date Range</label>
              <div className="flex items-center gap-2">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-500" />
                <span className="text-slate-400 text-[10px] font-bold">to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-blue-500" />
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Focus on upcoming due dates</p>
            </div>

            {/* Amount Range */}
            <div>
              <label className={lbl}>Amount Range — ₹{(amountMin / 1000).toFixed(0)}K — ₹{(amountMax / 1000).toFixed(0)}K</label>
              <div className="space-y-1">
                <input type="range" min={0} max={500000} step={1000} value={amountMax}
                  onChange={e => setAmountMax(Number(e.target.value))}
                  className="w-full accent-blue-600 h-1.5" />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>₹0</span><span>₹5L</span>
                </div>
              </div>
              <p className="text-[9px] text-slate-400 font-bold">Min/max invoice amount filter</p>
            </div>

            {/* ITC Hold Flag */}
            <div>
              <label className={lbl}>ITC Hold Flag</label>
              <label className="flex items-center gap-2 cursor-pointer w-fit mt-1">
                <div onClick={() => setItcHoldOnly(v => !v)}
                  className={`w-10 h-5 rounded-full relative transition-all ${itcHoldOnly ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${itcHoldOnly ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
                </div>
                <span className="text-[11px] font-bold text-slate-600">{itcHoldOnly ? 'On' : 'Off'}</span>
              </label>
              <p className="text-[9px] text-slate-400 mt-0.5 font-bold">When On: shows only invoices with tax amount on hold</p>
            </div>
          </div>
        </VCard>

        {/* ── Invoice Queue ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase ">
              Payment Processing Form — Per Invoice ({filtered.length} invoices)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              Click any card to expand payment form
            </span>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <VCard>
                <div className="text-center py-10 text-slate-400 text-[12px] font-bold">No invoices match the current filters</div>
              </VCard>
            )}
            {filtered.map(inv => {
              const expanded = expandedId === inv.id;
              const allMatched = inv.poMatchStatus === 'matched' && inv.grnMatchStatus === 'matched' && inv.invoiceMatchStatus === 'matched';
              const hasAnyMismatch = [inv.poMatchStatus, inv.grnMatchStatus, inv.invoiceMatchStatus].includes('mismatch');
              const accentColor = allMatched ? '#059669' : hasAnyMismatch ? '#dc2626' : '#f59e0b';

              return (
                <div key={inv.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
                  style={{ borderLeft: `4px solid ${accentColor}` }}>

                  {/* ── Card Header — clickable ── */}
                  <div
                    className="px-5 py-5 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : inv.id)}>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                      {/* Col 1 — Vendor + Invoice ID + Status */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0 shadow-sm"
                            style={{ background: accentColor }}>
                            {inv.vendor.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-slate-800 leading-tight">{inv.vendor}</div>
                            <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">{inv.vendorId}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                            {inv.id}
                          </span>
                          <StatusBadge
                            status={
                              inv.status === 'Approved' ? 'approved'
                                : inv.status === 'Under Review' ? 'under_review'
                                  : 'pending'
                            }
                            size="xs"
                          />
                        </div>
                      </div>

                      {/* Col 2 — 3-Way Match Status (clearly labelled) */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase  mb-1">3-Way Match Validation</div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'PO Match', status: inv.poMatchStatus },
                            { label: 'GRN Match', status: inv.grnMatchStatus },
                            { label: 'Invoice', status: inv.invoiceMatchStatus },
                          ].map(({ label, status }) => (
                            <div key={label}
                              className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border"
                              style={{
                                background: status === 'matched' ? '#f0fdf4' : status === 'mismatch' ? '#fef2f2' : '#fffbeb',
                                borderColor: status === 'matched' ? '#bbf7d0' : status === 'mismatch' ? '#fecaca' : '#fde68a',
                              }}>
                              <div className="text-[8px] font-bold uppercase tracking-wider"
                                style={{ color: status === 'matched' ? '#059669' : status === 'mismatch' ? '#dc2626' : '#d97706' }}>
                                {label}
                              </div>
                              <MatchBadge status={status} />
                            </div>
                          ))}
                        </div>
                        {!allMatched && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[9px] font-bold text-amber-600">⚠ All 3 must be Matched to approve payment</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleManualApprove(inv.realId);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all shadow-sm"
                            >
                              ⚙ Manually Match & Approve
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Col 3 — Amount + Due Date + ITC Hold + Chevron */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-3">
                          <div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase  mb-0.5">Invoice Amount</div>
                            <div className="text-[20px] font-bold text-slate-800 leading-tight">{formatCurrency(inv.invoiceAmount)}</div>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase ">Due Date</div>
                              <div className="text-[12px] font-bold text-slate-600 mt-0.5">{formatDate(inv.dueDate)}</div>
                            </div>
                            {inv.itcHoldAmount > 0 && (
                              <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200">
                                <div className="text-[8px] font-bold text-rose-500 uppercase tracking-wider">ITC Hold</div>
                                <div className="text-[12px] font-bold text-rose-700 mt-0.5">{formatCurrency(inv.itcHoldAmount)}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 mt-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${expanded ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                            }`}>
                            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ── Expanded form ── */}
                  {expanded && (
                    <div className="px-5 pb-5 border-t border-slate-100 pt-5" style={{ background: '#fafbfc' }}>
                      <InvoiceForm inv={inv} bankAccounts={vendorBankAccounts[inv.vendorId] || []} onApprove={handleApprove} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
