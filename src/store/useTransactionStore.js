import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, STORES } from '../utils/db';

const useTransactionStore = create(
    persist(
        (set, get) => ({
            sales: [],
            purchases: [],
            returns: [],

            // Actions for Sales
            addSale: (sale) => set((state) => ({
                sales: [
                    {
                        ...sale,
                        id: sale.invoiceNo || `INV-${Date.now()}`,
                        createdAt: new Date().toISOString()
                    },
                    ...state.sales
                ]
            })),

            // Actions for Purchases
            addPurchase: (purchase) => set((state) => ({
                purchases: [
                    {
                        ...purchase,
                        id: purchase.purchaseNo || `PUR-${Date.now()}`,
                        createdAt: new Date().toISOString()
                    },
                    ...state.purchases
                ]
            })),

            // Actions for Returns
            addReturn: (ret) => set((state) => ({
                returns: [
                    {
                        ...ret,
                        id: ret.returnNo || `RET-${Date.now()}`,
                        createdAt: new Date().toISOString()
                    },
                    ...state.returns
                ]
            })),

            // Derived Data for Reports/Dashboard
            getTodayStats: () => {
                const today = new Date().toISOString().split('T')[0];
                const salesToday = get().sales.filter(s => s.createdAt.startsWith(today));
                const purchasesToday = get().purchases.filter(p => p.createdAt.startsWith(today));

                const totalSales = salesToday.reduce((sum, s) => sum + s.grandTotal, 0);
                const totalPurchases = purchasesToday.reduce((sum, p) => sum + p.totalAmount, 0);

                // Simplified profit calculation: (Sale Price - Purchase Price) for all items sold
                // This requires tracking original purchase price in sale items
                const estimatedProfit = salesToday.reduce((sum, s) => {
                    const saleProfit = s.items.reduce((pSum, item) => {
                        return pSum + ((item.price - (item.purchasePrice || 0)) * item.qty);
                    }, 0);
                    return sum + saleProfit;
                }, 0);

                return {
                    totalSales,
                    totalPurchases,
                    estimatedProfit
                };
            },

            getSalesTrend: () => {
                // Return last 7 days sales
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();

                return last7Days.map(date => {
                    const dailySales = get().sales
                        .filter(s => s.createdAt.startsWith(date))
                        .reduce((sum, s) => sum + s.grandTotal, 0);

                    const formattedDate = new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                    return { name: formattedDate, amount: dailySales };
                });
            }
        }),
        {
            name: 'transaction-storage',
            storage: createJSONStorage(() => zustandStorage(STORES.TRANSACTIONS))
        }
    )
);

export default useTransactionStore;
