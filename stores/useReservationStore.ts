import { create } from 'zustand';
import { Reservation, ReservationStatus, Branch } from '../types';
import { reservationDb } from '../services/reservationDb';
import { useNotificationStore } from './useNotificationStore';

interface ReservationState {
    reservations: Reservation[];
    isLoading: boolean;

    // Actions
    fetchReservations: () => Promise<void>;
    addReservation: (reservation: Reservation, branch: Branch) => Promise<void>;
    updateReservationStatus: (id: string, status: ReservationStatus, branch: Branch) => Promise<void>;
    deleteReservation: (id: string) => Promise<void>;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
    reservations: [],
    isLoading: false,

    fetchReservations: async () => {
        set({ isLoading: true });
        try {
            const reservations = await reservationDb.getReservations();
            set({ reservations, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch reservations:', error);
            set({ isLoading: false });
        }
    },

    addReservation: async (reservation, branch) => {
        const newReservation: Reservation = {
            ...reservation,
            paymentStatus: reservation.totalDepositRequired > 0 ? 'UNPAID' : 'FULLY_PAID',
            depositPaid: 0,
            paymentDeadline: reservation.totalDepositRequired > 0 ? Date.now() + (2 * 60 * 60 * 1000) : undefined // 2 hours deadline
        };
        await reservationDb.saveReservation(newReservation);
        set(state => ({ reservations: [newReservation, ...state.reservations] }));

        // Trigger Notification
        if (reservation.sendConfirmation) {
            const notificationStore = useNotificationStore.getState();
            await notificationStore.sendNotification('RESERVATION_CREATED', reservation, branch);
        }
    },

    updateReservationStatus: async (id, status, branch) => {
        const reservations = get().reservations;
        const index = reservations.findIndex(r => r.id === id);
        if (index >= 0) {
            const updated = { ...reservations[index], status };
            await reservationDb.saveReservation(updated);
            set(state => ({
                reservations: state.reservations.map(r => r.id === id ? updated : r)
            }));

            // Map Status to Notification Event
            const statusEventMap: Record<ReservationStatus, any> = {
                'CONFIRMED': 'RESERVATION_CONFIRMED',
                'SEATED': 'RESERVATION_SEATED',
                'CANCELLED': 'RESERVATION_CANCELLED',
                'NO_SHOW': 'NO_SHOW',
                'PENDING': null,
                'PAYMENT_EXPIRED': 'RESERVATION_CANCELLED' // Assume cancel on expiration for notifications
            };

            const event = statusEventMap[status];
            if (event) {
                const notificationStore = useNotificationStore.getState();
                await notificationStore.sendNotification(event, updated, branch);
            }
        }
    },

    deleteReservation: async (id) => {
        await reservationDb.deleteReservation(id);
        set(state => ({
            reservations: state.reservations.filter(r => r.id !== id)
        }));
    }
}));
