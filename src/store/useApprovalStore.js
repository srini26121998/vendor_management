import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, STORES } from '../utils/db';

const useApprovalStore = create(
    persist(
        (set, get) => ({
            delegations: [],
            approvalHistory: [],

            // Actions
            addDelegation: (delegation) => set((state) => ({
                delegations: [...state.delegations, { ...delegation, id: Date.now(), active: true }]
            })),

            removeDelegation: (id) => set((state) => ({
                delegations: state.delegations.filter(d => d.id !== id)
            })),

            addHistory: (entry) => set((state) => ({
                approvalHistory: [{ ...entry, timestamp: new Date().toISOString() }, ...state.approvalHistory]
            })),

            getActiveDelegations: () => {
                const now = new Date();
                return get().delegations.filter(d => d.active && new Date(d.startDate) <= now && new Date(d.endDate) >= now);
            }
        }),
        {
            name: 'approval-governance-storage',
            storage: createJSONStorage(() => zustandStorage(STORES.MASTERS))
        }
    )
);

export default useApprovalStore;
