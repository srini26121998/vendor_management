import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { PageHeader, VCard, PrimaryBtn, SecondaryBtn, SearchBar, VModal, StatusBadge, FilterBar, Pagination, EmptyState } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useBranchStore, { REGISTERED_USERS, WAREHOUSES } from '../../store/useBranchStore';
import {
    Building2, Plus, Edit3, Trash2, Eye, MapPin, Phone, User, Warehouse,
    ChevronRight, Check, X, AlertTriangle, ToggleLeft, ToggleRight,
    GitBranch, Users, Package, TrendingUp, Calendar, Search, Hash, Power,
    ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { formatDate, formatCurrency } from './vendorConstants';

const TOAST_STYLE = { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold' };
const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

// ── Badge Components ──
const RequiredBadge = () => (
    <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-red-50 text-red-500 border border-red-100">Required</span>
);
const OptionalBadge = () => (
    <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-amber-50 text-amber-500 border border-amber-100">Optional</span>
);
const AutoBadge = () => (
    <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-emerald-50 text-emerald-600 border border-emerald-100">Auto</span>
);

// ── Toggle Switch ──
const ToggleSwitch = memo(({ enabled, onChange, disabled = false }) => (
    <button type="button" disabled={disabled} onClick={onChange}
        className={`relative inline-flex h-7 w-13 shrink-0 rounded-full transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{ width: '52px', background: enabled ? 'linear-gradient(135deg, #166534, #15803d)' : '#e2e8f0', boxShadow: enabled ? '0 2px 8px #16653440' : 'inset 0 1px 3px rgba(0,0,0,0.1)' }}>
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-all duration-300 ${enabled ? 'translate-x-[28px]' : 'translate-x-[3px]'}`} style={{ marginTop: '4px' }} />
    </button>
));

// ── Branch Detail Screen ──
const BranchDetailScreen = ({ branch, onBack, onEdit, onToggleStatus, onDelete }) => {
    if (!branch) return null;
    const details = [
        { label: 'Branch Code', value: branch.branchCode, icon: <Hash size={16} /> },
        { label: 'Supermarket', value: branch.supermarket, icon: <Building2 size={16} /> },
        { label: 'Address', value: [branch.addressLine1, branch.addressLine2, branch.city].filter(Boolean).join(', '), icon: <MapPin size={16} /> },
        { label: 'Branch Manager', value: branch.branchManager, icon: <User size={16} /> },
        { label: 'Contact', value: branch.contactNumber, icon: <Phone size={16} /> },
        { label: 'Warehouse', value: branch.warehouseLinked || 'Not linked', icon: <Warehouse size={16} /> },
        { label: 'Created On', value: formatDate(branch.createdOn), icon: <Calendar size={16} /> },
    ];
    return (
        <div className="p-4 lg:p-8 w-full space-y-6 animate-in fade-in duration-500 min-h-screen">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                     <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all cursor-pointer">
                         <ChevronRight size={20} className="rotate-180" />
                     </button>
                     <div>
                         <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Branch Details</h2>
                         <p className="text-sm text-slate-500">Viewing information for {branch.branchName}</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-3">
                     <button onClick={() => onToggleStatus(branch.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold border transition-all cursor-pointer ${branch.status === 'active' ? 'bg-[#fef3c7] text-[#d97706] border-[#fde68a] hover:bg-[#fde68a]' : 'bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0] hover:bg-[#bbf7d0]'}`}>
                         <Power size={14} />
                         {branch.status === 'active' ? 'Deactivate' : 'Activate'}
                     </button>
                     <button onClick={() => onEdit(branch)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] hover:bg-[#bbf7d0] transition-all cursor-pointer">
                         <Edit3 size={14} />
                         Edit Branch
                     </button>
                     <button onClick={() => onDelete(branch)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] hover:bg-[#fecaca] transition-all cursor-pointer">
                         <Trash2 size={14} />
                         Delete Branch
                     </button>
                 </div>
             </div>
             
             <VCard>
                <div className="space-y-6">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[oklch(0.96_0.04_150)] border border-[oklch(0.9_0.06_150)]">
                            <Building2 size={32} className="text-[oklch(0.45_0.12_150)]" />
                        </div>
                        <div>
                            <h3 className="text-xl font-extrabold text-slate-800">{branch.branchName}</h3>
                            <div className="mt-2"><StatusBadge status={branch.status} size="sm" /></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {details.map((d, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white border-[1.5px] border-slate-100 hover:border-green-300 transition-colors group cursor-default">
                                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0 group-hover:bg-green-50 group-hover:text-green-700 group-hover:border-green-200 transition-colors">{d.icon}</div>
                                <div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.label}</div>
                                    <div className="text-[14px] font-extrabold text-slate-800 mt-0.5">{d.value || '—'}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                        {[
                            { label: 'Vendors', value: branch.vendorCount, icon: <Users size={20} />, color: '#0284c7' },
                            { label: 'Total Stock', value: branch.totalStock?.toLocaleString(), icon: <Package size={20} />, color: '#7c3aed' },
                            { label: 'Monthly Revenue', value: formatCurrency(branch.monthlyRevenue || 0), icon: <TrendingUp size={20} />, color: '#166534' },
                        ].map((s, i) => (
                            <div key={i} className="relative p-6 rounded-2xl bg-white border-[1.5px] border-slate-200 hover:border-slate-300 transition-all overflow-hidden group cursor-default">
                                <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:opacity-[0.08]" style={{ backgroundColor: s.color }}></div>
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: s.color + '15', color: s.color }}>
                                        {s.icon}
                                    </div>
                                    <div className="px-2.5 py-1 rounded-md border text-[10px] font-bold tracking-widest uppercase" style={{ color: s.color, borderColor: s.color + '30', backgroundColor: s.color + '05' }}>
                                        {s.label}
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <div className="text-3xl font-black text-slate-800 tracking-tight">{s.value}</div>
                                </div>
                                <div className="absolute bottom-0 left-0 h-1.5 w-full opacity-60 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: s.color }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </VCard>
        </div>
    );
};

// ── Create/Edit Branch Form Modal ──
const BranchFormModal = ({ open, onClose, editBranch }) => {
    const { addBranch, updateBranch } = useBranchStore();
    const currentSupermarket = useBranchStore(s => s.currentSupermarket);
    const defaultForm = { branchName: '', branchCode: '', supermarket: currentSupermarket, addressLine1: '', addressLine2: '', city: '', branchManager: '', branchManagerId: '', contactNumber: '', warehouseLinked: '', warehouseId: '', status: 'active' };
    const [form, setForm] = useState(defaultForm);

    useEffect(() => {
        setForm(editBranch ? { ...defaultForm, ...editBranch } : { ...defaultForm, supermarket: currentSupermarket });
    }, [editBranch, open, currentSupermarket]);

    const handleSave = () => {
        if (!form.branchName.trim()) return toast.error('Branch name is required', { style: TOAST_STYLE });
        if (!form.branchCode.trim()) return toast.error('Branch code is required', { style: TOAST_STYLE });
        if (!form.addressLine1.trim()) return toast.error('Address is required', { style: TOAST_STYLE });
        if (!form.branchManagerId) return toast.error('Branch manager is required', { style: TOAST_STYLE });
        if (editBranch?.id) { updateBranch(editBranch.id, form); } else { addBranch(form); }
        onClose();
    };

    const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
    const handleManagerChange = (userId) => {
        const user = REGISTERED_USERS.find(u => u.id === userId);
        setForm(f => ({ ...f, branchManagerId: userId, branchManager: user?.name || '' }));
    };
    const handleWarehouseChange = (whId) => {
        const wh = WAREHOUSES.find(w => w.id === whId);
        setForm(f => ({ ...f, warehouseId: whId, warehouseLinked: wh?.name || '' }));
    };

    const fields = [
        { key: 'branchName', label: 'Branch Name', badge: 'required', type: 'text', placeholder: 'e.g. Red Hills Branch', helpText: 'Text input' },
        { key: 'branchCode', label: 'Branch Code', badge: 'required', type: 'text', placeholder: 'Unique, no spaces (RH001)', helpText: 'Text input' },
        { key: 'supermarket', label: 'Supermarket', badge: 'auto', type: 'readonly', helpText: 'Inherited from current context' },
        { key: 'addressLine1', label: 'Address Line 1', badge: 'required', type: 'text', placeholder: 'Street address', helpText: 'Text input' },
        { key: 'addressLine2', label: 'Address Line 2', badge: 'optional', type: 'text', placeholder: 'Apartment, suite, etc.', helpText: 'Text input' },
        { key: 'city', label: 'City / Area', badge: 'optional', type: 'text', placeholder: 'e.g. Pallikarnai', helpText: 'Text input' },
        { key: 'branchManagerId', label: 'Branch Manager', badge: 'required', type: 'userDropdown', helpText: 'Select from registered users' },
        { key: 'contactNumber', label: 'Contact Number', badge: 'optional', type: 'phone', placeholder: '+91 XXXXX XXXXX', helpText: 'Phone input' },
        { key: 'warehouseId', label: 'Warehouse Linked', badge: 'optional', type: 'warehouseDropdown', helpText: 'Link to warehouse module' },
        { key: 'status', label: 'Status', badge: 'required', type: 'toggle', helpText: 'Active / Inactive' },
    ];

    return (
        <VModal open={open} onClose={onClose} title={editBranch?.id ? 'Edit Branch' : 'Create New Branch'} width="max-w-2xl">
            <div className="space-y-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <Building2 size={12} /> Form Fields
                </div>
                <div className="space-y-3">
                    {fields.map(f => (
                        <div key={f.key} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/30 border border-slate-100 hover:border-slate-200 transition-all">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <label className="text-[12px] font-extrabold text-slate-700">{f.label}</label>
                                    {f.badge === 'required' && <RequiredBadge />}
                                    {f.badge === 'optional' && <OptionalBadge />}
                                    {f.badge === 'auto' && <AutoBadge />}
                                    <span className="text-[9px] font-medium text-slate-400 ml-auto">{f.helpText}</span>
                                </div>
                                {f.type === 'text' && (
                                    <input value={form[f.key] || ''} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder}
                                        className="w-full text-[13px] font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-[oklch(0.45_0.12_150)] focus:ring-4 focus:ring-green-600/10 transition-all" />
                                )}
                                {f.type === 'phone' && (
                                    <input value={form[f.key] || ''} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder} type="tel"
                                        className="w-full text-[13px] font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-[oklch(0.45_0.12_150)] focus:ring-4 focus:ring-green-600/10 transition-all" />
                                )}
                                {f.type === 'readonly' && (
                                    <div className="w-full text-[13px] font-semibold text-slate-500 border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-100/50 cursor-not-allowed">{form[f.key]}</div>
                                )}
                                {f.type === 'userDropdown' && (
                                    <select value={form.branchManagerId || ''} onChange={e => handleManagerChange(e.target.value)}
                                        className="w-full text-[13px] font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-[oklch(0.45_0.12_150)] focus:ring-4 focus:ring-green-600/10 transition-all appearance-none cursor-pointer">
                                        <option value="">Select branch manager...</option>
                                        {REGISTERED_USERS.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                                    </select>
                                )}
                                {f.type === 'warehouseDropdown' && (
                                    <select value={form.warehouseId || ''} onChange={e => handleWarehouseChange(e.target.value)}
                                        className="w-full text-[13px] font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-[oklch(0.45_0.12_150)] focus:ring-4 focus:ring-green-600/10 transition-all appearance-none cursor-pointer">
                                        <option value="">No warehouse linked</option>
                                        {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                )}
                                {f.type === 'toggle' && (
                                    <div className="flex items-center gap-3">
                                        <ToggleSwitch enabled={form.status === 'active'} onChange={() => setField('status', form.status === 'active' ? 'inactive' : 'active')} />
                                        <span className={`text-[12px] font-bold ${form.status === 'active' ? 'text-green-700' : 'text-slate-400'}`}>
                                            {form.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
                    <PrimaryBtn onClick={handleSave} icon={<Check size={14} />}>{editBranch?.id ? 'Update Branch' : 'Save Branch'}</PrimaryBtn>
                </div>
            </div>
        </VModal>
    );
};

// ── Delete Confirm Modal ──
const DeleteModal = ({ open, onClose, branch, onConfirm }) => (
    <VModal open={open} onClose={onClose} title="Delete Branch" width="max-w-md">
        <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto border border-red-100">
                <AlertTriangle size={28} className="text-red-500" />
            </div>
            <div>
                <h4 className="text-base font-extrabold text-slate-800">Delete "{branch?.branchName}"?</h4>
                <p className="text-[12px] text-slate-500 mt-1">This will permanently remove this branch, its vendor links, and warehouse associations. This action cannot be undone.</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
                <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
                <button onClick={onConfirm}
                    className="flex items-center gap-2 px-6 py-2.5 text-[11px] font-bold rounded-full bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all uppercase tracking-wider">
                    <Trash2 size={13} /> Delete Branch
                </button>
            </div>
        </div>
    </VModal>
);


// ── Main Component ──
export default function BranchManagement() {
    const branches = useBranchStore(s => s.branches);
    const fetchBranches = useBranchStore(s => s.fetchBranches);
    const deleteBranch = useBranchStore(s => s.deleteBranch);
    const toggleBranchStatus = useBranchStore(s => s.toggleBranchStatus);
    const currentSupermarket = useBranchStore(s => s.currentSupermarket);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [formOpen, setFormOpen] = useState(false);
    const [editBranch, setEditBranch] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewBranch, setViewBranch] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortField, setSortField] = useState('createdOn');
    const [sortDirection, setSortDirection] = useState('desc');

    useEffect(() => { fetchBranches(); }, []);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedAndFiltered = useMemo(() => {
        const result = branches.filter(b => {
            const matchSearch = !search || b.branchName.toLowerCase().includes(search.toLowerCase()) || b.branchCode.toLowerCase().includes(search.toLowerCase()) || b.city?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'all' || b.status === statusFilter;
            return matchSearch && matchStatus;
        });

        result.sort((a, b) => {
            let valA = a[sortField] || '';
            let valB = b[sortField] || '';
            
            if (sortField === 'location') {
                valA = [a.addressLine1, a.city].filter(Boolean).join(', ');
                valB = [b.addressLine1, b.city].filter(Boolean).join(', ');
            } else if (sortField === 'createdOn') {
                valA = new Date(a.createdOn).getTime();
                valB = new Date(b.createdOn).getTime();
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [branches, search, statusFilter, sortField, sortDirection]);

    // Reset page when search or filter changes
    useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

    const totalPages = Math.ceil(sortedAndFiltered.length / perPage);
    const paged = sortedAndFiltered.slice((currentPage - 1) * perPage, currentPage * perPage);

    const handleCreate = useCallback(() => { setEditBranch(null); setFormOpen(true); }, []);
    const handleEdit = useCallback((b) => { setEditBranch(b); setFormOpen(true); }, []);
    const handleDelete = useCallback(() => {
        if (deleteTarget) {
            deleteBranch(deleteTarget.id);
            if (viewBranch?.id === deleteTarget.id) setViewBranch(null);
        }
        setDeleteTarget(null);
    }, [deleteTarget, deleteBranch, viewBranch]);

    const activeBranches = branches.filter(b => b.status === 'active').length;
    const totalVendors = branches.reduce((a, b) => a + (b.vendorCount || 0), 0);
    const totalRevenue = branches.reduce((a, b) => a + (b.monthlyRevenue || 0), 0);

    const currentViewBranch = viewBranch ? branches.find(b => b.id === viewBranch.id) : null;

    return (
        <>
            {currentViewBranch ? (
                <BranchDetailScreen 
                    branch={currentViewBranch} 
                    onBack={() => setViewBranch(null)} 
                    onEdit={handleEdit}
                    onToggleStatus={toggleBranchStatus}
                    onDelete={(b) => setDeleteTarget(b)}
                />
            ) : (
                <div className="p-4 lg:p-8 w-full space-y-6 animate-in fade-in duration-500 min-h-screen">
            <PageHeader
                title="Branches"
                subtitle={`Manage branches for ${currentSupermarket}`}
                badge="ERP"
                actions={<PrimaryBtn onClick={handleCreate} icon={<Plus size={14} />}>Create Branch</PrimaryBtn>}
            />

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Branches', value: branches.length, icon: <Building2 size={16} />, color: '#166534' },
                    { label: 'Active Branches', value: activeBranches, icon: <GitBranch size={16} />, color: '#0284c7' },
                    { label: 'Total Vendors', value: totalVendors, icon: <Users size={16} />, color: '#7c3aed' },
                    { label: 'Monthly Revenue', value: formatCurrency(totalRevenue), icon: <TrendingUp size={16} />, color: '#d97706' },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border-[1.5px] border-slate-200 p-5 flex items-center gap-4 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-default group">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: s.color + '15', color: s.color }}>{s.icon}</div>
                        <div>
                            <div className="text-2xl font-black text-slate-800 tracking-tight">{s.value}</div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{s.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 w-full"><SearchBar value={search} onChange={setSearch} placeholder="Search branches by name, code, or city..." /></div>
                <FilterBar filters={STATUS_FILTERS} active={statusFilter} onChange={setStatusFilter} />
            </div>

            {/* Branch List Table */}
            <VCard noPad>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[700px]">
                        <thead>
                            <tr className="border-b border-slate-100" style={{ background: '#F8FAFC' }}>
                                {[
                                    { label: 'Branch Name', field: 'branchName', sortable: true },
                                    { label: 'Branch Code', field: 'branchCode', sortable: true },
                                    { label: 'Location / Address', field: 'location', sortable: true },
                                    { label: 'Branch Manager', field: 'branchManager', sortable: true },
                                    { label: 'Status', field: 'status', sortable: true },
                                    { label: 'Created On', field: 'createdOn', sortable: true }
                                ].map((h, i) => (
                                    <th key={i} 
                                        onClick={() => h.sortable && handleSort(h.field)}
                                        className={`px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap ${h.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            {h.label}
                                            {h.sortable && (
                                                <span className="text-slate-400">
                                                    {sortField === h.field ? (
                                                        sortDirection === 'asc' ? <ArrowUp size={12} className="text-[oklch(0.45_0.12_150)]" /> : <ArrowDown size={12} className="text-[oklch(0.45_0.12_150)]" />
                                                    ) : (
                                                        <ArrowUpDown size={12} className="opacity-50" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-16 text-center">
                                    <EmptyState title="No branches found" desc="Create your first branch to get started with multi-outlet operations." action={<PrimaryBtn onClick={handleCreate} icon={<Plus size={14} />}>Create Branch</PrimaryBtn>} />
                                </td></tr>
                            ) : paged.map((b, ri) => (
                                <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: ri * 0.03 }}
                                    onClick={() => setViewBranch(b)}
                                    className={`border-b border-slate-50 transition-all duration-200 hover:bg-[oklch(0.98_0.01_150)] group cursor-pointer ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[oklch(0.96_0.04_150)] border border-[oklch(0.9_0.06_150)]">
                                                <Building2 size={14} className="text-[oklch(0.45_0.12_150)]" />
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-800">{b.branchName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 font-mono">{b.branchCode}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-[12px] text-slate-600">
                                            <MapPin size={12} className="text-slate-400 shrink-0" />
                                            <span className="truncate max-w-[200px]">{[b.addressLine1, b.city].filter(Boolean).join(', ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User size={11} className="text-slate-500" />
                                            </div>
                                            <span className="text-[12px] font-semibold text-slate-700">{b.branchManager}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={b.status} size="xs" /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                            <Calendar size={11} className="text-slate-400" />
                                            {formatDate(b.createdOn)}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </VCard>

            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-4">
                <div className="flex items-center gap-2 text-[13px] font-bold text-slate-500">
                    <span>Show</span>
                    <select 
                        value={perPage} 
                        onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[oklch(0.45_0.12_150)]/20 cursor-pointer font-semibold"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <span>entries</span>
                </div>
                {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            </div>
                </div>
            )}

            <BranchFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditBranch(null); }} editBranch={editBranch} />
            <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} branch={deleteTarget} onConfirm={handleDelete} />
        </>
    );
}
