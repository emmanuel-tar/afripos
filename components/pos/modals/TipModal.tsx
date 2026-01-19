import React, { useState } from 'react';
import clsx from 'clsx';
import { DollarSign } from 'lucide-react';

interface TipModalProps {
    subtotal: number;
    currency: string;
    onClose: () => void;
    onSelectTip: (tipAmount: number, tipPercent: number) => void;
}

export const TipModal: React.FC<TipModalProps> = ({
    subtotal,
    currency,
    onClose,
    onSelectTip
}) => {
    const [selectedPercent, setSelectedPercent] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState<string>('');

    const tipPercentages = [0, 5, 10, 15, 20];

    const handlePercentClick = (percent: number) => {
        setSelectedPercent(percent);
        setCustomAmount('');
    };

    const handleCustomChange = (value: string) => {
        setCustomAmount(value);
        setSelectedPercent(null);
    };

    const handleConfirm = () => {
        let tipAmount = 0;
        let tipPercent = 0;

        if (selectedPercent !== null) {
            tipPercent = selectedPercent;
            tipAmount = (subtotal * selectedPercent) / 100;
        } else if (customAmount) {
            tipAmount = parseFloat(customAmount);
            tipPercent = (tipAmount / subtotal) * 100;
        }

        onSelectTip(tipAmount, tipPercent);
    };

    const calculatedTip = selectedPercent !== null
        ? (subtotal * selectedPercent) / 100
        : customAmount ? parseFloat(customAmount) : 0;

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-2xl bg-green-600 text-white flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Add Gratuity</h3>
                            <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Optional Tip</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    {/* Percentage Options */}
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                            Quick Select
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {tipPercentages.map(percent => (
                                <button
                                    key={percent}
                                    onClick={() => handlePercentClick(percent)}
                                    className={clsx(
                                        "py-4 rounded-2xl font-black transition-all text-sm",
                                        selectedPercent === percent
                                            ? 'bg-green-600 text-white shadow-lg scale-105'
                                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    )}
                                >
                                    {percent === 0 ? 'No Tip' : `${percent}%`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Amount */}
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                            Custom Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">
                                {currency}
                            </span>
                            <input
                                type="number"
                                value={customAmount}
                                onChange={(e) => handleCustomChange(e.target.value)}
                                placeholder="0"
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-200 font-black text-lg text-slate-800 focus:border-green-600 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Tip Preview */}
                    {calculatedTip > 0 && (
                        <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-green-700">Tip Amount:</span>
                                <span className="text-2xl font-black text-green-600">
                                    {currency}{calculatedTip.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-green-600 font-bold">New Total:</span>
                                <span className="font-black text-green-700">
                                    {currency}{(subtotal + calculatedTip).toLocaleString()}
                                </span>
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
                        onClick={handleConfirm}
                        className="flex-[2] py-4 bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-100 uppercase tracking-widest text-sm hover:bg-green-700 transition-all active:scale-95"
                    >
                        Continue to Payment
                    </button>
                </div>
            </div>
        </div>
    );
};
