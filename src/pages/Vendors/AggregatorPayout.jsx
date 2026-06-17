import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { VModal } from './VendorComponents';

const DATA = [
  { id:'INV-A-001', vendor:'Reliance Fresh',   date:'12 Apr 2026', our:84500, theirs:84500, match:true },
  { id:'INV-A-002', vendor:'Metro Cash & Carry',date:'14 Apr 2026', our:38000, theirs:40000, match:false },
  { id:'INV-A-003', vendor:'HUL India Ltd',     date:'18 Apr 2026', our:29500, theirs:29500, match:true },
  { id:'INV-A-004', vendor:'ITC Food Division', date:'21 Apr 2026', our:67000, theirs:66500, match:false },
  { id:'INV-A-005', vendor:'Amul Dairy',         date:'25 Apr 2026', our:52000, theirs:52000, match:true },
  { id:'INV-A-006', vendor:'Parle Products',     date:'28 Apr 2026', our:18500, theirs:19200, match:false },
];

const INR = n => '₹' + Number(n).toLocaleString('en-IN');

/* ─── Styles ─────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight:'100vh',
    background:'#f4f6fb',
    padding:'28px 28px',
    fontFamily:'"Inter",sans-serif',
  },
  card: {
    background:'#ffffff',
    border:'1px solid #e8ecf4',
    borderRadius:18,

  },
  glassWhite: {
    background:'#ffffff',
    border:'1px solid #e8ecf4',
    borderRadius:18,

  },
};

/* ─── Upload Screen ───────────────────────────────────────────── */
function UploadScreen({ onDone }) {
  const [phase, setPhase] = useState(0); // 0=idle,1=loading
  const [pct, setPct]   = useState(0);
  const fileRef = useRef();

  const run = () => {
    setPhase(1); setPct(0);
    let v = 0;
    const iv = setInterval(() => {
      v += Math.random() * 14 + 4;
      if (v >= 100) { v = 100; clearInterval(iv); setTimeout(onDone, 500); }
      setPct(Math.min(v, 100));
    }, 130);
  };

  const steps = ['Parsing file…','Extracting invoices…','Matching records…','Building report…'];
  const stepIdx = pct < 25 ? 0 : pct < 55 ? 1 : pct < 85 ? 2 : 3;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:40 }}>

      {/* Drop Zone */}
      <div
        onClick={() => phase===0 && fileRef.current.click()}
        onDragOver={e=>e.preventDefault()}
        onDrop={e=>{ e.preventDefault(); if(phase===0) run(); }}
        style={{
          width:'100%', maxWidth:580,
          border:`2.5px dashed ${phase?'#818cf8':'#c7d2fe'}`, 
          borderRadius:28, padding:'52px 40px',
          textAlign:'center', cursor: phase?'default':'pointer',
          background: phase
            ? '#f0f4ff'
            : '#fafbff',
          transition:'all .35s ease',
          position:'relative', overflow:'hidden',
        }}
      >
        {/* Glow blob */}
        <div style={{
          position:'absolute', width:220, height:220, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(99,102,241,.12),transparent 70%)',
          top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          pointerEvents:'none',
          animation: phase ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}/>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.pdf,.csv" style={{display:'none'}} onChange={run}/>

        {/* Icon */}
        <div style={{
          width:80, height:80, borderRadius:'50%', margin:'0 auto 20px',
          background: phase
            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
            : 'linear-gradient(135deg,#2563eb,#6366f1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:36,
          animation: phase ? 'spin 2s linear infinite' : 'none',
          position:'relative', zIndex:1,
        }}>
          {phase ? '⚙️' : '📤'}
        </div>

        <h2 style={{ color:'#1e293b', fontSize:22, fontWeight:800, marginBottom:8, position:'relative', zIndex:1 }}>
          {phase ? 'AI Matching in Progress…' : 'Upload Vendor Statement'}
        </h2>
        <p style={{ color:'#64748b', fontSize:13, marginBottom:28, position:'relative', zIndex:1 }}>
          {phase ? steps[stepIdx] : 'Drag & drop or click · Excel, PDF or CSV'}
        </p>

        {phase ? (
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ height:8, borderRadius:8, background:'rgba(255,255,255,0.1)', overflow:'hidden', marginBottom:10 }}>
              <div style={{
                height:'100%', borderRadius:8, transition:'width .15s ease',
                width:`${pct}%`,
                background:'linear-gradient(90deg,#6366f1,#a78bfa)',

              }}/>
            </div>
            <span style={{ color:'#6366f1', fontWeight:700, fontSize:12 }}>{Math.round(pct)}%</span>
          </div>
        ) : (
          <div style={{ display:'flex', gap:10, justifyContent:'center', position:'relative', zIndex:1 }}>
            {['Excel','PDF','CSV'].map(t=>(
              <span key={t} style={{
                background:'#eff2ff', color:'#6366f1',
                borderRadius:20, padding:'4px 14px', fontSize:11, fontWeight:700,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Feature pills */}
      <div style={{ display:'flex', gap:12, marginTop:28, flexWrap:'wrap', justifyContent:'center' }}>
        {['🤖 AI Auto-Match','⚡ Instant Variance','📊 Export Report','🔒 Secure Processing'].map(f=>(
          <span key={f} style={{
            background:'#fff', border:'1px solid #e0e7ff',
            color:'#4f46e5', borderRadius:20, padding:'8px 18px',
            fontSize:12, fontWeight:600,
          }}>{f}</span>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:.4; } 50% { opacity:.8; } }
      `}</style>
    </div>
  );
}

/* ─── Results Screen ──────────────────────────────────────────── */
function ResultsScreen({ onReset }) {
  const [tab, setTab]   = useState('all');
  const [row, setRow]   = useState(null);
  const navigate = useNavigate();

  const matched   = DATA.filter(r=>r.match);
  const variances = DATA.filter(r=>!r.match);
  const totalVar  = variances.reduce((s,r)=>s+Math.abs(r.our-r.theirs),0);
  const rate      = Math.round(matched.length/DATA.length*100);

  const rows = tab==='matched' ? matched : tab==='variance' ? variances : DATA;

  const kpis = [
    { label:'Total Invoices', value:DATA.length,       icon:'🧾', g:'135deg,#2563eb,#1d4ed8' },
    { label:'Matched',         value:matched.length,   icon:'✅', g:'135deg,#059669,#10b981' },
    { label:'Variances',       value:variances.length, icon:'⚠️', g:'135deg,#dc2626,#ef4444' },
    { label:'Unreconciled',    value:INR(totalVar),    icon:'💸', g:'135deg,#d97706,#f59e0b' },
    { label:'Match Rate',      value:`${rate}%`,       icon:'🎯', g:'135deg,#7c3aed,#a78bfa' },
  ];

  return (
    <div>
      {/* ── Hero banner ── */}
      <div style={{
        ...S.card, padding:'24px 28px', marginBottom:22,
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16,
        borderLeft:'4px solid #6366f1',
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
            <span style={{ fontSize:26 }}>🔍</span>
            <h2 style={{ color:'#1e293b', fontWeight:800, fontSize:22, margin:0 }}>Reconciliation Complete</h2>
            <span style={{
              background: rate>=80 ? '#059669' : '#dc2626',
              color:'#fff', fontSize:10, fontWeight:700,
              padding:'3px 10px', borderRadius:20, letterSpacing:1,
            }}>{rate>=80?'✓ GOOD':'⚠ REVIEW'}</span>
          </div>
          <p style={{ color:'#64748b', fontSize:13, margin:0 }}>
            {DATA.length} invoices · {matched.length} matched · {variances.length} variances · {INR(totalVar)} unreconciled
          </p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={()=>toast.success('Report exported!')} style={{
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color:'#fff', border:'none', borderRadius:12,
            padding:'11px 22px', fontWeight:700, fontSize:12, cursor:'pointer',
          }}>📥 Export</button>
          <button onClick={onReset} style={{
            background:'#f1f5f9', color:'#475569',
            border:'1px solid #e2e8f0', borderRadius:12,
            padding:'11px 18px', fontWeight:700, fontSize:12, cursor:'pointer',
          }}>↩ New Upload</button>
          <button onClick={()=>navigate('/vendors/ledger')} style={{
            background:'#f1f5f9', color:'#475569',
            border:'1px solid #e2e8f0', borderRadius:12,
            padding:'11px 18px', fontWeight:700, fontSize:12, cursor:'pointer',
          }}>📒 Ledger</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:14, marginBottom:22 }}>
        {kpis.map((k,i)=>(
          <div key={i} style={{
            borderRadius:18, padding:'20px 18px', position:'relative', overflow:'hidden',
            background:`linear-gradient(${k.g})`,

          }}>
            <div style={{
              position:'absolute', right:-14, top:-14, width:70, height:70, borderRadius:'50%',
              background:'rgba(255,255,255,0.12)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
            }}>{k.icon}</div>
            <div style={{ fontSize:26, fontWeight:900, color:'#fff', marginBottom:4 }}>{k.value}</div>
            <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:1 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Match Rate Bar ── */}
      <div style={{ ...S.card, padding:'18px 24px', marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ color:'#475569', fontSize:12, fontWeight:700 }}>Overall Match Rate</span>
          <span style={{ color: rate>=80?'#10b981':'#ef4444', fontWeight:800, fontSize:13 }}>{rate}%</span>
        </div>
        <div style={{ height:10, borderRadius:8, background:'#f1f5f9', overflow:'hidden' }}>
          <div style={{
            height:'100%', width:`${rate}%`, borderRadius:8,
            background: rate>=80 ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#dc2626,#ef4444)',

            transition:'width 1.2s cubic-bezier(.4,0,.2,1)',
          }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:10, color:'#94a3b8', fontWeight:600 }}>
          <span>{matched.length} Matched</span><span>{variances.length} Unmatched</span>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div style={{ ...S.glassWhite, overflow:'hidden' }}>
        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #f1f5f9', padding:'0 20px' }}>
          {[
            { k:'all',      l:`All (${DATA.length})` },
            { k:'matched',  l:`✅ Matched (${matched.length})` },
            { k:'variance', l:`⚠️ Variance (${variances.length})` },
          ].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} style={{
              padding:'14px 18px', fontSize:12, fontWeight:700, background:'none', border:'none',
              cursor:'pointer', transition:'all .2s',
              color: tab===t.k ? '#6366f1' : '#94a3b8',
              borderBottom: tab===t.k ? '2.5px solid #6366f1' : '2.5px solid transparent',
            }}>{t.l}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Invoice','Vendor','Date','Our Records','Vendor Stmt','Variance','Status',''].map(h=>(
                  <th key={h} style={{
                    padding:'12px 18px', textAlign:'left', fontSize:10,
                    fontWeight:700, color:'#94a3b8', textTransform:'uppercase',
                    letterSpacing:'0.06em', borderBottom:'1px solid #f1f5f9',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=>{
                const diff = Math.abs(r.our-r.theirs);
                return (
                  <tr key={i}
                    style={{ borderBottom:'1px solid #f8fafc', background: r.match?'#fff':'#fff9f9' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#f5f7ff'}
                    onMouseLeave={e=>e.currentTarget.style.background=r.match?'#fff':'#fff9f9'}
                  >
                    <td style={{ padding:'14px 18px', color:'#6366f1', fontWeight:700, fontFamily:'monospace' }}>{r.id}</td>
                    <td style={{ padding:'14px 18px', color:'#1e293b', fontWeight:600, maxWidth:160, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.vendor}</td>
                    <td style={{ padding:'14px 18px', color:'#64748b', fontWeight:500 }}>{r.date}</td>
                    <td style={{ padding:'14px 18px', fontWeight:700, color:'#1e293b' }}>{INR(r.our)}</td>
                    <td style={{ padding:'14px 18px', fontWeight:700, color:'#1e293b' }}>{INR(r.theirs)}</td>
                    <td style={{ padding:'14px 18px' }}>
                      {r.match
                        ? <span style={{ color:'#cbd5e1', fontSize:11 }}>—</span>
                        : <span style={{ color:'#dc2626', fontWeight:800 }}>{INR(diff)}</span>}
                    </td>
                    <td style={{ padding:'14px 18px' }}>
                      {r.match
                        ? <span style={{ background:'#f0fdf4', color:'#16a34a', padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, border:'1px solid #bbf7d0' }}>✓ Matched</span>
                        : <span style={{ background:'#fef2f2', color:'#dc2626', padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, border:'1px solid #fecaca' }}>⚠ Variance</span>}
                    </td>
                    <td style={{ padding:'14px 18px' }}>
                      <button onClick={()=>setRow(r)} style={{
                        background:'linear-gradient(135deg,#f8faff,#eef2ff)',
                        border:'1px solid #e0e7ff', borderRadius:8,
                        padding:'5px 12px', fontSize:11, fontWeight:700,
                        color:'#6366f1', cursor:'pointer',
                      }}>View →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding:'14px 22px', borderTop:'1px solid #f1f5f9', background:'#fafbff',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>Showing {rows.length} of {DATA.length} records</span>
          <span style={{ fontSize:11, fontWeight:800, color:'#d97706' }}>Total Variance: {INR(totalVar)}</span>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      <VModal open={!!row} onClose={()=>setRow(null)} title="Invoice Detail" width="max-w-lg">
        {row && (
          <div style={{ fontFamily:'"Inter",sans-serif' }}>
            <div style={{
              borderRadius:14, padding:'16px 20px', marginBottom:20,
              background: row.match ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
              border:`1px solid ${row.match?'#bbf7d0':'#fecaca'}`,
            }}>
              <div style={{ fontWeight:800, color: row.match?'#16a34a':'#dc2626', fontSize:15 }}>
                {row.match ? '✅ Perfect Match' : '⚠️ Variance Detected'}
              </div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>
                {row.match ? 'Both records agree.' : `Difference: ${INR(Math.abs(row.our-row.theirs))}`}
              </div>
            </div>
            {[['Invoice #',row.id],['Vendor',row.vendor],['Date',row.date],['Our Records',INR(row.our)],['Vendor Stmt',INR(row.theirs)],['Variance',INR(Math.abs(row.our-row.theirs))]].map(([k,v],i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>{k}</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#1e293b' }}>{v}</span>
              </div>
            ))}
            {!row.match && (
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button onClick={()=>{toast.success('Dispute raised!');setRow(null);}} style={{
                  flex:1, background:'linear-gradient(135deg,#fef2f2,#fee2e2)', color:'#dc2626',
                  border:'1px solid #fecaca', borderRadius:12, padding:12, fontWeight:700, fontSize:12, cursor:'pointer',
                }}>🚩 Raise Dispute</button>
                <button onClick={()=>{toast.success('Variance accepted!');setRow(null);}} style={{
                  flex:1, background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', color:'#16a34a',
                  border:'1px solid #bbf7d0', borderRadius:12, padding:12, fontWeight:700, fontSize:12, cursor:'pointer',
                }}>✓ Accept Variance</button>
              </div>
            )}
          </div>
        )}
      </VModal>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function AggregatorPayout() {
  const [done, setDone] = useState(false);

  const handleDone = () => {
    setDone(true);
    toast.success('6 invoices reconciled successfully!');
  };

  return (
    <div style={S.page}>
      <div style={{ maxWidth:1080, margin:'0 auto', paddingBottom:40 }}>
        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <div style={{
              width:44, height:44, borderRadius:14,
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,

            }}>🔄</div>
            <div>
              <h1 style={{ color:'#1e293b', fontSize:24, fontWeight:900, margin:0 }}>Aggregator Payout Reconciler</h1>
              <p style={{ color:'#64748b', fontSize:12, margin:0, fontWeight:500 }}>
                Upload vendor statement — AI auto-matches with our records
              </p>
            </div>
          </div>
        </div>

        {done ? <ResultsScreen onReset={()=>setDone(false)}/> : <UploadScreen onDone={handleDone}/>}
      </div>
    </div>
  );
}
