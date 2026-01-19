import React, { useState } from 'react';
import clsx from 'clsx';
import { Banknote } from 'lucide-react';

interface CashTenderedModalProps {
    total: number;
    currency: string;
    onClose: () => void;
    onConfirm: (tendered: number, change: number) => void;
}

export const CashTenderedModal: React.FC<CashTenderedModalProps> = ({
    total,
    currency,
    onClose,
    onConfirm
}) => {
    const [tendered, setTendered] = useState<string>('');

    const quickAmounts = [5000, 10000, 20000, 50000];

    const tenderedNum = parseFloat(tendered) || 0;
    const change = tenderedNum - total;
    const isValid = tenderedNum >= total;

    const handleQuickAmount = (amount: number) => {
        setTendered(amount.toString());
    };

    const handleConfirm = () => {
        if (isValid) {
            onConfirm(tenderedNum, change);
        }
    };

    return (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                            <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Cash Payment</h3>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Enter Amount Tendered</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border-2 border-blue-100">
                        <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Due</div>
                        <div className="text-4xl font-black text-slate-900">
                            {currency}{total.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Quick Amount Buttons */}
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                            Quick Amounts
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {quickAmounts.map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => handleQuickAmount(amount)}
                                    className={clsx(
                                        "py-4 rounded-2xl font-black transition-all",
                                        tendered === amount.toString()
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    )}
                                >
                                    {currency}{amount.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Amount Input */}
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                            Amount Tendered
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">
                                {currency}
                            </span>
                            <input
                                type="number"
                                value={tendered}
                                onChange={(e) => setTendered(e.target.value)}
                                placeholder="0"
                                className={clsx(
                                    "w-full pl-12 pr-4 py-5 rounded-2xl border-2 font-black text-2xl focus:outline-none transition-colors",
                                    isValid
                                        ? 'border-blue-600 text-slate-800'
                                        : 'border-red-300 text-red-600'
                                )}
                                autoFocus
                            />
                        </div>
                        {!isValid && tenderedNum > 0 && (
                            <p className="text-red-500 text-xs font-bold mt-2 ml-2">
                                Amount must be at least {currency}{total.toLocaleString()}
                            </p>
                        )}
                    </div>

                    {/* Change Display */}
                    {isValid && change > 0 && (
                        <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200 animate-in fade-in">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-green-700">Change to Return:</span>
                                <span className="text-3xl font-black text-green-600">
                                    {currency}{change.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {isValid && change === 0 && (
                        <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-200">
                            <p className="text-center text-sm font-bold text-blue-700">
                                ✓ Exact Amount
                            </p>
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
                        onClick={handleConfirm}
                        disabled={!isValid}
                        className={clsx(
                            "flex-[2] py-4 rounded-2xl font-black shadow-xl uppercase tracking-widest text-sm transition-all active:scale-95",
                            isValid
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        )}
                    >
                        Confirm Payment
                    </button>
                </div>
            </div>
        </div>
    );
};
