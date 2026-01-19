
import { create } from 'zustand';
import { Expense } from '../types';
import { financeDb } from '../services/financeDb';

interface FinanceState {
    expenses: Expense[];
    isLoading: boolean;
    fetchExpenses: () => void;
    addExpense: (expense: Expense) => void;
    updateExpense: (expense: Expense) => void;
    removeExpense: (id: string) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
    expenses: [],
    isLoading: false,

    fetchExpenses: () => {
        set({ isLoading: true });
        try {
            const expenses = financeDb.getExpenses();
            set({ expenses, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
            set({ isLoading: false });
        }
    },

    addExpense: (expense) => {
        financeDb.saveExpense(expense);
        set((state) => ({ expenses: [...state.expenses, expense] }));
    },

    updateExpense: (expense) => {
        financeDb.saveExpense(expense);
        set((state) => ({
            expenses: state.expenses.map((e) => (e.id === expense.id ? expense : e)),
        }));
    },

    removeExpense: (id) => {
        financeDb.deleteExpense(id);
        set((state) => ({
            expenses: state.expenses.filter((e) => e.id !== id),
        }));
    },
}));
