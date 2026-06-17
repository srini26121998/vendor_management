import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, STORES } from '../utils/db';
import salesService from '../api/salesService';

const useSyncStore = create(
    persist(
        (set, get) => ({
            isOnline: navigator.onLine,
            isSyncing: false,
            lastSyncedAt: null,
            pendingSales: [], // Sales created while offline
            syncError: null,
            retryCount: 0,

            setOnline: (status) => {
                set({ isOnline: status });
                // We no longer trigger sync here to avoid duplication with UI-triggered sync (toasts)
            },

            addPendingSale: (sale) => set((state) => ({
                pendingSales: [...state.pendingSales, sale]
            })),

            clearPendingSales: () => set({ pendingSales: [], syncError: null, retryCount: 0 }),

            syncData: async (addSaleCallback) => {
                const { isSyncing, isOnline, pendingSales, retryCount } = get();

                // Guard to prevent multiple simultaneous syncs
                if (isSyncing || !isOnline || pendingSales.length === 0) {
                    return { success: true, skipped: true };
                }

                set({ isSyncing: true, syncError: null });

                try {
                    console.log(`Syncing ${pendingSales.length} pending sales to server...`);

                    let syncedCount = 0;
                    const failedSales = [];

                    // Process sales one by one to ensure integrity
                    for (const sale of pendingSales) {
                        try {
                            // IMPROVED MAPPING:
                            // Check if items have the offline format (qty/price) vs backend format (quantity/mrp)
                            const mappedItems = sale.items.map(i => ({
                                productId: i.productId || i.id,
                                quantity: i.quantity ?? i.qty ?? 1,
                                mrp: i.mrp ?? i.price ?? 0,
                                discountPct: i.discountPct ?? i.discount ?? 0
                            }));

                            const payload = {
                                customerName: sale.customerName || "Walk-in Customer",
                                customerPhone: sale.customerPhone || "",
                                customerGstin: sale.customerGstin || "",
                                invoiceDate: sale.invoiceDate || new Date().toISOString().split('T')[0],
                                paymentMode: (sale.paymentMode || sale.payment?.method || 'CASH').toUpperCase(),
                                status: "COMPLETED",
                                items: mappedItems
                            };

                            const response = await salesService.createSale(payload);

                            // If successful, add to local transaction store to prevent data loss in UI
                            if (addSaleCallback) {
                                addSaleCallback({
                                    ...response,
                                    grandTotal: sale.grandTotal || 0,
                                    payment: sale.payment || { method: payload.paymentMode }
                                });
                            }
                            syncedCount++;
                        } catch (err) {
                            console.error('Failed to sync individual sale:', err);
                            failedSales.push(sale);
                        }
                    }

                    // Atomic update of state after the loop
                    set({
                        isSyncing: false,
                        lastSyncedAt: new Date().toISOString(),
                        pendingSales: failedSales,
                        retryCount: failedSales.length > 0 ? retryCount + 1 : 0,
                        syncError: failedSales.length > 0 ? `Failed to sync ${failedSales.length} records` : null
                    });

                    // Trigger global refresh events only if something actually synced
                    if (syncedCount > 0) {
                        try {
                            window.dispatchEvent(new window.CustomEvent('data-synchronized'));
                        } catch (e) {
                            console.warn('CustomEvent failed, falling back to simple Event:', e);
                            window.dispatchEvent(new Event('data-synchronized'));
                        }
                    }

                    return {
                        success: failedSales.length === 0,
                        synced: syncedCount,
                        failed: failedSales.length
                    };
                } catch (error) {
                    console.error('Sync process failed:', error);

                    set({
                        isSyncing: false,
                        syncError: error.message,
                        retryCount: retryCount + 1
                    });

                    return { success: false, error: error.message };
                }
            }
        }),
        {
            name: 'sync-storage',
            storage: createJSONStorage(() => zustandStorage(STORES.PENDING_SALES)),
            partialize: (state) => ({
                pendingSales: state.pendingSales,
                lastSyncedAt: state.lastSyncedAt
            })
        }
    )
);

// Initialize network listener
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => useSyncStore.getState().setOnline(true));
    window.addEventListener('offline', () => useSyncStore.getState().setOnline(false));
}

export default useSyncStore;
