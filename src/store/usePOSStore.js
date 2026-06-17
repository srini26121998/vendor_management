import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import salesService from '../api/salesService';
import useMasterStore from './useMasterStore';
import { zustandStorage, STORES } from '../utils/db';

const usePOSStore = create(
    persist(
        (set, get) => ({
            // ── Cart state ─────────────────────────────────────────────────────────
            cart: [],
            fixedDiscount: 0, // flat discount on entire bill

            addToCart: (product) => {
                const { cart } = get();
                // Use robust ID comparison (string conversion) to prevent duplicate rows for same ID
                const existing = cart.find((i) => String(i.id) === String(product.id));
                if (existing) {
                    set({
                        cart: cart.map((i) =>
                            String(i.id) === String(product.id) ? { ...i, qty: i.qty + 1 } : i
                        ),
                    });
                } else {
                    set({
                        cart: [
                            ...cart,
                            {
                                id: product.id,
                                name: product.name,
                                sku: product.sku || product.barcode || '',
                                price: product.sellingPrice ?? product.selling_price ?? product.price ?? 0,
                                gstRate: product.gstRate ?? product.gst_rate ?? 18,
                                image: product.image || null,
                                qty: 1,
                                discount: 0, // percent
                            },
                        ],
                    });
                }
            },

            removeFromCart: (id) =>
                set({ cart: get().cart.filter((i) => String(i.id) !== String(id)) }),

            updateQty: (id, qty) => {
                const n = parseInt(qty, 10);
                // We allow 0 so the user can clear the input in the UI
                const finalQty = isNaN(n) ? 0 : Math.max(0, n);
                set({ cart: get().cart.map((i) => (String(i.id) === String(id) ? { ...i, qty: finalQty } : i)) });
            },

            updateDiscount: (id, discount) => {
                const d = Math.min(Math.max(parseFloat(discount) || 0, 0), 100);
                set({
                    cart: get().cart.map((i) => (String(i.id) === String(id) ? { ...i, discount: d } : i)),
                });
            },

            updatePrice: (id, price) => {
                const p = Math.max(parseFloat(price) || 0, 0);
                set({
                    cart: get().cart.map((i) => (String(i.id) === String(id) ? { ...i, price: p } : i)),
                });
            },

            setFixedDiscount: (amount) => {
                set({ fixedDiscount: Math.max(parseFloat(amount) || 0, 0) });
            },

            clearCart: () => set({ cart: [], fixedDiscount: 0 }),

            // ── Totals (derived) ───────────────────────────────────────────────────
            getSubtotal: () =>
                get().cart.reduce((sum, i) => sum + i.price * i.qty, 0),

            getDiscountTotal: () => {
                const itemDiscounts = get().cart.reduce(
                    (sum, i) => sum + (i.price * i.qty * i.discount) / 100,
                    0
                );
                return itemDiscounts + get().fixedDiscount;
            },

            getGSTTotal: () =>
                get().cart.reduce((sum, i) => {
                    const lineSubtotal = i.price * i.qty;
                    const itemDiscount = (lineSubtotal * i.discount) / 100;

                    const taxable = lineSubtotal - itemDiscount;
                    return sum + (taxable * i.gstRate) / 100;
                }, 0),

            getGrandTotal: () => {
                const subtotal = get().getSubtotal();
                const itemDiscounts = get().cart.reduce(
                    (sum, i) => sum + (i.price * i.qty * i.discount) / 100,
                    0
                );
                const gstTotal = get().getGSTTotal();
                const fixedDisc = get().fixedDiscount;

                return Math.max(0, subtotal - itemDiscounts + gstTotal - fixedDisc);
            },

            // ── Held bills ────────────────────────────────────────────────────────
            heldBills: [],
            isLoadingHeld: false,

            fetchHeldBills: async () => {
                set({ isLoadingHeld: true });
                try {
                    const data = await salesService.getHeldSales();
                    const allProducts = useMasterStore.getState().products;

                    // Transform backend DTO to frontend format
                    const transformed = data.map(bill => {
                        let billCart = [];
                        try {
                            billCart = typeof bill.itemsJson === 'string'
                                ? JSON.parse(bill.itemsJson)
                                : (bill.itemsJson || []);
                        } catch (e) {
                            console.error('Failed to parse itemsJson', e);
                        }

                        // Map and Hydrate items
                        const hydratedCart = billCart.map(item => {
                            // Map backend keys to frontend keys if necessary
                            const id = item.id || item.productId;
                            const qty = item.qty ?? item.quantity ?? 1;
                            const price = item.price ?? item.mrp ?? 0;
                            const discount = item.discount ?? item.discountPct ?? 0;

                            // Lookup in master product list for missing info (name, gstRate, etc)
                            const master = allProducts.find(p => p.id === id);

                            return {
                                id,
                                qty,
                                price,
                                discount,
                                name: item.name || master?.name || 'Unknown Product',
                                sku: item.sku || master?.sku || master?.barcode || '',
                                gstRate: item.gstRate ?? master?.gstRate ?? 18,
                                image: item.image || master?.image || null
                            };
                        });

                        return {
                            holdId: bill.id,
                            label: bill.label,
                            cart: hydratedCart,
                            amount: bill.amount,
                            heldAt: new Date(bill.createdAt).toLocaleTimeString(),
                            createdAt: bill.createdAt
                        };
                    });

                    set({ heldBills: transformed, isLoadingHeld: false });
                } catch (error) {
                    console.error('Failed to fetch held bills:', error);
                    set({ isLoadingHeld: false });
                }
            },

            holdBill: async (label, userId) => {
                const { cart, getGrandTotal } = get();
                if (!cart.length) return null;

                // Map items to backend-expected format (productId, quantity, mrp, discountPct)
                const backendItems = cart.map(i => ({
                    productId: i.id,
                    quantity: i.qty,
                    mrp: i.price,
                    discountPct: i.discount
                }));

                const holdData = {
                    label: label || `Hold ${new Date().toLocaleTimeString()}`,
                    itemsJson: JSON.stringify(backendItems),
                    amount: getGrandTotal(),
                    userId: userId || null
                };

                try {
                    await salesService.holdSale(holdData);
                    set({ cart: [], fixedDiscount: 0 });
                    await get().fetchHeldBills(); // Refresh list
                    return true;
                } catch (error) {
                    console.error('Failed to hold bill:', error);
                    return false;
                }
            },

            recallBill: async (holdId) => {
                const { heldBills } = get();
                const bill = heldBills.find((b) => b.holdId === holdId);
                if (!bill) return;

                // Set cart and clear hold from backend
                set({
                    cart: bill.cart,
                    heldBills: heldBills.filter((b) => b.holdId !== holdId),
                });

                try {
                    await salesService.deleteHeldSale(holdId);
                } catch (error) {
                    console.error('Failed to delete held bill after recall:', error);
                }
            },

            deleteHeldBill: async (holdId) => {
                try {
                    await salesService.deleteHeldSale(holdId);
                    set({ heldBills: get().heldBills.filter((b) => b.holdId !== holdId) });
                } catch (error) {
                    console.error('Failed to delete held bill:', error);
                }
            },

            clearAllHeldBills: async () => {
                try {
                    await salesService.deleteAllHeldSales();
                    set({ heldBills: [] });
                } catch (error) {
                    console.error('Failed to clear all held bills:', error);
                }
            },
        }),
        {
            name: 'pos-storage',
            storage: createJSONStorage(() => zustandStorage(STORES.POS_STATE)),
            partialize: (state) => ({
                cart: state.cart,
                fixedDiscount: state.fixedDiscount,
                heldBills: state.heldBills
            })
        }
    )
);

export default usePOSStore;
