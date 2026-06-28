import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, Package, Search, Truck, CheckCircle2,
    FileText, Printer, X, Plus, Minus, Building2,
    Store, Warehouse, ChevronRight, Clock, AlertTriangle,
    ArrowRightLeft, RefreshCw, MapPin, Zap, Filter,
    TrendingUp, ShoppingCart, Send, Eye
} from 'lucide-react';
import { fetchProducts, createSTO, fetchSTOs, updateSTOStatus, fetchBranches } from '../../api/vendorService';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────────────────────────────────────
   Scoped Styles
───────────────────────────────────────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

  .sta-root * { box-sizing: border-box; }
  .sta-root { font-family: 'Inter', sans-serif; }

  /* Hide number input spinners */
  .sta-qty-input::-webkit-inner-spin-button,
  .sta-qty-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .sta-qty-input { -moz-appearance: textfield; }

  /* Custom scrollbar */
  .sta-scroll::-webkit-scrollbar { width: 4px; }
  .sta-scroll::-webkit-scrollbar-track { background: transparent; }
  .sta-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
  .sta-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }

  /* Outlet card hover */
  .sta-outlet-card { transition: all 0.18s ease; }
  .sta-outlet-card:hover:not(.disabled) { transform: translateY(-1px); }

  /* Product row hover */
  .sta-product-row { transition: all 0.15s ease; }

  /* Table row hover */
  .sta-tr:hover { background: #f8fafc; }

  /* Pulse dot */
  @keyframes sta-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
  .sta-pulse { animation: sta-pulse 2s ease-in-out infinite; }

  /* Spin */
  @keyframes sta-spin { to { transform: rotate(360deg); } }
  .sta-spin { animation: sta-spin 0.8s linear infinite; }

  /* Slide-in */
  @keyframes sta-slide-in { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
  .sta-slide-in { animation: sta-slide-in 0.22s ease; }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────────────────── */
// OUTLETS will now be fetched from backend branches

const STATUS_CFG = {
    DRAFT:      { label: 'Draft',      color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' },
    IN_TRANSIT: { label: 'In Transit', color: '#0d9488', bg: '#ccfbf1', dot: '#0d9488' },
    RECEIVED:   { label: 'Received',   color: '#10b981', bg: '#d1fae5', dot: '#10b981' },
    CANCELLED:  { label: 'Cancelled',  color: '#ef4444', bg: '#fee2e2', dot: '#ef4444' },
};

/* ─────────────────────────────────────────────────────────────────────────────
   Challan Modal
───────────────────────────────────────────────────────────────────────────── */
function ChallanModal({ isOpen, onClose, cart, fromOutlet, toOutlet }) {
    const challanNo = `DC-${Date.now().toString().slice(-8)}`;
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const printRef = useRef();

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const win = window.open('', '', 'width=860,height=660');
        win.document.write(`<html><head><title>Delivery Challan – ${challanNo}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            *{box-sizing:border-box}
            body{font-family:'Inter',Arial,sans-serif;padding:40px;font-size:13px;color:#1e293b;background:#fff}
            table{width:100%;border-collapse:collapse;margin:20px 0}
            th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:left}
            th{background:#f8fafc;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:#64748b}
            .hdr{border-bottom:3px solid #16a34a;margin-bottom:24px;padding-bottom:18px;display:flex;justify-content:space-between;align-items:flex-start}
            .title{font-size:26px;font-weight:900;color:#1e293b;letter-spacing:-0.5px}
            .sub{color:#94a3b8;font-size:11px;margin-top:4px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
            .route{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}
            .rb{padding:14px 18px;border-radius:10px;border:1.5px solid #e2e8f0}
            .rb-label{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px}
            .rb-name{font-size:16px;font-weight:900}
            .rb-sub{font-size:11px;font-weight:600;margin-top:2px;color:#64748b}
            .total-row td{font-weight:800;background:#f8fafc}
            .footer{margin-top:48px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px}
            .sig{border-top:2px solid #cbd5e1;padding-top:10px;margin-top:32px;font-size:10px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.6px}
            .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:10px;font-weight:800;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
        </style>
        </head><body>${content}</body></html>`);
        win.document.close();
        win.print();
    };

    if (!isOpen) return null;
    const totalItems = cart.reduce((a, c) => a + c.qty, 0);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            backdropFilter: 'blur(10px)', background: 'rgba(15,23,42,0.65)'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{
                    background: '#fff', borderRadius: 24, width: '100%', maxWidth: 680,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.22)'
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Delivery Challan</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, fontFamily: 'monospace', marginTop: 1 }}>{challanNo}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={16} color="#64748b" />
                    </button>
                </div>

                {/* Body */}
                <div ref={printRef} style={{ flex: 1, overflowY: 'auto', padding: 28 }} className="sta-scroll">
                    <div className="hdr" style={{ borderBottom: '3px solid #16a34a', paddingBottom: 18, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div className="title" style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>DELIVERY CHALLAN</div>
                            <div className="sub" style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: 4 }}>Internal Stock Transfer Document</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Challan No.</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', marginTop: 2 }}>{challanNo}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginTop: 2 }}>{today}</div>
                        </div>
                    </div>

                    {/* Route */}
                    <div className="route" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                        <div className="rb" style={{ padding: '14px 18px', borderRadius: 12, background: fromOutlet?.light, border: `1.5px solid ${fromOutlet?.ring}` }}>
                            <div className="rb-label" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: fromOutlet?.color, marginBottom: 6 }}>📦 From</div>
                            <div className="rb-name" style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{fromOutlet?.name}</div>
                            <div className="rb-sub" style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 2 }}>{fromOutlet?.sub}</div>
                        </div>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ArrowRight size={16} color="#fff" />
                        </div>
                        <div className="rb" style={{ padding: '14px 18px', borderRadius: 12, background: toOutlet?.light, border: `1.5px solid ${toOutlet?.ring}` }}>
                            <div className="rb-label" style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: toOutlet?.color, marginBottom: 6 }}>🏪 To</div>
                            <div className="rb-name" style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{toOutlet?.name}</div>
                            <div className="rb-sub" style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 2 }}>{toOutlet?.sub}</div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                {['#', 'Product Name', 'SKU / Barcode', 'Qty', 'Unit'].map((h, i) => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: i === 3 ? 'right' : 'left', fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item, i) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1e293b', fontSize: 13 }}>{item.name}</td>
                                    <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{item.sku || '—'}</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 900, color: '#16a34a', fontSize: 15, textAlign: 'right' }}>{item.qty}</td>
                                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>Units</td>
                                </tr>
                            ))}
                            <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                <td colSpan={3} style={{ padding: '12px 14px', fontWeight: 800, color: '#1e293b', textAlign: 'right', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Items</td>
                                <td style={{ padding: '12px 14px', fontWeight: 900, color: '#0f172a', fontSize: 18, textAlign: 'right' }}>{totalItems}</td>
                                <td />
                            </tr>
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="footer" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginTop: 52 }}>
                        {['Prepared By', 'Dispatched By', 'Received By'].map(label => (
                            <div key={label}>
                                <div style={{ borderTop: '2px solid #cbd5e1', paddingTop: 10, marginTop: 32 }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
                                    <div style={{ fontSize: 11, color: '#e2e8f0', marginTop: 4, fontStyle: 'italic' }}>Sign &amp; Stamp</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', gap: 12, padding: '16px 28px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                    <button onClick={handlePrint} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px 0', background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                        color: '#fff', fontSize: 13, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(22,163,74,0.35)', transition: 'all 0.2s'
                    }}>
                        <Printer size={16} /> Print Challan
                    </button>
                    <button onClick={onClose} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '12px 0', background: '#fff', border: '2px solid #bbf7d0',
                        color: '#16a34a', fontSize: 13, fontWeight: 700, borderRadius: 12, cursor: 'pointer'
                    }}>
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Outlet Selector Card
───────────────────────────────────────────────────────────────────────────── */
function OutletCard({ outlet, isSelected, onClick, disabled }) {
    const Icon = outlet.icon;
    return (
        <div
            onClick={disabled ? undefined : onClick}
            className="sta-outlet-card"
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer',
                border: isSelected ? `2px solid ${outlet.color}` : '2px solid #f1f5f9',
                background: isSelected ? outlet.light : '#fff',
                opacity: disabled ? 0.38 : 1,
                boxShadow: isSelected ? `0 4px 16px ${outlet.color}22` : 'none',
            }}
        >
            <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected ? outlet.color : '#f1f5f9',
                transition: 'all 0.18s'
            }}>
                <Icon size={17} color={isSelected ? '#fff' : '#94a3b8'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? outlet.color : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{outlet.name}</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{outlet.sub}</div>
            </div>
            {isSelected && <CheckCircle2 size={16} color={outlet.color} style={{ flexShrink: 0 }} />}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Status Badge
───────────────────────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.DRAFT;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 99,
            background: cfg.bg, color: cfg.color,
            fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
            {cfg.label}
        </span>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────────── */
export default function StockTransferAdvanced() {
    const { user } = useAuthStore();

    const [outlets, setOutlets] = useState([]);
    const [fromOutletId, setFromOutletId] = useState('');
    const [toOutletId, setToOutletId]     = useState('');

    const [products, setProducts]             = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchQuery, setSearchQuery]       = useState('');

    const [cart, setCart]       = useState([]);

    const [stos, setStos]           = useState([]);
    const [loadingSTOs, setLoadingSTOs] = useState(false);
    const [stoSearch, setStoSearch]   = useState('');

    const [showChallan, setShowChallan] = useState(false);
    const [submitting, setSubmitting]   = useState(false);

    const fromOutlet = outlets.find(o => o.id === fromOutletId);
    const toOutlet   = outlets.find(o => o.id === toOutletId);
    const routeOk    = toOutletId && fromOutletId !== toOutletId;

    /* ── Load branches (outlets) ── */
    useEffect(() => {
        fetchBranches().then(res => {
            const data = Array.isArray(res?.data ?? res) ? (res?.data ?? res) : [];
            const mapped = data.map((b, i) => {
                const colors = [
                    { color: '#16a34a', light: '#f0fdf4', ring: '#bbf7d0' },
                    { color: '#15803d', light: '#f0fdf4', ring: '#bbf7d0' },
                    { color: '#10b981', light: '#f0fdf4', ring: '#a7f3d0' },
                    { color: '#f59e0b', light: '#fffbeb', ring: '#fde68a' },
                    { color: '#22c55e', light: '#f0fdf4', ring: '#bbf7d0' }
                ];
                const c = colors[i % colors.length];
                return {
                    id: b.id,
                    name: b.branchName || 'Unknown',
                    sub: b.city || b.supermarket || 'Branch',
                    icon: Store,
                    color: c.color,
                    light: c.light,
                    ring: c.ring
                };
            });
            setOutlets(mapped);
            if (mapped.length > 0) setFromOutletId(mapped[0].id);
            if (mapped.length > 1) setToOutletId(mapped[1].id);
        }).catch(() => setOutlets([]));
    }, []);

    /* ── Load products ── */
    useEffect(() => {
        setLoadingProducts(true);
        fetchProducts()
            .then(res => { const l = Array.isArray(res?.data ?? res) ? (res?.data ?? res) : []; setProducts(l); })
            .catch(() => setProducts([]))
            .finally(() => setLoadingProducts(false));
    }, []);

    /* ── Load STOs ── */
    const loadSTOs = () => {
        setLoadingSTOs(true);
        fetchSTOs()
            .then(res => { const l = Array.isArray(res?.data ?? res) ? (res?.data ?? res) : []; setStos(l); })
            .catch(() => setStos([]))
            .finally(() => setLoadingSTOs(false));
    };
    useEffect(() => { loadSTOs(); }, []);

    /* ── Filtered products ── */
    const filteredProducts = products.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    });

    /* ── Cart actions ── */
    const addToCart = (product) => setCart(prev => {
        const exists = prev.find(i => i.id === product.id);
        if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: Math.min(i.qty + 1, i.maxQty) } : i);
        return [...prev, { id: product.id, name: product.name, sku: product.sku || product.barcode || '', qty: 1, maxQty: product.currentStock || 999 }];
    });

    const updateCartQty = (id, delta) => setCart(prev =>
        prev.map(i => i.id === id ? { ...i, qty: Math.max(1, Math.min(i.maxQty, i.qty + delta)) } : i)
    );

    const setCartQty = (id, val) => {
        const num = parseInt(val, 10);
        if (isNaN(num) || num < 1) return;
        setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.min(i.maxQty, num) } : i));
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

    /* ── Dispatch ── */
    const handleDispatch = async () => {
        if (cart.length === 0) { toast.error('Add at least one item to the cart.'); return; }
        if (!routeOk) { toast.error('Select different source & destination outlets.'); return; }
        setSubmitting(true);
        try {
            for (const item of cart) {
                await createSTO({
                    productId: item.id,
                    sourceBranchName: fromOutlet.name,
                    destBranchName: toOutlet.name,
                    transferQuantity: item.qty,
                    transferDate: new Date().toISOString().split('T')[0],
                    transferMode: 'Own Vehicle',
                    priority: 'Normal',
                    capitalSaved: 0
                }, user?.id);
            }
            toast.success(`🚛 ${cart.length} STO${cart.length > 1 ? 's' : ''} dispatched successfully!`);
            setCart([]);
            loadSTOs();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to create STO. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Status update ── */
    const handleStatusUpdate = (id, newStatus) => {
        updateSTOStatus(id, newStatus, user?.id)
            .then(() => { toast.success(`STO updated to ${newStatus}!`); loadSTOs(); })
            .catch(err => toast.error(err?.response?.data?.message || 'Failed to update status'));
    };

    /* ── Filtered STO log ── */
    const filteredSTOs = stos.filter(s => {
        if (!stoSearch) return true;
        const q = stoSearch.toLowerCase();
        return (s.productName || '').toLowerCase().includes(q)
            || (s.stoNumber || '').toLowerCase().includes(q)
            || (s.sourceBranchName || '').toLowerCase().includes(q)
            || (s.destBranchName || '').toLowerCase().includes(q);
    });

    const totalCartQty = cart.reduce((a, c) => a + c.qty, 0);

    /* ───────────────────────────────────────────────────────────────────────── */
    return (
        <>
            <style>{styles}</style>
            <div className="sta-root" style={{ minHeight: '100vh', background: '#f0f4f8', padding: '24px 20px' }}>

                {/* ── Page Header ─────────────────────────────────────── */}
                <div style={{ marginBottom: 28 }}>
                    {/* Breadcrumb */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 14 }}>
                        <span style={{ color: '#64748b' }}>Inventory</span>
                        <ChevronRight size={12} />
                        <span style={{ color: '#64748b' }}>Stock Management</span>
                        <ChevronRight size={12} />
                        <span style={{ color: '#16a34a' }}>Stock Transfer</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 14,
                                    background: 'linear-gradient(135deg,#16a34a 0%,#22c55e 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 6px 18px rgba(22,163,74,0.35)'
                                }}>
                                    <ArrowRightLeft size={20} color="#fff" />
                                </div>
                                <div>
                                    <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.6px', margin: 0 }}>Stock Transfer</h1>
                                    <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>Dispatch stock between outlets &amp; generate delivery challans</p>
                                </div>
                            </div>
                        </div>

                        {/* Header actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Live badge */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 7,
                                padding: '7px 14px', borderRadius: 99,
                                background: '#f0fdf4', border: '1.5px solid #bbf7d0'
                            }}>
                                <span className="sta-pulse" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Live Sync</span>
                            </div>

                            {/* Refresh */}
                            <button onClick={loadSTOs} style={{
                                width: 38, height: 38, borderRadius: 10, background: '#fff',
                                border: '1.5px solid #bbf7d0', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                            }}>
                                <RefreshCw size={15} color="#64748b" />
                            </button>
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 20, background: '#fff', borderRadius: 14, padding: '12px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                        {[
                            { step: 1, label: 'Select Route', sub: 'Choose source & destination', done: routeOk },
                            { step: 2, label: 'Add Products', sub: 'Pick items to transfer', done: cart.length > 0 },
                            { step: 3, label: 'Review Cart', sub: 'Set quantities', done: cart.length > 0 && routeOk },
                            { step: 4, label: 'Dispatch', sub: 'Create STO & send', done: false },
                        ].map((s, idx) => (
                            <React.Fragment key={s.step}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: s.done ? '#16a34a' : '#f1f5f9',
                                        color: s.done ? '#fff' : '#94a3b8',
                                        fontWeight: 800, fontSize: 13, flexShrink: 0
                                    }}>
                                        {s.done ? <CheckCircle2 size={16} color="#fff" /> : s.step}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: s.done ? '#16a34a' : '#475569' }}>{s.label}</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{s.sub}</div>
                                    </div>
                                </div>
                                {idx < 3 && (
                                    <div style={{ flex: 1, minWidth: 24, height: 2, background: idx < 2 && s.done ? 'linear-gradient(90deg,#16a34a,#22c55e)' : '#e2e8f0', margin: '0 12px', borderRadius: 2 }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* ── Main 3-panel grid ───────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 340px', gap: 16, marginBottom: 20, alignItems: 'start' }}>

                    {/* ── LEFT: Route Selector ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* FROM panel */}
                        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <MapPin size={14} color="#16a34a" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>From</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Transfer source</div>
                                </div>
                            </div>
                            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {outlets.map(o => (
                                    <OutletCard
                                        key={`from-${o.id}`}
                                        outlet={o}
                                        isSelected={fromOutletId === o.id}
                                        onClick={() => { if (toOutletId === o.id) setToOutletId(''); setFromOutletId(o.id); }}
                                        disabled={false}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Arrow bridge */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                            <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg,transparent,#bbf7d0)' }} />
                            <div style={{
                                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                                background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 14px rgba(22,163,74,0.35)'
                            }}>
                                <ArrowRight size={17} color="#fff" />
                            </div>
                            <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(270deg,transparent,#bbf7d0)' }} />
                        </div>

                        {/* TO panel */}
                        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Truck size={14} color="#22c55e" />
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>To</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>Destination outlet</div>
                                </div>
                            </div>
                            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {outlets.map(o => (
                                    <OutletCard
                                        key={`to-${o.id}`}
                                        outlet={o}
                                        isSelected={toOutletId === o.id}
                                        onClick={() => setToOutletId(o.id)}
                                        disabled={fromOutletId === o.id}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── CENTER: Product Catalog ── */}
                    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: 560 }}>
                        {/* Catalog header */}
                        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Product Catalog</h3>
                                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                                        {loadingProducts ? 'Loading…' : !searchQuery.trim() ? 'Search to view products' : `${filteredProducts.length} results`}
                                    </p>
                                </div>
                                {fromOutlet && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                                        borderRadius: 99, background: fromOutlet.light, border: `1.5px solid ${fromOutlet.ring}`
                                    }}>
                                        <Package size={12} color={fromOutlet.color} />
                                        <span style={{ fontSize: 11, fontWeight: 700, color: fromOutlet.color }}>{fromOutlet.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Search bar */}
                            <div style={{ position: 'relative' }}>
                                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                <input
                                    type="text"
                                    placeholder="Search by product name or SKU…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 10, paddingBottom: 10,
                                        background: '#f8fafc', border: '1.5px solid #bbf7d0', borderRadius: 12,
                                        fontSize: 13, fontWeight: 500, color: '#1e293b', outline: 'none',
                                        fontFamily: 'inherit', transition: 'all 0.18s'
                                    }}
                                    onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.background = '#fff'; }}
                                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                                />
                            </div>
                        </div>

                        {/* Product list */}
                        <div className="sta-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {loadingProducts ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 14 }}>
                                    <div className="sta-spin" style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#16a34a' }} />
                                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Loading products…</span>
                                </div>
                            ) : !searchQuery.trim() ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
                                    <div style={{ width: 60, height: 60, borderRadius: 18, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Search size={28} color="#cbd5e1" />
                                    </div>
                                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Search for products</span>
                                    <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500 }}>Enter a product name or SKU to view catalog</span>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
                                    <div style={{ width: 60, height: 60, borderRadius: 18, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Package size={28} color="#cbd5e1" />
                                    </div>
                                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>No products found</span>
                                    <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500 }}>Try a different search term</span>
                                </div>
                            ) : (
                                filteredProducts.map(product => {
                                    const inCart = cart.find(i => i.id === product.id);
                                    const stock = product.currentStock || 0;
                                    const stockStatus = stock <= 0 ? 'out' : stock <= 10 ? 'low' : 'ok';
                                    const stockColor = stockStatus === 'out' ? '#ef4444' : stockStatus === 'low' ? '#f59e0b' : '#10b981';

                                    return (
                                        <div
                                            key={product.id}
                                            className="sta-product-row"
                                            onClick={() => stockStatus !== 'out' && addToCart(product)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                                                borderRadius: 12, cursor: stockStatus === 'out' ? 'not-allowed' : 'pointer',
                                                border: inCart ? '2px solid #bbf7d0' : '2px solid #f1f5f9',
                                                background: inCart ? '#f0fdf4' : '#fff',
                                                opacity: stockStatus === 'out' ? 0.5 : 1,
                                                boxShadow: inCart ? '0 2px 10px rgba(22,163,74,0.12)' : 'none',
                                            }}
                                            onMouseEnter={e => { if (!inCart && stockStatus !== 'out') e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = inCart ? '#bbf7d0' : '#f1f5f9'; e.currentTarget.style.boxShadow = inCart ? '0 2px 10px rgba(22,163,74,0.12)' : 'none'; }}
                                        >
                                            {/* Icon */}
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: inCart ? '#16a34a' : '#f8fafc',
                                            }}>
                                                <Package size={18} color={inCart ? '#fff' : '#94a3b8'} />
                                            </div>

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                                                <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>{product.sku || product.barcode || 'No SKU'}</div>
                                            </div>

                                            {/* Stock */}
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: stockColor }}>{stock}</div>
                                                <div style={{ fontSize: 9, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                                    {stockStatus === 'out' ? 'Out of stock' : stockStatus === 'low' ? 'Low stock' : 'In stock'}
                                                </div>
                                            </div>

                                            {/* Add/check */}
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: inCart ? '#16a34a' : stockStatus === 'out' ? '#f1f5f9' : '#f1f5f9',
                                            }}>
                                                {inCart ? <CheckCircle2 size={16} color="#fff" /> : <Plus size={16} color={stockStatus === 'out' ? '#cbd5e1' : '#16a34a'} />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT: Transfer Cart ── */}
                    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: 560 }}>
                        {/* Cart header */}
                        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                        <ShoppingCart size={16} color="#16a34a" />
                                        {cart.length > 0 && (
                                            <span style={{
                                                position: 'absolute', top: -5, right: -5, width: 17, height: 17,
                                                borderRadius: '50%', background: '#16a34a', color: '#fff',
                                                fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '2px solid #fff'
                                            }}>{cart.length}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Transfer Cart</div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 1 }}>
                                            {cart.length === 0 ? 'No items added' : `${cart.length} item${cart.length !== 1 ? 's' : ''} · ${totalCartQty} units total`}
                                        </div>
                                    </div>
                                </div>
                                {cart.length > 0 && (
                                    <button onClick={() => setCart([])} style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8, cursor: 'pointer' }}>
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Route summary */}
                            {routeOk ? (
                                <div style={{
                                    marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                                    borderRadius: 12, background: 'linear-gradient(135deg,#f0fdf4,#f0fdf4)',
                                    border: '1.5px solid #bbf7d0'
                                }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: fromOutlet?.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40%' }}>{fromOutlet?.name}</span>
                                    <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg,#bbf7d0,#86efac)', borderRadius: 2 }} />
                                    <ArrowRight size={13} color="#22c55e" style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1, height: 1.5, background: 'linear-gradient(90deg,#86efac,#bbf7d0)', borderRadius: 2 }} />
                                    <span style={{ fontSize: 12, fontWeight: 700, color: toOutlet?.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40%' }}>{toOutlet?.name}</span>
                                </div>
                            ) : (
                                <div style={{
                                    marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                                    borderRadius: 12, background: '#fffbeb', border: '1.5px solid #fde68a'
                                }}>
                                    <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>Select different source &amp; destination</span>
                                </div>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className="sta-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <AnimatePresence>
                                {cart.length === 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 14, opacity: 0.5 }}>
                                        <div style={{ width: 68, height: 68, borderRadius: 20, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ShoppingCart size={32} color="#cbd5e1" />
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>Cart is empty</div>
                                            <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4, fontWeight: 500 }}>Click products in the catalog<br />to add them here</div>
                                        </div>
                                    </div>
                                ) : cart.map(item => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: 20, scale: 0.97 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -20, scale: 0.97 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                                        style={{
                                            padding: '14px 14px 12px',
                                            borderRadius: 14,
                                            border: '1.5px solid #bbf7d0',
                                            background: '#fafbfc'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', lineHeight: '1.3' }}>{item.name}</div>
                                                {item.sku && <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#94a3b8', marginTop: 2 }}>{item.sku}</div>}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                style={{
                                                    width: 26, height: 26, borderRadius: 8, background: '#fff',
                                                    border: '1.5px solid #bbf7d0', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.background = '#fff8f8'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#fff'; }}
                                            >
                                                <X size={12} color="#94a3b8" />
                                            </button>
                                        </div>

                                        {/* Quantity stepper */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 10, border: '1.5px solid #bbf7d0', padding: '4px 6px' }}>
                                            <button
                                                onClick={() => updateCartQty(item.id, -1)}
                                                style={{
                                                    width: 30, height: 30, borderRadius: 8, background: '#f8fafc',
                                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
                                            >
                                                <Minus size={13} color="#64748b" />
                                            </button>
                                            <input
                                                type="number"
                                                className="sta-qty-input"
                                                value={item.qty}
                                                onChange={e => setCartQty(item.id, e.target.value)}
                                                min={1} max={item.maxQty}
                                                style={{
                                                    flex: 1, textAlign: 'center', fontWeight: 800, fontSize: 16, color: '#0f172a',
                                                    border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit'
                                                }}
                                            />
                                            <button
                                                onClick={() => updateCartQty(item.id, 1)}
                                                style={{
                                                    width: 30, height: 30, borderRadius: 8, background: '#f8fafc',
                                                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
                                            >
                                                <Plus size={13} color="#16a34a" />
                                            </button>
                                        </div>
                                        <div style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 600, textAlign: 'center', marginTop: 6 }}>
                                            Available: {item.maxQty} units
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Cart actions */}
                        <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 10, background: '#fafbfc', borderRadius: '0 0 18px 18px' }}>
                            {/* Summary row */}
                            {cart.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0' }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Total units to transfer</span>
                                    <span style={{ fontSize: 16, fontWeight: 900, color: '#16a34a' }}>{totalCartQty}</span>
                                </div>
                            )}

                            {/* Preview challan */}
                            <button
                                onClick={() => setShowChallan(true)}
                                disabled={cart.length === 0}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '11px 0', borderRadius: 12,
                                    border: cart.length > 0 ? '2px solid #bbf7d0' : '2px solid #e2e8f0',
                                    background: cart.length > 0 ? '#f0fdf4' : '#f8fafc',
                                    color: cart.length > 0 ? '#16a34a' : '#cbd5e1',
                                    fontSize: 13, fontWeight: 700, cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.18s', fontFamily: 'inherit'
                                }}
                            >
                                <Eye size={15} /> Preview Delivery Challan
                            </button>

                            {/* Dispatch */}
                            <button
                                onClick={handleDispatch}
                                disabled={submitting || cart.length === 0 || !routeOk}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '13px 0', borderRadius: 12, border: 'none',
                                    background: (cart.length > 0 && routeOk && !submitting)
                                        ? 'linear-gradient(135deg,#16a34a,#22c55e)'
                                        : '#e2e8f0',
                                    color: (cart.length > 0 && routeOk && !submitting) ? '#fff' : '#94a3b8',
                                    fontSize: 14, fontWeight: 800, cursor: (cart.length > 0 && routeOk && !submitting) ? 'pointer' : 'not-allowed',
                                    boxShadow: (cart.length > 0 && routeOk && !submitting) ? '0 6px 20px rgba(22,163,74,0.4)' : 'none',
                                    transition: 'all 0.2s', fontFamily: 'inherit'
                                }}
                            >
                                {submitting ? (
                                    <>
                                        <div className="sta-spin" style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%' }} />
                                        Dispatching…
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Dispatch Stock Transfer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Challan Modal */}
                <AnimatePresence>
                    {showChallan && (
                        <ChallanModal
                            isOpen={showChallan}
                            onClose={() => setShowChallan(false)}
                            cart={cart}
                            fromOutlet={fromOutlet}
                            toOutlet={toOutlet}
                        />
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
