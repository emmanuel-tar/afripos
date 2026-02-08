import { create } from 'zustand';
import { Order, SyncStatus } from '../types';
import { saveOrder, getOrders } from '../services/db';
import { toast } from 'sonner';

interface SyncState {
    offlineQueue: Order[];
    isOnline: boolean;
    lastSyncTime: number | null;

    // Actions
    setIsOnline: (status: boolean) => void;
    queueOrder: (order: Order) => Promise<void>;
    syncQueue: () => Promise<void>;
    getQueueCount: () => number;
}

export const useSyncStore = create<SyncState>((set, get) => ({
    offlineQueue: [],
    isOnline: navigator.onLine,
    lastSyncTime: null,

    setIsOnline: (status) => {
        const wasOffline = !get().isOnline;
        set({ isOnline: status });

        if (status && wasOffline) {
            toast.info("Back online! Synchronizing orders...");
            get().syncQueue();
        }
    },

    queueOrder: async (order) => {
        const isOnline = get().isOnline;

        const orderWithSync = {
            ...order,
            syncStatus: isOnline ? 'SYNCED' as const : 'QUEUED' as const
        };

        await saveOrder(orderWithSync);

        if (!isOnline) {
            set(state => ({
                offlineQueue: [...state.offlineQueue, orderWithSync]
            }));
            toast.warning("Offline: Order queued for later sync");
        }
    },

    syncQueue: async () => {
        const queue = get().offlineQueue;
        if (queue.length === 0) return;

        set({ lastSyncTime: Date.now() });

        try {
            // Simulate API sync for each order
            for (const order of queue) {
                const syncedOrder = { ...order, syncStatus: 'SYNCED' as const };
                await saveOrder(syncedOrder);
            }

            set({ offlineQueue: [] });
            toast.success(`Successfully synced ${queue.length} orders`);
        } catch (error) {
            console.error("Sync failed:", error);
            toast.error("Failed to sync some orders. Will retry later.");
        }
    },

    getQueueCount: () => get().offlineQueue.length
}));

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => useSyncStore.getState().setIsOnline(true));
    window.addEventListener('offline', () => useSyncStore.getState().setIsOnline(false));
}
