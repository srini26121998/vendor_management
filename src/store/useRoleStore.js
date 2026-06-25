import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── All sidebar menu keys that can be assigned to roles ──
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

const MENU_GROUPS = ['Core', 'Procurement', 'Finance', 'Operations', 'Analytics', 'Admin'];

// ── Default seed roles ──
const DEFAULT_ROLES = [
    {
        id: 'role_admin',
        name: 'Admin',
        description: 'Full system access with all permissions. Can manage roles and settings.',
        color: '#166534',
        isSystem: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        permissions: ALL_MENU_ITEMS.map(m => m.key),
        memberCount: 2,
    },
    {
        id: 'role_manager',
        name: 'Manager',
        description: 'Can manage procurement, vendors, and view reports. No admin access.',
        color: '#0284c7',
        isSystem: false,
        createdAt: '2026-02-15T00:00:00Z',
        updatedAt: '2026-03-10T00:00:00Z',
        permissions: [
            'dashboard', 'vendorList', 'vendorProducts', 'purchaseOrders', 'grnManagement',
            'invoices', 'payables', 'returnsClaims', 'fulfillment', 'reportsHub',
            'vendorPortal', 'multiOutlet', 'approvalQueue', 'smartPO', 'forecasting',
        ],
        memberCount: 5,
    },
    {
        id: 'role_cashier',
        name: 'Cashier',
        description: 'Limited access for billing and payment operations.',
        color: '#d97706',
        isSystem: false,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-20T00:00:00Z',
        permissions: [
            'dashboard', 'invoices', 'payables', 'gstReconciliation',
        ],
        memberCount: 8,
    },
    {
        id: 'role_viewer',
        name: 'Viewer',
        description: 'Read-only access to dashboards and reports.',
        color: '#7c3aed',
        isSystem: false,
        createdAt: '2026-04-10T00:00:00Z',
        updatedAt: '2026-04-10T00:00:00Z',
        permissions: [
            'dashboard', 'reportsHub', 'forecasting',
        ],
        memberCount: 12,
    },
];

const useRoleStore = create(
    persist(
        (set, get) => ({
            roles: DEFAULT_ROLES,
            menuGroups: MENU_GROUPS,

            addRole: (role) => {
                const newRole = {
                    ...role,
                    id: 'role_' + Date.now(),
                    isSystem: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    memberCount: 0,
                };
                set(state => ({ roles: [...state.roles, newRole] }));
            },

            updateRole: (id, updates) => {
                set(state => ({
                    roles: state.roles.map(r =>
                        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
                    )
                }));
            },

            deleteRole: (id) => {
                set(state => ({
                    roles: state.roles.filter(r => r.id !== id)
                }));
            },

            togglePermission: (roleId, menuKey) => {
                set(state => ({
                    roles: state.roles.map(r => {
                        if (r.id !== roleId) return r;
                        const has = r.permissions.includes(menuKey);
                        return {
                            ...r,
                            permissions: has
                                ? r.permissions.filter(p => p !== menuKey)
                                : [...r.permissions, menuKey],
                            updatedAt: new Date().toISOString(),
                        };
                    })
                }));
            },

            toggleGroupPermissions: (roleId, group, allMenuItems) => {
                set(state => ({
                    roles: state.roles.map(r => {
                        if (r.id !== roleId) return r;
                        const groupKeys = allMenuItems.filter(m => m.group === group).map(m => m.key);
                        const allSelected = groupKeys.every(k => r.permissions.includes(k));
                        const newPermissions = allSelected
                            ? r.permissions.filter(p => !groupKeys.includes(p))
                            : [...new Set([...r.permissions, ...groupKeys])];
                        return { ...r, permissions: newPermissions, updatedAt: new Date().toISOString() };
                    })
                }));
            },

            duplicateRole: (id) => {
                const role = get().roles.find(r => r.id === id);
                if (!role) return;
                const newRole = {
                    ...role,
                    id: 'role_' + Date.now(),
                    name: role.name + ' (Copy)',
                    isSystem: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    memberCount: 0,
                };
                set(state => ({ roles: [...state.roles, newRole] }));
            },

            getRoleById: (id) => get().roles.find(r => r.id === id),
        }),
        {
            name: 'role-storage',
        }
    )
);

export default useRoleStore;
