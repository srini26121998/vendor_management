import React, { useState, useEffect } from 'react';
import { formatCurrency, VENDOR_ROUTES } from './vendorConstants';
import { fetchPurchaseOrders, fetchInvoices, vendorRespondToPO, raiseDispute, fetchVendors, fetchPayments } from '../../api/vendorService';
import { VCard, SectionTitle, StatusBadge, PrimaryBtn, SecondaryBtn, VModal, VendorBreadcrumb } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, FileText, Scale, CreditCard, Settings, Download, CheckCircle, Info, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
    { key: 'po', label: 'PO Inbox', icon: <Layout size={18} /> },
    { key: 'docs', label: 'Documents', icon: <FileText size={18} /> },
    { key: 'dispute', label: 'Disputes', icon: <Scale size={18} /> },
    { key: 'payments', label: 'Payments', icon: <CreditCard size={18} /> }
];

export default function VendorPortal() {
    const [tab, setTab] = useState('po');
    const [pos, setPos] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [currentVendorId, setCurrentVendorId] = useState(null);
    const [disputeForm, setDisputeForm] = useState({
        relatedInstrument: '',
        category: 'Payment not received',
        narrative: ''
    });

    useEffect(() => {
        fetchPurchaseOrders().then(d => setPos(Array.isArray(d) ? d : []));
        fetchInvoices().then(d => setInvoices(Array.isArray(d) ? d : []));
        fetchPayments().then(d => {
            const data = d.data || d;
            setPayments(Array.isArray(data) ? data : []);
        });
        
        // Fetch the first available vendor to act as the "Logged In" vendor for disputes
        fetchVendors().then(res => {
            const data = res.data || res;
            if (Array.isArray(data) && data.length > 0) {
                setCurrentVendorId(data[0].id);
            }
        }).catch(err => console.error("Failed to fetch mock vendor ID", err));
    }, []);

    const handleAcknowledge = async (id) => {
        try {
            await vendorRespondToPO(id, 'ACCEPTED');
            toast.success(`PO Acknowledged successfully!`);
            setPos(prev => prev.map(po => po.id === id ? { ...po, status: 'ACCEPTED' } : po));
        } catch (error) {
            toast.error('Failed to acknowledge PO');
        }
    };

    const handleDisputeSubmit = async () => {
        if (!currentVendorId) {
            toast.error('No vendor context found. Cannot raise dispute.');
            return;
        }
        if (!disputeForm.relatedInstrument || !disputeForm.narrative) {
            toast.error('Please fill in all dispute fields.');
            return;
        }

        try {
            await raiseDispute(currentVendorId, disputeForm);
            toast.success('Dispute raised and logged successfully!');
            setDisputeForm({ relatedInstrument: '', category: 'Payment not received', narrative: '' });
        } catch (err) {
            toast.error('Failed to raise dispute.');
            console.error(err);
        }
    };

    const [settings, setSettings] = useState({
        allowPOAck: true,
        allowDisputes: true,
        allowInvoices: true,
        notifyWhatsApp: true,
        notifyEmail: true,
        sessionExpiry: '4h',
        portalStatus: 'active'
    });

    const toggleSetting = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
    const saveSettings = () => {
        toast.success('Portal settings updated successfully!');
        setSettingsOpen(false);
    };

    const labelCls = "text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1";

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div><h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Vendor Portal (Self-Service)</h1>
                    </div>
                    <button onClick={() => setSettingsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-[12px] font-bold bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
                        <Settings size={14} /> Portal Settings
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* ── Sidebar Navigation ── */}
                    <div className="space-y-6">
                        <VCard noPad className="overflow-hidden border-slate-200">
                            <div className="p-2 space-y-1">
                                {TABS.map(t => (
                                    <button key={t.key} onClick={() => setTab(t.key)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-bold transition-all ${tab === t.key ? 'bg-green-50 text-green-800 border-green-200 shadow-sm' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                                        {t.icon}
                                        {t.label}
                                        {tab === t.key && <motion.div layoutId="tab-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-green-800" />}
                                    </button>
                                ))}
                            </div>
                        </VCard>

                        <VCard className="!bg-white !border-blue-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <Info size={16} className="text-blue-600" />
                                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Portal Guide</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                                This portal allows your vendors to acknowledge POs, upload invoices, and track payments in real-time.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <ShieldCheck size={12} />
                                <span>SECURE ACCESS ACTIVE</span>
                            </div>
                        </VCard>
                    </div>

                    {/* ── Main Content Area ── */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode="wait">
                            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                {tab === 'po' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">Purchase Order Inbox</h3>
                                            <span className="text-[10px] font-bold text-blue-500 uppercase  flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Sync
                                            </span>
                                        </div>
                                        {pos.slice(0, 4).map((po, i) => (
                                            <VCard key={i} className="group hover:border-blue-200 transition-all">
                                                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 border border-slate-100 transition-all shadow-sm shrink-0">
                                                        <Layout size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                            <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{po.id}</span>
                                            <h3 className="text-[16px] font-bold text-slate-800">{formatCurrency(po.grandTotal || po.amount || 0)} · {po.items?.length || 0} Items</h3>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                <span>Expected: {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN') : 'TBD'}</span>
                                                            <StatusBadge status={po.status} size="xs" />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 w-full md:w-auto shrink-0">
                                                        <SecondaryBtn icon={<Download size={14} />} onClick={() => toast.success(`PO PDF downloaded`)} className="flex-1 md:flex-none !py-1.5 !px-4 !text-[11px]">
                                                            PDF
                                                        </SecondaryBtn>
                                                        {((po.status || '').toUpperCase() === 'ACTIVE') ? (
                                                            <PrimaryBtn icon={<CheckCircle size={14} />} onClick={() => handleAcknowledge(po.id)} className="flex-1 !py-1.5 !px-4 !text-[11px]">
                                                                Acknowledge
                                                            </PrimaryBtn>
                                                        ) : (
                                                            <PrimaryBtn className="flex-1 !py-1.5 !px-4 !text-[11px] opacity-50 cursor-not-allowed">
                                                                Acknowledged
                                                            </PrimaryBtn>
                                                        )}
                                                    </div>
                                                </div>
                                            </VCard>
                                        ))}
                                    </div>
                                )}

                                {tab === 'docs' && (
                                    <VCard className="py-16 text-center border-dashed border-slate-200 bg-white shadow-sm">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-blue-600 mb-4 border border-slate-100 mx-auto">
                                            <FileText size={28} />
                                        </div>
                                        <h3 className="text-[16px] font-bold text-slate-800">Secure Document Upload</h3>
                                        <p className="text-[12px] text-slate-400 font-medium max-w-sm mx-auto mt-2 leading-relaxed mb-8">
                                            Upload Invoices, GST Certificates, or Legal Agreements for immediate processing.
                                        </p>
                                        <PrimaryBtn onClick={() => toast.success('Document uploaded!')} className="mx-auto">
                                            Select Files to Upload
                                        </PrimaryBtn>
                                        <p className="text-[9px] text-slate-300 font-bold uppercase mt-4 tracking-[0.2em]">PDF, JPG, PNG (Max 10MB)</p>
                                    </VCard>
                                )}

                                {tab === 'dispute' && (
                                    <VCard className="max-w-3xl">
                                        <SectionTitle>Raise Compliance Dispute</SectionTitle>
                                        <div className="space-y-6 mt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelCls}>Related Instrument</label>
                                                    <select 
                                                        value={disputeForm.relatedInstrument}
                                                        onChange={e => setDisputeForm({ ...disputeForm, relatedInstrument: e.target.value })}
                                                        className="w-full text-[13px] font-bold border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:border-blue-500 transition-all outline-none">
                                                        <option value="">Select an Invoice...</option>
                                                        {invoices.map(i => <option key={i.id} value={i.id}>{i.id} — {formatCurrency(i.totalAmount || i.invoiceAmount || 0)}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Dispute Category</label>
                                                    <select 
                                                        value={disputeForm.category}
                                                        onChange={e => setDisputeForm({ ...disputeForm, category: e.target.value })}
                                                        className="w-full text-[13px] font-bold border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:border-blue-500 transition-all outline-none">
                                                        <option value="Payment not received">Payment not received</option>
                                                        <option value="Wrong quantity">Wrong quantity</option>
                                                        <option value="Pricing mismatch">Pricing mismatch</option>
                                                        <option value="Damaged goods">Damaged goods</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Detailed Narrative</label>
                                                <textarea rows={4} placeholder="Describe the discrepancy in detail..."
                                                    value={disputeForm.narrative}
                                                    onChange={e => setDisputeForm({ ...disputeForm, narrative: e.target.value })}
                                                    className="w-full text-[13px] font-medium border border-slate-200 rounded-lg px-4 py-2.5 bg-slate-50/50 focus:border-blue-500 transition-all outline-none resize-none leading-relaxed" />
                                            </div>
                                            <PrimaryBtn onClick={handleDisputeSubmit} className="w-full justify-center !py-3.5 shadow-blue-100 shadow-lg">
                                                Submit Formal Dispute
                                            </PrimaryBtn>
                                        </div>
                                    </VCard>
                                )}

                                {tab === 'payments' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">Real-time Payment View</h3>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase ">Synced: 10m ago</span>
                                        </div>
                                        {(() => {
                                            const combinedItems = [];
                                            payments.forEach(payment => combinedItems.push({ type: 'payment', data: payment }));
                                            invoices.forEach(inv => {
                                                const hasPayment = payments.some(p => p.invoiceId === inv.id || p.invoiceNumber === inv.invoiceNumber);
                                                if (!hasPayment) combinedItems.push({ type: 'invoice', data: inv });
                                            });

                                            if (combinedItems.length === 0) {
                                                return <div className="text-center py-8 text-sm text-slate-500">No pending or completed payments found.</div>;
                                            }

                                            return combinedItems.map((item, i) => {
                                                const isPayment = item.type === 'payment';
                                                const payment = isPayment ? item.data : null;
                                                const inv = isPayment ? null : item.data;
                                                
                                                const isPaid = isPayment || (inv && inv.submissionStatus === 'PAID');
                                                const status = isPaid ? 'SUCCESS' : (inv?.submissionStatus === 'APPROVED' ? 'PENDING' : inv?.submissionStatus);
                                                
                                                const displayPrefix = isPaid ? 'BATCH:' : 'INV:';
                                                const displayId = isPayment
                                                    ? (payment.bankReference || payment.paymentNumber || payment.id.split('-')[0])
                                                    : (inv.invoiceNumber || inv.id.split('-')[0]);
                                                    
                                                const amount = isPayment 
                                                    ? (payment.netPayment || payment.paymentAmount || 0) 
                                                    : (inv.totalAmount || inv.invoiceAmount || 0);

                                                return (
                                                    <VCard key={i} className="group hover:border-emerald-200 transition-all shadow-sm">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 transition-all shrink-0">
                                                                    <CreditCard size={18} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 group-hover:bg-white">
                                                                            {displayPrefix} {displayId}
                                                                        </span>
                                                                        <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{formatCurrency(amount)}</h3>
                                                                    </div>
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase italic">
                                                                        {isPaid 
                                                                            ? `Invoice: ${isPayment ? payment.invoiceNumber || 'N/A' : inv?.invoiceNumber || 'N/A'}`
                                                                            : `Due: ${inv?.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'N/A'}`
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <StatusBadge status={status || 'PENDING'} size="xs" />
                                                                <button className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-100">
                                                                    <Info size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </VCard>
                                                );
                                            });
                                        })()}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Portal Settings Modal */}
            <VModal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Portal Configuration Settings" width="max-w-2xl">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-blue-600 uppercase  mb-3 flex items-center gap-2">
                                <ShieldCheck size={14} /> Self-Service Permissions
                            </h4>
                            {[
                                { key: 'allowPOAck', label: 'Allow PO Acknowledgement', desc: 'Confirm POs digitally' },
                                { key: 'allowDisputes', label: 'Allow Dispute Raising', desc: 'Compliance dispute portal' },
                                { key: 'allowInvoices', label: 'Allow Invoice Upload', desc: 'Direct document sync' },
                            ].map(p => (
                                <div key={p.key} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all">
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-700">{p.label}</p>
                                        <p className="text-[9px] text-slate-400 font-medium">{p.desc}</p>
                                    </div>
                                    <button onClick={() => toggleSetting(p.key)}
                                        className={`w-9 h-4.5 rounded-full relative transition-colors mt-1 ${settings[p.key] ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings[p.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-emerald-600 uppercase  mb-3 flex items-center gap-2">
                                <CheckCircle size={14} /> Communication Prefs
                            </h4>
                            {[
                                { key: 'notifyWhatsApp', label: 'WhatsApp Alerts', desc: 'Real-time PO pings' },
                                { key: 'notifyEmail', label: 'Email Digest', desc: 'Daily settlement logs' },
                            ].map(p => (
                                <div key={p.key} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-emerald-200 transition-all">
                                    <div>
                                        <p className="text-[12px] font-bold text-slate-700">{p.label}</p>
                                        <p className="text-[9px] text-slate-400 font-medium">{p.desc}</p>
                                    </div>
                                    <button onClick={() => toggleSetting(p.key)}
                                        className={`w-9 h-4.5 rounded-full relative transition-colors mt-1 ${settings[p.key] ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${settings[p.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className={labelCls}>Portal Status</label>
                                <div className="flex gap-2">
                                    {['active', 'maintenance'].map(s => (
                                        <button key={s} onClick={() => setSettings(prev => ({ ...prev, portalStatus: s }))}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${settings.portalStatus === s ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-200'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Session Expiry</label>
                                <select value={settings.sessionExpiry} onChange={e => setSettings(s => ({ ...s, sessionExpiry: e.target.value }))}
                                    className="w-full text-[12px] font-bold border border-slate-200 rounded-lg px-4 py-2 bg-slate-50 focus:border-blue-500 outline-none">
                                    <option value="1h">1 Hour</option>
                                    <option value="4h">4 Hours</option>
                                    <option value="12h">12 Hours</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <SecondaryBtn onClick={() => setSettingsOpen(false)}>Cancel</SecondaryBtn>
                        <PrimaryBtn onClick={saveSettings} className="px-6 shadow-blue-100 shadow-lg">Apply Config</PrimaryBtn>
                    </div>
                </div>
            </VModal>
        </div>
    );
}
