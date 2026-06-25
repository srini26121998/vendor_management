import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader, VCard, PrimaryBtn, SecondaryBtn, SearchBar, VModal } from './VendorComponents';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useRoleStore, { ALL_MENU_ITEMS } from '../../store/useRoleStore';
import {
    Shield, Plus, Edit3, Trash2, Copy, Users, Lock, Unlock,
    ChevronRight, Check, X, Eye, EyeOff, Search, ShieldCheck,
    LayoutGrid, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';

const ROLE_COLORS = ['#166534', '#0284c7', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#be185d', '#059669'];
const GROUPS = ['Core', 'Procurement', 'Finance', 'Operations', 'Analytics', 'Admin'];

// ── Role Card ──
const RoleCard = ({ role, isSelected, onSelect, onEdit, onDuplicate, onDelete }) => {
    const permCount = role.permissions.length;
    const totalCount = ALL_MENU_ITEMS.length;
    const pct = Math.round((permCount / totalCount) * 100);

    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
            onClick={onSelect}
            className={`group relative bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${isSelected
                ? 'border-[oklch(0.45_0.12_150)] shadow-md shadow-green-100/50'
                : 'border-slate-100 hover:border-slate-200'}`}>

            <div className="flex items-start justify-between mb-4 pt-1">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ background: role.color + '15', color: role.color }}>
                        <Shield size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-extrabold text-slate-800 tracking-tight">{role.name}</h3>
                            {role.isSystem && (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-amber-50 text-amber-600 border border-amber-100">System</span>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 line-clamp-1">{role.description}</p>
                    </div>
                </div>
                {isSelected && <div className="w-6 h-6 rounded-full bg-[oklch(0.45_0.12_150)] flex items-center justify-center"><Check size={14} className="text-white" /></div>}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500"><Users size={13} /><span className="font-bold">{role.memberCount}</span> members</div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500"><Eye size={13} /><span className="font-bold">{permCount}/{totalCount}</span> menus</div>
            </div>

            {/* Progress bar */}
            <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute left-0 top-0 h-full rounded-full" style={{ background: role.color }} />
            </div>
            <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Access Level</span>
                <span className="text-[10px] font-extrabold" style={{ color: role.color }}>{pct}%</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); onEdit(); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-[oklch(0.45_0.12_150)] hover:bg-green-50 rounded-lg transition-all"><Edit3 size={12} />Edit</button>
                <button onClick={e => { e.stopPropagation(); onDuplicate(); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"><Copy size={12} />Clone</button>
                {!role.isSystem && (
                    <button onClick={e => { e.stopPropagation(); onDelete(); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-auto"><Trash2 size={12} />Delete</button>
                )}
            </div>
        </motion.div>
    );
};

// ── Permission Matrix Panel ──
const PermissionPanel = ({ role, onToggle, onToggleGroup }) => {
    const [expandedGroups, setExpandedGroups] = useState(GROUPS.reduce((a, g) => ({ ...a, [g]: true }), {}));

    if (!role) return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                <ShieldCheck size={36} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-700 mb-1">Select a Role</h3>
            <p className="text-[12px] text-slate-400 font-medium max-w-xs">Click on any role card to view and manage its menu permissions</p>
        </div>
    );

    const toggleGroup = (group) => setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: role.color + '15', color: role.color }}>
                        <Shield size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-extrabold text-slate-800">{role.name} — Menu Access</h3>
                        <p className="text-[10px] text-slate-400 font-medium">{role.permissions.length} of {ALL_MENU_ITEMS.length} menus enabled</p>
                    </div>
                </div>
                {role.isSystem && role.name === 'Admin' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-lg border border-amber-100"><Lock size={12} />Full Access (Locked)</span>
                )}
            </div>

            {GROUPS.map(group => {
                const items = ALL_MENU_ITEMS.filter(m => m.group === group);
                const selectedCount = items.filter(m => role.permissions.includes(m.key)).length;
                const allSelected = selectedCount === items.length;
                const isExpanded = expandedGroups[group];
                const isAdmin = role.isSystem && role.name === 'Admin';

                return (
                    <div key={group} className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                        <button onClick={() => toggleGroup(group)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">{group}</span>
                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-500">{selectedCount}/{items.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isAdmin && (
                                    <button onClick={e => { e.stopPropagation(); onToggleGroup(role.id, group); }}
                                        className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition-all ${allSelected
                                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                            : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                        {allSelected ? 'Revoke All' : 'Grant All'}
                                    </button>
                                )}
                                {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                            </div>
                        </button>
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                    className="overflow-hidden">
                                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {items.map(item => {
                                            const isEnabled = role.permissions.includes(item.key);
                                            return (
                                                <button key={item.key} disabled={isAdmin}
                                                    onClick={() => onToggle(role.id, item.key)}
                                                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 group/item ${isEnabled
                                                        ? 'bg-[oklch(0.96_0.04_150)] border border-[oklch(0.9_0.06_150)]'
                                                        : 'bg-slate-50/50 border border-slate-100 hover:border-slate-200'} ${isAdmin ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'}`}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isEnabled
                                                            ? 'bg-[oklch(0.45_0.12_150)] text-white shadow-sm'
                                                            : 'bg-white border border-slate-200'}`}>
                                                            {isEnabled && <Check size={11} strokeWidth={3} />}
                                                        </div>
                                                        <span className={`text-[12px] font-semibold ${isEnabled ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</span>
                                                    </div>
                                                    {isEnabled
                                                        ? <Eye size={13} className="text-[oklch(0.45_0.12_150)]" />
                                                        : <EyeOff size={13} className="text-slate-300" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
};

// ── Toggle Switch Component ──
const ToggleSwitch = ({ enabled, onChange, color = '#166534', disabled = false }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-300 ease-in-out focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        style={{
            background: enabled
                ? `linear-gradient(135deg, ${color}, ${color}dd)`
                : '#e2e8f0',
            boxShadow: enabled ? `0 2px 8px ${color}40` : 'inset 0 1px 3px rgba(0,0,0,0.1)',
        }}
    >
        <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${enabled ? 'translate-x-[22px] scale-95' : 'translate-x-[2px]'}`}
            style={{ marginTop: '2px' }}
        />
    </button>
);

// ── Create/Edit Role Modal ──
const RoleFormModal = ({ open, onClose, editRole }) => {
    const { addRole, updateRole } = useRoleStore();
    const [form, setForm] = useState(editRole || { name: '', description: '', color: ROLE_COLORS[0], permissions: [] });
    const [menuSearch, setMenuSearch] = useState('');
    const [expandedGroups, setExpandedGroups] = useState(GROUPS.reduce((a, g) => ({ ...a, [g]: true }), {}));

    React.useEffect(() => {
        setForm(editRole || { name: '', description: '', color: ROLE_COLORS[0], permissions: [] });
        setMenuSearch('');
        setExpandedGroups(GROUPS.reduce((a, g) => ({ ...a, [g]: true }), {}));
    }, [editRole, open]);

    const handleSave = () => {
        if (!form.name.trim()) return toast.error('Role name is required');
        if (editRole?.id) {
            updateRole(editRole.id, { name: form.name, description: form.description, color: form.color, permissions: form.permissions });
            toast.success('Role updated successfully ✓', { style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold' } });
        } else {
            addRole(form);
            toast.success('Role created successfully ✓', { style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold' } });
        }
        onClose();
    };

    const togglePerm = (key) => {
        setForm(f => ({
            ...f,
            permissions: f.permissions.includes(key)
                ? f.permissions.filter(p => p !== key)
                : [...f.permissions, key]
        }));
    };

    const toggleGroupAll = (group) => {
        const groupKeys = ALL_MENU_ITEMS.filter(m => m.group === group).map(m => m.key);
        const allSelected = groupKeys.every(k => form.permissions.includes(k));
        setForm(f => ({
            ...f,
            permissions: allSelected
                ? f.permissions.filter(p => !groupKeys.includes(p))
                : [...new Set([...f.permissions, ...groupKeys])]
        }));
    };

    const selectAll = () => setForm(f => ({ ...f, permissions: ALL_MENU_ITEMS.map(m => m.key) }));
    const clearAll = () => setForm(f => ({ ...f, permissions: [] }));

    const filteredMenuItems = ALL_MENU_ITEMS.filter(m =>
        m.label.toLowerCase().includes(menuSearch.toLowerCase()) ||
        m.group.toLowerCase().includes(menuSearch.toLowerCase())
    );

    const toggleGroup = (group) => setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));

    const enabledCount = form.permissions.length;
    const totalCount = ALL_MENU_ITEMS.length;
    const pct = totalCount ? Math.round((enabledCount / totalCount) * 100) : 0;

    // Icon map for menu items
    const menuIconMap = {
        dashboard: <LayoutGrid size={14} />,
        vendorList: <Users size={14} />,
        vendorProducts: <Eye size={14} />,
        purchaseOrders: <Eye size={14} />,
        grnManagement: <Eye size={14} />,
        invoices: <Eye size={14} />,
        payables: <Eye size={14} />,
        returnsClaims: <Eye size={14} />,
        gstReconciliation: <Eye size={14} />,
        fulfillment: <Eye size={14} />,
        reportsHub: <Eye size={14} />,
        vendorPortal: <Eye size={14} />,
        multiOutlet: <Eye size={14} />,
        warehouseMap: <Eye size={14} />,
        stockTransfer: <Eye size={14} />,
        cycleAudit: <Eye size={14} />,
        approvalQueue: <Eye size={14} />,
        smartPO: <Eye size={14} />,
        forecasting: <Eye size={14} />,
        liveAuction: <Eye size={14} />,
        inboundLogistics: <Eye size={14} />,
        aggregatorPayout: <Eye size={14} />,
        vendorSettings: <Eye size={14} />,
        roleManagement: <Shield size={14} />,
    };

    return (
        <VModal open={open} onClose={onClose} title={editRole?.id ? 'Edit Role' : 'Create New Role'} width="max-w-3xl">
            <div className="space-y-5">
                {/* Top Row: Name + Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Role Name</label>
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="e.g. Warehouse Staff"
                            className="w-full text-[13px] font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 transition-all shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Description</label>
                        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Describe the purpose of this role..."
                            className="w-full text-[13px] font-semibold text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-600/10 transition-all shadow-sm" />
                    </div>
                </div>

                {/* Menu Permissions Section */}
                <div className="border-t border-slate-100 pt-4">
                    {/* Header with stats */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: form.color + '15', color: form.color }}>
                                <Shield size={16} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h4 className="text-[13px] font-extrabold text-slate-800 tracking-tight">Menu Permissions</h4>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    <span className="font-extrabold" style={{ color: form.color }}>{enabledCount}</span> of {totalCount} menus enabled
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={selectAll}
                                className="px-2.5 py-1 text-[9px] font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all uppercase tracking-wider border border-green-100">
                                Select All
                            </button>
                            <button onClick={clearAll}
                                className="px-2.5 py-1 text-[9px] font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all uppercase tracking-wider border border-red-100">
                                Clear All
                            </button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="absolute left-0 top-0 h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${form.color}, ${form.color}cc)` }}
                        />
                    </div>

                    {/* Search menus */}
                    <div className="relative mb-3">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={menuSearch}
                            onChange={e => setMenuSearch(e.target.value)}
                            placeholder="Search menus..."
                            className="w-full text-[12px] font-medium text-slate-700 border border-slate-200 rounded-xl pl-9 pr-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-slate-300 transition-all"
                        />
                    </div>

                    {/* Grouped menu items */}
                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                        {GROUPS.map(group => {
                            const items = filteredMenuItems.filter(m => m.group === group);
                            if (items.length === 0) return null;
                            const selectedCount = items.filter(m => form.permissions.includes(m.key)).length;
                            const allSelected = selectedCount === items.length;
                            const isExpanded = expandedGroups[group];

                            // Group color mapping
                            const groupColors = {
                                Core: '#166534', Procurement: '#0284c7', Finance: '#d97706',
                                Operations: '#7c3aed', Analytics: '#0891b2', Admin: '#dc2626'
                            };
                            const gc = groupColors[group] || '#64748b';

                            return (
                                <div key={group} className="rounded-xl border border-slate-100 overflow-hidden bg-white">
                                    <button onClick={() => toggleGroup(group)}
                                        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ background: gc }} />
                                            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">{group}</span>
                                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md" style={{ background: gc + '12', color: gc }}>
                                                {selectedCount}/{items.length}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={e => { e.stopPropagation(); toggleGroupAll(group); }}
                                                className={`px-2 py-0.5 text-[8px] font-bold rounded-md transition-all uppercase tracking-wider ${allSelected
                                                    ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'
                                                    : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100'}`}>
                                                {allSelected ? 'Revoke' : 'Grant All'}
                                            </button>
                                            {isExpanded
                                                ? <ChevronUp size={13} className="text-slate-400" />
                                                : <ChevronDown size={13} className="text-slate-400" />}
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                                className="overflow-hidden">
                                                <div className="p-2 space-y-1">
                                                    {items.map(item => {
                                                        const isEnabled = form.permissions.includes(item.key);
                                                        return (
                                                            <div key={item.key}
                                                                onClick={() => togglePerm(item.key)}
                                                                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group/item ${isEnabled
                                                                    ? 'bg-gradient-to-r from-[oklch(0.97_0.03_150)] to-white border border-[oklch(0.92_0.04_150)]'
                                                                    : 'bg-white border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'}`}
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${isEnabled
                                                                        ? 'shadow-sm'
                                                                        : 'bg-slate-50 text-slate-400'}`}
                                                                        style={isEnabled ? { background: form.color + '15', color: form.color } : {}}>
                                                                        {menuIconMap[item.key] || <Eye size={14} />}
                                                                    </div>
                                                                    <div>
                                                                        <span className={`text-[12px] font-semibold block leading-tight ${isEnabled ? 'text-slate-800' : 'text-slate-500'}`}>
                                                                            {item.label}
                                                                        </span>
                                                                        {isEnabled && (
                                                                            <span className="text-[9px] font-medium" style={{ color: form.color }}>Visible</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <ToggleSwitch
                                                                    enabled={isEnabled}
                                                                    onChange={() => togglePerm(item.key)}
                                                                    color={form.color}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: form.color }} />
                        <span className="text-[11px] font-bold text-slate-500">
                            {enabledCount} permission{enabledCount !== 1 ? 's' : ''} · {pct}% access
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
                        <PrimaryBtn onClick={handleSave}>{editRole?.id ? 'Update Role' : 'Create Role'}</PrimaryBtn>
                    </div>
                </div>
            </div>
        </VModal>
    );
};

// ── Delete Confirm Modal ──
const DeleteModal = ({ open, onClose, role, onConfirm }) => (
    <VModal open={open} onClose={onClose} title="Delete Role" width="max-w-md">
        <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto border border-red-100">
                <AlertTriangle size={28} className="text-red-500" />
            </div>
            <div>
                <h4 className="text-base font-extrabold text-slate-800">Delete "{role?.name}"?</h4>
                <p className="text-[12px] text-slate-500 mt-1">This will permanently remove this role and its permissions. Members will lose their access settings.</p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
                <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
                <button onClick={onConfirm}
                    className="flex items-center gap-2 px-6 py-2.5 text-[11px] font-bold rounded-full bg-red-500 text-white hover:bg-red-600 active:scale-95 transition-all uppercase tracking-wider">
                    <Trash2 size={13} /> Delete Role
                </button>
            </div>
        </div>
    </VModal>
);

// ── Main Component ──
export default function RoleManagement() {
    const { roles, fetchRoles, togglePermission, toggleGroupPermissions, duplicateRole, deleteRole } = useRoleStore();
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editRole, setEditRole] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        if (!selectedRoleId && roles.length > 0) {
            setSelectedRoleId(roles.find(r => r.name === 'Admin')?.id ?? roles[0]?.id);
        }
    }, [roles, selectedRoleId]);

    const filteredRoles = useMemo(() =>
        roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase())),
        [roles, search]
    );

    const selectedRole = roles.find(r => r.id === selectedRoleId);

    const handleEdit = (role) => { setEditRole(role); setFormOpen(true); };
    const handleCreate = () => { setEditRole(null); setFormOpen(true); };
    const handleDelete = () => {
        if (deleteTarget) {
            deleteRole(deleteTarget.id);
            if (selectedRoleId === deleteTarget.id) setSelectedRoleId(null);
            toast.success('Role deleted', { icon: '🗑️', style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold' } });
        }
        setDeleteTarget(null);
    };
    const handleDuplicate = (role) => {
        duplicateRole(role.id);
        toast.success('Role duplicated', { icon: '📋', style: { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold' } });
    };

    // Summary stats
    const totalMembers = roles.reduce((a, r) => a + r.memberCount, 0);
    const avgAccess = roles.length ? Math.round(roles.reduce((a, r) => a + (r.permissions.length / ALL_MENU_ITEMS.length) * 100, 0) / roles.length) : 0;

    return (
        <div className="p-4 lg:p-8 w-full space-y-6 animate-in fade-in duration-500 min-h-screen">
            <PageHeader
                title="Role Management"
                subtitle="Define roles and control which menus are visible for each team member"
                badge="RBAC"
                actions={<PrimaryBtn onClick={handleCreate} icon={<Plus size={14} />}>Create Role</PrimaryBtn>}
            />

            {/* Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Roles', value: roles.length, icon: <Shield size={16} />, color: '#166534' },
                    { label: 'Total Members', value: totalMembers, icon: <Users size={16} />, color: '#0284c7' },
                    { label: 'Menu Items', value: ALL_MENU_ITEMS.length, icon: <LayoutGrid size={16} />, color: '#7c3aed' },
                    { label: 'Avg. Access', value: `${avgAccess}%`, icon: <ShieldCheck size={16} />, color: '#d97706' },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-sm transition-all">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.color + '12', color: s.color }}>
                            {s.icon}
                        </div>
                        <div>
                            <div className="text-lg font-extrabold text-slate-800 tracking-tight">{s.value}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content: Roles List + Permission Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Left: Roles List */}
                <div className="xl:col-span-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[13px] font-extrabold text-slate-700 uppercase tracking-wider">All Roles</h2>
                        <span className="text-[11px] text-slate-400 font-medium">{filteredRoles.length} roles</span>
                    </div>
                    <SearchBar value={search} onChange={setSearch} placeholder="Search roles..." />
                    <div className="space-y-3">
                        <AnimatePresence>
                            {filteredRoles.map(role => (
                                <RoleCard key={role.id} role={role}
                                    isSelected={selectedRoleId === role.id}
                                    onSelect={() => setSelectedRoleId(role.id)}
                                    onEdit={() => handleEdit(role)}
                                    onDuplicate={() => handleDuplicate(role)}
                                    onDelete={() => setDeleteTarget(role)} />
                            ))}
                        </AnimatePresence>
                        {filteredRoles.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Shield size={36} className="mx-auto mb-3 text-slate-300" />
                                <p className="text-sm font-bold">No roles found</p>
                                <p className="text-[11px] mt-1">Try a different search term</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Permission Matrix */}
                <div className="xl:col-span-7">
                    <VCard className="min-h-[400px]">
                        <PermissionPanel role={selectedRole}
                            onToggle={togglePermission}
                            onToggleGroup={(roleId, group) => toggleGroupPermissions(roleId, group, ALL_MENU_ITEMS)} />
                    </VCard>
                </div>
            </div>

            <RoleFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditRole(null); }} editRole={editRole} />
            <DeleteModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} role={deleteTarget} onConfirm={handleDelete} />
        </div>
    );
}
