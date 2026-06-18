import { create } from 'zustand';

const useLoadingStore = create((set) => ({
    loadingCount: 0,
    isLoading: false,
    showLoader: () => set((state) => {
        const count = state.loadingCount + 1;
        return { loadingCount: count, isLoading: count > 0 };
    }),
    hideLoader: () => set((state) => {
        const count = Math.max(0, state.loadingCount - 1);
        return { loadingCount: count, isLoading: count > 0 };
    }),
    resetLoader: () => set({ loadingCount: 0, isLoading: false })
}));

export default useLoadingStore;
