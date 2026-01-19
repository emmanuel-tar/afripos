
import { Expense } from '../types';
import { db } from './offlineDb';

export const financeDb = {
    getExpenses: async (): Promise<Expense[]> => {
        return await db.expenses.toArray();
    },

    saveExpense: async (expense: Expense): Promise<void> => {
        await db.expenses.put(expense);
    },

    deleteExpense: async (id: string): Promise<void> => {
        await db.expenses.delete(id);
    }
};
