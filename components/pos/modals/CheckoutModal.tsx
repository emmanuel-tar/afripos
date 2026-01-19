import React, { useState } from 'react';
import { PaymentMethod, Branch } from '../../../types';
import clsx from 'clsx';
import { useAppStore } from '../../../stores/useAppStore';

interface CheckoutModalProps {
    total: number;
    tableNumber: string;
    onClose: () => void;
    onCheckout: (method: PaymentMethod) => void;
    onSplitPayment?: () => void;
    currency: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    total,
    tableNumber,
    onClose,
    onCheckout,
    onSplitPayment,
    currency
}) => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

    return (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Final Settlement</h3>
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">Payment for Table {tableNumber}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Due Amount</div>
                        <div className="text-4xl font-black text-slate-900 tracking-tighter">{currency}{total.toLocaleString()}</div>
                    </div>
                </div>

                <div className="p-10 grid grid-cols-2 gap-4">
                    {(['CASH', 'POS', 'TRANSFER', 'COMPLIMENTARY'] as PaymentMethod[]).map(method => (
                        <button key={method} onClick={() => setPaymentMethod(method)} className={clsx("p-8 rounded-[2rem] border-2 text-center transition-all flex flex-col items-center gap-4", paymentMethod === method ? 'border-indigo-600 bg-indigo-50 ring-8 ring-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-300')}>
                            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", paymentMethod === method ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400')}>
                                {/* Simplified icons */}
                                <span className="font-bold text-lg">{method[0]}</span>
                            </div>
                            <span className={clsx("font-black text-xs tracking-[0.2em]", paymentMethod === method ? 'text-indigo-700' : 'text-slate-500')}>{method}</span>
                        </button>
                    ))}
                </div>

                <div className="p-10 bg-slate-50 border-t border-slate-100 space-y-4">
                    {onSplitPayment && (
                        <button
                            onClick={onSplitPayment}
                            className="w-full py-4 bg-purple-50 text-purple-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-purple-100 transition-all border-2 border-purple-200"
                        >
                            💳 Split Payment (Multiple Methods)
                        </button>
                    )}
                    <div className="flex gap-4">
                        <button onClick={onClose} className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest text-xs">Back</button>
                        <button onClick={() => onCheckout(paymentMethod)} className="flex-[2] py-5 bg-green-600 text-white rounded-3xl font-black shadow-2xl shadow-green-100 uppercase tracking-widest text-lg hover:bg-green-700 transition-all active:scale-95">
                            Post Transaction
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
