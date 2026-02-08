import React, { useState } from 'react';
import { PaymentMethod, Branch, Customer } from '../../../types';
import clsx from 'clsx';
import { useAppStore } from '../../../stores/useAppStore';

interface CheckoutModalProps {
    total: number;
    tableNumber: string;
    onClose: () => void;
    onCheckout: (method: PaymentMethod) => void;
    onSplitPayment?: () => void;
    currency: string;
    activeCustomer?: Customer | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
    total,
    tableNumber,
    onClose,
    onCheckout,
    onSplitPayment,
    currency,
    activeCustomer
}) => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

    const walletBalance = activeCustomer?.wallets ? (activeCustomer.wallets.cash + activeCustomer.wallets.promotional + activeCustomer.wallets.refund) : 0;
    const creditEnabled = activeCustomer?.creditConfig?.isEnabled || false;
    const creditLimit = activeCustomer?.creditConfig?.creditLimit || 0;
    const currentCreditUsed = activeCustomer?.wallets?.cash && activeCustomer.wallets.cash < 0 ? Math.abs(activeCustomer.wallets.cash) : 0;
    const availableCredit = Math.max(0, creditLimit - currentCreditUsed);

    const methods: { id: PaymentMethod; label: string; icon: string; disabled?: boolean; subtext?: string }[] = [
        { id: 'CASH', label: 'Cash', icon: '💵' },
        { id: 'POS', label: 'Card / POS', icon: '💳' },
        { id: 'TRANSFER', label: 'Transfer', icon: '🏦' },
        { id: 'COMPLIMENTARY', label: 'On House', icon: '🎁' },
    ];

    if (activeCustomer) {
        methods.push({
            id: 'WALLET',
            label: 'Wallet',
            icon: '👛',
            disabled: walletBalance < total,
            subtext: `Bal: ${currency}${walletBalance.toLocaleString()}`
        });
        methods.push({
            id: 'CREDIT',
            label: 'On Credit',
            icon: '📝',
            disabled: !creditEnabled || (total > availableCredit),
            subtext: `Limit: ${currency}${availableCredit.toLocaleString()}`
        });
    }

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
                    {methods.map(method => (
                        <button
                            key={method.id}
                            disabled={method.disabled}
                            onClick={() => setPaymentMethod(method.id)}
                            className={clsx(
                                "p-8 rounded-[2rem] border-2 text-center transition-all flex flex-col items-center gap-4 relative overflow-hidden",
                                paymentMethod === method.id ? 'border-indigo-600 bg-indigo-50 ring-8 ring-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-300',
                                method.disabled && 'opacity-40 grayscale cursor-not-allowed shadow-none border-dashed'
                            )}
                        >
                            <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", paymentMethod === method.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400')}>
                                <span className="text-2xl">{method.icon}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className={clsx("font-black text-xs tracking-[0.2em] uppercase", paymentMethod === method.id ? 'text-indigo-700' : 'text-slate-500')}>
                                    {method.label}
                                </span>
                                {method.subtext && (
                                    <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">
                                        {method.subtext}
                                    </span>
                                )}
                            </div>
                            {method.disabled && (
                                <div className="absolute top-2 right-2">
                                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                            )}
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
