import { db } from './offlineDb';
import { Reservation } from '../types';

export const reservationDb = {
    getReservations: async () => {
        return await db.reservations.toArray();
    },

    saveReservation: async (reservation: Reservation) => {
        return await db.reservations.put(reservation);
    },

    deleteReservation: async (id: string) => {
        return await db.reservations.delete(id);
    },

    getReservationsByDate: async (date: string) => {
        return await db.reservations.where('date').equals(date).toArray();
    }
};
