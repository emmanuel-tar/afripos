import React from 'react';
import { WalletTransaction } from '../../types';

interface WalletLedgerProps {
    transactions: WalletTransaction[];
}

const WalletLedger: React.FC<WalletLedgerProps> = ({ transactions }) => {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Audit Ledger</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Immutable Transaction History</p>
                </div>
            </div>

            <div className="overflow-y-auto flex-1">
                <table className="w-full">
                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                            <th className="px-6 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                            <th className="px-6 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
                            <th className="px-6 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                            <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${tx.type === 'TOP_UP' ? 'bg-emerald-50 text-emerald-600' :
                                                tx.type === 'DEDUCTION' || tx.type === 'LOCK' ? 'bg-red-50 text-red-600' :
                                                    'bg-slate-50 text-slate-600'
                                            }`}>
                                            {tx.type.slice(0, 3)}
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black text-slate-800 uppercase">{tx.type.replace('_', ' ')}</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">Wallet: {tx.walletType}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`text-[11px] font-black ${['TOP_UP', 'RELEASE'].includes(tx.type) ? 'text-emerald-600' : 'text-red-600'
                                        }`}>
                                        {['TOP_UP', 'RELEASE'].includes(tx.type) ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="text-[11px] font-black text-slate-600 font-mono">₦{tx.balanceAfter.toLocaleString()}</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase">Was: ₦{tx.balanceBefore.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="text-[10px] font-black text-indigo-600 font-mono">{tx.referenceId || 'N/A'}</div>
                                    {tx.referenceType && <div className="text-[8px] font-bold text-slate-400 uppercase">{tx.referenceType}</div>}
                                </td>
                                <td className="px-8 py-5 text-right text-slate-400">
                                    <div className="text-[9px] font-bold uppercase">{new Date(tx.timestamp).toLocaleDateString()}</div>
                                    <div className="text-[8px] font-medium tracking-tighter truncate max-w-[120px] ml-auto">{tx.staffName}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {transactions.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-200">
                        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">No transactions recorded</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletLedger;
