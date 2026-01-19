import React, { useState } from 'react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useAppStore } from '../../stores/useAppStore'; // Assumed for user context
import { PurchaseOrder, PurchaseOrderItem } from '../../types';
import { format } from 'date-fns';
import { CURRENCY } from '../../constants';

export const PurchaseOrderManager: React.FC = () => {
    const { purchaseOrders, suppliers, materials, createPurchaseOrder, receivePurchaseOrder } = useInventoryStore();
    const { user } = useAppStore(); // Need to ensure useAppStore is safe to use here or pass user as prop
    // Actually, InventoryView used user from useAppStore. I'll duplicate that pattern.

    const [isPOModalOpen, setIsPOModalOpen] = useState(false);
    const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>({
        items: [],
        supplierId: '',
        notes: ''
    });

    const addPOItem = (materialId: string) => {
        const mat = materials.find(m => m.id === materialId);
        if (!mat) return;
        const existing = newPO.items?.find(i => i.materialId === materialId);
        if (existing) return;

        const newItem: PurchaseOrderItem = {
            materialId,
            materialName: mat.name,
            quantity: 1,
            unit: mat.unit,
            unitPrice: mat.costPerUnit,
            total: mat.costPerUnit
        };

        setNewPO(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }));
    };

    const updatePOItem = (id: string, field: keyof PurchaseOrderItem, value: any) => {
        setNewPO(prev => ({
            ...prev,
            items: prev.items?.map(item => {
                if (item.materialId === id) {
                    const updated = { ...item, [field]: value };
                    updated.total = updated.quantity * updated.unitPrice;
                    return updated;
                }
                return item;
            })
        }));
    };

    const handleSavePO = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPO.supplierId || !newPO.items?.length) return;

        const supplier = suppliers.find(s => s.id === newPO.supplierId);
        const subtotal = newPO.items.reduce((sum, item) => sum + item.total, 0);

        const po: PurchaseOrder = {
            id: `PO-${Date.now()}`,
            poNumber: `PO-${format(Date.now(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000)}`,
            supplierId: newPO.supplierId,
            supplierName: supplier?.name || 'Unknown',
            items: newPO.items as PurchaseOrderItem[],
            subtotal,
            totalAmount: subtotal,
            status: 'PENDING',
            dateCreated: Date.now(),
            createdBy: user?.name || 'Admin', // Fallback if user is missing
            notes: newPO.notes
        };

        createPurchaseOrder(po);
        setIsPOModalOpen(false);
        setNewPO({ items: [], supplierId: '', notes: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">Active Purchase Orders</h2>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage Stock Replenishment</div>
                </div>
                <button onClick={() => setIsPOModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all">
                    + New PO
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {purchaseOrders.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="text-slate-400 font-bold">No purchase orders found.</div>
                    </div>
                )}
                {purchaseOrders.map(po => (
                    <div key={po.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase">{format(po.dateCreated, 'MMM')}</span>
                                <span className="text-xl font-black text-slate-800 leading-none">{format(po.dateCreated, 'dd')}</span>
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
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest ${po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {po.status}
                                </span>
                                {po.status !== 'RECEIVED' && (
                                    <button onClick={() => receivePurchaseOrder(po.id, user?.id || 'sys', user?.name || 'System')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                                        Receive Stock
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create PO Modal */}
            {isPOModalOpen && (
                <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Draft Purchase Order</h3>
                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Stock Replenishment Form</div>
                            </div>
                            <button onClick={() => setIsPOModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSavePO} className="flex-1 overflow-y-auto p-10 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Supplier</label>
                                    <select required value={newPO.supplierId} onChange={e => setNewPO({ ...newPO, supplierId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold">
                                        <option value="">Choose Supplier...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Notes</label>
                                    <input type="text" value={newPO.notes || ''} onChange={e => setNewPO({ ...newPO, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Optional delivery instructions..." />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Line Items</h4>
                                    <select className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black py-2 px-4 rounded-xl outline-none" onChange={e => { if (e.target.value) addPOItem(e.target.value); e.target.value = ""; }}>
                                        <option value="">+ Add Material</option>
                                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    {newPO.items?.length === 0 && (
                                        <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs">
                                            No items added to this purchase order yet.
                                        </div>
                                    )}
                                    {newPO.items?.map(item => (
                                        <div key={item.materialId} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center gap-6">
                                            <div className="flex-1 min-w-[200px]">
                                                <div className="text-sm font-black text-slate-800">{item.materialName}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase">{item.unit}</div>
                                            </div>
                                            <div className="w-24">
                                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Qty</label>
                                                <input type="number" required value={item.quantity} onChange={e => updatePOItem(item.materialId, 'quantity', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black" />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Price ({CURRENCY})</label>
                                                <input type="number" required value={item.unitPrice} onChange={e => updatePOItem(item.materialId, 'unitPrice', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black" />
                                            </div>
                                            <div className="w-32 text-right">
                                                <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Total</div>
                                                <div className="text-sm font-black text-slate-900">{CURRENCY}{item.total.toLocaleString()}</div>
                                            </div>
                                            <button type="button" onClick={() => setNewPO(prev => ({ ...prev, items: prev.items?.filter(i => i.materialId !== item.materialId) }))} className="text-slate-300 hover:text-red-500">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total Balance</div>
                                    <div className="text-3xl font-black text-slate-900">{CURRENCY}{newPO.items?.reduce((s, i) => s + i.total, 0).toLocaleString()}</div>
                                </div>
                                <button type="submit" disabled={!newPO.supplierId || !newPO.items?.length} className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black shadow-2xl shadow-indigo-100 uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50">
                                    Generate PO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
