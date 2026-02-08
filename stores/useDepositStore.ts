import { create } from 'zustand';
import { DepositRule, PaymentRecord, Reservation, DepositType, PaymentStatus } from '../types';

interface DepositState {
    rules: DepositRule[];
    paymentRecords: PaymentRecord[];
    isLoading: boolean;

    // Actions
    fetchRules: () => Promise<void>;
    saveRule: (rule: DepositRule) => Promise<void>;
    deleteRule: (id: string) => Promise<void>;

    processPayment: (record: PaymentRecord) => Promise<void>;
    calculateDeposit: (reservation: Partial<Reservation>, rules: DepositRule[]) => { amount: number; ruleId?: string };
}

export const useDepositStore = create<DepositState>((set, get) => ({
    rules: [
        {
            id: 'rule-1',
            name: 'Weekend Peak',
            type: 'PERCENTAGE',
            value: 50,
            daysOfWeek: [5, 6], // Fri, Sat
            isRefundable: true,
            refundCutoffHours: 24,
            isActive: true,
        },
        {
            id: 'rule-2',
            name: 'Large Party',
            type: 'PER_PERSON',
            value: 2000,
            minPartySize: 6,
            isRefundable: false,
            refundCutoffHours: 0,
            isActive: true,
        }
    ],
    paymentRecords: [],
    isLoading: false,

    fetchRules: async () => {
        // Mock fetch
        set({ isLoading: true });
        // In real app, fetch from IndexedDB or API
        set({ isLoading: false });
    },

    saveRule: async (rule) => {
        set(state => ({
            rules: state.rules.find(r => r.id === rule.id)
                ? state.rules.map(r => r.id === rule.id ? rule : r)
                : [...state.rules, rule]
        }));
    },

    deleteRule: async (id) => {
        set(state => ({ rules: state.rules.filter(r => r.id !== id) }));
    },

    processPayment: async (record) => {
        set(state => ({ paymentRecords: [record, ...state.paymentRecords] }));
        // In a real app, this would update the reservation store as well
    },

    calculateDeposit: (reservation, rules) => {
        if (!reservation.date || !reservation.partySize) return { amount: 0 };

        const reservationDate = new Date(reservation.date);
        const dayOfWeek = reservationDate.getDay();

        // Simple rule matching logic
        const matchedRules = rules.filter(rule => {
            if (!rule.isActive) return false;

            // Branch check
            if (rule.locationId && rule.locationId !== reservation.locationId) return false;

            // Day of week check
            if (rule.daysOfWeek && !rule.daysOfWeek.includes(dayOfWeek)) return false;

            // Party size check
            if (rule.minPartySize && (reservation.partySize || 0) < rule.minPartySize) return false;
            if (rule.maxPartySize && (reservation.partySize || 0) > rule.maxPartySize) return false;

            return true;
        });

        if (matchedRules.length === 0) return { amount: 0 };

        // Select the rule with highest value (simplistic priority)
        const rule = matchedRules.sort((a, b) => b.value - a.value)[0];

        let amount = 0;
        switch (rule.type) {
            case 'FIXED':
                amount = rule.value;
                break;
            case 'PERCENTAGE':
                // Assuming a default average bill or per person for percentage if full price not known
                // For this demo, let's assume a percentage of a fixed "estimated total" of 10000 per person
                amount = ((reservation.partySize || 1) * 10000) * (rule.value / 100);
                break;
            case 'FULL':
                amount = (reservation.partySize || 1) * 10000;
                break;
            case 'PER_PERSON':
                amount = (reservation.partySize || 1) * rule.value;
                break;
            default:
                amount = 0;
        }

        return { amount, ruleId: rule.id };
    }
}));
