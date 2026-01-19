
import { Shift, User } from '../types';

const SHIFTS_KEY = 'afripos_shifts';
const STAFF_KEY = 'afripos_staff';

export const hrDb = {
    getShifts: (): Shift[] => {
        const data = localStorage.getItem(SHIFTS_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveShift: (shift: Shift): void => {
        const shifts = hrDb.getShifts();
        const index = shifts.findIndex(s => s.id === shift.id);
        if (index >= 0) {
            shifts[index] = shift;
        } else {
            shifts.push(shift);
        }
        localStorage.setItem(SHIFTS_KEY, JSON.stringify(shifts));
    },

    getStaff: (): User[] => {
        const data = localStorage.getItem(STAFF_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveStaff: (staff: User[]): void => {
        localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
    }
};
