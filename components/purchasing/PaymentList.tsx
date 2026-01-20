import React from 'react';
import { SupplierPayment } from '../../types';
import { CURRENCY } from '../../constants';
import { format } from 'date-fns';

interface PaymentListProps {
    payments: SupplierPayment[];
    suppliers: { id: string, name: string }[];
}

export const PaymentList: React.FC<PaymentListProps> = ({ payments, suppliers }) => {

    // Sort by date desc
    const sortedPayments = [...payments].sort((a, b) => b.date - a.date);

    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Payment History</h2>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Track Outgoing Funds</div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                {sortedPayments.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="text-slate-400 font-bold">No payment records found.</div>
                    </div>
                )}

                {sortedPayments.map(payment => (
                    <div key={payment.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex flex-col items-center justify-center border border-emerald-100">
                                <span className="text-[10px] font-black uppercase">{format(payment.date, 'MMM')}</span>
                                <span className="text-xl font-black leading-none">{format(payment.date, 'dd')}</span>
                            </div>
                            <div>
                                <div className="text-lg font-black text-slate-800">{getSupplierName(payment.supplierId)}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {payment.method} • Ref: {payment.reference || 'N/A'} • By {payment.recordedBy}
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs font-black text-slate-400 uppercase mb-1">Amount Paid</div>
                            <div className="text-xl font-black text-emerald-600">{CURRENCY}{payment.amount.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
