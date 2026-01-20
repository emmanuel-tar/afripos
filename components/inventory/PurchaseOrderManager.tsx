import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { usePurchasingStore } from '../../stores/usePurchasingStore'; // Need this for invoicing
import { useAppStore } from '../../stores/useAppStore';
import { PurchaseOrder, Supplier } from '../../types';
import { format } from 'date-fns';
import { CURRENCY } from '../../constants';
import { PurchaseOrderForm } from '../purchasing/PurchaseOrderForm';

export const PurchaseOrderManager: React.FC = () => {
    const { purchaseOrders, suppliers, createPurchaseOrder, receivePurchaseOrder } = useInventoryStore();
    const { addInvoice } = usePurchasingStore();
    const { user } = useAppStore();

    const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | undefined>();
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | undefined>();

    const handleCreatePO = (po: PurchaseOrder) => {
        createPurchaseOrder(po);
        setViewMode('LIST');
    };

    const handleStartCreate = () => {
        // Need to select supplier first? Or select inside form?
        // Let's assume we select inside form if we pass none, but form needs supplier prop?
        // The current form requires a supplier prop. Let's make a quick modal to select supplier FIRST.
        // Simplified: Just use a supplier picker standard.
        // Actually, let's allow selecting supplier in a pre-step or modal.
        setViewMode('CREATE');
    };

    // Quick internal state for the "Select Supplier" step of creation
    const [isSelectingSupplier, setIsSelectingSupplier] = useState(false);

    const onReceive = async (poId: string) => {
        if (confirm("Are you sure you want to receive this stock? Inventory will be updated.")) {
            await receivePurchaseOrder(poId, user?.id || 'sys', user?.name || 'System');
        }
    };

    const onConvertToInvoice = async (po: PurchaseOrder) => {
        if (confirm("Create a Supplier Invoice from this PO?")) {
            await addInvoice({
                id: `INV-${Date.now()}`,
                invoiceNumber: `INV-${po.poNumber}`,
                poId: po.id,
                supplierId: po.supplierId,
                supplierName: po.supplierName,
                dateIssued: Date.now(),
                dueDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // +30 days default
                totalAmount: po.totalAmount,
                amountPaid: 0,
                status: 'PENDING',
                items: po.items,
                notes: `Generated from PO ${po.poNumber}`
            });
            alert("Invoice created successfully in Invoices tab.");
        }
    };

    if (viewMode === 'CREATE') {
        if (!selectedSupplier) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-10">
                    <h2 className="text-2xl font-black text-slate-800 mb-8">Select Supplier for New PO</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
                        {suppliers.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSupplier(s)}
                                className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-xl transition-all text-left group"
                            >
                                <div className="font-black text-xl text-slate-800 group-hover:text-indigo-600 mb-2">{s.name}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase">{s.contactName || 'No Contact'}</div>
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setViewMode('LIST')} className="mt-12 text-slate-400 font-bold hover:text-slate-600">Cancel</button>
                </div>
            );
        }
        return (
            <div className="h-full flex flex-col items-center pt-4">
                <PurchaseOrderForm
                    supplier={selectedSupplier}
                    onSave={handleCreatePO}
                    onCancel={() => { setViewMode('LIST'); setSelectedSupplier(undefined); }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm shrink-0">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Active Purchase Orders</h2>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage Stock Replenishment</div>
                </div>
                <button onClick={handleStartCreate} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all">
                    + New PO
                </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                {purchaseOrders.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="text-slate-400 font-bold">No purchase orders found.</div>
                    </div>
                )}
                {[...purchaseOrders].sort((a, b) => b.dateCreated - a.dateCreated).map(po => (
                    <div key={po.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center ${po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                                <span className="text-[10px] font-black uppercase">{format(po.dateCreated, 'MMM')}</span>
                                <span className="text-xl font-black leading-none">{format(po.dateCreated, 'dd')}</span>
                            </div>
                            <div>
                                <div className="text-lg font-black text-slate-800">{po.poNumber}</div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{po.supplierName} • {po.items.length} Items</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="text-right">
                                <div className="text-xs font-black text-slate-400 uppercase mb-1">Total Value</div>
                                <div className="text-xl font-black text-slate-900">{CURRENCY}{po.totalAmount.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${po.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-700' :
                                        po.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {po.status}
                                </div>

                                {po.status !== 'RECEIVED' && (
                                    <button
                                        onClick={() => onReceive(po.id)}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all"
                                        title="Receive Stock"
                                    >
                                        Receive
                                    </button>
                                )}

                                {po.status === 'RECEIVED' && (
                                    <button
                                        onClick={() => onConvertToInvoice(po)}
                                        className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all"
                                        title="Create Invoice"
                                    >
                                        To Invoice
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
