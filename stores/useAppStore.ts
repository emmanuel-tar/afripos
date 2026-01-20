import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppView, User, Branch, TerminalConfig } from '../types';
import { DEFAULT_BRANCHES } from '../constants';

interface AppState {
    view: AppView;
    viewParams: any;
    user: User | null;
    currentBranch: Branch | null;
    terminalConfig: TerminalConfig | null;
    isOnline: boolean;
    error: string | null;

    // Actions
    setView: (view: AppView, params?: any) => void;
    setUser: (user: User | null) => void;
    setBranch: (branch: Branch) => void;
    setTerminalConfig: (config: TerminalConfig | null) => void;
    setIsOnline: (isOnline: boolean) => void;
    setError: (error: string | null) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            view: AppView.LOGIN_ID,
            viewParams: {},
            user: null,
            currentBranch: DEFAULT_BRANCHES[0],
            terminalConfig: null,
            isOnline: navigator.onLine,
            error: null,

            setView: (view, params = {}) => set({ view, viewParams: params }),
            setUser: (user) => set({ user }),
            setBranch: (currentBranch) => set({ currentBranch }),
            setTerminalConfig: (terminalConfig) => set({ terminalConfig }),
            setIsOnline: (isOnline) => set({ isOnline }),
            setError: (error) => set({ error }),
            logout: () => set({ user: null, view: AppView.LOGIN_ID, viewParams: {} })
        }),
        {
            name: 'afripos-app-storage',
            partialize: (state) => ({
                user: state.user,
                currentBranch: state.currentBranch,
                terminalConfig: state.terminalConfig
            }), // Only persist user and branch and terminal config
        }
    )
);
