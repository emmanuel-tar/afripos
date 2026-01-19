
import { Customer } from '../types';

const CUSTOMERS_KEY = 'afripos_customers';

export const crmDb = {
    getCustomers: (): Customer[] => {
        const data = localStorage.getItem(CUSTOMERS_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveCustomer: (customer: Customer): void => {
        const customers = crmDb.getCustomers();
        const index = customers.findIndex(c => c.id === customer.id);
        if (index >= 0) {
            customers[index] = customer;
        } else {
            customers.push(customer);
        }
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    },

    deleteCustomer: (id: string): void => {
        const customers = crmDb.getCustomers();
        const filtered = customers.filter(c => c.id !== id);
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(filtered));
    }
};
