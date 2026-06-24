import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, VENDOR_ROUTES } from './vendorConstants';
import { fetchApprovals, approveItem, rejectItem, updateSTOStatus } from '../../api/vendorService';
import { PageHeader, VCard, SectionTitle, PrimaryBtn, SecondaryBtn } from './VendorComponents';
import { Check, X, Clock, User, AlertCircle, FileText, CreditCard, Box, ArrowRight, ShieldCheck, Zap, ArrowRightLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import useVendorStore from '../../store/useVendorStore';
import useApprovalStore from '../../store/useApprovalStore';
import useAuthStore from '../../store/useAuthStore';

const PRIORITY_CONFIG = {
    high: 'bg-rose-50 text-rose-600 border-rose-100 ring-rose-500/20',
    medium: 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/20',
    low: 'bg-blue-50 text-blue-600 border-blue-100 ring-blue-500/20'
};

const TYPE_ICONS = { 
    'Purchase Order': <FileText size={20} />, 
    'Payment': <CreditCard size={20} />, 
    'GRN Override': <Box size={20} />,
    'Vendor Onboarding': <User size={20} />,
    'Invoice Payment': <CreditCard size={20} />,
    'Stock Transfer': <ArrowRightLeft size={20} />
};

export default function ApprovalQueue() {
    const navigate = useNavigate();
    const { vendors, updateVendor } = useVendorStore();
    const { delegations, addDelegation, removeDelegation, addHistory } = useApprovalStore();
    const user = useAuthStore(state => state.user);
    
    const [approvals, setApprovals] = useState([]);
    const [approvalsLoading, setApprovalsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showDelegateModal, setShowDelegateModal] = useState(false);

    // ── Load live approvals from backend on mount ──
    useEffect(() => {
        setApprovalsLoading(true);
        fetchApprovals()
            .then(items => setApprovals(Array.isArray(items) ? items : []))
            .catch(() => setApprovals([]))
            .finally(() => setApprovalsLoading(false));
    }, []);

    // Derived: Active delegations for current user
    const activeDelegations = delegations.filter(d => d.active);

    // Derived: Pending KYC vendors from store
    const kycPendingVendors = vendors.filter(v => v.status === 'pending_kyc');

    // Combine mock approvals with live KYC pending vendors
    const allItems = [
        ...kycPendingVendors.map(v => ({
            id: v.id,
            type: 'Vendor Onboarding',
            requester: 'Self Registered',
            amount: 0,
            vendor: v.name,
            since: 'Just now',
            priority: 'medium'
        })),
        ...approvals
    ];

    const approve = (id) => {
        const item = allItems.find(i => i.id === id);
        if (id.startsWith('V')) {
            updateVendor(id, { status: 'active' });
            toast.success(`Vendor ${id} KYC Approved! ✅`);
            finalizeApproval(id, item);
        } else if (item?.type === 'Stock Transfer') {
            updateSTOStatus(id, 'APPROVED', user?.id)
                .then(() => {
                    toast.success(`Stock Transfer ${item.displayId || id} Approved! ✅`);
                    finalizeApproval(id, item);
                })
                .catch(err => toast.error('Failed to approve Stock Transfer'));
        } else {
            toast.success(`Item ${item?.displayId || id} Approved! ✅`);
            finalizeApproval(id, item);
        }
    };

    const finalizeApproval = (id, item) => {
        if (!id.startsWith('V')) {
            setApprovals(it => it.filter(x => x.id !== id));
        }
        
        // Audit Trail
        addHistory({
            itemId: item?.displayId || id,
            action: 'Approved',
            actor: user?.name || 'System Admin',
            vendor: item?.vendor,
            onBehalfOf: activeDelegations.length > 0 ? activeDelegations[0].fromUser : null
        });

        setSelectedIds(prev => prev.filter(x => x !== id));
    };

    const handleBatchApprove = () => {
        if (selectedIds.length === 0) return toast.error('No items selected');
        selectedIds.forEach(id => approve(id));
        toast.success(`Batch authorized ${selectedIds.length} items!`);
        setSelectedIds([]);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === allItems.length) setSelectedIds([]);
        else setSelectedIds(allItems.map(i => i.id));
    };

    const reject = (id) => {
        const item = allItems.find(i => i.id === id);
        if (id.startsWith('V')) {
            updateVendor(id, { status: 'blocked' });
            toast.error(`Vendor KYC Rejected`);
        } else if (item?.type === 'Stock Transfer') {
            updateSTOStatus(id, 'CANCELLED', user?.id)
                .then(() => toast.error(`Stock Transfer Rejected`))
                .catch(() => toast.error('Failed to reject Stock Transfer'));
            setApprovals(it => it.filter(x => x.id !== id));
        } else {
            toast.error(`Item Rejected`);
            setApprovals(it => it.filter(x => x.id !== id));
        }
        setSelectedIds(prev => prev.filter(x => x !== id));
    };

    return (
        <div className="w-full bg-[#F8FAFC] min-h-screen pb-20" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Command Center Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
                <div className="max-w-[1600px] mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    Strategic Approval Queue
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-100">Governance Active</span>
                                </h1>
                                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Authorized Procurement & Compliance Workflows</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <SecondaryBtn className="!rounded-xl shadow-sm bg-white" icon={<Zap size={16} />} onClick={() => setShowDelegateModal(true)}>
                                Delegate Matrix
                            </SecondaryBtn>
                            <PrimaryBtn
                                className="!rounded-xl shadow-lg shadow-blue-100"
                                icon={<Check size={16} />}
                                onClick={handleBatchApprove}
                                title={selectedIds.length === 0 ? 'Select items from the list below to batch authorize' : ''}
                            >
                                {selectedIds.length > 0 ? `Approve ${selectedIds.length} Selections` : 'Batch Authorize'}
                            </PrimaryBtn>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-8">
                
                {/* Delegation Banner */}
                {activeDelegations.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-indigo-600 to-violet-700 p-5 rounded-[2rem] text-white flex items-center justify-between shadow-2xl shadow-indigo-100 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                                <Zap size={22} className="text-amber-300" />
                            </div>
                            <div>
                                <p className="text-[14px] font-black tracking-tight">Active Authorization Delegation</p>
                                <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest mt-0.5">You are acting on behalf of <span className="text-white underline decoration-amber-300 underline-offset-4">{activeDelegations[0].toUser}</span></p>
                            </div>
                        </div>
                        <button onClick={() => removeDelegation(activeDelegations[0].id)} className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/20 backdrop-blur-md relative z-10 active:scale-95">
                            Revoke Matrix
                        </button>
                    </motion.div>
                )}

                {/* KPI Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {[
                        { label: 'Pending KYC', count: kycPendingVendors.length, color: 'text-amber-600', icon: <User size={20} /> },
                        { label: 'Strategic POs', count: approvals.filter(x => x.type === 'Purchase Order').length, color: 'text-blue-600', icon: <FileText size={20} /> },
                        { label: 'Stock Transfers', count: approvals.filter(x => x.type === 'Stock Transfer').length, color: 'text-emerald-600', icon: <ArrowRightLeft size={20} /> },
                        { label: 'Priority Transacts', count: approvals.filter(x => x.priority === 'high').length, color: 'text-rose-600', icon: <AlertCircle size={20} /> },
                        { label: 'SLA At Risk', count: 2, color: 'text-violet-600', icon: <Clock size={20} /> },
                    ].map((stat, i) => (
                        <VCard key={i} className="!p-6 shadow-md border-slate-100 group hover:border-blue-200 transition-all cursor-default bg-white">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl bg-slate-50 group-hover:scale-110 transition-transform ${stat.color.replace('text', 'bg-opacity-10')}`}>
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-black text-slate-900">{stat.count}</div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                        </VCard>
                    ))}
                </div>

                {/* Queue Content */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <SectionTitle>Active Workflow Lifecycle</SectionTitle>
                            {allItems.length > 0 && (
                                <button onClick={toggleSelectAll} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-blue-600 transition-colors">
                                    {selectedIds.length === allItems.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>
                        <button onClick={() => navigate(VENDOR_ROUTES.ledger)} className="text-[11px] font-bold text-blue-600 uppercase tracking-wider hover:underline">View All History</button>
                    </div>
                    
                    {allItems.length === 0 ? (
                        <VCard className="py-24 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <ShieldCheck size={24} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">All Systems Clear</h3>
                            <p className="text-sm text-slate-400 font-medium">No pending approvals detected in the current governance cycle.</p>
                        </VCard>
                    ) : (
                        allItems.map(item => (
                            <div key={item.id} className={`group relative bg-white p-6 rounded-2xl border ${selectedIds.includes(item.id) ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'} shadow-sm hover:shadow-md hover:border-blue-200 transition-all flex flex-col md:flex-row items-start md:items-center gap-6 overflow-hidden`}>
                                
                                {/* Selection Checkbox */}
                                <div className="z-20">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => toggleSelect(item.id)}
                                        className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>

                                {/* Priority Indicator */}
                                <div className={`absolute top-0 left-0 bottom-0 w-1 ${item.priority === 'high' ? 'bg-rose-500' : item.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`} />

                                {/* Icon */}
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 group-hover:scale-105 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                    {TYPE_ICONS[item.type] || <FileText size={20} />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap mb-2">
                                        <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm">{item.displayId || item.id}</span>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ring-2 ring-offset-0 ${PRIORITY_CONFIG[item.priority]}`}>
                                            {item.priority} Priority
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-auto">
                                            <Clock size={12} /> {item.since}
                                        </div>
                                    </div>
                                    <div className="flex items-baseline gap-3 mb-1">
                                        <h2 className="text-[19px] font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
                                            {item.vendor}
                                        </h2>
                                        {item.amount > 0 && (
                                            <span className="text-[16px] font-bold text-slate-400">
                                                • {formatCurrency(item.amount)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                            <User size={12} className="text-slate-400" />
                                            <span>Requester: <span className="text-slate-600">{item.requester}</span></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                            <Box size={12} className="text-slate-400" />
                                            <span>Type: <span className="text-slate-600">{item.type}</span></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 flex-shrink-0">
                                    <button 
                                        onClick={() => approve(item.id)}
                                        className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white text-[12px] font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} /> Authorize
                                    </button>
                                    <button 
                                        onClick={() => reject(item.id)}
                                        className="flex-1 md:flex-none px-6 py-2.5 bg-white text-rose-500 border border-rose-200 text-[12px] font-bold rounded-xl hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <X size={16} /> Reject
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (item.type === 'Vendor Onboarding') navigate(`/vendors/detail/${item.id}`);
                                            else if (item.type === 'Purchase Order') navigate(`/vendors/purchase-orders/${item.id}`);
                                            else if (item.type === 'Invoice Payment') navigate(VENDOR_ROUTES.purchaseInvoice);
                                            else if (item.type === 'Stock Transfer') navigate(`/vendors/inventory/stock-transfer`);
                                            else navigate(VENDOR_ROUTES.payablesDash);
                                        }}
                                        title="View Details"
                                        className="flex-1 md:flex-none p-2.5 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                                    >
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Delegate Matrix Modal */}
            <DelegateModal 
                show={showDelegateModal} 
                onClose={() => setShowDelegateModal(false)} 
                onSubmit={(data) => {
                    addDelegation(data);
                    setShowDelegateModal(false);
                }}
            />
        </div>
    );
}

const DelegateModal = ({ show, onClose, onSubmit }) => {
    const [form, setForm] = useState({
        toUser: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        scope: []
    });

    if (!show) return null;

    const handleCheck = (s) => {
        setForm(prev => ({
            ...prev,
            scope: prev.scope.includes(s) ? prev.scope.filter(x => x !== s) : [...prev.scope, s]
        }));
    };

    const handleConfirm = () => {
        if (!form.toUser || !form.endDate || form.scope.length === 0) {
            return toast.error('Please fill all required fields');
        }
        onSubmit(form);
        toast.success('Delegation Matrix Updated!');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Delegate Matrix</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Authorization Reassignment</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Assign Authority To *</label>
                            <select 
                                value={form.toUser}
                                onChange={(e) => setForm(prev => ({ ...prev, toUser: e.target.value }))}
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none"
                            >
                                <option value="">Select Manager...</option>
                                <option value="Srinidhi R (Finance)">Srinidhi R (Finance)</option>
                                <option value="Arun V (Procurement)">Arun V (Procurement)</option>
                                <option value="Priya S (Audit)">Priya S (Audit)</option>
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Start Date</label>
                                <input 
                                    type="date" 
                                    value={form.startDate}
                                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">End Date *</label>
                                <input 
                                    type="date" 
                                    value={form.endDate}
                                    onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Scope of Delegation *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['All Workflows', 'KYC Only', 'PO Only', 'Payments Only'].map(s => (
                                    <label key={s} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all group ${form.scope.includes(s) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={form.scope.includes(s)}
                                            onChange={() => handleCheck(s)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                                        />
                                        <span className={`text-[12px] font-bold ${form.scope.includes(s) ? 'text-blue-700' : 'text-slate-600'}`}>{s}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                            Delegating authority will allow the selected user to sign off on workflows on your behalf. All actions will be logged with both your names.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-400 text-[12px] font-bold rounded-2xl hover:bg-slate-100 transition-all">
                        Cancel
                    </button>
                    <button onClick={handleConfirm} className="flex-1 px-6 py-3 bg-blue-600 text-white text-[12px] font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                        Confirm Delegation
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
