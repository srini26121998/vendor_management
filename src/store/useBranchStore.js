import { create } from 'zustand';
import api from '../api/axios';
import toast from 'react-hot-toast';

// ── Mock data for initial development ──
const MOCK_BRANCHES = [
    {
        id: 'BR001',
        branchName: 'Pallikarnai',
        branchCode: 'PLK001',
        supermarket: 'Crazy Supermarkets',
        addressLine1: '12, Old Pallavaram Road',
        addressLine2: 'Near Bus Stand',
        city: 'Pallikarnai',
        branchManager: 'Rajesh Kumar',
        branchManagerId: 'USR001',
        contactNumber: '+91 98765 43210',
        warehouseLinked: 'Warehouse A — Pallikarnai Central',
        warehouseId: 'WH001',
        status: 'active',
        createdOn: '2025-03-15T10:30:00Z',
        vendorCount: 24,
        totalStock: 14520,
        monthlyRevenue: 1850000,
    },
    {
        id: 'BR002',
        branchName: 'Red Hills',
        branchCode: 'RH001',
        supermarket: 'Crazy Supermarkets',
        addressLine1: '45, Red Hills Main Road',
        addressLine2: '',
        city: 'Red Hills',
        branchManager: 'Priya Sharma',
        branchManagerId: 'USR002',
        contactNumber: '+91 87654 32109',
        warehouseLinked: 'Warehouse B — Red Hills North',
        warehouseId: 'WH002',
        status: 'active',
        createdOn: '2025-05-22T14:15:00Z',
        vendorCount: 18,
        totalStock: 11230,
        monthlyRevenue: 1420000,
    },
    {
        id: 'BR003',
        branchName: 'Tambaram',
        branchCode: 'TBM001',
        supermarket: 'Crazy Supermarkets',
        addressLine1: '78, Tambaram Sanatorium',
        addressLine2: 'GST Road',
        city: 'Tambaram',
        branchManager: 'Arjun Nair',
        branchManagerId: 'USR003',
        contactNumber: '+91 76543 21098',
        warehouseLinked: 'Warehouse C — Tambaram West',
        warehouseId: 'WH003',
        status: 'active',
        createdOn: '2025-08-10T09:00:00Z',
        vendorCount: 21,
        totalStock: 13050,
        monthlyRevenue: 1650000,
    },
    {
        id: 'BR004',
        branchName: 'Velachery',
        branchCode: 'VLC001',
        supermarket: 'Crazy Supermarkets',
        addressLine1: '100 Feet Road',
        addressLine2: 'Near Phoenix Mall',
        city: 'Velachery',
        branchManager: 'Deepa Venkat',
        branchManagerId: 'USR004',
        contactNumber: '+91 65432 10987',
        warehouseLinked: '',
        warehouseId: '',
        status: 'inactive',
        createdOn: '2026-01-05T11:45:00Z',
        vendorCount: 0,
        totalStock: 0,
        monthlyRevenue: 0,
    },
    {
        id: 'BR005',
        branchName: 'Anna Nagar',
        branchCode: 'AN001',
        supermarket: 'Crazy Supermarkets',
        addressLine1: '2nd Avenue, Anna Nagar',
        addressLine2: 'Block W',
        city: 'Anna Nagar',
        branchManager: 'Suresh Babu',
        branchManagerId: 'USR005',
        contactNumber: '+91 54321 09876',
        warehouseLinked: 'Warehouse D — Anna Nagar Hub',
        warehouseId: 'WH004',
        status: 'active',
        createdOn: '2025-11-20T16:30:00Z',
        vendorCount: 30,
        totalStock: 18200,
        monthlyRevenue: 2100000,
    },
];

// ── Mock registered users for Branch Manager dropdown ──
export const REGISTERED_USERS = [
    { id: 'USR001', name: 'Rajesh Kumar', email: 'rajesh@crazy.com', role: 'Branch Manager' },
    { id: 'USR002', name: 'Priya Sharma', email: 'priya@crazy.com', role: 'Branch Manager' },
    { id: 'USR003', name: 'Arjun Nair', email: 'arjun@crazy.com', role: 'Branch Manager' },
    { id: 'USR004', name: 'Deepa Venkat', email: 'deepa@crazy.com', role: 'Branch Manager' },
    { id: 'USR005', name: 'Suresh Babu', email: 'suresh@crazy.com', role: 'Branch Manager' },
    { id: 'USR006', name: 'Meena Ravi', email: 'meena@crazy.com', role: 'Branch Manager' },
    { id: 'USR007', name: 'Karthik Sundaram', email: 'karthik@crazy.com', role: 'Branch Manager' },
];

// ── Mock warehouses for linking dropdown ──
export const WAREHOUSES = [
    { id: 'WH001', name: 'Warehouse A — Pallikarnai Central' },
    { id: 'WH002', name: 'Warehouse B — Red Hills North' },
    { id: 'WH003', name: 'Warehouse C — Tambaram West' },
    { id: 'WH004', name: 'Warehouse D — Anna Nagar Hub' },
    { id: 'WH005', name: 'Warehouse E — Porur Depot' },
];

const TOAST_STYLE = { borderRadius: '12px', background: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: 'bold' };

const useBranchStore = create((set, get) => ({
    branches: [],
    loading: false,
    currentSupermarket: 'Crazy Supermarkets',

    fetchBranches: async () => {
        set({ loading: true });
        try {
            const res = await api.get('/branches');
            const data = Array.isArray(res) ? res : (res.data || []);
            set({ branches: data, loading: false });
        } catch (error) {
            // Fallback to mock data during development
            console.warn('API unavailable, using mock data:', error.message);
            set({ branches: MOCK_BRANCHES, loading: false });
        }
    },

    addBranch: async (branch) => {
        try {
            const newBranch = {
                ...branch,
                id: `BR${String(get().branches.length + 1).padStart(3, '0')}`,
                createdOn: new Date().toISOString(),
                vendorCount: 0,
                totalStock: 0,
                monthlyRevenue: 0,
            };
            const res = await api.post('/branches', newBranch);
            const data = res.data || res;
            set(state => ({ branches: [...state.branches, data] }));
            toast.success('Branch created successfully ✓', { style: TOAST_STYLE });
        } catch (error) {
            // Fallback: add locally
            const newBranch = {
                ...branch,
                id: `BR${String(get().branches.length + 1).padStart(3, '0')}`,
                createdOn: new Date().toISOString(),
                vendorCount: 0,
                totalStock: 0,
                monthlyRevenue: 0,
            };
            set(state => ({ branches: [...state.branches, newBranch] }));
            toast.success('Branch created (offline) ✓', { style: TOAST_STYLE });
        }
    },

    updateBranch: async (id, updates) => {
        try {
            const res = await api.put(`/branches/${id}`, updates);
            const data = res.data || res;
            set(state => ({
                branches: state.branches.map(b => b.id === id ? { ...b, ...data } : b)
            }));
            toast.success('Branch updated successfully ✓', { style: TOAST_STYLE });
        } catch (error) {
            // Fallback: update locally
            set(state => ({
                branches: state.branches.map(b => b.id === id ? { ...b, ...updates } : b)
            }));
            toast.success('Branch updated (offline) ✓', { style: TOAST_STYLE });
        }
    },

    deleteBranch: async (id) => {
        try {
            await api.delete(`/branches/${id}`);
            set(state => ({
                branches: state.branches.filter(b => b.id !== id)
            }));
            toast.success('Branch deleted', { icon: '🗑️', style: TOAST_STYLE });
        } catch (error) {
            set(state => ({
                branches: state.branches.filter(b => b.id !== id)
            }));
            toast.success('Branch deleted (offline)', { icon: '🗑️', style: TOAST_STYLE });
        }
    },

    toggleBranchStatus: async (id) => {
        const branch = get().branches.find(b => b.id === id);
        if (!branch) return;
        const newStatus = branch.status === 'active' ? 'inactive' : 'active';

        // Optimistic update
        set(state => ({
            branches: state.branches.map(b => b.id === id ? { ...b, status: newStatus } : b)
        }));

        try {
            await api.put(`/branches/${id}`, { status: newStatus });
            toast.success(`Branch ${newStatus === 'active' ? 'activated' : 'deactivated'} ✓`, { style: TOAST_STYLE });
        } catch (error) {
            toast.success(`Branch ${newStatus === 'active' ? 'activated' : 'deactivated'} (offline) ✓`, { style: TOAST_STYLE });
        }
    },

    getBranchById: (id) => get().branches.find(b => b.id === id),
}));

export default useBranchStore;
