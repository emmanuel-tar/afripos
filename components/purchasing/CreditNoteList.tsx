import React from 'react';
import { CreditNote, Supplier } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { CURRENCY } from '../../constants';

interface CreditNoteListProps {
    creditNotes: CreditNote[];
}

export const CreditNoteList: React.FC<CreditNoteListProps> = ({ creditNotes }) => {
    const { suppliers } = useInventoryStore();

    const getSupplierName = (id: string) => {
        return suppliers.find(s => s.id === id)?.name || 'Unknown Supplier';
    };

    const getStatusColor = (status: CreditNote['status']) => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-600';
            case 'USED': return 'bg-blue-100 text-blue-600';
            case 'REFUNDED': return 'bg-emerald-100 text-emerald-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice ID</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {creditNotes.map(note => (
                        <tr key={note.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                            <td className="px-6 py-4 font-bold text-slate-600">
                                {new Date(note.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                                <div className="font-black text-slate-900">{getSupplierName(note.supplierId)}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{note.id}</div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-600">
                                {note.invoiceId}
                            </td>
                            <td className="px-6 py-4 font-black text-slate-900">
                                {CURRENCY}{note.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(note.status)}`}>
                                    {note.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium italic">
                                "{note.reason}"
                            </td>
                        </tr>
                    ))}
                    {creditNotes.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                No credit notes recorded.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
