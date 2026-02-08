import React, { useState } from 'react';
import { Customer, WalletType } from '../../types';
import { useWalletStore } from '../../stores/useWalletStore';
import { useAppStore } from '../../stores/useAppStore';
import { toast } from 'sonner';

interface TransferModalProps {
    customer: Customer;
    onClose: () => void;
    onSuccess: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ customer, onClose, onSuccess }) => {
    const [from, setFrom] = useState<WalletType>('CASH');
    const [to, setTo] = useState<WalletType>('PROMOTIONAL');
    const [amount, setAmount] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    const transfer = useWalletStore(state => state.transfer);
    const user = useAppStore(state => state.user);

    const handleTransfer = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        const success = await transfer(
            customer.id,
            from,
            to,
            val,
            user?.id || 'SYS',
            user?.name || 'System',
            notes
        );

        if (success) {
            toast.success("Transfer completed successfully");
            onSuccess();
            onClose();
        } else {
            toast.error("Transfer failed. Insufficient funds in source wallet.");
        }
    };

    const wallets: WalletType[] = ['CASH', 'PROMOTIONAL', 'REFUND'];

    return (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Inter-Wallet Transfer</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Movement for {customer.name}</p>
                    </div>
                    <button onClick={onClose} className="bg-white p-3 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm border border-slate-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">From Wallet</label>
                            <select
                                value={from}
                                onChange={e => setFrom(e.target.value as WalletType)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-600 appearance-none uppercase"
                            >
                                {wallets.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">To Wallet</label>
                            <select
                                value={to}
                                onChange={e => setTo(e.target.value as WalletType)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-600 appearance-none uppercase"
                            >
                                {wallets.map(w => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Amount to Transfer (₦)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Internal Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Reason for transfer..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600 h-24"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleTransfer}
                            disabled={from === to}
                            className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] ${from === to ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black'}`}
                        >
                            Execute Transfer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferModal;
