import React, { useState } from 'react';
import { Supplier, PurchaseOrder, SupplierInvoice, SupplierPayment } from '../../types';
import { format } from 'date-fns';
import { CURRENCY } from '../../constants';

interface SupplierDetailsProps {
    supplier: Supplier;
    purchaseOrders: PurchaseOrder[];
    invoices: SupplierInvoice[];
    payments: SupplierPayment[];
    onClose: () => void;
    onEdit: () => void;
}

export const SupplierDetails: React.FC<SupplierDetailsProps> = ({
    supplier,
    purchaseOrders,
    invoices,
    payments,
    onClose,
    onEdit
}) => {
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'HISTORY' | 'PAYMENTS'>('PROFILE');

    // Derived stats
    const totalOrders = purchaseOrders.length;
    const totalSpent = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.amountPaid), 0);

    // Sort items by date desc
    const sortedPOs = [...purchaseOrders].sort((a, b) => b.dateCreated - a.dateCreated);
    const sortedPayments = [...payments].sort((a, b) => b.date - a.date);

    return (
        <div className="bg-white rounded-[3rem] shadow-2xl h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-8 bg-slate-900 text-white flex justify-between items-start shrink-0">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-4xl font-black">
                        {supplier.name[0]}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">{supplier.name}</h2>
                        <div className="text-emerald-400 font-bold uppercase tracking-widest text-xs mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            {supplier.status} Partner
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={onClose} className="bg-white/10 hover:bg-red-500/20 hover:text-red-400 p-3 rounded-xl transition-all text-white/50">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            {/* Quick Stats Strip */}
            <div className="bg-slate-800 text-white px-8 py-6 grid grid-cols-3 gap-8 shrink-0">
                <div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Orders</div>
                    <div className="text-2xl font-black">{totalOrders}</div>
                </div>
                <div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Lifetime Value</div>
                    <div className="text-2xl font-black text-indigo-400">{CURRENCY}{totalSpent.toLocaleString()}</div>
                </div>
                <div>
                    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Outstanding Balance</div>
                    <div className="text-2xl font-black text-rose-400">{CURRENCY}{totalOutstanding.toLocaleString()}</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-100 px-8 pt-4 bg-white shrink-0">
                {[
                    { id: 'PROFILE', label: 'Profile Info' },
                    { id: 'HISTORY', label: 'Order History' },
                    { id: 'PAYMENTS', label: 'Payment Log' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-800'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                {activeTab === 'PROFILE' && (
                    <div className="space-y-8 max-w-3xl">
                        <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-indigo-500 pl-4">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Person</div>
                                    <div className="text-lg font-bold text-slate-800">{supplier.contactName || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</div>
                                    <div className="text-lg font-bold text-slate-800">{supplier.phone || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</div>
                                    <div className="text-lg font-bold text-slate-800">{supplier.email || 'N/A'}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Physical Address</div>
                                    <div className="text-lg font-bold text-slate-800">{supplier.address || 'N/A'}</div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-purple-500 pl-4">Business Details</h3>
                            <div className="mb-6">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categories</div>
                                <div className="flex flex-wrap gap-2">
                                    {supplier.categories.map(c => (
                                        <span key={c} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">{c}</span>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="space-y-4">
                        {sortedPOs.length === 0 && (
                            <div className="text-center py-20 text-slate-400 font-bold">No purchase history available.</div>
                        )}
                        {sortedPOs.map(po => (
                            <div key={po.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center justify-center font-black">
                                        <span className="text-[10px] uppercase">{format(po.dateCreated, 'MMM')}</span>
                                        <span className="text-xl leading-none">{format(po.dateCreated, 'dd')}</span>
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-slate-800">{po.poNumber}</div>
                                        <div className="text-xs font-bold text-slate-400">{po.items.length} Items • Created by {po.createdBy}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-slate-800">{CURRENCY}{po.totalAmount.toLocaleString()}</div>
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {po.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'PAYMENTS' && (
                    <div className="space-y-4">
                        {sortedPayments.length === 0 && (
                            <div className="text-center py-20 text-slate-400 font-bold">No payment records found.</div>
                        )}
                        {sortedPayments.map(pmt => (
                            <div key={pmt.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between hover:shadow-md transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex flex-col items-center justify-center font-black">
                                        <span className="text-[10px] uppercase">{format(pmt.date, 'MMM')}</span>
                                        <span className="text-xl leading-none">{format(pmt.date, 'dd')}</span>
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-slate-800">{pmt.method} Payment</div>
                                        <div className="text-xs font-bold text-slate-400">Ref: {pmt.reference || 'N/A'} • By {pmt.recordedBy}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-emerald-600">{CURRENCY}{pmt.amount.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
