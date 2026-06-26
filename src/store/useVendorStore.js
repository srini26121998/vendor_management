import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, STORES } from '../utils/db';
import {
  fetchVendors,
  fetchVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  blockVendor,
  unblockVendor,
} from '../api/vendorService';
import { adaptVendor, adaptVendorList, adaptToRequestDTO } from '../api/vendorAdapter';

const useVendorStore = create(
  persist(
    (set, get) => ({
      vendors:   [],
      isLoading: false,
      error:     null,
      _hasHydrated: false,

      // ─── Read: fetch all vendors from backend ────────────────────────────────
      loadVendors: async (params = {}) => {
        // Prevent duplicate calls if already loading
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const data = await fetchVendors(params);
          // axios interceptor returns response.data directly
          const adapted = adaptVendorList(Array.isArray(data) ? data : []);
          set({ vendors: adapted, isLoading: false });
          return adapted;
        } catch (err) {
          const msg = err?.response?.data?.message || err?.message || 'Failed to load vendors';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      // ─── Read: fetch a single vendor (returns adapted object) ────────────────
      loadVendorById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const data = await fetchVendorById(id);
          const adapted = adaptVendor(data);
          // Update or insert into the list in store
          set((state) => {
            const exists = state.vendors.find(v => v.id === id);
            const updatedList = exists
              ? state.vendors.map(v => v.id === id ? adapted : v)
              : [adapted, ...state.vendors];
            return { vendors: updatedList, isLoading: false };
          });
          return adapted;
        } catch (err) {
          const msg = err?.response?.data?.message || err?.message || 'Failed to load vendor';
          set({ isLoading: false, error: msg });
          throw err;
        }
      },

      // ─── Create: POST /api/vendors ───────────────────────────────────────────
      addVendor: async (formData, userId = null) => {
        const dto = adaptToRequestDTO(formData);
        const data = await createVendor(dto, userId);
        const adapted = adaptVendor(data);
        set((state) => ({ vendors: [adapted, ...state.vendors] }));
        return adapted;
      },

      // ─── Update: PUT /api/vendors/{id} ───────────────────────────────────────
      saveVendor: async (id, formData) => {
        const dto = adaptToRequestDTO(formData);
        const data = await updateVendor(id, dto);
        const adapted = adaptVendor(data);
        set((state) => ({
          vendors: state.vendors.map(v => v.id === id ? adapted : v),
        }));
        return adapted;
      },

      // ─── Delete: DELETE /api/vendors/{id} ───────────────────────────────────
      removeVendor: async (id) => {
        await deleteVendor(id);
        set((state) => ({ vendors: state.vendors.filter(v => v.id !== id) }));
      },

      // ─── Block: PATCH /api/vendors/{id}/block ────────────────────────────────
      blockVendorApi: async (id, reason) => {
        const data = await blockVendor(id, reason);
        const adapted = adaptVendor(data);
        set((state) => ({
          vendors: state.vendors.map(v => v.id === id ? adapted : v),
        }));
        return adapted;
      },

      // ─── Block multiple vendors (sequential API calls) ───────────────────────
      blockVendorsApi: async (ids, reason) => {
        const results = await Promise.allSettled(
          ids.map(id => blockVendor(id, reason))
        );
        // Batch all successful updates into a SINGLE set() call
        const updates = new Map();
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            updates.set(ids[idx], adaptVendor(result.value));
          }
        });
        if (updates.size > 0) {
          set((state) => ({
            vendors: state.vendors.map(v => updates.get(v.id) || v),
          }));
        }
        const failed = results.filter(r => r.status === 'rejected').length;
        return { success: ids.length - failed, failed };
      },

      // ─── Unblock: PATCH /api/vendors/{id}/unblock ───────────────────────────
      unblockVendorApi: async (id) => {
        const data = await unblockVendor(id);
        const adapted = adaptVendor(data);
        set((state) => ({
          vendors: state.vendors.map(v => v.id === id ? adapted : v),
        }));
        return adapted;
      },

      // ─── Approve All (direct activate using unblock shortcut) ────────────────
      approveVendorsApi: async (ids) => {
        const results = await Promise.allSettled(
          ids.map(id => unblockVendor(id))
        );
        // Batch all successful updates into a SINGLE set() call
        const updates = new Map();
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            updates.set(ids[idx], adaptVendor(result.value));
          }
        });
        if (updates.size > 0) {
          set((state) => ({
            vendors: state.vendors.map(v => updates.get(v.id) || v),
          }));
        }
        const failed = results.filter(r => r.status === 'rejected').length;
        return { success: ids.length - failed, failed };
      },


      // ─── Local-only update (for optimistic updates / mock compatibility) ────
      updateVendorLocal: (id, updatedData) => set((state) => ({
        vendors: state.vendors.map(v =>
          v.id === id ? { ...v, ...updatedData, lastUpdated: new Date().toISOString().split('T')[0] } : v
        ),
      })),

      // ─── Legacy mock compatibility (kept for other pages that haven't migrated yet) ─
      blockVendors: (ids, reason) => set((state) => ({
        vendors: state.vendors.map(v =>
          ids.includes(v.id) ? { ...v, status: 'blocked', kycStatus: 'BLOCKED', blockReason: reason } : v
        ),
      })),

      assignManager: (ids, managerId) => set((state) => ({
        vendors: state.vendors.map(v => ids.includes(v.id) ? { ...v, managerId } : v),
      })),

      setVendors: (vendors) => set({ vendors }),
      setLoading: (isLoading) => set({ isLoading }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'vendor-registry-storage',
      storage: createJSONStorage(() => zustandStorage(STORES.MASTERS)),
      // Only persist the vendors list — not loading/error state
      partialize: (state) => ({ vendors: state.vendors }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);

export default useVendorStore;
