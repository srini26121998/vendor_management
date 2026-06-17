import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage, STORES } from '../utils/db';
import productService from '../api/productService';
import categoryService from '../api/categoryService';

const useMasterStore = create(
    persist(
        (set) => ({
            products: [],
            categories: [],
            suppliers: [],
            customers: [],
            isLoading: false,

            // Global setters
            setProducts: (products) => set({ products }),
            setCategories: (categories) => set({ categories }),
            setSuppliers: (suppliers) => set({ suppliers }),

            // Async Fetchers
            fetchProducts: async () => {
                set({ isLoading: true });
                try {
                    const response = await productService.getProducts();
                    const data = Array.isArray(response) ? response : (response?.data || []);

                    const mapped = data.map(p => ({
                        ...p,
                        sku: p.sku || `QUICK-${p.id?.toString().slice(-4) || '0000'}`,
                        stock: p.currentStock ?? p.stock ?? 0,
                        isActive: p.isActive ?? true,
                        sellingPrice: p.mrp ?? p.sellingPrice ?? 0,
                        gstRate: p.gstRate ?? 0
                    }));
                    set({ products: mapped, isLoading: false });
                } catch (error) {
                    console.error('Fetch products failed:', error);
                    set({ isLoading: false, products: [] });
                }
            },

            fetchCategories: async () => {
                set({ isLoading: true });
                try {
                    const response = await categoryService.getCategories();
                    // Handle both direct array and wrapped data
                    const categoriesData = Array.isArray(response) ? response : (response?.data || []);
                    console.log('Categories fetched:', categoriesData);
                    set({ categories: categoriesData, isLoading: false });
                } catch (error) {
                    console.error('Fetch categories failed:', error);
                    set({ isLoading: false, categories: [] });
                }
            },

            // Actions for Products
            addProduct: (product) => set((state) => ({
                products: [...state.products, { ...product, id: product.id || Date.now(), isActive: true }]
            })),
            updateProduct: (id, updatedProduct) => set((state) => ({
                products: state.products.map(p => p.id === id ? { ...p, ...updatedProduct } : p)
            })),
            updateStock: (id, change) => set((state) => ({
                products: state.products.map(p => p.id === id ? { ...p, stock: (p.stock || 0) + change } : p)
            })),
            deleteProduct: (id) => set((state) => ({
                products: state.products.filter(p => p.id !== id)
            })),

            // Actions for Categories
            addCategory: async (categoryData) => {
                set({ isLoading: true });
                try {
                    const newCategory = await categoryService.createCategory(categoryData);
                    set((state) => ({
                        categories: [...state.categories, newCategory],
                        isLoading: false
                    }));
                    return newCategory;
                } catch (error) {
                    console.error('Add category failed:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },
            updateCategory: async (id, categoryData) => {
                set({ isLoading: true });
                try {
                    const updatedCategory = await categoryService.updateCategory(id, categoryData);
                    set((state) => ({
                        categories: state.categories.map(c => c.id === id ? updatedCategory : c),
                        isLoading: false
                    }));
                    return updatedCategory;
                } catch (error) {
                    console.error('Update category failed:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },
            deleteCategory: async (id) => {
                set({ isLoading: true });
                try {
                    await categoryService.deleteCategory(id);
                    set((state) => ({
                        categories: state.categories.filter(c => c.id !== id),
                        isLoading: false
                    }));
                } catch (error) {
                    console.error('Delete category failed:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            // Actions for Suppliers
            addSupplier: (supplier) => set((state) => ({
                suppliers: [...state.suppliers, { ...supplier, id: Date.now() }]
            })),

            // Actions for Customers
            addCustomer: (customer) => set((state) => ({
                customers: [...state.customers, { ...customer, id: Date.now() }]
            })),
        }),
        {
            name: 'master-storage',
            storage: createJSONStorage(() => zustandStorage(STORES.MASTERS))
        }
    )
);

export default useMasterStore;
