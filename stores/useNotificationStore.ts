import { create } from 'zustand';
import { Order } from '../types';

interface NotificationState {
    readyOrderIds: string[];
    isAlarmActive: boolean;

    // Actions
    setReadyOrders: (orders: Order[]) => void;
    acknowledgeOrder: (orderId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    readyOrderIds: [],
    isAlarmActive: false,

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
    }
}));
