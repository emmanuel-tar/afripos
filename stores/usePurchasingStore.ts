import { create } from 'zustand';
import { SupplierInvoice, SupplierPayment, RFQ, CreditNote } from '../types';
import { purchasingDb } from '../services/purchasingDb';

interface PurchasingState {
    invoices: SupplierInvoice[];
    payments: SupplierPayment[];
    rfqs: RFQ[];
    creditNotes: CreditNote[];
    isLoading: boolean;

    // Actions
    fetchPurchasingData: () => Promise<void>;

    addInvoice: (invoice: SupplierInvoice) => Promise<void>;
    updateInvoice: (invoice: SupplierInvoice) => Promise<void>;
    deleteInvoice: (id: string) => Promise<void>;

    addPayment: (payment: SupplierPayment) => Promise<void>;

    addRFQ: (rfq: RFQ) => Promise<void>;
    updateRFQ: (rfq: RFQ) => Promise<void>;

    addCreditNote: (note: CreditNote) => Promise<void>;
}

export const usePurchasingStore = create<PurchasingState>((set, get) => ({
    invoices: [],
    payments: [],
    rfqs: [],
    creditNotes: [],
    isLoading: false,

    fetchPurchasingData: async () => {
        set({ isLoading: true });
        try {
            const [invoices, payments, rfqs, creditNotes] = await Promise.all([
                purchasingDb.getInvoices(),
                purchasingDb.getPayments(),
                purchasingDb.getRFQs(),
                purchasingDb.getCreditNotes()
            ]);
            set({ invoices, payments, rfqs, creditNotes, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch purchasing data:', error);
            set({ isLoading: false });
        }
    },

    addInvoice: async (invoice) => {
        await purchasingDb.saveInvoice(invoice);
        set((state) => ({ invoices: [invoice, ...state.invoices] }));
    },

    updateInvoice: async (invoice) => {
        await purchasingDb.saveInvoice(invoice);
        set((state) => ({
            invoices: state.invoices.map(i => i.id === invoice.id ? invoice : i)
        }));
    },

    deleteInvoice: async (id) => {
        await purchasingDb.deleteInvoice(id);
        set((state) => ({
            invoices: state.invoices.filter(i => i.id !== id)
        }));
    },

    addPayment: async (payment) => {
        await purchasingDb.savePayment(payment);
        set((state) => ({ payments: [payment, ...state.payments] }));
    },

    addRFQ: async (rfq) => {
        await purchasingDb.saveRFQ(rfq);
        set((state) => ({ rfqs: [rfq, ...state.rfqs] }));
    },

    updateRFQ: async (rfq) => {
        await purchasingDb.saveRFQ(rfq);
        set((state) => ({
            rfqs: state.rfqs.map(r => r.id === rfq.id ? rfq : r)
        }));
    },

    addCreditNote: async (note) => {
        await purchasingDb.saveCreditNote(note);
        set((state) => ({ creditNotes: [note, ...state.creditNotes] }));
    }
}));
