
import React, { useState } from 'react';
import { PurchaseOrderManager } from '../components/inventory/PurchaseOrderManager';
import { useInventoryStore } from '../stores/useInventoryStore';
import { usePurchasingStore } from '../stores/usePurchasingStore';
import { Supplier, PurchaseOrder, SupplierInvoice } from '../types';
import { format } from 'date-fns';
import { CURRENCY } from '../constants';
import { toast } from 'sonner';

interface PurchasingViewProps {
    onBack: () => void;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PO' | 'INVOICES' | 'PAYMENTS' | 'SUPPLIERS'>('DASHBOARD');
    const { suppliers, addSupplier, deleteSupplier } = useInventoryStore();
    const { invoices, addInvoice, payments, addPayment } = usePurchasingStore();

    // Temporary mock data or derived data could be here

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar / Tabs */}
            <div className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
                <div className="p-8">
                    <button onClick={onBack} className="text-white/60 font-bold flex items-center gap-2 mb-6 hover:text-white transition-colors text-xs uppercase tracking-widest">
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-black tracking-tight mb-2">Purchasing</h1>
                    <p className="text-white/40 text-xs font-medium">Procurement Management</p>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { id: 'DASHBOARD', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                        { id: 'PO', label: 'Purchase Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                        { id: 'INVOICES', label: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                        { id: 'PAYMENTS', label: 'Payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { id: 'SUPPLIERS', label: 'Suppliers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                            <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'DASHBOARD' && (
                    <div className="p-10">
                        <h2 className="text-3xl font-black text-slate-800 mb-8">Overview</h2>
                        <div className="grid grid-cols-3 gap-8 mb-12">
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                                <div className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">Pending Invoices</div>
                                <div className="text-4xl font-black text-slate-800">{invoices.filter(i => i.status === 'PENDING').length}</div>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                                <div className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">Outstanding Amount</div>
                                <div className="text-4xl font-black text-red-600">{CURRENCY}{invoices.reduce((acc, curr) => curr.status === 'PENDING' ? acc + (curr.totalAmount - curr.amountPaid) : acc, 0).toLocaleString()}</div>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                                <div className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">Total Paid (Month)</div>
                                <div className="text-4xl font-black text-emerald-600">{CURRENCY}0</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'PO' && (
                    <div className="p-6 h-full flex flex-col">
                        <PurchaseOrderManager />
                    </div>
                )}

                {activeTab === 'SUPPLIERS' && (
                    <div className="p-10">
                        <div className="flex justify-between mb-8">
                            <h2 className="text-3xl font-black text-slate-800">Suppliers</h2>
                            <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest">+ Add Supplier</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {suppliers.map(s => (
                                <div key={s.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-black text-slate-800">{s.name}</h3>
                                    <div className="text-sm text-slate-500 mt-2">{s.categories.join(', ')}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'INVOICES' && (
                    <div className="p-10">
                        <h2 className="text-3xl font-black text-slate-800 mb-8">Invoices</h2>
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-10 text-center text-slate-400">
                            <p>No invoices found. Convert a Received PO to an Invoice to see it here.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
