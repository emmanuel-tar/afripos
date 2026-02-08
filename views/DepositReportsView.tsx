import React, { useState } from 'react';
import { useDepositStore } from '../stores/useDepositStore';
import { useReservationStore } from '../stores/useReservationStore';
import { PaymentRecord, Reservation } from '../types';

const DepositReportsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { paymentRecords } = useDepositStore();
    const { reservations } = useReservationStore();
    const [filterPeriod, setFilterPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH'>('WEEK');

    const totalDeposits = paymentRecords.reduce((sum, record) => sum + record.amount, 0);
    const successfulPayments = paymentRecords.filter(r => r.status === 'SUCCESS').length;

    // Simple filter logic
    const filteredRecords = paymentRecords.filter(record => {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (filterPeriod === 'TODAY') return (now - record.timestamp) < oneDay;
        if (filterPeriod === 'WEEK') return (now - record.timestamp) < (7 * oneDay);
        if (filterPeriod === 'MONTH') return (now - record.timestamp) < (30 * oneDay);
        return true;
    });

    return (
        <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-10 py-8 shrink-0">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <button
                            onClick={onBack}
                            className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-3 hover:text-indigo-600 transition-colors flex items-center gap-2 outline-none"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Admin
                        </button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Deposit Reports & Ledger</h1>
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                        {(['TODAY', 'WEEK', 'MONTH'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setFilterPeriod(p)}
                                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filterPeriod === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10">
                <div className="max-w-7xl mx-auto">
                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        {[
                            { label: 'Total Deposits Collected', value: `₦${totalDeposits.toLocaleString()}`, color: 'indigo' },
                            { label: 'Successful Transactions', value: successfulPayments, color: 'emerald' },
                            { label: 'Pending Prepayments', value: reservations.filter(r => r.paymentStatus === 'UNPAID' && r.totalDepositRequired > 0).length, color: 'amber' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{stat.label}</div>
                                <div className={`text-4xl font-black text-${stat.color}-600 tracking-tight`}>{stat.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Ledger Table */}
                    <div className="bg-white rounded-[4rem] border border-slate-200 overflow-hidden shadow-xl">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Transaction Ledger</h2>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> All Systems Operational
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                        <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</th>
                                        <th className="px-6 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.map(record => (
                                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-6 text-[11px] font-black text-slate-400">
                                                {new Date(record.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{record.customerName}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">RES ID: {record.reservationId}</div>
                                            </td>
                                            <td className="px-6 py-6 font-mono text-[10px] text-indigo-600 font-bold">{record.reference}</td>
                                            <td className="px-6 py-6">
                                                <span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600">{record.method}</span>
                                            </td>
                                            <td className="px-6 py-6 text-right font-black text-slate-800">₦{record.amount.toLocaleString()}</td>
                                            <td className="px-10 py-6 text-right">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${record.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                                                        record.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRecords.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-10 py-40 text-center">
                                                <div className="text-slate-300 font-black text-sm uppercase tracking-[0.3em]">No records found for this period</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepositReportsView;
