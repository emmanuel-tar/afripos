import React, { useState } from 'react';
import { PaymentMethod, Payment } from '../../../types';
import clsx from 'clsx';
import { CreditCard, Trash2 } from 'lucide-react';

interface SplitPaymentModalProps {
    total: number;
    currency: string;
    onClose: () => void;
    onComplete: (payments: Payment[]) => void;
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
    total,
    currency,
    onClose,
    onComplete
}) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
    const [amount, setAmount] = useState<string>('');

    const paymentMethods: PaymentMethod[] = ['CASH', 'POS', 'TRANSFER', 'COMPLIMENTARY'];

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = total - totalPaid;
    const isComplete = remaining <= 0;

    const handleAddPayment = () => {
        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum <= 0) return;

        // Don't allow overpayment
        const actualAmount = Math.min(amountNum, remaining);

        const newPayment: Payment = {
            id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            method: selectedMethod,
            amount: actualAmount,
            timestamp: Date.now()
        };

        setPayments([...payments, newPayment]);
        setAmount('');
    };

    const handleRemovePayment = (id: string) => {
        setPayments(payments.filter(p => p.id !== id));
    };

    const handleQuickAmount = (quickAmount: number) => {
        const actualAmount = Math.min(quickAmount, remaining);
        setAmount(actualAmount.toString());
    };

    const handleComplete = () => {
        if (isComplete) {
            onComplete(payments);
        }
    };

    return (
        <div className="fixed inset-0 z-[125] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-10 border-b border-slate-100 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Split Payment</h3>
                            <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Multiple Payment Methods</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-4 border-2 border-purple-100">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Bill</div>
                            <div className="text-2xl font-black text-slate-900">
                                {currency}{total.toLocaleString()}
                            </div>
                        </div>
                        <div className={clsx(
                            "rounded-2xl p-4 border-2",
                            isComplete ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                        )}>
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Remaining</div>
                            <div className={clsx(
                                "text-2xl font-black",
                                isComplete ? 'text-green-600' : 'text-amber-600'
                            )}>
                                {currency}{Math.max(0, remaining).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Existing Payments */}
                    {payments.length > 0 && (
                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                                Payments Added ({payments.length})
                            </label>
                            <div className="space-y-2">
                                {payments.map(payment => (
                                    <div key={payment.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                                                <span className="text-xs font-black text-slate-600">{payment.method[0]}</span>
                                            </div>
                                            <div>
                                                <div className="font-black text-sm text-slate-800">{payment.method}</div>
                                                <div className="text-xs text-slate-500 font-bold">
                                                    {new Date(payment.timestamp).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-lg text-slate-900">
                                                {currency}{payment.amount.toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => handleRemovePayment(payment.id)}
                                                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add New Payment */}
                    {!isComplete && (
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-4">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                                Add Payment
                            </label>

                            {/* Payment Method Selection */}
                            <div className="grid grid-cols-4 gap-2">
                                {paymentMethods.map(method => (
                                    <button
                                        key={method}
                                        onClick={() => setSelectedMethod(method)}
                                        className={clsx(
                                            "py-3 rounded-xl font-black text-xs transition-all",
                                            selectedMethod === method
                                                ? 'bg-purple-600 text-white shadow-lg'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                        )}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>

                            {/* Amount Input */}
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">
                                    {currency}
                                </span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 font-black text-xl text-slate-800 focus:border-purple-600 focus:outline-none transition-colors"
                                />
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleQuickAmount(remaining)}
                                    className="flex-1 py-2 rounded-xl bg-purple-50 text-purple-600 font-black text-xs hover:bg-purple-100 transition-colors"
                                >
                                    Full Amount
                                </button>
                                <button
                                    onClick={() => handleQuickAmount(remaining / 2)}
                                    className="flex-1 py-2 rounded-xl bg-purple-50 text-purple-600 font-black text-xs hover:bg-purple-100 transition-colors"
                                >
                                    Half
                                </button>
                            </div>

                            <button
                                onClick={handleAddPayment}
                                disabled={!amount || parseFloat(amount) <= 0}
                                className={clsx(
                                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all",
                                    amount && parseFloat(amount) > 0
                                        ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                )}
                            >
                                Add {selectedMethod} Payment
                            </button>
                        </div>
                    )}

                    {isComplete && (
                        <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200 text-center">
                            <div className="text-4xl mb-2">✓</div>
                            <div className="font-black text-green-700 text-lg">Payment Complete!</div>
                            <div className="text-sm text-green-600 font-bold mt-1">
                                {payments.length} payment{payments.length > 1 ? 's' : ''} totaling {currency}{totalPaid.toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 flex gap-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleComplete}
                        disabled={!isComplete}
                        className={clsx(
                            "flex-[2] py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-sm transition-all active:scale-95",
                            isComplete
                                ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        )}
                    >
                        Complete Transaction
                    </button>
                </div>
            </div>
        </div>
    );
};
