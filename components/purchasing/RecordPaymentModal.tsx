import React, { useState } from 'react';
import { SupplierInvoice, SupplierPayment } from '../../types';
import { CURRENCY } from '../../constants';

interface RecordPaymentModalProps {
    invoice: SupplierInvoice;
    onSave: (payment: Partial<SupplierPayment>) => void;
    onCancel: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ invoice, onSave, onCancel }) => {
    const outstanding = invoice.totalAmount - invoice.amountPaid;

    const [amount, setAmount] = useState(outstanding);
    const [method, setMethod] = useState<'CASH' | 'TRANSFER' | 'CHEQUE'>('TRANSFER');
    const [reference, setReference] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            invoiceId: invoice.id,
            supplierId: invoice.supplierId,
            amount: Number(amount),
            date: Date.now(),
            method,
            reference,
            recordedBy: 'Current User' // TODO: Context
        });
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="p-8 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Record Payment</h3>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Invoice #{invoice.invoiceNumber} • {invoice.supplierName}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Total Due</span>
                            <span className="text-xl font-black text-indigo-800">{CURRENCY}{outstanding.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Invoice Total</span>
                            <span className="text-sm font-bold text-indigo-600">{CURRENCY}{invoice.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Amount</label>
                        <input
                            type="number"
                            required
                            max={outstanding}
                            min={1}
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-2xl text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['CASH', 'TRANSFER', 'CHEQUE'].map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMethod(m as any)}
                                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${method === m
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                            : 'border-slate-100 text-slate-400 hover:border-slate-300'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reference / Note</label>
                        <input
                            type="text"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                            placeholder="e.g. Bank Transfer Ref 12345"
                        />
                    </div>

                    <div className="pt-6 flex gap-4">
                        <button type="button" onClick={onCancel} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl">
                            Cancel
                        </button>
                        <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-2xl transition-all transform hover:-translate-y-1">
                            Confirm Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
