import React, { useState } from 'react';
import { PageHeader, VCard, SectionTitle, PrimaryBtn, SecondaryBtn } from './VendorComponents';
import { MessageSquare, Send, Settings, ShieldCheck, Share2, Users, Clock, CheckCheck, Trash2, Zap, Key, Link as LinkIcon, Globe, Smartphone, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { VModal } from './VendorComponents';
import useVendorStore from '../../store/useVendorStore';


const TEMPLATES = [
    { id: 1, name: 'PO Dispatch', preview: 'Dear {vendor}, PO #{po_id} for ₹{amount} has been approved...', category: 'PO' },
    { id: 2, name: 'Payment Confirmation', preview: 'Payment of ₹{amount} has been processed via {mode}...', category: 'Payment' },
    { id: 3, name: 'GRN Acknowledgement', preview: 'We have received {items} items against PO #{po_id}...', category: 'GRN' },
    { id: 4, name: 'Invoice Reminder', preview: 'Please send invoice for PO #{po_id} at the earliest...', category: 'Invoice' },
    { id: 5, name: 'Price Negotiation', preview: 'We noticed your price for SKU#{sku} is above market...', category: 'Negotiation' },
];

const HISTORY_DATA = [
    { vendor: 'Sunrise Foods Ltd', msg: 'PO-2026-0421 dispatched', time: '11:46 AM', status: 'delivered' },
    { vendor: 'Green Valley Organics', msg: 'Payment ₹2,08,500 confirmed', time: '10:30 AM', status: 'read' },
    { vendor: 'Metro Grain Suppliers', msg: 'Invoice reminder sent', time: 'Yesterday', status: 'delivered' },
];

export default function WhatsAppComms() {
    const { vendors } = useVendorStore();
    const [selected, setSelected] = useState(null);
    const [showConfig, setShowConfig] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [showBlueprintModal, setShowBlueprintModal] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authStatus, setAuthStatus] = useState('idle');
    const [templates, setTemplates] = useState(TEMPLATES);
    const [newTemplate, setNewTemplate] = useState({ name: '', category: 'PO', preview: '' });

    const [config, setConfig] = useState({
        apiKey: '••••••••••••••••••••',
        phoneId: '1029384756',
        webhookUrl: 'https://api.retailflow.io/webhooks/whatsapp',
        apiVersion: 'v18.0'
    });

    const allVendors = vendors;
    const [history, setHistory] = useState(HISTORY_DATA);
    const [message, setMessage] = useState('');
    const [targetVendor, setTargetVendor] = useState(allVendors.length > 0 ? allVendors[0].name : '');

    const handleSelectTemplate = (t) => {
        setSelected(t);
        setMessage(t.preview);
    };

    const handleDeleteHistory = (idx) => {
        setHistory(prev => prev.filter((_, i) => i !== idx));
        toast.success('Log entry removed.');
    };

    const handleClearAllHistory = () => {
        setHistory([]);
        toast.success('All communication logs cleared.');
    };

    const handleCreateBlueprint = () => {
        if (!newTemplate.name.trim()) { toast.error('Template name is required.'); return; }
        if (!newTemplate.preview.trim()) { toast.error('Preview text is required.'); return; }
        const created = { id: templates.length + 1, ...newTemplate };
        setTemplates(prev => [...prev, created]);
        setNewTemplate({ name: '', category: 'PO', preview: '' });
        setShowBlueprintModal(false);
        toast.success(`Blueprint "${created.name}" created successfully! ✅`);
    };

    const send = () => {
        if (!message.trim()) {
            toast.error("Message payload cannot be empty!");
            return;
        }

        const newEntry = {
            vendor: targetVendor,
            msg: message.length > 50 ? message.substring(0, 50) + '...' : message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'delivered'
        };

        setHistory([newEntry, ...history]);
        toast.success('WhatsApp message dispatched! ✅');
    };

    const handleAuth = () => {
        setIsAuthenticating(true);
        setAuthStatus('idle');
        
        setTimeout(() => {
            setIsAuthenticating(false);
            setAuthStatus('success');
            toast.success('WhatsApp Integration Verified Successfully! 🛡️');
        }, 2000);
    };

    const saveConfig = () => {
        toast.success('Communication Parameters Updated! ⚙️');
        setShowConfig(false);
    };

    const shareTemplate = (t) => {
        toast.success(`Template "${t.name}" link copied to clipboard! 🔗`);
    };

    return (
        <div className="w-full bg-[#F8FAFC] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1400px] mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">WhatsApp Communications Center</h1>
                        <p className="text-[12px] text-slate-500 font-medium">Native integration for vendor communication and document sharing.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <SecondaryBtn onClick={() => setShowConfig(true)} small icon={<Settings size={14} />}>Config</SecondaryBtn>
                        <PrimaryBtn onClick={() => setShowAuth(true)} small icon={<ShieldCheck size={14} />}>Auth Integration</PrimaryBtn>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Template Gallery */}
                    <div className="lg:col-span-5 space-y-6">
                        <VCard className="h-full !border-slate-200">
                            <div className="flex items-center justify-between mb-4">
                                <SectionTitle>Message Blueprints</SectionTitle>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded">5 Active</span>
                            </div>
                            <div className="space-y-3 mt-4">
                                {templates.map(t => (
                                    <div key={t.id} className="relative group">
                                        <button 
                                            onClick={() => handleSelectTemplate(t)}
                                            className={`w-full text-left p-4 rounded-2xl border transition-all ${selected?.id === t.id ? 'border-emerald-500 bg-emerald-50/30 shadow-md ring-1 ring-emerald-500/20' : 'border-slate-100 hover:border-emerald-200 bg-white hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${selected?.id === t.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-emerald-600 border-slate-100'}`}>
                                                    <MessageSquare size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-[14px] text-slate-800">{t.name}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{t.category}</span>
                                                    </div>
                                                    <div className="text-[12px] text-slate-500 line-clamp-1 font-medium italic opacity-70">"{t.preview}"</div>
                                                </div>
                                            </div>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); shareTemplate(t); }}
                                            className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-white/80 border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                            title="Share Template"
                                        >
                                            <Share2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowBlueprintModal(true)}
                                className="w-full mt-4 py-3 border border-dashed border-slate-200 rounded-2xl text-[12px] font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all flex items-center justify-center gap-2">
                                <Zap size={14} /> Create New Custom Blueprint
                            </button>
                        </VCard>
                    </div>

                    {/* Compose Area */}
                    <div className="lg:col-span-7 space-y-6">
                        <VCard className="h-full !border-slate-200 bg-gradient-to-br from-white to-slate-50/30">
                            <SectionTitle>Real-time Dispatcher</SectionTitle>
                            {selected ? (
                                <div className="space-y-5 mt-4">
                                    <div className="p-5 rounded-2xl bg-emerald-50/20 border border-emerald-100/50 shadow-inner">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-2 tracking-widest">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                                Active Session: {selected.name}
                                            </div>
                                            <button onClick={() => shareTemplate(selected)} className="p-2 rounded-xl bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50 transition-all">
                                                <Share2 size={16} />
                                            </button>
                                        </div>
                                        <textarea 
                                            value={message} 
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={6}
                                            className="w-full text-[15px] bg-transparent text-slate-700 resize-none focus:outline-none font-medium leading-relaxed placeholder:text-slate-300" 
                                            placeholder="Compose your message here..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Primary Vendor</label>
                                            <select 
                                                value={targetVendor}
                                                onChange={(e) => setTargetVendor(e.target.value)}
                                                className="w-full text-[13px] font-bold border border-slate-200 rounded-xl px-4 py-3 bg-white focus:border-emerald-400 transition-all outline-none appearance-none shadow-sm cursor-pointer"
                                            >
                                                {allVendors.map(v => (
                                                    <option key={v.id} value={v.name}>{v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Attached Document</label>
                                            <div className="w-full flex items-center gap-2 border border-slate-200 rounded-xl px-4 py-3 bg-white text-[13px] text-slate-500 font-bold italic shadow-sm">
                                                <Share2 size={14} className="text-slate-300" />
                                                No direct file linked
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={send}
                                            className="flex-1 py-3.5 text-[14px] font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                                        >
                                            <Send size={18} /> Broadcast via WhatsApp
                                        </button>
                                        <SecondaryBtn onClick={() => setSelected(null)} className="px-8 !rounded-xl">Cancel</SecondaryBtn>
                                    </div>

                                    <button 
                                        onClick={send}
                                        className="w-full py-3 text-[11px] font-bold rounded-xl border border-dashed border-slate-200 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all uppercase tracking-[0.1em]"
                                    >
                                        <Users size={14} className="inline-block mr-2" /> Global Dispatch to Active Category
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 border border-slate-100 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        <MessageSquare size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700">Comms Logic Inactive</h3>
                                    <p className="text-sm text-slate-400 font-medium max-w-[260px] mx-auto mt-1 leading-relaxed">
                                        Select a verified blueprint from the gallery to initialize the secure communication bridge.
                                    </p>
                                </div>
                            )}
                        </VCard>
                    </div>
                </div>

                {/* History Matrix */}
                <VCard className="!border-slate-200">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <SectionTitle>Global Communication Logs</SectionTitle>
                        <div className="flex items-center gap-2">
                            <button onClick={handleClearAllHistory} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all" title="Clear All Logs"><Clock size={16} /></button>
                            <button onClick={handleClearAllHistory} className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all" title="Delete All"><Trash2 size={16} /></button>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <th className="px-8 py-5">Recipient Identity</th>
                                    <th className="px-8 py-5">Message Payload</th>
                                    <th className="px-8 py-5 text-right">Audit & Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {history.map((h, i) => (
                                    <tr key={i} className="hover:bg-blue-50/20 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-50 to-white text-slate-600 flex items-center justify-center text-[12px] font-bold border border-slate-200 transition-all group-hover:scale-110 group-hover:border-blue-200 group-hover:shadow-sm">
                                                    {h.vendor.charAt(0)}
                                                </div>
                                                <span className="text-[14px] font-bold text-slate-700">{h.vendor}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="text-[13px] text-slate-600 font-medium max-w-md truncate leading-relaxed">
                                                {h.msg}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{h.time}</div>
                                            <div className={`text-[10px] font-bold uppercase mt-1 flex items-center justify-end gap-1.5 ${h.status === 'read' ? 'text-blue-500' : 'text-emerald-500'}`}>
                                                <CheckCheck size={12} />
                                                {h.status === 'read' ? 'Verified Seen' : 'Securely Delivered'}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteHistory(i)}
                                                className="mt-1 text-[9px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all">
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </VCard>
            </div>

            {/* ── Configuration Modal ── */}
            <VModal open={showConfig} onClose={() => setShowConfig(false)} title="Integration Configuration" width="max-w-md">
                <div className="space-y-4 p-1">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 mb-2">
                        <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
                            Define your WhatsApp Business API parameters here. These credentials link your billing system to your Meta Business account.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Meta API Access Token</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                <input 
                                    type="password" 
                                    value={config.apiKey} 
                                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-400 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Phone ID</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        value={config.phoneId} 
                                        onChange={(e) => setConfig({...config, phoneId: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">API Version</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                    <input 
                                        type="text" 
                                        value={config.apiVersion} 
                                        onChange={(e) => setConfig({...config, apiVersion: e.target.value})}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Webhook Endpoint</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                                <input 
                                    type="text" 
                                    value={config.webhookUrl} 
                                    onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-400 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                        <PrimaryBtn onClick={saveConfig} className="flex-1 !rounded-xl">Save Changes</PrimaryBtn>
                        <SecondaryBtn onClick={() => setShowConfig(false)} className="px-6 !rounded-xl">Cancel</SecondaryBtn>
                    </div>
                </div>
            </VModal>

            {/* ── Auth Integration Modal ── */}
            <VModal open={showAuth} onClose={() => setShowAuth(false)} title="Authentication & Security" width="max-w-sm">
                <div className="text-center space-y-6 py-4">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                        authStatus === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 scale-110 shadow-lg shadow-emerald-100' : 
                        authStatus === 'error' ? 'bg-rose-50 border-rose-500 text-rose-600' :
                        'bg-blue-50 border-blue-200 text-blue-600'
                    }`}>
                        {isAuthenticating ? (
                            <RefreshCw className="w-10 h-10 animate-spin" />
                        ) : authStatus === 'success' ? (
                            <ShieldCheck className="w-10 h-10 animate-bounce" />
                        ) : (
                            <ShieldCheck className="w-10 h-10" />
                        )}
                    </div>

                    <div>
                        <h4 className="text-lg font-bold text-slate-800">
                            {isAuthenticating ? 'Verifying Bridge...' : 
                             authStatus === 'success' ? 'Secure Link Active' : 
                             'Security Handshake'}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium mt-1 px-4 leading-relaxed">
                            {isAuthenticating ? 'We are performing a multi-factor handshake with the Meta Business API Gateway...' :
                             authStatus === 'success' ? 'Your WhatsApp Business API is fully authenticated and ready for bulk dispatch.' :
                             'Initiate a secure authentication cycle to verify your credentials and enable communication flow.'}
                        </p>
                    </div>

                    {authStatus === 'success' && (
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-3 text-left">
                            <CheckCheck className="text-emerald-600 w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-emerald-800 uppercase">System Ready</p>
                                <p className="text-[11px] text-emerald-600 font-medium">All security protocols verified.</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button 
                            disabled={isAuthenticating}
                            onClick={handleAuth}
                            className={`w-full py-4 rounded-2xl font-bold text-[13px] transition-all flex items-center justify-center gap-3 ${
                                isAuthenticating ? 'bg-slate-100 text-slate-400' :
                                authStatus === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' :
                                'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95'
                            }`}
                        >
                            {isAuthenticating ? 'Please Wait...' : 
                             authStatus === 'success' ? 'Re-Verify Integration' : 
                             'Start Authentication'}
                        </button>
                        <button onClick={() => setShowAuth(false)} className="mt-4 text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                            {authStatus === 'success' ? 'Done' : 'Back to Dashboard'}
                        </button>
                    </div>
                </div>
            </VModal>

            {/* ── Create Blueprint Modal ── */}
            <VModal open={showBlueprintModal} onClose={() => setShowBlueprintModal(false)} title="Create Custom Blueprint" width="max-w-md">
                <div className="space-y-4 p-1">
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 mb-2">
                        <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                            Create a reusable message template for vendor communications. Use <code className="bg-white px-1 rounded">{`{vendor}`}</code>, <code className="bg-white px-1 rounded">{`{po_id}`}</code>, <code className="bg-white px-1 rounded">{`{amount}`}</code> as dynamic placeholders.
                        </p>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Template Name</label>
                        <input
                            value={newTemplate.name}
                            onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g. Payment Reminder"
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-emerald-400 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Category</label>
                        <select
                            value={newTemplate.category}
                            onChange={e => setNewTemplate(p => ({ ...p, category: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-emerald-400 outline-none transition-all appearance-none">
                            {['PO', 'Payment', 'GRN', 'Invoice', 'Negotiation', 'Reminder', 'Custom'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Preview Text</label>
                        <textarea
                            value={newTemplate.preview}
                            onChange={e => setNewTemplate(p => ({ ...p, preview: e.target.value }))}
                            rows={4}
                            placeholder="Dear {vendor}, your {po_id} for ₹{amount} has been..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-emerald-400 outline-none transition-all resize-none"
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleCreateBlueprint} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-[13px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                            ⚡ Create Blueprint
                        </button>
                        <button onClick={() => setShowBlueprintModal(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-200 transition-all">
                            Cancel
                        </button>
                    </div>
                </div>
            </VModal>
        </div>
    );
}
