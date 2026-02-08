import { create } from 'zustand';
import { WalletTransaction, WalletType, Customer } from '../types';
import { useCRMStore } from './useCRMStore';

interface WalletState {
    transactions: WalletTransaction[];
    isLoading: boolean;

    // Actions
    topUp: (customerId: string, walletType: WalletType, amount: number, staffId: string, staffName: string, notes?: string) => Promise<void>;
    deduct: (customerId: string, walletType: WalletType, amount: number, staffId: string, staffName: string, referenceId?: string, referenceType?: any, notes?: string) => Promise<boolean>;
    lockFunds: (customerId: string, amount: number, staffId: string, staffName: string, reservationId: string) => Promise<boolean>;
    releaseFunds: (customerId: string, amount: number, staffId: string, staffName: string, reservationId: string) => Promise<void>;
    transfer: (customerId: string, from: WalletType, to: WalletType, amount: number, staffId: string, staffName: string, notes?: string) => Promise<boolean>;
    expirePromotional: (customerId: string, staffId: string, staffName: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    transactions: [],
    isLoading: false,

    topUp: async (customerId, walletType, amount, staffId, staffName, notes) => {
        const crmStore = useCRMStore.getState();
        const customer = crmStore.customers.find(c => c.id === customerId);
        if (!customer) return;

        const currentWallets = customer.wallets || { cash: 0, promotional: 0, refund: 0, locked: 0 };
        const balanceBefore = walletType === 'CASH' ? currentWallets.cash :
            walletType === 'PROMOTIONAL' ? currentWallets.promotional : currentWallets.refund;

        const balanceAfter = balanceBefore + amount;

        const newWallets = {
            ...currentWallets,
            [walletType.toLowerCase()]: balanceAfter
        };

        const transaction: WalletTransaction = {
            id: `WLT-${Date.now()}`,
            customerId,
            walletType,
            type: 'TOP_UP',
            amount,
            balanceBefore,
            balanceAfter,
            staffId,
            staffName,
            notes,
            timestamp: Date.now()
        };

        const updatedCustomer: Customer = {
            ...customer,
            wallets: newWallets,
            creditBalance: newWallets.cash + newWallets.promotional + newWallets.refund // Total available
        };

        await crmStore.updateCustomer(updatedCustomer);
        set(state => ({ transactions: [transaction, ...state.transactions] }));
    },

    deduct: async (customerId, walletType, amount, staffId, staffName, referenceId, referenceType, notes) => {
        const crmStore = useCRMStore.getState();
        const customer = crmStore.customers.find(c => c.id === customerId);
        if (!customer) return false;

        const currentWallets = customer.wallets || { cash: 0, promotional: 0, refund: 0, locked: 0 };
        const balanceBefore = walletType === 'CASH' ? currentWallets.cash :
            walletType === 'PROMOTIONAL' ? currentWallets.promotional : currentWallets.refund;

        // Check if we can use credit
        if (balanceBefore < amount) {
            if (walletType === 'CASH' && customer.creditConfig?.isEnabled) {
                const currentCreditUsed = Math.max(0, -currentWallets.cash);
                const additionalCreditNeeded = amount - balanceBefore;
                const newTotalCreditUsed = currentCreditUsed + additionalCreditNeeded;

                if (newTotalCreditUsed > customer.creditConfig.creditLimit) {
                    return false; // Credit limit exceeded
                }
                // Allow deduction even if balance goes negative
            } else {
                return false; // Insufficient balance and no credit
            }
        }

        const balanceAfter = balanceBefore - amount;
        const newWallets = {
            ...currentWallets,
            [walletType.toLowerCase()]: balanceAfter
        };

        const transaction: WalletTransaction = {
            id: `WLT-${Date.now()}`,
            customerId,
            walletType,
            type: 'DEDUCTION',
            amount,
            balanceBefore,
            balanceAfter,
            referenceId,
            referenceType,
            staffId,
            staffName,
            notes,
            timestamp: Date.now()
        };

        const updatedCustomer: Customer = {
            ...customer,
            wallets: newWallets,
            creditBalance: newWallets.cash + newWallets.promotional + newWallets.refund
        };

        await crmStore.updateCustomer(updatedCustomer);
        set(state => ({ transactions: [transaction, ...state.transactions] }));
        return true;
    },

    lockFunds: async (customerId, amount, staffId, staffName, reservationId) => {
        const crmStore = useCRMStore.getState();
        const customer = crmStore.customers.find(c => c.id === customerId);
        if (!customer) return false;

        const currentWallets = customer.wallets || { cash: 0, promotional: 0, refund: 0, locked: 0 };
        if (currentWallets.cash < amount) return false;

        const balanceBefore = currentWallets.cash;
        const balanceAfter = currentWallets.cash - amount;

        const newWallets = {
            ...currentWallets,
            cash: balanceAfter,
            locked: (currentWallets.locked || 0) + amount
        };

        const transaction: WalletTransaction = {
            id: `WLT-${Date.now()}`,
            customerId,
            walletType: 'CASH',
            type: 'LOCK',
            amount,
            balanceBefore,
            balanceAfter,
            referenceId: reservationId,
            referenceType: 'RESERVATION',
            staffId,
            staffName,
            notes: 'Funds locked for reservation deposit',
            timestamp: Date.now()
        };

        const updatedCustomer: Customer = {
            ...customer,
            wallets: newWallets,
            creditBalance: newWallets.cash + newWallets.promotional + newWallets.refund
        };

        await crmStore.updateCustomer(updatedCustomer);
        set(state => ({ transactions: [transaction, ...state.transactions] }));
        return true;
    },

    releaseFunds: async (customerId, amount, staffId, staffName, reservationId) => {
        const crmStore = useCRMStore.getState();
        const customer = crmStore.customers.find(c => c.id === customerId);
        if (!customer) return;

        const currentWallets = customer.wallets || { cash: 0, promotional: 0, refund: 0, locked: 0 };
        const balanceBefore = currentWallets.cash;
        const balanceAfter = currentWallets.cash + amount;

        const newWallets = {
            ...currentWallets,
            cash: balanceAfter,
            locked: Math.max(0, (currentWallets.locked || 0) - amount)
        };

        const transaction: WalletTransaction = {
            id: `WLT-${Date.now()}`,
            customerId,
            walletType: 'CASH',
            type: 'RELEASE',
            amount,
            balanceBefore,
            balanceAfter,
            referenceId: reservationId,
            referenceType: 'RESERVATION',
            staffId,
            staffName,
            notes: 'Funds released from reservation',
            timestamp: Date.now()
        };

        const updatedCustomer: Customer = {
            ...customer,
            wallets: newWallets,
            creditBalance: newWallets.cash + newWallets.promotional + newWallets.refund
        };

        await crmStore.updateCustomer(updatedCustomer);
        set(state => ({ transactions: [transaction, ...state.transactions] }));
    },

    transfer: async (customerId, from, to, amount, staffId, staffName, notes) => {
        const crmStore = useCRMStore.getState();
        const customer = crmStore.customers.find(c => c.id === customerId);
        if (!customer || from === to) return false;

        const currentWallets = customer.wallets || { cash: 0, promotional: 0, refund: 0, locked: 0 };
        const fromBalance = from === 'CASH' ? currentWallets.cash :
            from === 'PROMOTIONAL' ? currentWallets.promotional : currentWallets.refund;

        if (fromBalance < amount) return false;

        const toBalance = to === 'CASH' ? currentWallets.cash :
            to === 'PROMOTIONAL' ? currentWallets.promotional : currentWallets.refund;

        const newWallets = {
            ...currentWallets,
            [from.toLowerCase()]: fromBalance - amount,
            [to.toLowerCase()]: toBalance + amount
        };

        const txId = `WLT-TRSF-${Date.now()}`;
        const transaction: WalletTransaction = {
            id: txId,
            customerId,
            walletType: from,
            type: 'TRANSFER',
            amount,
            balanceBefore: fromBalance,
            balanceAfter: fromBalance - amount,
            staffId,
            staffName,
            notes: `${notes || 'Transfer to ' + to}`,
            timestamp: Date.now()
        };

        const receivingTx: WalletTransaction = {
            id: txId + '-IN',
            customerId,
            walletType: to,
            type: 'TOP_UP',
            amount,
            balanceBefore: toBalance,
            balanceAfter: toBalance + amount,
            staffId,
            staffName,
            notes: `Transfer from ${from}`,
            timestamp: Date.now()
        };

        const updatedCustomer: Customer = {
            ...customer,
            wallets: newWallets,
            creditBalance: newWallets.cash + newWallets.promotional + newWallets.refund
        };

        await crmStore.updateCustomer(updatedCustomer);
        set(state => ({ transactions: [transaction, receivingTx, ...state.transactions] }));
        return true;
    },

    expirePromotional: async (customerId, staffId, staffName) => {
        const crmStore = useCRMStore.getState();
        const customer = crmStore.customers.find(c => c.id === customerId);
        if (!customer || !customer.wallets || customer.wallets.promotional <= 0) return;

        const balanceBefore = customer.wallets.promotional;
        const amount = balanceBefore;
        const balanceAfter = 0;

        const newWallets = {
            ...customer.wallets,
            promotional: 0
        };

        const transaction: WalletTransaction = {
            id: `WLT-${Date.now()}`,
            customerId,
            walletType: 'PROMOTIONAL',
            type: 'EXPIRY',
            amount,
            balanceBefore,
            balanceAfter,
            staffId,
            staffName,
            notes: 'Promotional credit expired',
            timestamp: Date.now()
        };

        const updatedCustomer: Customer = {
            ...customer,
            wallets: newWallets,
            creditBalance: newWallets.cash + newWallets.promotional + newWallets.refund
        };

        await crmStore.updateCustomer(updatedCustomer);
        set(state => ({ transactions: [transaction, ...state.transactions] }));
    }
}));
