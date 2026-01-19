
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

    fetchHRData: async () => {
        set({ isLoading: true });
        try {
            let staff = await hrDb.getStaff();
            if (staff.length === 0) {
                staff = DEFAULT_STAFF;
                await hrDb.saveStaff(staff);
            }
            const shifts = await hrDb.getShifts();
            set({ staff, shifts, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch HR data:', error);
            set({ isLoading: false });
        }
    },

    addStaff: async (user) => {
        const newStaff = [...get().staff, user];
        await hrDb.saveStaff(newStaff);
        set({ staff: newStaff });
    },

    updateStaff: async (user) => {
        const newStaff = get().staff.map(s => s.id === user.id ? user : s);
        await hrDb.saveStaff(newStaff);
        set({ staff: newStaff });
    },

    removeStaff: async (id) => {
        const newStaff = get().staff.filter(s => s.id !== id);
        await hrDb.saveStaff(newStaff);
        set({ staff: newStaff });
    },

    clockIn: async (userId, userName) => {
        const shift: Shift = {
            id: `shift-${Date.now()}`,
            userId,
            userName,
            startTime: Date.now(),
            status: 'OPEN'
        };
        await hrDb.saveShift(shift);
        set(state => ({ shifts: [...state.shifts, shift] }));
    },

    clockOut: async (shiftId) => {
        const shifts = get().shifts;
        const index = shifts.findIndex(s => s.id === shiftId);
        if (index >= 0) {
            const updatedShift = { ...shifts[index], endTime: Date.now(), status: 'CLOSED' as const };
            await hrDb.saveShift(updatedShift);
            set(state => ({
                shifts: state.shifts.map(s => s.id === shiftId ? updatedShift : s)
            }));
        }
    }
}));
