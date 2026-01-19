
import { Shift, User } from '../types';
import { db } from './offlineDb';

export const hrDb = {
    getShifts: async (): Promise<Shift[]> => {
        return await db.shifts.toArray();
    },

    saveShift: async (shift: Shift): Promise<void> => {
        await db.shifts.put(shift);
    },

    getStaff: async (): Promise<User[]> => {
        return await db.staff.toArray();
    },

    saveStaff: async (staff: User[]): Promise<void> => {
        await db.staff.clear();
        await db.staff.bulkPut(staff);
    }
};
