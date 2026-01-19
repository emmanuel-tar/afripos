import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PurchaseOrder, Supplier, SupplierInvoice, SupplierPayment, RFQ, CreditNote } from '../types';

interface PurchasingState {
    invoices: SupplierInvoice[];
    payments: SupplierPayment[];
    rfqs: RFQ[];
    creditNotes: CreditNote[];
    isLoading: boolean;

    // Actions
    addInvoice: (invoice: SupplierInvoice) => void;
    updateInvoice: (invoice: SupplierInvoice) => void;
    addPayment: (payment: SupplierPayment) => void;
    addRFQ: (rfq: RFQ) => void;
    updateRFQ: (rfq: RFQ) => void;
    addCreditNote: (note: CreditNote) => void;
}

export const usePurchasingStore = create<PurchasingState>()(
    persist(
        (set) => ({
            invoices: [],
            payments: [],
            rfqs: [],
            creditNotes: [],
            isLoading: false,

            addInvoice: (invoice) => set((state) => ({ invoices: [invoice, ...state.invoices] })),
            updateInvoice: (invoice) => set((state) => ({
                invoices: state.invoices.map(i => i.id === invoice.id ? invoice : i)
            })),
            addPayment: (payment) => set((state) => ({ payments: [payment, ...state.payments] })),
            addRFQ: (rfq) => set((state) => ({ rfqs: [rfq, ...state.rfqs] })),
            updateRFQ: (rfq) => set((state) => ({
                rfqs: state.rfqs.map(r => r.id === rfq.id ? rfq : r)
            })),
            addCreditNote: (note) => set((state) => ({ creditNotes: [note, ...state.creditNotes] }))
        }),
        {
            name: 'purchasing-storage',
        }
    )
);
