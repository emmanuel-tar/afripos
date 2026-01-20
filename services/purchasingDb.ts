import { db } from './offlineDb';
import { SupplierInvoice, SupplierPayment, RFQ, CreditNote } from '../types';

export const purchasingDb = {
    // Invoices
    getInvoices: async (): Promise<SupplierInvoice[]> => {
        return await db.invoices.toArray();
    },
    saveInvoice: async (invoice: SupplierInvoice): Promise<void> => {
        await db.invoices.put(invoice);
    },
    deleteInvoice: async (id: string): Promise<void> => {
        await db.invoices.delete(id);
    },

    // Payments
    getPayments: async (): Promise<SupplierPayment[]> => {
        return await db.payments.toArray();
    },
    savePayment: async (payment: SupplierPayment): Promise<void> => {
        await db.payments.put(payment);
    },
    deletePayment: async (id: string): Promise<void> => {
        await db.payments.delete(id);
    },

    // RFQs
    getRFQs: async (): Promise<RFQ[]> => {
        return await db.rfqs.toArray();
    },
    saveRFQ: async (rfq: RFQ): Promise<void> => {
        await db.rfqs.put(rfq);
    },
    deleteRFQ: async (id: string): Promise<void> => {
        await db.rfqs.delete(id);
    },

    // Credit Notes
    getCreditNotes: async (): Promise<CreditNote[]> => {
        return await db.creditNotes.toArray();
    },
    saveCreditNote: async (note: CreditNote): Promise<void> => {
        await db.creditNotes.put(note);
    },
    deleteCreditNote: async (id: string): Promise<void> => {
        await db.creditNotes.delete(id);
    }
};
