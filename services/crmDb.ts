
import { Customer } from '../types';
import { db } from './offlineDb';

export const crmDb = {
    getCustomers: async (): Promise<Customer[]> => {
        return await db.customers.toArray();
    },

    saveCustomer: async (customer: Customer): Promise<void> => {
        await db.customers.put(customer);
    },

    deleteCustomer: async (id: string): Promise<void> => {
        await db.customers.delete(id);
    }
};
