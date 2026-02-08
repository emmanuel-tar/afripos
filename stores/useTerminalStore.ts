import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Shift } from '../types';

interface TerminalState {
    terminalId: string | null;
    terminalName: string | null;
    isBound: boolean;
    activeShift: Shift | null;

    // Actions
    bindTerminal: (name: string) => void;
    resetTerminal: () => void;
    startShift: (userId: string, userName: string) => void;
    endShift: () => void;
}

export const useTerminalStore = create<TerminalState>()(
    persist(
        (set) => ({
            terminalId: null,
            terminalName: null,
            isBound: false,
            activeShift: null,

            bindTerminal: (name: string) => {
                const id = `TERM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                set({ terminalId: id, terminalName: name, isBound: true });
            },

            resetTerminal: () => set({ terminalId: null, terminalName: null, isBound: false, activeShift: null }),

            startShift: (userId: string, userName: string) => {
                const newShift: Shift = {
                    id: `SHIFT-${Date.now()}`,
                    userId,
                    userName,
                    startTime: Date.now(),
                    status: 'OPEN'
                };
                set({ activeShift: newShift });

                // In a real app, we'd log this shift event to the database here too
                console.log(`Shift started for ${userName} at terminal`);
            },

            endShift: () => {
                set((state) => {
                    if (!state.activeShift) return state;
                    return {
                        activeShift: null // Shift ended
                    };
                });
                console.log('Shift ended');
            }
        }),
        {
            name: 'afripos-terminal-storage',
            partialize: (state) => ({
                terminalId: state.terminalId,
                terminalName: state.terminalName,
                isBound: state.isBound,
                activeShift: state.activeShift
            }),
        }
    )
);
