import React from 'react';
import { RFQ, Supplier } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';

interface RFQListProps {
    rfqs: RFQ[];
    onView?: (rfq: RFQ) => void;
}

export const RFQList: React.FC<RFQListProps> = ({ rfqs, onView }) => {
    const { suppliers } = useInventoryStore();

    const getSupplierNames = (ids: string[]) => {
        return ids.map(id => suppliers.find(s => s.id === id)?.name || id).join(', ');
    };

    const getStatusColor = (status: RFQ['status']) => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-600';
            case 'SENT': return 'bg-blue-100 text-blue-600';
            case 'CLOSED': return 'bg-emerald-100 text-emerald-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">RFQ Number</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Suppliers</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rfqs.map(rfq => (
                        <tr key={rfq.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <span className="font-black text-slate-900">{rfq.rfqNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-600 truncate max-w-[200px]">
                                    {getSupplierNames(rfq.supplierIds)}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-slate-800">
                                    {rfq.items.length} Items
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase font-black tracking-tight">
                                    {rfq.items.slice(0, 2).map(i => i.materialName).join(', ')}
                                    {rfq.items.length > 2 && '...'}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(rfq.status)}`}>
                                    {rfq.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={() => onView?.(rfq)}
                                    className="text-indigo-600 font-black text-xs uppercase hover:underline"
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                    {rfqs.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                No RFQs found. Create your first Request for Quotation.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
