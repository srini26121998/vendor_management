import { create } from 'zustand';


const useNotificationStore = create((set, get) => ({
    notifications: [],
    
    // Derived state for unread count
    getUnreadCount: () => {
        return get().notifications.filter(n => !n.read).length;
    },

    addNotification: (notification) => set((state) => ({
        notifications: [
            {
                id: Date.now(),
                time: 'Just now',
                read: false,
                ...notification
            },
            ...state.notifications
        ]
    })),

    markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
        )
    })),

    markAllRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
    })),

    dismiss: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),

    clearRead: () => set((state) => ({
        notifications: state.notifications.filter(n => !n.read)
    })),
}));

export default useNotificationStore;
