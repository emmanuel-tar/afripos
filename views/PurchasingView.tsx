
import React, { useState, useEffect } from 'react';
import { PurchaseOrderManager } from '../components/inventory/PurchaseOrderManager';
import { SupplierList } from '../components/purchasing/SupplierList';
import { SupplierForm } from '../components/purchasing/SupplierForm';
import { SupplierDetails } from '../components/purchasing/SupplierDetails';
import { InvoiceList } from '../components/purchasing/InvoiceList';
import { PaymentList } from '../components/purchasing/PaymentList';
import { RecordPaymentModal } from '../components/purchasing/RecordPaymentModal';
import { RFQList } from '../components/purchasing/RFQList';
import { RFQForm } from '../components/purchasing/RFQForm';
import { CreditNoteList } from '../components/purchasing/CreditNoteList';
import { useInventoryStore } from '../stores/useInventoryStore';
import { usePurchasingStore } from '../stores/usePurchasingStore';
import { useFinanceStore } from '../stores/useFinanceStore';
import { Supplier, SupplierInvoice, SupplierPayment, RFQ, CreditNote } from '../types';
import { CURRENCY } from '../constants';

interface PurchasingViewProps {
    onBack: () => void;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PO' | 'INVOICES' | 'PAYMENTS' | 'SUPPLIERS' | 'RFQS' | 'CREDIT_NOTES'>('DASHBOARD');

    // Supplier View Navigation
    const [supplierView, setSupplierView] = useState<'LIST' | 'CREATE' | 'EDIT' | 'DETAILS'>('LIST');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Invoice/Payment State
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoice | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [showRFQForm, setShowRFQForm] = useState(false);

    const { suppliers, addSupplier, updateSupplier, purchaseOrders } = useInventoryStore();
    const { invoices, payments, rfqs, creditNotes, fetchPurchasingData, updateInvoice, addPayment, addRFQ } = usePurchasingStore();
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
            id: `PMT-${Date.now()}`,
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
            id: `EXP-${Date.now()}`,
            category: 'REPLENISHMENT',
            amount: paymentData.amount,
            description: `Invoice Payment #${invoice.invoiceNumber} (${payment.method})`,
            timestamp: Date.now(),
            userId: 'sys',
            userName: 'System'
        });

        setIsPaymentModalOpen(false);
        setSelectedInvoice(null);
    };

    const handleSaveRFQ = async (rfq: RFQ) => {
        await addRFQ(rfq);
        setShowRFQForm(false);
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
                        { id: 'RFQS', label: 'RFQs / Quotations', icon: 'M7 8h10M7 12h4m1 8l4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
                        { id: 'CREDIT_NOTES', label: 'Credit Notes', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                        { id: 'SUPPLIERS', label: 'Suppliers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setSupplierView('LIST'); }}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                                <div className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4">Outstanding Amount</div>
                                <div className="text-4xl font-black text-red-600 mb-1">
                                    {CURRENCY}{invoices.reduce((acc, curr) => curr.status === 'PENDING' || curr.status === 'OVERDUE' ? acc + (curr.totalAmount - curr.amountPaid) : acc, 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">From {invoices.filter(i => i.status === 'PENDING' || i.status === 'OVERDUE').length} invoices</div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                                <div className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4">Month Spending</div>
                                <div className="text-4xl font-black text-emerald-600 mb-1">
                                    {CURRENCY}{payments.filter(p => p.date > Date.now() - 2592000000).reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Last 30 days</div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                                <div className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4">Pending POs</div>
                                <div className="text-4xl font-black text-indigo-600 mb-1">
                                    {purchaseOrders.filter(po => po.status === 'PENDING').length}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Orders in transit</div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden group hover:shadow-xl transition-all">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                                <div className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4">Active RFQs</div>
                                <div className="text-4xl font-black text-slate-800 mb-1">
                                    {rfqs.filter(r => r.status === 'DRAFT' || r.status === 'SENT').length}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Awaiting quotations</div>
                            </div>
                        </div>

                        {/* Recent Activity Mini-Feed */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200">
                                <h3 className="text-xl font-black text-slate-800 mb-8 border-l-4 border-slate-900 pl-4 uppercase tracking-widest">Recent Invoices</h3>
                                <div className="space-y-6">
                                    {invoices.slice(0, 5).map(inv => (
                                        <div key={inv.id} className="flex justify-between items-center pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-black text-slate-900">{inv.supplierName}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">#{inv.invoiceNumber} • {new Date(inv.dateIssued).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-slate-900">{CURRENCY}{inv.totalAmount.toLocaleString()}</div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${inv.status === 'PAID' ? 'text-emerald-500' : 'text-red-500'}`}>{inv.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {invoices.length === 0 && <div className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs">No recent invoices</div>}
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200">
                                <h3 className="text-xl font-black text-slate-800 mb-8 border-l-4 border-emerald-500 pl-4 uppercase tracking-widest">Available Credits</h3>
                                <div className="space-y-6">
                                    {creditNotes.filter(n => n.status === 'DRAFT').slice(0, 5).map(note => (
                                        <div key={note.id} className="flex justify-between items-center pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-black text-slate-900 truncate max-w-[150px]">
                                                    {suppliers.find(s => s.id === note.supplierId)?.name || 'Supplier'}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Ref: {note.invoiceId}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-emerald-600">{CURRENCY}{note.amount.toLocaleString()}</div>
                                                <div className="text-[9px] font-medium italic text-slate-400">"{note.reason}"</div>
                                            </div>
                                        </div>
                                    ))}
                                    {creditNotes.filter(n => n.status === 'DRAFT').length === 0 && <div className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs">No active credit notes</div>}
                                </div>
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
                            onSelectInvoice={(inv) => {/* View Invoice Detail - TODO */ }}
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

                {activeTab === 'RFQS' && (
                    <div className="p-10 h-full">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-slate-800">Requests for Quotation</h2>
                            <button
                                onClick={() => setShowRFQForm(true)}
                                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all"
                            >
                                + New RFQ
                            </button>
                        </div>
                        <RFQList
                            rfqs={rfqs}
                            onView={(rfq) => {/* TODO */ }}
                        />
                    </div>
                )}

                {activeTab === 'CREDIT_NOTES' && (
                    <div className="p-10 h-full">
                        <h2 className="text-3xl font-black text-slate-800 mb-8">Credit Notes</h2>
                        <CreditNoteList creditNotes={creditNotes} />
                    </div>
                )}
            </div>

            {/* Modals */}
            {showRFQForm && (
                <RFQForm
                    onSave={handleSaveRFQ}
                    onCancel={() => setShowRFQForm(false)}
                />
            )}
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

