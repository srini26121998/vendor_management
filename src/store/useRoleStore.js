import { create } from 'zustand';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const ALL_MENU_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', group: 'Core' },
    { key: 'vendorList', label: 'Vendor List', group: 'Core' },
    { key: 'vendorProducts', label: 'Vendor Products', group: 'Core' },
    { key: 'purchaseOrders', label: 'Purchase Orders', group: 'Procurement' },
    { key: 'grnManagement', label: 'GRN Management', group: 'Procurement' },
    { key: 'invoices', label: 'Invoices', group: 'Finance' },
    { key: 'payables', label: 'Payables', group: 'Finance' },
    { key: 'returnsClaims', label: 'Returns & Claims', group: 'Procurement' },
    { key: 'gstReconciliation', label: 'GST Reconciliation', group: 'Finance' },
    { key: 'fulfillment', label: 'Fulfillment', group: 'Operations' },
    { key: 'reportsHub', label: 'Reports Hub', group: 'Analytics' },
    { key: 'vendorPortal', label: 'Vendor Portal', group: 'Core' },
    { key: 'multiOutlet', label: 'Multi-Outlet', group: 'Operations' },
    { key: 'warehouseMap', label: 'Warehouse Map', group: 'Operations' },
    { key: 'stockTransfer', label: 'Stock Transfer', group: 'Operations' },
    { key: 'cycleAudit', label: 'Cycle Audit', group: 'Operations' },
    { key: 'approvalQueue', label: 'Approval Queue', group: 'Core' },
    { key: 'smartPO', label: 'Smart PO', group: 'Procurement' },
    { key: 'forecasting', label: 'Forecasting', group: 'Analytics' },
    { key: 'liveAuction', label: 'Live Auction', group: 'Procurement' },
    { key: 'inboundLogistics', label: 'Inbound Logistics', group: 'Operations' },
    { key: 'aggregatorPayout', label: 'Aggregator Payout', group: 'Finance' },
    { key: 'vendorSettings', label: 'Vendor Settings', group: 'Admin' },
    { key: 'roleManagement', label: 'Role Management', group: 'Admin' },
];

export const MENU_GROUPS = ['Core', 'Procurement', 'Finance', 'Operations', 'Analytics', 'Admin'];

// ── Pre-computed lookups (computed ONCE at module load, not per render) ──
export const MENU_ITEMS_BY_GROUP = Object.freeze(
    MENU_GROUPS.reduce((acc, group) => {
        acc[group] = ALL_MENU_ITEMS.filter(m => m.group === group);
        return acc;
    }, {})
);

export const MENU_KEYS_BY_GROUP = Object.freeze(
    MENU_GROUPS.reduce((acc, group) => {
        acc[group] = MENU_ITEMS_BY_GROUP[group].map(m => m.key);
        return acc;
    }, {})
);

// ── All menu keys as a frozen Set for O(1) lookups ──
export const ALL_MENU_KEYS_SET = Object.freeze(new Set(ALL_MENU_ITEMS.map(m => m.key)));

const useRoleStore = create((set, get) => ({
    roles: [],
    menuGroups: MENU_GROUPS,
    loading: false,

    fetchRoles: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/roles');
            // If unwrapped globally by interceptor, res is the array
            const data = Array.isArray(res) ? res : (res.data || []);
            set({ roles: data, loading: false });
        } catch (error) {
            console.error("Failed to fetch roles:", error);
            set({ loading: false });
        }
    },

    addRole: async (role) => {
        try {
            const newRole = {
                ...role,
                permissions: role.permissions || [],
                memberCount: 0
            };
            const res = await api.post('/roles', newRole);
            const data = res.data || res; // handle interceptor
            set(state => ({ roles: [...state.roles, data] }));
            toast.success("Role created successfully!");
        } catch (error) {
            console.error("Failed to add role:", error);
            toast.error("Failed to create role");
        }
    },

    updateRole: async (id, updates) => {
        try {
            const res = await api.put(`/roles/${id}`, updates);
            const data = res.data || res;
            set(state => ({
                roles: state.roles.map(r => r.id === id ? data : r)
            }));
        } catch (error) {
            console.error("Failed to update role:", error);
            toast.error("Failed to save changes");
        }
    },

    deleteRole: async (id) => {
        try {
            await api.delete(`/roles/${id}`);
            set(state => ({
                roles: state.roles.filter(r => r.id !== id)
            }));
            toast.success("Role deleted");
        } catch (error) {
            console.error("Failed to delete role:", error);
            toast.error("Cannot delete system roles");
        }
    },

    duplicateRole: async (id) => {
        try {
            const res = await api.post(`/roles/${id}/duplicate`);
            const data = res.data || res;
            set(state => ({ roles: [...state.roles, data] }));
            toast.success("Role duplicated successfully!");
        } catch (error) {
            console.error("Failed to duplicate role:", error);
            toast.error("Failed to duplicate role");
        }
    },

    togglePermission: async (roleId, menuKey) => {
        const role = get().roles.find(r => r.id === roleId);
        if (!role) return;

        // Use Set for O(1) lookup instead of O(n) .includes()
        const permSet = new Set(role.permissions);
        const has = permSet.has(menuKey);
        if (has) permSet.delete(menuKey);
        else permSet.add(menuKey);
        const newPermissions = Array.from(permSet);

        // Optimistic UI update
        set(state => ({
            roles: state.roles.map(r => r.id === roleId ? { ...r, permissions: newPermissions } : r)
        }));

        try {
            await api.put(`/roles/${roleId}`, { permissions: newPermissions });
        } catch (err) {
            // Revert on fail
            toast.error("Failed to save permission");
            get().fetchRoles();
        }
    },

    toggleGroupPermissions: async (roleId, group) => {
        const role = get().roles.find(r => r.id === roleId);
        if (!role) return;

        const groupKeys = MENU_KEYS_BY_GROUP[group];
        const permSet = new Set(role.permissions);
        const allSelected = groupKeys.every(k => permSet.has(k));

        let newPermissions;
        if (allSelected) {
            groupKeys.forEach(k => permSet.delete(k));
            newPermissions = Array.from(permSet);
        } else {
            groupKeys.forEach(k => permSet.add(k));
            newPermissions = Array.from(permSet);
        }

        // Optimistic UI update
        set(state => ({
            roles: state.roles.map(r => r.id === roleId ? { ...r, permissions: newPermissions } : r)
        }));

        try {
            await api.put(`/roles/${roleId}`, { permissions: newPermissions });
        } catch (err) {
            toast.error("Failed to save permissions");
            get().fetchRoles();
        }
    },

    getRoleById: (id) => get().roles.find(r => r.id === id),
}));

export default useRoleStore;
