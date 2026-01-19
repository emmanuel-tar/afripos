
import { create } from 'zustand';
import { Shift, User } from '../types';
import { hrDb } from '../services/hrDb';
import { DEFAULT_STAFF } from '../constants';

interface HRState {
    staff: User[];
    shifts: Shift[];
    isLoading: boolean;
    fetchHRData: () => void;
    updateStaff: (user: User) => void;
    addStaff: (user: User) => void;
    removeStaff: (id: string) => void;
    clockIn: (userId: string, userName: string) => void;
    clockOut: (shiftId: string) => void;
}

export const useHRStore = create<HRState>((set, get) => ({
    staff: [],
    shifts: [],
    isLoading: false,

    fetchHRData: () => {
        set({ isLoading: true });
        try {
            let staff = hrDb.getStaff();
            if (staff.length === 0) {
                staff = DEFAULT_STAFF;
                hrDb.saveStaff(staff);
            }
            const shifts = hrDb.getShifts();
            set({ staff, shifts, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch HR data:', error);
            set({ isLoading: false });
        }
    },

    addStaff: (user) => {
        const newStaff = [...get().staff, user];
        hrDb.saveStaff(newStaff);
        set({ staff: newStaff });
    },

    updateStaff: (user) => {
        const newStaff = get().staff.map(s => s.id === user.id ? user : s);
        hrDb.saveStaff(newStaff);
        set({ staff: newStaff });
    },

    removeStaff: (id) => {
        const newStaff = get().staff.filter(s => s.id !== id);
        hrDb.saveStaff(newStaff);
        set({ staff: newStaff });
    },

    clockIn: (userId, userName) => {
        const shift: Shift = {
            id: `shift-${Date.now()}`,
            userId,
            userName,
            startTime: Date.now(),
            status: 'OPEN'
        };
        hrDb.saveShift(shift);
        set(state => ({ shifts: [...state.shifts, shift] }));
    },

    clockOut: (shiftId) => {
        const shifts = get().shifts;
        const index = shifts.findIndex(s => s.id === shiftId);
        if (index >= 0) {
            const updatedShift = { ...shifts[index], endTime: Date.now(), status: 'CLOSED' as const };
            hrDb.saveShift(updatedShift);
            set(state => ({
                shifts: state.shifts.map(s => s.id === shiftId ? updatedShift : s)
            }));
        }
    }
}));
