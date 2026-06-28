import { create } from 'zustand';
import api from '../api/axios';
import toast from 'react-hot-toast';

// "??"?"? Mock data removed "??"?"?

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
            console.error('Failed to fetch branches:', error.message);
            set({ loading: false });
        }
    },

    addBranch: async (branch) => {
        try {
            const res = await api.post('/branches', branch);
            const data = res.data || res;
            set(state => ({ branches: [...state.branches, data] }));
            toast.success('Branch created successfully ✓', { style: TOAST_STYLE });
        } catch (error) {
            toast.error('Failed to create branch', { style: TOAST_STYLE });
            console.error('Create branch failed', error);
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
            toast.error('Failed to update branch', { style: TOAST_STYLE });
            console.error('Update branch failed', error);
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
            toast.error('Failed to delete branch', { style: TOAST_STYLE });
            console.error('Delete branch failed', error);
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
            // Revert on fail
            toast.error('Failed to update status', { style: TOAST_STYLE });
            get().fetchBranches();
        }
    },

    getBranchById: (id) => get().branches.find(b => b.id === id),
}));

export default useBranchStore;
