import React from 'react';
import { Customer } from '../../types';

interface WalletSummaryCardProps {
    customer: Customer;
}

const WalletSummaryCard: React.FC<WalletSummaryCardProps> = ({ customer }) => {
    const wallets = customer.wallets || { cash: 0, promotional: 0, refund: 0, locked: 0 };

    const stats = [
        { label: 'Cash Wallet', value: wallets.cash, color: 'emerald' },
        { label: 'Promotional', value: wallets.promotional, color: 'amber' },
        { label: 'Refund Credit', value: wallets.refund, color: 'indigo' },
        { label: 'Locked (Reservations)', value: wallets.locked, color: 'slate' }
    ];

    const totalAvailable = wallets.cash + wallets.promotional + wallets.refund;

    return (
        <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-full -mr-10 -mt-10" />

                <div className="relative">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Total Available Balance</div>
                    <div className="text-5xl font-black tracking-tight font-mono">₦{totalAvailable.toLocaleString()}</div>

                    {customer.creditConfig?.isEnabled && (
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                            <div>
                                <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">Credit Limit</div>
                                <div className="text-sm font-black">₦{customer.creditConfig.creditLimit.toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">Status</div>
                                <div className="bg-white/10 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Active Line</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{stat.label}</div>
                        <div className={`text-xl font-black text-${stat.color}-600 font-mono`}>₦{stat.value.toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WalletSummaryCard;
