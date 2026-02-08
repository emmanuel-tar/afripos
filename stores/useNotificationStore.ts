import { create } from 'zustand';
import { Order } from '../types';

interface NotificationState {
    readyOrderIds: string[];
    isAlarmActive: boolean;
    pendingPairingRequests: string[]; // Device IDs awaiting approval

    // Actions
    setReadyOrders: (orders: Order[]) => void;
    acknowledgeOrder: (orderId: string) => void;
    setPendingPairingRequests: (deviceIds: string[]) => void;
    acknowledgePairingRequest: (deviceId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    readyOrderIds: [],
    isAlarmActive: false,
    pendingPairingRequests: [],

    setReadyOrders: (orders: Order[]) => {
        const ids = orders.map(o => o.id);
        set({
            readyOrderIds: ids,
            isAlarmActive: ids.length > 0
        });
    },

    acknowledgeOrder: (orderId: string) => {
        set((state) => {
            const newIds = state.readyOrderIds.filter(id => id !== orderId);
            return {
                readyOrderIds: newIds,
                isAlarmActive: newIds.length > 0
            };
        });
    },

    setPendingPairingRequests: (deviceIds: string[]) => {
        set({ pendingPairingRequests: deviceIds });
    },

    acknowledgePairingRequest: (deviceId: string) => {
        set((state) => ({
            pendingPairingRequests: state.pendingPairingRequests.filter(id => id !== deviceId)
        }));
    }
}));
