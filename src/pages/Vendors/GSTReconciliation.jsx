import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader, VCard, SectionTitle, PrimaryBtn, SecondaryBtn } from './VendorComponents';
import { Search, Bell, Unlock, Trash2, FileText, ChevronDown, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchGSTData, notifyGSTVendor, releaseGSTHold, writeOffGSTHold, updateGSTDisputeNote } from '../../api/vendorService';
import { formatCurrency } from './vendorConstants';

const MATCH_STATUSES = ['Matched', 'Mismatched', 'GSTR Not Filed', 'Pending'];

function MatchChip({ status }) {
  const cfg = {
    'Matched': { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={10} /> },
    'Mismatched': { cls: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle size={10} /> },
    'GSTR Not Filed': { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock size={10} /> },
    'Pending': { cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: <Clock size={10} /> },
  }[status] || { cls: 'bg-slate-50 text-slate-500 border-slate-200', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      {cfg.icon}{status}
    </span>
  );
}

export default function GSTReconciliation() {
  // Live State
  const [reconData, setReconData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [gstinPeriod, setGstinPeriod] = useState('2026-04');
  const [vendorFilter, setVendorFilter] = useState('');
  const [selectedMatchStatuses, setSelectedMatchStatuses] = useState([]);
  const [itcHoldThreshold, setItcHoldThreshold] = useState(0);

  // Action state per row
  const [notes, setNotes] = useState({});
  const [notified, setNotified] = useState({});
  const [released, setReleased] = useState({});
  const [writtenOff, setWrittenOff] = useState({});

  const loadData = () => {
    setIsLoading(true);
    fetchGSTData({ period: gstinPeriod })
      .then(res => {
        const data = Array.isArray(res.data || res) ? (res.data || res) : [];
        setReconData(data);

        // Prepopulate action states from fetched server data
        const initialNotes = {};
        const initialNotified = {};
        const initialReleased = {};
        const initialWrittenOff = {};

        data.forEach(row => {
          if (row.disputeNote) initialNotes[row.gstin] = row.disputeNote;
          if (row.notified) initialNotified[row.gstin] = true;
          if (row.released) initialReleased[row.gstin] = true;
          if (row.writtenOff) initialWrittenOff[row.gstin] = true;
        });

        setNotes(initialNotes);
        setNotified(initialNotified);
        setReleased(initialReleased);
        setWrittenOff(initialWrittenOff);
      })
      .catch(err => {
        console.error("Failed to load GST reconciliation data", err);
        toast.error("Failed to sync GST reconciliation data from portal");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [gstinPeriod]);

  const toggleMatchStatus = (s) =>
    setSelectedMatchStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const filtered = useMemo(() => {
    return reconData.filter(row => {
      if (vendorFilter && !row.vendor.toLowerCase().includes(vendorFilter.toLowerCase()) &&
        !row.gstin.toLowerCase().includes(vendorFilter.toLowerCase())) return false;
      if (selectedMatchStatuses.length && !selectedMatchStatuses.includes(row.matchStatus)) return false;
      if (row.itcHold < itcHoldThreshold) return false;
      return true;
    });
  }, [reconData, vendorFilter, selectedMatchStatuses, itcHoldThreshold]);

  const totalPortal = filtered.reduce((s, r) => s + r.portalAmount, 0);
  const totalBooks = filtered.reduce((s, r) => s + r.booksAmount, 0);
  const totalITCHold = filtered.reduce((s, r) => s + r.itcHold, 0);
  const matched = filtered.filter(r => r.matchStatus === 'Matched').length;

  const handleNotify = (gstin, vendor) => {
    notifyGSTVendor(gstin, gstinPeriod)
      .then(() => {
        setNotified(p => ({ ...p, [gstin]: true }));
        toast.success(`Portal + email alert sent to ${vendor}`);
      })
      .catch(err => {
        console.error("Notify failed", err);
        toast.error(`Failed to notify ${vendor}`);
      });
  };

  const handleRelease = (gstin, row) => {
    if (!row.gstinMatch) { toast.error('GSTIN match required to release hold'); return; }
    releaseGSTHold(gstin, gstinPeriod)
      .then(() => {
        setReleased(p => ({ ...p, [gstin]: true }));
        setReconData(prev => prev.map(r => r.gstin === gstin ? { ...r, itcHold: 0, matchStatus: 'Matched', gstinMatch: true } : r));
        toast.success(`Hold released for ${row.vendor} — Finance Controller approval recorded`);
      })
      .catch(err => {
        console.error("Release failed", err);
        toast.error("Failed to release hold");
      });
  };

  const handleWriteOff = (gstin, vendor) => {
    if (!window.confirm(`Director approval required. Write off ITC hold for ${vendor}?`)) return;
    writeOffGSTHold(gstin, gstinPeriod)
      .then(() => {
        setWrittenOff(p => ({ ...p, [gstin]: true }));
        setReconData(prev => prev.map(r => r.gstin === gstin ? { ...r, itcHold: 0 } : r));
        toast.success(`Write-off recorded for ${vendor} — Full audit trail created`);
      })
      .catch(err => {
        console.error("Write off failed", err);
        toast.error("Failed to write off hold");
      });
  };

  const handleNoteBlur = (gstin, note) => {
    updateGSTDisputeNote(gstin, gstinPeriod, note)
      .then(() => {
        toast.success("Dispute note auto-saved", { id: `note-${gstin}` });
      })
      .catch(err => {
        console.error("Note save failed", err);
        toast.error("Failed to save dispute note");
      });
  };

  const lbl = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";
  const inp = "w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold text-slate-700 focus:outline-none focus:border-blue-500";

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#F3F5F9] flex items-center justify-center" style={{ fontFamily: '"Inter", sans-serif' }}>
        <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 max-w-sm border border-slate-100/50">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <h3 className="text-base font-bold text-slate-800 tracking-tight">Syncing GSTR-2B data...</h3>
          <p className="text-xs text-slate-400 font-medium text-center leading-relaxed">Connecting securely to the GST portal to fetch live GSTR-1, GSTR-2A, and ITC reconciliation filings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4" style={{ fontFamily: '"Inter", sans-serif' }}>
      <PageHeader
        title="GST ITC Reconciliation Screen"
        subtitle="GSTR-1 matching dashboard protecting Input Tax Credit with vendor filing status visibility"
        actions={<>
          <SecondaryBtn onClick={() => loadData()}>Fetch Portal Data</SecondaryBtn>
          <PrimaryBtn onClick={() => toast('Exporting…', { icon: '📤' })}>Export Mismatches</PrimaryBtn>
        </>}
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Portal Total', value: formatCurrency(totalPortal), color: '#2563eb', bg: '#EFF6FF' },
          { label: 'Books Total', value: formatCurrency(totalBooks), color: '#1e3a5f', bg: '#f0f7ff' },
          { label: 'ITC Hold Total', value: formatCurrency(totalITCHold), color: '#dc2626', bg: '#FEF2F2' },
          { label: `${matched}/${filtered.length} Matched`, value: `${filtered.length ? Math.round(matched / filtered.length * 100) : 0}%`, color: '#059669', bg: '#F0FDF4' },
        ].map((k, i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{ background: k.bg }}>
            <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Reconciliation Filter Controls */}
      <VCard>
        <h3 className="text-[11px] font-bold text-slate-400 uppercase  mb-3">Reconciliation Filter Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* GSTIN Period — Required */}
          <div>
            <label className={lbl}>
              GSTIN Period <span className="text-red-500">*</span>
              <span className="ml-1 text-[8px] bg-red-100 text-red-600 px-1 rounded font-bold">Required</span>
            </label>
            <input type="month" value={gstinPeriod} onChange={e => setGstinPeriod(e.target.value)}
              className={inp + " border-2 border-blue-200"} />
            <p className="text-[9px] text-slate-400 mt-0.5 font-bold">GSTR-1 filing period; defaults to last closed month</p>
          </div>

          {/* Vendor Filter */}
          <div>
            <label className={lbl}>Vendor Filter</label>
            <div className="relative">
              <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
              <input value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}
                placeholder="All Vendors"
                className={inp + " pl-8"} />
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Search by vendor name or GSTIN</p>
          </div>

          {/* Match Status Multi-Select */}
          <div>
            <label className={lbl}>Match Status</label>
            <div className="flex flex-wrap gap-1">
              {MATCH_STATUSES.map(s => (
                <button key={s} onClick={() => toggleMatchStatus(s)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded-full border transition-all ${selectedMatchStatuses.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 font-bold">All Statuses</p>
          </div>

          {/* ITC Hold Threshold */}
          <div>
            <label className={lbl}>ITC Hold Amount Threshold</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-[12px] text-slate-500 font-bold">₹</span>
              <input type="number" value={itcHoldThreshold} onChange={e => setItcHoldThreshold(Number(e.target.value))}
                placeholder="0 (all)"
                className={inp + " pl-6"} />
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Show only vendors with ITC hold &gt; this amount</p>
          </div>
        </div>
      </VCard>

      {/* Reconciliation Table with Action Fields */}
      <VCard noPad>
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">Reconciliation Action Fields</h3>
          <span className="text-[10px] text-slate-400 font-bold">{filtered.length} vendors</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead style={{ background: '#F8FAFC' }}>
              <tr className="border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Vendor / GSTIN</th>
                <th className="px-4 py-3 text-left">Match Status</th>
                <th className="px-4 py-3 text-right">Portal Amount</th>
                <th className="px-4 py-3 text-right">Books Amount</th>
                <th className="px-4 py-3 text-right">ITC Hold</th>
                <th className="px-4 py-3 text-left">Dispute Note</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-[12px] font-bold">
                    No records match the current filters
                  </td>
                </tr>
              )}
              {filtered.map((row, i) => {
                const diff = row.portalAmount - row.booksAmount;
                const isReleased = released[row.gstin];
                const isWrittenOff = writtenOff[row.gstin];
                return (
                  <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${row.itcHold > 0 ? 'bg-amber-50/20' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[12px] text-slate-800">{row.vendor}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">{row.gstin}</div>
                      {!row.gstr1Filed && (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                          GSTR-1 Not Filed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <MatchChip status={row.matchStatus} />
                      {diff !== 0 && (
                        <div className={`text-[9px] font-bold mt-1 ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {diff > 0 ? '+' : ''}₹{Math.abs(diff).toLocaleString('en-IN')} diff
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700 text-[12px]">
                      {row.portalAmount > 0 ? `₹${row.portalAmount.toLocaleString('en-IN')}` : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700 text-[12px]">
                      ₹{row.booksAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.itcHold > 0 ? (
                        <span className="font-bold text-rose-600 text-[12px]">₹{row.itcHold.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        value={notes[row.gstin] || ''}
                        onChange={e => setNotes(p => ({ ...p, [row.gstin]: e.target.value.slice(0, 300) }))}
                        onBlur={e => handleNoteBlur(row.gstin, e.target.value)}
                        placeholder="Add note…"
                        rows={2}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-blue-500 resize-none min-w-[140px]"
                      />
                      <div className="text-[9px] text-slate-400 font-bold text-right">
                        {(notes[row.gstin] || '').length}/300 · timestamped
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        {/* Notify Vendor — always available */}
                        <button
                          onClick={() => handleNotify(row.gstin, row.vendor)}
                          disabled={notified[row.gstin]}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all w-full justify-center
                            ${notified[row.gstin] ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'}`}>
                          <Bell size={10} /> {notified[row.gstin] ? 'Notified' : 'Notify Vendor'}
                        </button>

                        {/* Release Hold — conditional: GSTIN must match */}
                        <button
                          onClick={() => handleRelease(row.gstin, row)}
                          disabled={!row.gstinMatch || isReleased || isWrittenOff}
                          title={!row.gstinMatch ? 'GSTIN match required; Finance Controller role needed' : ''}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all w-full justify-center
                            ${(!row.gstinMatch || isReleased || isWrittenOff)
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}>
                          <Unlock size={10} /> {isReleased ? 'Released' : 'Release Hold'}
                        </button>

                        {/* Write Off Hold — conditional: management decision */}
                        <button
                          onClick={() => handleWriteOff(row.gstin, row.vendor)}
                          disabled={isWrittenOff || isReleased}
                          title="Director approval required; full audit trail"
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all w-full justify-center
                            ${(isWrittenOff || isReleased)
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'}`}>
                          <Trash2 size={10} /> {isWrittenOff ? 'Written Off' : 'Write Off Hold'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </VCard>

      {/* Legend */}
      <VCard>
        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5"><CheckCircle2 size={11} className="text-emerald-600" /> Matched — ITC claimable</div>
          <div className="flex items-center gap-1.5"><XCircle size={11} className="text-red-600" /> Mismatched — ITC blocked until resolved</div>
          <div className="flex items-center gap-1.5"><Clock size={11} className="text-amber-600" /> GSTR Not Filed — vendor portal alert sent</div>
          <div className="flex items-center gap-1.5 ml-auto text-slate-400">Release Hold requires Finance Controller · Write Off requires Director</div>
        </div>
      </VCard>
    </div>
  );
}
