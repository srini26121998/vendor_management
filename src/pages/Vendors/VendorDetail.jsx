import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { VENDOR_ROUTES, STATUS_COLORS } from './vendorConstants';
import {
    StatusBadge, TierBadge, VCard, SectionTitle, StatRow, PrimaryBtn, SecondaryBtn, VModal
} from './VendorComponents';
import { ArrowLeft, MessageSquare, ShieldCheck, Mail, Printer, Download, CheckCircle, XCircle, AlertTriangle, Loader2, Edit3, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { printData } from '../../utils/exportUtils';
import useVendorStore from '../../store/useVendorStore';
import { fetchVendorById, fetchVendorProducts, fetchExpiredVendorProducts, fetchVendorReturns, fetchVendorPayments } from '../../api/vendorService';
import { adaptVendor } from '../../api/vendorAdapter';

const TABS = [
    { key: 'basic', label: 'Basic Info', icon: '🏢' },
    { key: 'products', label: 'Products', icon: '📦' },
    { key: 'bank', label: 'Bank Accounts', icon: '🏦' },
    { key: 'docs', label: 'Statutory Vault', icon: '🔒' },
    // { key: 'performance', label: 'Performance', icon: '📈' },
    { key: 'returns', label: 'Returns', icon: '🔄' },
    { key: 'expired', label: 'Expired', icon: '⚠️' },
    { key: 'payment', label: 'Payment Details', icon: '💳' },
];

export default function VendorDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tab, setTab] = useState('basic');
    const [previewDoc, setPreviewDoc] = useState(null);
    const { vendors, blockVendorApi, unblockVendorApi, removeVendor } = useVendorStore();
    const [vendorData, setVendorData] = useState(null);
    const [vendorLoading, setVendorLoading] = useState(true);
    const [vendorProducts, setVendorProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [expiredProducts, setExpiredProducts] = useState([]);
    const [expiredProductsLoading, setExpiredProductsLoading] = useState(false);
    const [hasFetchedExpired, setHasFetchedExpired] = useState(false);
    
    const [returnsData, setReturnsData] = useState([]);
    const [returnsLoading, setReturnsLoading] = useState(false);
    const [hasFetchedReturns, setHasFetchedReturns] = useState(false);

    const [paymentsData, setPaymentsData] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [hasFetchedPayments, setHasFetchedPayments] = useState(false);

    // ── Modal States ──
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');
    const [showComplianceModal, setShowComplianceModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // ── Fetch the correct vendor by ID from backend ──
    useEffect(() => {
        if (!id) return;
        setVendorLoading(true);
        fetchVendorById(id)
            .then(res => {
                const data = res?.data || res;
                if (data && data.id) {
                    setVendorData(adaptVendor(data));
                } else {
                    // Fall back to Zustand store cache
                    const cached = vendors.find(v => v.id === id);
                    if (cached) setVendorData(cached);
                    else toast.error('Vendor not found in system.');
                }
            })
            .catch(() => {
                // Network error — use Zustand cache
                const cached = vendors.find(v => v.id === id);
                if (cached) setVendorData(cached);
                else toast.error('Could not load vendor. Please check connection.');
            })
            .finally(() => setVendorLoading(false));

        // Fetch products for this vendor
        setProductsLoading(true);
        fetchVendorProducts(id)
            .then(res => {
                setVendorProducts(res?.data || res || []);
            })
            .catch(() => {
                console.error('Failed to load vendor products');
            })
            .finally(() => setProductsLoading(false));

    }, [id]);

    useEffect(() => {
        if (tab === 'expired' && !hasFetchedExpired) {
            setExpiredProductsLoading(true);
            fetchExpiredVendorProducts(id)
                .then(res => {
                    setExpiredProducts(res?.data || res || []);
                    setHasFetchedExpired(true);
                })
                .catch(() => {
                    console.error('Failed to load expired products');
                })
                .finally(() => setExpiredProductsLoading(false));
        }
    }, [tab, id, hasFetchedExpired]);

    useEffect(() => {
        if (tab === 'returns' && !hasFetchedReturns) {
            setReturnsLoading(true);
            fetchVendorReturns(id)
                .then(res => {
                    setReturnsData(res?.data || res || []);
                    setHasFetchedReturns(true);
                })
                .catch(() => {
                    console.error('Failed to load returns data');
                })
                .finally(() => setReturnsLoading(false));
        }
    }, [tab, id, hasFetchedReturns]);

    useEffect(() => {
        if (tab === 'payment' && !hasFetchedPayments) {
            setPaymentsLoading(true);
            fetchVendorPayments(id)
                .then(res => {
                    setPaymentsData(res?.data || res || []);
                    setHasFetchedPayments(true);
                })
                .catch(() => {
                    console.error('Failed to load payments data');
                })
                .finally(() => setPaymentsLoading(false));
        }
    }, [tab, id, hasFetchedPayments]);

    const vendor = vendorData || vendors.find(v => v.id === id);

    if (vendorLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 size={40} className="animate-spin text-green-800" />
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">Vendor Not Found</h2>
                    <p className="text-slate-500 mt-2">The requested vendor does not exist or has been removed.</p>
                    <PrimaryBtn onClick={() => navigate(VENDOR_ROUTES.list)} className="mt-6">
                        Back to Directory
                    </PrimaryBtn>
                </div>
            </div>
        );
    }

    const COMPLIANCE_CHECKS = [
        { label: 'GSTIN Validity', status: vendor.gstin ? 'pass' : 'fail' },
        { label: 'PAN Registered', status: vendor.pan ? 'pass' : 'fail' },
        { label: 'FSSAI License', status: vendor.fssai ? 'pass' : 'warn' },
        { label: 'Bank Account Verified', status: vendor.bankAccounts?.length > 0 ? 'pass' : 'fail' },
        { label: 'Documents Uploaded', status: vendor.documents?.length >= 2 ? 'pass' : 'warn' },
        { label: 'No Expired Docs', status: vendor.documents?.some(d => d.status === 'blocked') ? 'fail' : 'pass' },
        { label: 'Signatory Declared', status: vendor.declaration?.signatoryName ? 'pass' : 'warn' },
    ];
    const complianceScore = Math.round((COMPLIANCE_CHECKS.filter(c => c.status === 'pass').length / COMPLIANCE_CHECKS.length) * 100);

    const hasExpiredDocs = vendor.documents?.some(d => d.status === 'expiring_soon' || d.status === 'blocked');
    const expiredCount = vendor.documents?.filter(d => d.status === 'expiring_soon' || d.status === 'blocked').length;

    const handleRemind = () => {
        toast.success(`Reminder sent to ${vendor.name} for document renewal!`);
    };

    const handlePrint = () => {
        printData([vendor], `Vendor Details: ${vendor.name}`, [
            { header: 'ID', accessor: 'id' },
            { header: 'Name', accessor: 'name' },
            { header: 'Category', accessor: 'category' },
            { header: 'Status', accessor: 'status' },
            { header: 'GSTIN', accessor: 'gstin' },
            { header: 'PAN', accessor: 'pan' },
            { header: 'City', accessor: 'city' },
            { header: 'State', accessor: 'state' }
        ]);
    };

    // ── Email Handler ──
    const handleSendEmail = () => {
        if (!emailSubject.trim()) { toast.error('Email subject is required.'); return; }
        if (!emailBody.trim()) { toast.error('Email body cannot be empty.'); return; }
        toast.promise(
            new Promise(res => setTimeout(res, 1500)),
            {
                loading: `Sending email to ${vendor.name}...`,
                success: `Email sent to ${vendor.email} successfully! ✉️`,
                error: 'Failed to send email.'
            }
        );
        setEmailSubject('');
        setEmailBody('');
        setShowEmailModal(false);
    };

    // ── Block / Unblock Handlers ──
    const handleBlock = () => {
        const reason = window.prompt("Enter reason for blocking this vendor:");
        if (!reason) return;
        toast.promise(
            blockVendorApi(vendor.id, reason),
            {
                loading: 'Blocking vendor...',
                success: (res) => {
                    setVendorData(res);
                    return 'Vendor blocked successfully!';
                },
                error: 'Failed to block vendor'
            }
        );
    };

    const handleUnblock = () => {
        toast.promise(
            unblockVendorApi(vendor.id),
            {
                loading: 'Unblocking vendor...',
                success: (res) => {
                    setVendorData(res);
                    return 'Vendor unblocked successfully!';
                },
                error: 'Failed to unblock vendor'
            }
        );
    };

    // ── Download Audit Trail ──
    const handleDownloadAuditTrail = () => {
        const lines = [
            `AUDIT TRAIL — ${vendor.name} (${vendor.id})`,
            '='.repeat(60),
            `Generated: ${new Date().toLocaleString()}`,
            '',
            ...((vendor.auditLog || [
                { action: 'Vendor Onboarded', user: 'admin', timestamp: '2026-01-15 10:30' },
                { action: 'KYC Documents Uploaded', user: 'vendor_portal', timestamp: '2026-01-16 14:22' },
                { action: 'Approved by Manager', user: 'Arun Varma', timestamp: '2026-01-17 09:15' },
                { action: 'Status Changed: Active', user: 'system', timestamp: '2026-01-17 09:16' },
            ]).map(l => `[${l.timestamp}]  ${l.action}  (by: ${l.user})`)),
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${vendor.id}_AuditTrail.txt`;
        a.click(); URL.revokeObjectURL(url);
        toast.success('Audit trail downloaded!');
    };

    // ── Download Scorecard ──
    const handleDownloadScorecard = () => {
        printData([{
            vendor: vendor.name,
            category: vendor.category,
            tier: vendor.tier || 'Bronze',
            fulfillment: '94.5%',
            accuracy: '98.2%',
            pricing: '85.0%',
            totalOrders: vendor.totalOrders || 0,
            rating: vendor.rating || 0,
        }], `Vendor Scorecard: ${vendor.name}`, [
            { header: 'Vendor', accessor: 'vendor' },
            { header: 'Category', accessor: 'category' },
            { header: 'Tier', accessor: 'tier' },
            { header: 'Fulfillment Rate', accessor: 'fulfillment' },
            { header: 'Order Accuracy', accessor: 'accuracy' },
            { header: 'Pricing Score', accessor: 'pricing' },
            { header: 'Total Orders', accessor: 'totalOrders' },
        ]);
        toast.success('Scorecard print dialog opened!');
    };

    // ── Deletion and Dossier Handlers ──
    const confirmDelete = () => {
        setShowDeleteModal(false);
        toast.promise(
            removeVendor(vendor.id),
            {
                loading: `Removing ${vendor.name || vendor.vendorCode}...`,
                success: () => {
                    navigate(VENDOR_ROUTES.list);
                    return `Vendor "${vendor.name || vendor.vendorCode}" removed from the registry.`;
                },
                error: (err) => err?.response?.data?.message || 'Failed to delete vendor.',
            }
        );
    };

    const handleDownloadDossier = (v) => {
        const generateDossier = async () => {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const content = `VENDOR DOSSIER: ${v.vendorCode || v.id}\n-----------------------------------\nName: ${v.name}\nCategory: ${v.category}\nGSTIN: ${v.gstin}\nPAN: ${v.pan}\nFSSAI: ${v.fssai || 'N/A'}\nLocation: ${v.city}\nStatus: ${v.status.toUpperCase()}\nLast Updated: ${v.lastUpdated || ''}\n-----------------------------------\nGenerated on: ${new Date().toLocaleString()}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${v.vendorCode || v.id}_Dossier.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        };

        toast.promise(
            generateDossier(),
            {
                loading: `Generating document package for ${v.name}...`,
                success: `Dossier for ${v.vendorCode || v.id} downloaded successfully.`,
                error: 'Failed to generate documents.',
            }
        );
    };

    // ── Cheque Preview ──
    const handleChequePreview = (bank) => {
        toast.success(`Loading cancelled cheque for ${bank.bank}... 🏦`);
        // In a real system, open the cheque document URL
        // For demo: show a toast as the doc would open in a new tab
    };

    // ── Download Original PDF ──
    const handleDownloadDocPDF = (doc) => {
        toast.promise(
            new Promise(res => setTimeout(res, 1200)),
            {
                loading: `Downloading ${doc.type} document...`,
                success: `${doc.type} document downloaded successfully! 📄`,
                error: 'Download failed. Please try again.'
            }
        );
    };

    // ── Loading guard ──
    if (vendorLoading && !vendor) {
        return (
            <div className="w-full min-h-screen bg-[#F3F5F9] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-green-800 animate-spin" />
                    <p className="text-[13px] font-bold text-slate-500">Loading vendor profile...</p>
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="w-full min-h-screen bg-[#F3F5F9] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-5xl">🔍</div>
                    <h2 className="text-xl font-bold text-slate-700">Vendor Not Found</h2>
                    <p className="text-slate-500 text-sm">No vendor with ID <span className="font-mono font-bold">{id}</span> exists.</p>
                    <button onClick={() => navigate(VENDOR_ROUTES.list)}
                        className="px-6 py-2 bg-green-800 text-white rounded-xl font-bold text-sm hover:bg-green-950 transition-all">
                        ← Back to Vendor List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen" style={{ fontFamily: '"Outfit", sans-serif' }}>
            {/* ── Sticky Top Bar ── */}
            <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(VENDOR_ROUTES.list)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-all">
                        <ArrowLeft size={12} /> Back
                    </button>
                    <div className="h-4 w-px bg-slate-200" />
                    <nav className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                        <button onClick={() => navigate(VENDOR_ROUTES.list)} className="hover:text-green-800 transition-colors">Vendor Master</button>
                        <span className="mx-1">/</span>
                        <span className="text-slate-700">{vendor.name}</span>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-all">
                        <Mail size={12} /> Email
                    </button>
                    <button onClick={() => handleDownloadDossier(vendor)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-all">
                        <Download size={12} /> Download Dossier
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition-all">
                        <Printer size={12} /> Print
                    </button>
                    <button onClick={() => navigate(VENDOR_ROUTES.onboarding, { state: { vendor, mode: 'edit' } })} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-all">
                        <Edit3 size={12} /> Edit
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-all">
                        <Trash2 size={12} /> Delete
                    </button>
                    <button onClick={() => setShowComplianceModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-[11px] font-bold text-green-700 hover:bg-green-100 transition-all">
                        <ShieldCheck size={12} /> Compliance Audit
                    </button>
                    {vendor.status === 'blocked' || vendor.kycStatus === 'BLOCKED' ? (
                        <button onClick={handleUnblock} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-all">
                            <CheckCircle size={12} /> Unblock
                        </button>
                    ) : (
                        <button onClick={handleBlock} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition-all">
                            <XCircle size={12} /> Block
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 space-y-4">

                {/* ── Alerts & Notifications ── */}
                {hasExpiredDocs && (
                    <div className="mb-8 animate-in slide-in-from-top-4">
                        <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm ${expiredCount > 1 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{expiredCount > 1 ? '🚨' : '⚠️'}</span>
                                <div>
                                    <p className="font-bold text-[14px] uppercase tracking-[0.1em]">{expiredCount > 1 ? 'Critical: POs and Payments are BLOCKED' : 'Document Expiry Warning'}</p>
                                    <p className="text-[13px] font-medium opacity-80 mt-0.5">{expiredCount} Statutory document(s) need immediate attention.</p>
                                </div>
                            </div>
                            <button onClick={handleRemind} className="px-6 py-2 bg-white rounded-xl text-[12px] font-bold border border-current hover:bg-current hover:text-white transition-all">
                                Remind Vendor
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Vendor Hero Header ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 relative overflow-hidden mb-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
                            {vendor.logo ? (
                                <img src={vendor.logo} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-green-800 font-bold text-2xl">{(vendor.name || 'V').charAt(0)}</span>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{vendor.name}</h2>
                                <StatusBadge status={vendor.status} size="xs" />
                                <TierBadge tier={vendor.tier} />
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-3 flex items-center gap-2">
                                {vendor.category} <span className="w-1 h-1 bg-slate-200 rounded-full"></span> {vendor.city}, {vendor.state}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1 bg-green-50/50 border border-green-100 rounded-lg text-[11px] font-bold text-green-800 flex items-center gap-1.5">
                                    <span className="opacity-60 font-medium">GST:</span> {vendor.gstin}
                                </div>
                                <div className="px-3 py-1 bg-emerald-50/50 border border-emerald-100 rounded-lg text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                                    <span className="opacity-60 font-medium">PAN:</span> {vendor.pan}
                                </div>
                                <div className="px-3 py-1 bg-slate-50/50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                                    <span className="opacity-60 font-medium">ID:</span> {vendor.id}
                                </div>
                            </div>
                        </div>

                        {/* Buttons removed from here as actions are now in the top bar */}
                    </div>
                </div>

                {/* ── Navigation Tabs ── */}
                <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2.5 px-6 py-2 rounded-xl text-[12px] font-bold transition-all border shrink-0
                                ${tab === t.key ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                            <span className="text-base">{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* ── Content Panes ── */}
                <div className="animate-in fade-in duration-500">
                    {tab === 'basic' && (
                        <div className="space-y-6">
                            {/* Top Highlights Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center text-lg font-bold">🏢</div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business Type</p>
                                        <p className="text-sm font-bold text-slate-800">{vendor.businessType || '—'}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg font-bold">📊</div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KYC Status</p>
                                        <p className="text-sm font-bold text-indigo-700">{vendor.kycStatus || '—'}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold">🛡️</div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance</p>
                                        <p className="text-sm font-bold text-emerald-700">{vendor.complianceStatus || '—'}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-lg font-bold">📅</div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created Date</p>
                                        <p className="text-sm font-bold text-slate-800">{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString('en-IN') : '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Columns Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Column 1: Organization & Registration */}
                                <VCard className="flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                                            <span className="text-lg">📋</span>
                                            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Registration Info</h3>
                                        </div>
                                        <div className="space-y-3.5">
                                            <StatRow label="Trade Name" value={vendor.tradeName || '—'} />
                                            <StatRow label="Business Type" value={vendor.businessType || '—'} />
                                            <StatRow label="GST Reg. Type" value={vendor.gstRegistrationType || '—'} />
                                            <StatRow label="Annual Turnover" value={vendor.annualTurnoverRange?.replace(/_/g, ' ') || '—'} />
                                            <StatRow label="Auth Required" value={vendor.authRequired ? 'Yes (4-step review)' : 'No (Direct activation)'} />
                                            <StatRow label="Vendor Code" value={<span className="font-mono font-bold text-green-700">{vendor.vendorCode || '—'}</span>} />
                                        </div>
                                    </div>
                                    {vendor.notes && (
                                        <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Internal Notes</p>
                                            <p className="text-[12px] text-slate-600 leading-relaxed">{vendor.notes}</p>
                                        </div>
                                    )}
                                </VCard>

                                {/* Column 2: Communications & Locations */}
                                <VCard className="flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                                            <span className="text-lg">📞</span>
                                            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Contacts & Sites</h3>
                                        </div>
                                        <div className="space-y-3.5">
                                            <StatRow label="Website" value={vendor.website ? <a href={vendor.website} target="_blank" rel="noreferrer" className="text-green-700 hover:underline font-semibold">{vendor.website}</a> : '—'} />
                                            <StatRow label="Primary Mobile" value={vendor.primaryMobile || vendor.mobile || '—'} />
                                            <StatRow label="Corporate Email" value={vendor.email || vendor.primaryEmail || '—'} />
                                            <StatRow label="Alternate Contact" value={vendor.alternateContact || 'N/A'} />
                                        </div>

                                        <div className="h-px bg-slate-100 my-4" />

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Registered Locations</label>
                                            {vendor.locations?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {vendor.locations.map((loc, li) => (
                                                        <div key={li} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                                                            <p className="text-[9px] font-bold text-green-700 uppercase mb-1 flex items-center gap-1">
                                                                📍 {loc.locationType}{loc.isPrimary ? ' · Primary' : ''}
                                                            </p>
                                                            <p className="text-[12px] font-bold text-slate-700">{loc.addressLine1}</p>
                                                            {loc.addressLine2 && <p className="text-[12px] text-slate-500">{loc.addressLine2}</p>}
                                                            <p className="text-[12px] text-slate-500">{loc.city}{loc.stateCode ? ', ' + loc.stateCode : ''}{loc.pinCode ? ' - ' + loc.pinCode : ''}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-[12px] text-slate-400 italic">No locations added yet.</p>}
                                        </div>
                                    </div>
                                </VCard>

                                {/* Column 3: Verification & Signatures */}
                                <VCard className="flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                                            <span className="text-lg">✍️</span>
                                            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">Verification & Sign</h3>
                                        </div>
                                        <div className="space-y-3.5">
                                            <StatRow label="Submitted On" value={vendor.declaration?.submissionDate || 'N/A'} />
                                            <StatRow label="Signatory" value={vendor.declaration?.signatoryName || 'N/A'} />
                                            <StatRow label="Designation" value={vendor.declaration?.signatoryDesignation || 'N/A'} />
                                            <StatRow label="Last Updated" value={vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleDateString('en-IN') : (vendor.lastUpdated || '—')} />
                                        </div>

                                        {vendor.declaration?.signatureDoc && (
                                            <>
                                                <div className="h-px bg-slate-100 my-4" />
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col items-center">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">Digital Signature</p>
                                                    <div className="bg-white rounded-lg p-3 border border-slate-200 flex justify-center w-full">
                                                        <img src={vendor.declaration?.signatureDoc} alt="Signature" className="h-10 object-contain opacity-85" />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </VCard>
                            </div>
                        </div>
                    )}

                    {tab === 'products' && (
                        <VCard>
                            <div className="flex items-center justify-between mb-6">
                                <SectionTitle>Linked Catalog Products</SectionTitle>
                                <button onClick={() => navigate(VENDOR_ROUTES.productList)} className="text-green-800 font-bold text-[12px] hover:underline">
                                    Manage Products ↗
                                </button>
                            </div>
                            {productsLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
                                </div>
                            ) : vendorProducts && vendorProducts.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                                <th className="px-4 py-3 font-bold">Product Name</th>
                                                <th className="px-4 py-3 font-bold">SKU / Barcode</th>
                                                <th className="px-4 py-3 font-bold">Batch & Expiry</th>
                                                <th className="px-4 py-3 font-bold">Purchase Price</th>
                                                <th className="px-4 py-3 font-bold">UOM</th>
                                                <th className="px-4 py-3 font-bold">MOQ</th>
                                                <th className="px-4 py-3 font-bold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {vendorProducts.map((p, idx) => (
                                                <tr key={p.id || idx} className="hover:bg-green-50/10 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="text-[13px] font-bold text-slate-800">{p.productName}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{p.brand || 'No Brand'} • {p.category || 'Uncategorized'}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-[12px] bg-slate-50 px-2 py-1 rounded text-slate-600 font-medium">
                                                            {p.vendorSku || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-[12px] font-bold text-slate-700">{p.batchNumber || '—'}</div>
                                                        <div className="text-[10px] text-slate-400">{p.expiryDate || '—'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[13px] font-bold text-emerald-600">
                                                        ₹{p.purchasePrice || '0.00'}
                                                    </td>
                                                    <td className="px-4 py-3 text-[12px] text-slate-600 font-medium uppercase">{p.unitOfMeasure || 'PCS'}</td>
                                                    <td className="px-4 py-3 text-[12px] text-slate-600">{p.minOrderQty || 1}</td>
                                                    <td className="px-4 py-3">
                                                        {p.isActive !== false ? (
                                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase border border-emerald-100">Active</span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold uppercase border border-rose-100">Inactive</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4 border border-slate-100">📦</div>
                                    <h3 className="text-[15px] font-bold text-slate-700 mb-1">No products linked</h3>
                                    <p className="text-[13px] text-slate-400 max-w-sm">This vendor doesn't have any products in the catalog yet.</p>
                                </div>
                            )}
                        </VCard>
                    )}

                    {tab === 'bank' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {vendor.bankAccounts?.length > 0 ? vendor.bankAccounts.map((b, i) => (
                                <VCard key={i} className={`relative ${b.isPrimary ? 'border-green-200 ring-4 ring-green-50/50' : 'border-slate-100'}`}>
                                    {b.isPrimary && <span className="absolute top-6 right-8 px-4 py-1.5 bg-green-800 text-white text-[10px] font-bold uppercase rounded-full shadow-lg shadow-green-200">Primary Account</span>}
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-800 flex items-center justify-center text-3xl shadow-inner border border-green-100">🏦</div>
                                        <div>
                                            <p className="text-xl font-bold text-slate-800">{b.bankName}</p>
                                            <p className="text-[13px] font-medium text-slate-400">{b.accountType || 'Current'} Account</p>
                                        </div>
                                    </div>
                                    <div className="space-y-5 bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                                        <StatRow label="Account Holder" value={<span className="font-bold text-slate-700">{b.accountHolderName || vendor.name}</span>} />
                                        <StatRow label="Account Number" value={<span className="font-mono font-bold text-lg tracking-wider text-slate-800">{b.accountNumber || b.accountNumberMasked || '—'}</span>} />
                                        <StatRow label="IFSC Code" value={<span className="font-mono font-bold text-green-800 bg-green-50 px-3 py-1 rounded-lg border border-green-100">{b.ifscCode}</span>} />
                                        <StatRow label="Verification" value={<span className={`font-bold text-[11px] uppercase px-2 py-0.5 rounded-full ${b.verificationStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{b.verificationStatus || 'PENDING'}</span>} />
                                    </div>
                                </VCard>
                            )) : <div className="col-span-2 py-16 text-center text-slate-400 text-[13px] font-medium">No bank accounts added yet.</div>}
                        </div>
                    )}

                    {tab === 'docs' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {vendor.documents?.length > 0 ? vendor.documents.map((d, i) => (
                                    <div key={i} className={`p-6 bg-white rounded-[2rem] border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-full ${d.uploadStatus === 'REJECTED' ? 'border-rose-200 bg-rose-50/20' : d.uploadStatus === 'APPROVED' ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-100'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                                                {d.docType === 'GSTIN' ? '🏛️' : d.docType === 'PAN' ? '💳' : d.docType === 'FSSAI' ? '🍎' : d.docType === 'CIN' ? '🏢' : '📜'}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border shadow-sm ${d.uploadStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : d.uploadStatus === 'REJECTED' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                {(d.uploadStatus || 'PENDING').replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="space-y-1 mb-6">
                                            <h4 className="text-[15px] font-bold text-slate-800 leading-tight">{d.docType}</h4>
                                            <p className="text-[12px] font-mono font-bold text-slate-400">{d.docNumber || '••••••••••'}</p>
                                        </div>
                                        <div className="space-y-4 pt-6 border-t border-slate-100">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</span>
                                                <span className="text-[12px] font-bold text-slate-600">{d.expiryDate || 'No expiry'}</span>
                                            </div>
                                            {d.daysToExpiry !== null && d.daysToExpiry !== undefined && (
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Days to Expiry</span>
                                                    <span className={`text-[12px] font-bold ${d.daysToExpiry < 30 ? 'text-rose-600' : 'text-slate-600'}`}>{d.daysToExpiry}</span>
                                                </div>
                                            )}
                                            {d.createdAt && (
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Uploaded</span>
                                                    <span className="text-[12px] font-bold text-slate-600">{new Date(d.createdAt).toLocaleDateString('en-IN')}</span>
                                                </div>
                                            )}
                                            {d.verifiedByName && (
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Verified By</span>
                                                    <span className="text-[12px] font-bold text-slate-600 text-right">{d.verifiedByName}<br/><span className="text-[10px] opacity-70">{d.verifiedAt ? new Date(d.verifiedAt).toLocaleDateString('en-IN') : ''}</span></span>
                                                </div>
                                            )}
                                            {d.rejectionReason && (
                                                <div className="flex justify-between items-start mt-2 border-t border-rose-100 pt-2">
                                                    <span className="text-[10px] font-bold text-rose-500 uppercase mt-0.5">Rejection Reason</span>
                                                    <span className="text-[11px] font-medium text-rose-600 text-right max-w-[60%]">{d.rejectionReason}</span>
                                                </div>
                                            )}
                                            {d.fileReference && (
                                                <a href={d.fileReference} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-800 text-white hover:bg-green-950 transition-all text-[11px] font-bold shadow-lg shadow-green-100">VIEW DOCUMENT</a>
                                            )}
                                        </div>
                                    </div>
                                )) : <div className="col-span-4 py-16 text-center text-slate-400 text-[13px] font-medium">No documents added yet.</div>}
                            </div>

                            <VCard className="!p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <SectionTitle>Audit Log & Compliance History</SectionTitle>
                                    <button onClick={handleDownloadAuditTrail} className="text-green-800 font-bold text-[12px] hover:underline uppercase ">Download Full Audit Trail</button>
                                </div>
                                <div className="space-y-3">
                                    {vendor.auditLog?.map((log, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 text-[13px] shadow-sm hover:border-slate-200 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-2 h-2 bg-green-800 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                                <span className="font-bold text-slate-700">{log.action}</span>
                                                <span className="px-3 py-1 bg-slate-50 rounded-lg font-bold text-slate-500 text-[11px] border border-slate-100">by {log.user}</span>
                                            </div>
                                            <span className="font-bold text-slate-400 tabular-nums">{log.timestamp}</span>
                                        </div>
                                    ))}
                                </div>
                            </VCard>
                        </div>
                    )}

                    {tab === 'performance' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <VCard>
                                <SectionTitle>Fulfillment Performance</SectionTitle>
                                <div className="mt-10 space-y-8">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[12px] font-bold text-slate-400 uppercase ">Order Accuracy</span>
                                            <span className="text-[14px] font-bold text-green-800">98.2%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                                            <div className="h-full bg-green-800 rounded-full shadow-[0_0_8px_rgba(22,101,52,0.4)]" style={{ width: '98.2%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[12px] font-bold text-slate-400 uppercase ">On-Time Delivery</span>
                                            <span className="text-[14px] font-bold text-emerald-600">94.5%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                                            <div className="h-full bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: '94.5%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[12px] font-bold text-slate-400 uppercase ">Pricing Competitiveness</span>
                                            <span className="text-[14px] font-bold text-amber-600">85.0%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
                                            <div className="h-full bg-amber-600 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]" style={{ width: '85.0%' }} />
                                        </div>
                                    </div>
                                </div>
                            </VCard>
                            <VCard className="flex flex-col items-center justify-center text-center p-10 bg-gradient-to-br from-white to-green-50/30">
                                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center text-5xl mb-6 shadow-2xl border border-green-50 animate-bounce duration-[3000ms]">🏆</div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Top Performer Tier</h3>
                                <p className="text-slate-500 text-[14px] font-medium max-w-[280px] leading-relaxed">{vendor.name} is currently ranked #3 in the {vendor.category} category.</p>
                                <button onClick={handleDownloadScorecard} className="mt-8 px-10 py-4 bg-green-800 text-white rounded-[2rem] font-bold text-[14px] shadow-2xl shadow-green-200 hover:bg-green-950 hover:scale-105 transition-all">Download Scorecard PDF</button>
                            </VCard>
                        </div>
                    )}

                    {tab === 'returns' && (
                        <VCard>
                            <SectionTitle>Returns</SectionTitle>
                            {returnsLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
                                </div>
                            ) : returnsData && returnsData.length > 0 ? (
                                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                                <th className="px-4 py-3 font-bold">Return ID</th>
                                                <th className="px-4 py-3 font-bold">Date</th>
                                                <th className="px-4 py-3 font-bold">Reason</th>
                                                <th className="px-4 py-3 font-bold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {returnsData.map((r, idx) => (
                                                <tr key={r.id || idx} className="hover:bg-green-50/10 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-slate-800">{r.id || '—'}</td>
                                                    <td className="px-4 py-3 text-[13px] text-slate-600">{r.createdAt || r.date || '—'}</td>
                                                    <td className="px-4 py-3 text-[13px] text-slate-600">{r.reason || '—'}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-bold uppercase border border-slate-200">
                                                            {r.status || 'PENDING'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-16 text-center text-slate-400 text-[13px] font-medium">No returns data available yet.</div>
                            )}
                        </VCard>
                    )}

                    {tab === 'expired' && (
                        <VCard>
                            <SectionTitle>Expired Items</SectionTitle>
                            {expiredProductsLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                                </div>
                            ) : expiredProducts && expiredProducts.length > 0 ? (
                                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                                <th className="px-4 py-3 font-bold">Product Name</th>
                                                <th className="px-4 py-3 font-bold">SKU / Barcode</th>
                                                <th className="px-4 py-3 font-bold">Batch & Expiry</th>
                                                <th className="px-4 py-3 font-bold">Purchase Price</th>
                                                <th className="px-4 py-3 font-bold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {expiredProducts.map((p, idx) => (
                                                <tr key={p.id || idx} className="hover:bg-rose-50/10 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="text-[13px] font-bold text-slate-800">{p.productName}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{p.brand || 'No Brand'} • {p.category || 'Uncategorized'}</div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-[12px] bg-slate-50 px-2 py-1 rounded text-slate-600 font-medium">
                                                            {p.vendorSku || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-[12px] font-bold text-slate-700">{p.batchNumber || '—'}</div>
                                                        <div className="text-[10px] text-rose-500 font-bold">{p.expiryDate || '—'}</div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[13px] font-bold text-emerald-600">
                                                        ₹{p.purchasePrice || '0.00'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-bold uppercase border border-rose-100">Expired</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4 border border-slate-100">✅</div>
                                    <h3 className="text-[15px] font-bold text-slate-700 mb-1">No expired products</h3>
                                    <p className="text-[13px] text-slate-400 max-w-sm">There are currently no expired items for this vendor.</p>
                                </div>
                            )}
                        </VCard>
                    )}

                    {tab === 'payment' && (
                        <VCard>
                            <SectionTitle>Payment Details</SectionTitle>
                            {paymentsLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
                                </div>
                            ) : paymentsData && paymentsData.length > 0 ? (
                                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider border-b border-slate-100">
                                                <th className="px-4 py-3 font-bold">Payment ID</th>
                                                <th className="px-4 py-3 font-bold">Date</th>
                                                <th className="px-4 py-3 font-bold">Amount</th>
                                                <th className="px-4 py-3 font-bold">Status</th>
                                                <th className="px-4 py-3 font-bold">Reference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {paymentsData.map((p, idx) => (
                                                <tr key={p.id || idx} className="hover:bg-green-50/10 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-slate-800">{p.id || '—'}</td>
                                                    <td className="px-4 py-3 text-[13px] text-slate-600">{p.paymentDate || p.createdAt || p.date || '—'}</td>
                                                    <td className="px-4 py-3 text-[13px] font-bold text-emerald-600">
                                                        ₹{p.amount || '0.00'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${p.status === 'COMPLETED' || p.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : p.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : p.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                                            {p.status || 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-[13px] text-slate-600">{p.referenceNumber || p.transactionId || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-4 border border-slate-100">💳</div>
                                    <h3 className="text-[15px] font-bold text-slate-700 mb-1">No payment details</h3>
                                    <p className="text-[13px] text-slate-400 max-w-sm">There are currently no payment details available for this vendor.</p>
                                </div>
                            )}
                        </VCard>
                    )}
                </div>
            </div>

            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{previewDoc.type} Document Preview</h3>
                                <p className="text-[12px] font-bold text-slate-400 uppercase  mt-1">Expiring: {previewDoc.expiry}</p>
                            </div>
                            <button onClick={() => setPreviewDoc(null)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-all">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 bg-slate-100 flex justify-center">
                            <img src={previewDoc.preview} alt="Document Preview" className="max-w-full h-auto rounded-lg shadow-2xl border border-white" />
                        </div>
                        <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center">
                            <p className="text-[12px] font-medium text-slate-500 italic">Audit Note: Verified by Compliance Dept on 12-Feb-2026</p>
                            <div className="flex gap-4">
                                <SecondaryBtn onClick={() => setPreviewDoc(null)}>Close</SecondaryBtn>
                                <PrimaryBtn onClick={() => handleDownloadDocPDF(previewDoc)}>Download Original PDF</PrimaryBtn>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Email Compose Modal ── */}
            <VModal open={showEmailModal} onClose={() => setShowEmailModal(false)} title={`Email — ${vendor.name}`}>
                <div className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-[12px] text-green-800 font-medium">
                        Sending to: <span className="font-bold">{vendor.email || 'vendor@example.com'}</span>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Subject</label>
                        <input
                            value={emailSubject}
                            onChange={e => setEmailSubject(e.target.value)}
                            placeholder="e.g. Document Renewal Reminder"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-green-800 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Message Body</label>
                        <textarea
                            value={emailBody}
                            onChange={e => setEmailBody(e.target.value)}
                            rows={5}
                            placeholder="Write your email content here..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-green-800 outline-none transition-all resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <PrimaryBtn onClick={handleSendEmail} className="flex-1">✉️ Send Email</PrimaryBtn>
                        <SecondaryBtn onClick={() => setShowEmailModal(false)} className="px-6">Cancel</SecondaryBtn>
                    </div>
                </div>
            </VModal>

            {/* ── Compliance Audit Modal ── */}
            <VModal open={showComplianceModal} onClose={() => setShowComplianceModal(false)} title="Compliance Audit Report">
                <div className="space-y-5">
                    {/* Score Meter */}
                    <div className={`p-4 rounded-2xl border flex items-center gap-4 ${complianceScore >= 80 ? 'bg-emerald-50 border-emerald-200' :
                            complianceScore >= 60 ? 'bg-amber-50 border-amber-200' :
                                'bg-rose-50 border-rose-200'
                        }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-4 ${complianceScore >= 80 ? 'border-emerald-500 text-emerald-700 bg-white' :
                                complianceScore >= 60 ? 'border-amber-500 text-amber-700 bg-white' :
                                    'border-rose-500 text-rose-700 bg-white'
                            }`}>
                            {complianceScore}%
                        </div>
                        <div>
                            <p className="text-[14px] font-bold text-slate-800">
                                {complianceScore >= 80 ? '✅ Compliance Satisfactory' :
                                    complianceScore >= 60 ? '⚠️ Partial Compliance' :
                                        '🚨 Non-Compliant — Action Required'}
                            </p>
                            <p className="text-[12px] text-slate-500 mt-0.5">{vendor.name} · Audit Date: {new Date().toLocaleDateString('en-IN')}</p>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-2">
                        {COMPLIANCE_CHECKS.map((check, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border text-[13px] font-medium ${check.status === 'pass' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                                    check.status === 'warn' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                        'bg-rose-50 border-rose-100 text-rose-800'
                                }`}>
                                <span>{check.label}</span>
                                <span className="font-bold uppercase text-[10px] tracking-wider">
                                    {check.status === 'pass' ? '✓ Pass' : check.status === 'warn' ? '⚠ Review' : '✕ Fail'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <PrimaryBtn onClick={() => { toast.success('Compliance report downloaded!'); handleDownloadAuditTrail(); }} className="flex-1">💾 Download Report</PrimaryBtn>
                        <SecondaryBtn onClick={() => setShowComplianceModal(false)} className="px-6">Close</SecondaryBtn>
                    </div>
                </div>
            </VModal>

            {/* ── Delete Vendor Modal ── */}
            <VModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Vendor">
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center py-4">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Are you sure?</h3>
                        <p className="text-slate-600">
                            You are about to permanently delete <span className="font-bold text-slate-800">"{vendor.name}"</span>.
                            This action cannot be undone and will remove all associated data.
                        </p>
                    </div>
                    <div className="flex gap-3 justify-end mt-8">
                        <SecondaryBtn onClick={() => setShowDeleteModal(false)}>Cancel</SecondaryBtn>
                        <PrimaryBtn onClick={confirmDelete} className="!bg-rose-600 hover:!bg-rose-700">Delete Permanently</PrimaryBtn>
                    </div>
                </div>
            </VModal>
        </div>
    );
}
