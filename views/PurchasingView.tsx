```
import React, { useState, useEffect } from 'react';
import { PurchaseOrderManager } from '../components/inventory/PurchaseOrderManager';
import { SupplierList } from '../components/purchasing/SupplierList';
import { SupplierForm } from '../components/purchasing/SupplierForm';
import { SupplierDetails } from '../components/purchasing/SupplierDetails';
import { InvoiceList } from '../components/purchasing/InvoiceList';
import { PaymentList } from '../components/purchasing/PaymentList';
import { RecordPaymentModal } from '../components/purchasing/RecordPaymentModal';
import { useInventoryStore } from '../stores/useInventoryStore';
import { usePurchasingStore } from '../stores/usePurchasingStore';
import { useFinanceStore } from '../stores/useFinanceStore'; 
import { Supplier, SupplierInvoice, SupplierPayment } from '../types';
import { CURRENCY } from '../constants';

interface PurchasingViewProps {
    onBack: () => void;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PO' | 'INVOICES' | 'PAYMENTS' | 'SUPPLIERS'>('DASHBOARD');
    
    // Supplier View Navigation
    const [supplierView, setSupplierView] = useState<'LIST' | 'CREATE' | 'EDIT' | 'DETAILS'>('LIST');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Invoice/Payment State
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const { suppliers, addSupplier, updateSupplier, purchaseOrders } = useInventoryStore();
    const { invoices, payments, fetchPurchasingData, updateInvoice, addPayment } = usePurchasingStore();
    const { addExpense } = useFinanceStore();

    useEffect(() => {
        fetchPurchasingData();
    }, []);

    const handleSaveSupplier = async (supplier: Supplier) => {
        if (supplierView === 'CREATE') {
            await addSupplier(supplier);
        } else {
            await updateSupplier(supplier);
        }
        setSupplierView('LIST');
        setSelectedSupplier(null);
    };

    const handleRecordPayment = async (paymentData: Partial<SupplierPayment>) => {
        if (!paymentData.invoiceId || !paymentData.amount) return;
        
        const invoice = invoices.find(i => i.id === paymentData.invoiceId);
        if (!invoice) return;

        // 1. Create Payment
        const payment: SupplierPayment = {
            id: `PMT - ${ Date.now() } `,
            invoiceId: paymentData.invoiceId,
            supplierId: paymentData.supplierId!,
            amount: paymentData.amount,
            date: Date.now(),
            method: paymentData.method || 'CASH',
            reference: paymentData.reference,
            recordedBy: 'Admin' // TODO: Context
        };
        await addPayment(payment);

        // 2. Update Invoice Status
        const newPaidAmount = invoice.amountPaid + paymentData.amount;
        const newStatus = newPaidAmount >= invoice.totalAmount ? 'PAID' : 'PENDING';
        
        await updateInvoice({
            ...invoice,
            amountPaid: newPaidAmount,
            status: newStatus
        });

        // 3. Record Expense in Finance
        await addExpense({
             id: `EXP - ${ Date.now() } `,
             category: 'REPLENISHMENT',
             amount: paymentData.amount,
             description: `Invoice Payment #${ invoice.invoiceNumber } (${ payment.method })`,
             timestamp: Date.now(),
             userId: 'sys',
             userName: 'System'
        });

        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
    };

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
                        { id: 'PAYMENTS', label: 'Payments', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { id: 'SUPPLIERS', label: 'Suppliers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setSupplierView('LIST'); }}
                            className={`w - full flex items - center gap - 4 px - 6 py - 4 rounded - 2xl transition - all ${ activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white' } `}
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
                                <div className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-2">Month Spending</div>
                                <div className="text-4xl font-black text-emerald-600">{CURRENCY}{payments.filter(p => p.date > Date.now() - 2592000000).reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</div>
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
                    <div className="p-6 h-full">
                        {supplierView === 'LIST' && (
                            <>
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-3xl font-black text-slate-800">Suppliers</h2>
                                </div>
                                <SupplierList 
                                    onSelectSupplier={(s) => { setSelectedSupplier(s); setSupplierView('DETAILS'); }}
                                    onAddNew={() => { setSelectedSupplier(null); setSupplierView('CREATE'); }}
                                />
                            </>
                        )}
                         {(supplierView === 'CREATE' || supplierView === 'EDIT') && (
                            <div className="flex justify-center pt-8">
                                <SupplierForm 
                                    initialData={selectedSupplier || {}}
                                    onSave={handleSaveSupplier}
                                    onCancel={() => { setSupplierView('LIST'); setSelectedSupplier(null); }}
                                />
                            </div>
                        )}

                        {supplierView === 'DETAILS' && selectedSupplier && (
                            <SupplierDetails 
                                supplier={selectedSupplier}
                                purchaseOrders={purchaseOrders.filter(po => po.supplierId === selectedSupplier.id)}
                                invoices={invoices.filter(inv => inv.supplierId === selectedSupplier.id)}
                                payments={payments.filter(p => p.supplierId === selectedSupplier.id)}
                                onClose={() => { setSupplierView('LIST'); setSelectedSupplier(null); }}
                                onEdit={() => setSupplierView('EDIT')}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'INVOICES' && (
                    <div className="p-6 h-full">
                       <InvoiceList 
                          invoices={invoices}
                          onSelectInvoice={(inv) => {/* View Invoice Detail - TODO */}}
                          onRecordPayment={(inv) => { setSelectedInvoice(inv); setIsPaymentModalOpen(true); }}
                       />
                    </div>
                )}
                
                 {activeTab === 'PAYMENTS' && (
                     <div className="p-6 h-full">
                        <PaymentList 
                            payments={payments} 
                            suppliers={suppliers} 
                        />
                    </div>
                 )}
            </div>

            {/* Modals */}
            {isPaymentModalOpen && selectedInvoice && (
                <RecordPaymentModal 
                    invoice={selectedInvoice}
                    onSave={handleRecordPayment}
                    onCancel={() => { setIsPaymentModalOpen(false); setSelectedInvoice(null); }}
                />
            )}
        </div>
    );
};
```
