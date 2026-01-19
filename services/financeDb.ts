
import { Expense } from '../types';

const EXPENSES_KEY = 'afripos_expenses';

export const financeDb = {
    getExpenses: (): Expense[] => {
        const data = localStorage.getItem(EXPENSES_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveExpense: (expense: Expense): void => {
        const expenses = financeDb.getExpenses();
        const index = expenses.findIndex(e => e.id === expense.id);
        if (index >= 0) {
            expenses[index] = expense;
        } else {
            expenses.push(expense);
        }
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
    },

    deleteExpense: (id: string): void => {
        const expenses = financeDb.getExpenses();
        const filtered = expenses.filter(e => e.id !== id);
        localStorage.setItem(EXPENSES_KEY, JSON.stringify(filtered));
    }
};
