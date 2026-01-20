import React, { useState } from 'react';
import { SupplierInvoice, Supplier } from '../../types';
import { CURRENCY } from '../../constants';
import { format } from 'date-fns';

interface InvoiceListProps {
    invoices: SupplierInvoice[];
    onSelectInvoice: (invoice: SupplierInvoice) => void;
    onRecordPayment: (invoice: SupplierInvoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onSelectInvoice, onRecordPayment }) => {
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInvoices = invoices.filter(inv => {
        const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-100 text-emerald-700';
            case 'PENDING': return 'bg-amber-100 text-amber-700';
            case 'OVERDUE': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Supplier Invoices</h2>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage Bills & Payments</div>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search invoices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 shrink-0">
                {['ALL', 'PENDING', 'PAID', 'OVERDUE'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status as any)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                                ? 'bg-slate-800 text-white shadow-lg'
                                : 'bg-white text-slate-400 hover:bg-slate-50'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                {filteredInvoices.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="text-slate-400 font-bold">No invoices found matching your criteria.</div>
                    </div>
                )}

                {filteredInvoices.map(invoice => (
                    <div key={invoice.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all group">
                        <div className="flex items-center gap-6" onClick={() => onSelectInvoice(invoice)}>
                            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center cursor-pointer ${invoice.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' :
                                    invoice.status === 'OVERDUE' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                <span className="text-[10px] font-black uppercase">{format(invoice.dateIssued, 'MMM')}</span>
                                <span className="text-xl font-black leading-none">{format(invoice.dateIssued, 'dd')}</span>
                            </div>
                            <div className="cursor-pointer">
                                <div className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{invoice.supplierName}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{invoice.invoiceNumber} • Due {format(invoice.dueDate, 'dd MMM')}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="text-right">
                                <div className="text-xs font-black text-slate-400 uppercase mb-1">Balance Due</div>
                                <div className="text-xl font-black text-slate-900">
                                    {/* Show remaining balance if pending, else total */}
                                    {invoice.status === 'PAID' ? (
                                        <span className="text-emerald-500 flex items-center gap-1 justify-end">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            Paid
                                        </span>
                                    ) : (
                                        <span>{CURRENCY}{(invoice.totalAmount - invoice.amountPaid).toLocaleString()}</span>
                                    )}
                                </div>
                                {invoice.status !== 'PAID' && (
                                    <div className="text-[10px] font-bold text-slate-400">of {CURRENCY}{invoice.totalAmount.toLocaleString()}</div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(invoice.status)}`}>
                                    {invoice.status}
                                </span>
                                {invoice.status !== 'PAID' && (
                                    <button
                                        onClick={() => onRecordPayment(invoice)}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                    >
                                        Pay
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
