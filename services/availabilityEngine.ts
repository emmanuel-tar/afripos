import { Table, Reservation } from '../types';

export interface AvailabilityResult {
    isAvailable: boolean;
    reason?: string;
    suggestedTable?: Table;
}

/**
 * AvailabilityEngine handles the logic for checking if a table or room is available
 * for a specific date, time, and party size.
 */
export const AvailabilityEngine = {
    /**
     * Finds available tables for a given criteria
     */
    findAvailableTables: (
        tables: Table[],
        reservations: Reservation[],
        date: string, // YYYY-MM-DD
        time: string, // HH:mm
        partySize: number,
        locationId: string
    ): Table[] => {
        // 1. Filter tables by branch and capacity
        const eligibleTables = tables.filter(t =>
            t.isActive &&
            t.locationId === locationId &&
            t.capacity >= partySize
        );

        // 2. Define a buffer window (e.g., 2 hours per reservation)
        const bufferMinutes = 120;
        const requestedDateTime = new Date(`${date}T${time}`).getTime();

        // 3. Filter out tables that have overlapping reservations
        return eligibleTables.filter(table => {
            const tableReservations = reservations.filter(r =>
                r.tableId === table.id &&
                r.date === date &&
                r.status !== 'CANCELLED'
            );

            const hasOverlap = tableReservations.some(res => {
                const resDateTime = new Date(`${res.date}T${res.time}`).getTime();
                const diffMinutes = Math.abs(requestedDateTime - resDateTime) / (1000 * 60);
                return diffMinutes < bufferMinutes;
            });

            return !hasOverlap;
        });
    },

    /**
     * Checks if a specific table is available
     */
    checkTableAvailability: (
        tableId: string,
        reservations: Reservation[],
        date: string,
        time: string,
        bufferMinutes = 120
    ): boolean => {
        const requestedDateTime = new Date(`${date}T${time}`).getTime();

        const tableReservations = reservations.filter(r =>
            r.tableId === tableId &&
            r.date === date &&
            r.status !== 'CANCELLED'
        );

        return !tableReservations.some(res => {
            const resDateTime = new Date(`${res.date}T${res.time}`).getTime();
            const diffMinutes = Math.abs(requestedDateTime - resDateTime) / (1000 * 60);
            return diffMinutes < bufferMinutes;
        });
    }
};
