import React from 'react';
import { StockTransaction } from '../../types';
import { CURRENCY } from '../../constants';
import { format } from 'date-fns';

interface ItemHistoryProps {
    transactions: StockTransaction[];
    unit: string;
}

const ItemHistory: React.FC<ItemHistoryProps> = ({ transactions, unit }) => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'IN':
            case 'PURCHASE':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'OUT':
            case 'WASTE':
                return 'bg-red-50 text-red-600 border-red-100';
            case 'SALE':
                return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'ADJUST':
                return 'bg-slate-50 text-slate-600 border-slate-100';
            default:
                return 'bg-slate-50 text-slate-500 border-slate-100';
        }
    };

    if (safeTransactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-slate-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No history found for this item</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {safeTransactions.map((trx) => (
                <div key={trx?.id || Math.random().toString()} className="bg-white border border-slate-100 p-5 rounded-[2rem] flex items-center gap-6 hover:shadow-md transition-shadow">
                    <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase">{format(trx?.timestamp || Date.now(), 'MMM')}</div>
                        <div className="text-xl font-black text-slate-800 leading-none">{format(trx?.timestamp || Date.now(), 'dd')}</div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${getBadgeColor(trx?.type || 'OTHER')}`}>
                                {trx?.type || 'UNKNOWN'}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 lowercase tracking-widest">
                                by {trx?.userName || 'System'} • {format(trx?.timestamp || Date.now(), 'HH:mm')}
                            </span>
                        </div>
                        <div className="text-sm font-black text-slate-800">
                            {trx?.reason || (trx?.type === 'SALE' ? `Order ${trx?.referenceId}` : trx?.type === 'PURCHASE' ? `Purchase from Supplier` : 'Manual Adjustment')}
                        </div>
                        {trx?.totalCost && (
                            <div className="text-[10px] font-black text-emerald-600 uppercase mt-1">
                                Value: {CURRENCY}{trx.totalCost.toLocaleString()} ({CURRENCY}{(trx.unitPrice || 0).toLocaleString()}/{unit})
                            </div>
                        )}
                    </div>

                    <div className="text-right shrink-0">
                        <div className={`text-lg font-black ${(trx?.newStock || 0) > (trx?.previousStock || 0) ? 'text-emerald-500' : 'text-red-500'}`}>
                            {(trx?.newStock || 0) > (trx?.previousStock || 0) ? '+' : ''}{trx?.quantity || 0} {unit}
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Stock: {trx?.newStock || 0} {unit}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ItemHistory;
