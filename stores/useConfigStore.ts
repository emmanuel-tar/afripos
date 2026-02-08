import { create } from 'zustand';
import { layoutDb } from '../services/layoutDb';
import { Floor, Room, Table } from '../types';

interface ConfigState {
    floors: Floor[];
    rooms: Room[];
    isLoading: boolean;

    // Actions: Fetching
    fetchLayout: () => Promise<void>;

    // Actions: Floors
    saveFloor: (floor: Floor) => Promise<void>;
    deleteFloor: (id: string) => Promise<void>;

    // Actions: Rooms
    saveRoom: (room: Room) => Promise<void>;
    deleteRoom: (id: string) => Promise<void>;

    // System Reset
    resetSystem: (scope: 'FULL' | 'CONFIG_ONLY') => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
    floors: [],
    rooms: [],
    isLoading: false,

    fetchLayout: async () => {
        set({ isLoading: true });
        try {
            const [floors, rooms] = await Promise.all([
                layoutDb.getFloors(),
                layoutDb.getRooms()
            ]);
            set({ floors, rooms, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch layout:', error);
            set({ isLoading: false });
        }
    },

    saveFloor: async (floor) => {
        await layoutDb.saveFloor(floor);
        await get().fetchLayout();
    },

    deleteFloor: async (id) => {
        await layoutDb.deleteFloor(id);
        await get().fetchLayout();
    },

    saveRoom: async (room) => {
        await layoutDb.saveRoom(room);
        await get().fetchLayout();
    },

    deleteRoom: async (id) => {
        await layoutDb.deleteRoom(id);
        await get().fetchLayout();
    },

    resetSystem: async (scope) => {
        set({ isLoading: true });
        try {
            if (scope === 'FULL') {
                await layoutDb.resetOperationalData();
                await layoutDb.resetConfigurationData();
            } else {
                await layoutDb.resetConfigurationData();
            }

            // Hard refresh or reload state
            await get().fetchLayout();
            set({ isLoading: false });

            // In a real app, we'd probably window.location.reload() 
            // to clear all in-memory stores (Zustand persist)
        } catch (error) {
            console.error('Reset failed:', error);
            set({ isLoading: false });
            throw error;
        }
    }
}));
