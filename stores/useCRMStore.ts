
import { create } from 'zustand';
import { Customer, Product } from '../types';
import { crmDb } from '../services/crmDb';

interface CRMState {
    customers: Customer[];
    isLoading: boolean;
    fetchCustomers: () => void;
    addCustomer: (customer: Customer) => void;
    updateCustomer: (customer: Customer) => void;
    removeCustomer: (id: string) => void;
    awardPoints: (customerId: string, points: number) => void;
    updateBalance: (customerId: string, amount: number) => void;
}

export const useCRMStore = create<CRMState>((set, get) => ({
    customers: [],
    isLoading: false,

    fetchCustomers: () => {
        set({ isLoading: true });
        try {
            const customers = crmDb.getCustomers();
            set({ customers, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch customers:', error);
            set({ isLoading: false });
        }
    },

    addCustomer: (customer) => {
        crmDb.saveCustomer(customer);
        set(state => ({ customers: [...state.customers, customer] }));
    },

    updateCustomer: (customer) => {
        crmDb.saveCustomer(customer);
        set(state => ({
            customers: state.customers.map(c => c.id === customer.id ? customer : c)
        }));
    },

    removeCustomer: (id) => {
        crmDb.deleteCustomer(id);
        set(state => ({
            customers: state.customers.filter(c => c.id !== id)
        }));
    },

    awardPoints: (customerId, points) => {
        const customers = get().customers;
        const index = customers.findIndex(c => c.id === customerId);
        if (index >= 0) {
            const updated = { ...customers[index], loyaltyPoints: (customers[index].loyaltyPoints || 0) + points };
            crmDb.saveCustomer(updated);
            set(state => ({
                customers: state.customers.map(c => c.id === customerId ? updated : c)
            }));
        }
    },

    updateBalance: (customerId, amount) => {
        const customers = get().customers;
        const index = customers.findIndex(c => c.id === customerId);
        if (index >= 0) {
            const updated = { ...customers[index], creditBalance: (customers[index].creditBalance || 0) + amount };
            crmDb.saveCustomer(updated);
            set(state => ({
                customers: state.customers.map(c => c.id === customerId ? updated : c)
            }));
        }
    }
}));
