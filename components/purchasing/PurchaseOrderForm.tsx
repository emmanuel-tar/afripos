import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseOrder, PurchaseOrderItem, Supplier } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { CURRENCY } from '../../constants';
import { format } from 'date-fns';

interface PurchaseOrderFormProps {
    initialData?: Partial<PurchaseOrder>;
    supplier?: Supplier;
    onSave: (po: PurchaseOrder) => void;
    onCancel: () => void;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ initialData, supplier, onSave, onCancel }) => {
    const { materials, products } = useInventoryStore();
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [poData, setPoData] = useState<Partial<PurchaseOrder>>({
        items: [],
        notes: '',
        dateCreated: Date.now(),
        status: 'DRAFT',
        ...initialData
    });

    // Derived Calculations
    const calculations = useMemo(() => {
        const items = poData.items || [];
        const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

        // Summing up individual item discounts/taxes if we tracked them per item
        // But for this form, we might want global or per line. 
        // Let's implement per-line tax/discount for maximum flexibility as requested.

        let totalDiscount = 0;
        let totalTax = 0;

        items.forEach(item => {
            // specific logic: if discount is percentage or fixed? Let's assume percentage for now based on typical use
            const lineTotal = item.unitPrice * item.quantity;
            const discountAmount = (item.discount || 0) / 100 * lineTotal;
            const taxableAmount = lineTotal - discountAmount;
            const taxAmount = (item.taxRate || 0) / 100 * taxableAmount;

            totalDiscount += discountAmount;
            totalTax += taxAmount;
        });

        const grandTotal = subtotal - totalDiscount + totalTax;

        return { subtotal, totalDiscount, totalTax, grandTotal };
    }, [poData.items]);

    // Item Selection Logic
    const availableItems = useMemo(() => {
        if (!searchTerm) return [];
        const lowerSearch = searchTerm.toLowerCase();

        const rawMatches = materials
            .filter(m => m.name.toLowerCase().includes(lowerSearch) || m.barcode?.toLowerCase().includes(lowerSearch))
            .map(m => ({
                id: m.id,
                name: m.name,
                barcode: m.barcode,
                type: 'RAW_MATERIAL' as const,
                unit: m.unit,
                cost: m.costPerUnit
            }));

        const productMatches = products
            .filter(p => p.name.toLowerCase().includes(lowerSearch) || p.barcode?.toLowerCase().includes(lowerSearch))
            .map(p => ({
                id: p.id,
                name: p.name,
                barcode: p.barcode,
                type: 'PRODUCT' as const,
                unit: p.unit || 'unit',
                cost: p.costPrice || 0
            }));

        return [...rawMatches, ...productMatches];
    }, [searchTerm, materials, products]);

    const handleAddItem = (item: any) => {
        const newItem: PurchaseOrderItem = {
            itemId: item.id,
            type: item.type,
            name: item.name,
            quantity: 1,
            unit: item.unit,
            unitPrice: item.cost,
            discount: 0,
            taxRate: 0,
            total: item.cost
        };

        setPoData(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem]
        }));
        setSearchTerm('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission

            // Scanner usually sends exact barcode + Enter
            // Check for exact barcode match first
            const exactMatch = availableItems.find(i => i.barcode === searchTerm || i.name.toLowerCase() === searchTerm.toLowerCase());

            if (exactMatch) {
                handleAddItem(exactMatch);
            } else if (availableItems.length === 1) {
                // Determine if close enough or just auto-select unique result
                handleAddItem(availableItems[0]);
            }
        }
    };

    const updateLineItem = (index: number, field: keyof PurchaseOrderItem, value: number) => {
        setPoData(prev => {
            const newItems = [...(prev.items || [])];
            const item = { ...newItems[index], [field]: value };

            // Recalculate line total
            const lineTotalRaw = item.quantity * item.unitPrice;
            const discountAmt = (item.discount || 0) / 100 * lineTotalRaw;
            const taxAmt = (item.taxRate || 0) / 100 * (lineTotalRaw - discountAmt);
            item.total = lineTotalRaw - discountAmt + taxAmt;

            newItems[index] = item;
            return { ...prev, items: newItems };
        });
    };

    const removeLineItem = (index: number) => {
        setPoData(prev => ({
            ...prev,
            items: prev.items?.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = () => {
        if (!supplier || !poData.items?.length) return;

        const finalPO: PurchaseOrder = {
            id: initialData?.id || `PO-${Date.now()}`,
            poNumber: initialData?.poNumber || `PO-${format(Date.now(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000)}`,
            supplierId: supplier.id,
            supplierName: supplier.name,
            items: poData.items,
            subtotal: calculations.subtotal,
            discountAmount: calculations.totalDiscount,
            taxAmount: calculations.totalTax,
            totalAmount: calculations.grandTotal,
            status: 'DRAFT', // Always save as draft first? Or allow status change. Let's keep existing status.
            dateCreated: initialData?.dateCreated || Date.now(),
            createdBy: 'Current User', // TODO: Get from context
            notes: poData.notes
        };

        onSave(finalPO);
    };

    return (
        <div className="bg-white rounded-[3rem] shadow-2xl flex flex-col h-full max-h-[90vh] overflow-hidden w-full max-w-5xl mx-auto">
            {/* Header */}
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Purchase Order</h2>
                    <div className="text-indigo-400 font-bold uppercase tracking-widest text-xs mt-1">
                        {supplier?.name} • {format(Number(poData.dateCreated || Date.now()), 'dd MMM yyyy')}
                    </div>
                </div>
                <button onClick={onCancel} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Item Search */}
                <div className="relative z-20">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Add Items (Search Name or Scan Barcode)
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                        placeholder="Type item name or scan barcode..."
                        autoFocus
                    />

                    {/* Search Results Dropdown */}
                    {searchTerm && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                            {availableItems.length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-xs font-bold">No results found</div>
                            ) : (
                                availableItems.map(item => (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => handleAddItem(item)}
                                        className="w-full text-left p-4 hover:bg-indigo-50 border-b border-slate-50 last:border-0 flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                {item.name}
                                                {item.barcode && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">#{item.barcode}</span>}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type.replace('_', ' ')}</div>
                                        </div>
                                        <div className="text-indigo-600 font-black opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                                            + Add
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Line Items Table */}
                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Item Description</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Qty</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-32">Price</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Disc %</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Tax %</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-32">Total</th>
                                <th className="p-6 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {poData.items?.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase">{item.type} • {item.unit}</div>
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={e => updateLineItem(index, 'quantity', Number(e.target.value))}
                                            className="w-full bg-slate-100 rounded-xl px-2 py-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.unitPrice}
                                            onChange={e => updateLineItem(index, 'unitPrice', Number(e.target.value))}
                                            className="w-full bg-slate-100 rounded-xl px-2 py-2 text-right font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.discount}
                                            onChange={e => updateLineItem(index, 'discount', Number(e.target.value))}
                                            className="w-full bg-slate-100 rounded-xl px-2 py-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={item.taxRate}
                                            onChange={e => updateLineItem(index, 'taxRate', Number(e.target.value))}
                                            className="w-full bg-slate-100 rounded-xl px-2 py-2 text-center font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                                        />
                                    </td>
                                    <td className="p-6 text-right font-black text-slate-800">
                                        {CURRENCY}{item.total.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => removeLineItem(index)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!poData.items || poData.items.length === 0) && (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-400 font-bold italic">
                                        No items added. Search above to start building your order.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Notes</label>
                        <textarea
                            value={poData.notes}
                            onChange={e => setPoData({ ...poData, notes: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none h-32 resize-none"
                            placeholder="Delivery instructions, payment terms, or other remarks..."
                        />
                    </div>
                    <div className="bg-slate-50 rounded-[2rem] p-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Subtotal</span>
                            <span className="text-lg font-black text-slate-800">{CURRENCY}{calculations.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600">
                            <span className="text-xs font-bold uppercase tracking-wide">Discount</span>
                            <span className="text-lg font-black">-{CURRENCY}{calculations.totalDiscount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-amber-600">
                            <span className="text-xs font-bold uppercase tracking-wide">Tax</span>
                            <span className="text-lg font-black">+{CURRENCY}{calculations.totalTax.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Grand Total</span>
                            <span className="text-3xl font-black text-indigo-600">{CURRENCY}{calculations.grandTotal.toLocaleString()}</span>
                        </div>

                        <button
                            disabled={!poData.items?.length}
                            onClick={handleSubmit}
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none mt-4"
                        >
                            Save Purchase Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
