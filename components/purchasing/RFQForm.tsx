import React, { useState } from 'react';
import { RFQ, Supplier, RawMaterial, Product } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';

interface RFQFormProps {
    onSave: (rfq: RFQ) => void;
    onCancel: () => void;
}

export const RFQForm: React.FC<RFQFormProps> = ({ onSave, onCancel }) => {
    const { suppliers, materials, products } = useInventoryStore();

    const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
    const [items, setItems] = useState<{ materialName: string; quantity: number; unit: string; }[]>([]);
    const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const [newItem, setNewItem] = useState({ materialName: '', quantity: 1, unit: 'pcs' });

    const handleAddSupplier = (id: string) => {
        if (!selectedSupplierIds.includes(id)) {
            setSelectedSupplierIds([...selectedSupplierIds, id]);
        }
    };

    const handleRemoveSupplier = (id: string) => {
        setSelectedSupplierIds(selectedSupplierIds.filter(sid => sid !== id));
    };

    const handleAddItem = () => {
        if (!newItem.materialName) return;
        setItems([...items, { ...newItem }]);
        setNewItem({ materialName: '', quantity: 1, unit: 'pcs' });
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSupplierIds.length === 0 || items.length === 0) {
            alert("Please select at least one supplier and add at least one item.");
            return;
        }

        const rfq: RFQ = {
            id: `RFQ-${Date.now()}`,
            rfqNumber: `RFQ-${Math.floor(1000 + Math.random() * 9000)}`,
            supplierIds: selectedSupplierIds,
            items: items,
            status: 'DRAFT',
            dateCreated: Date.now(),
            deadline: new Date(deadline).getTime()
        };

        onSave(rfq);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-3xl font-black text-slate-800">New RFQ</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Request for Quotation</p>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {/* Suppliers Selection */}
                    <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-indigo-600 pl-4">Target Suppliers & Timeline</h4>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Supplier</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                                        onChange={(e) => handleAddSupplier(e.target.value)}
                                        value=""
                                    >
                                        <option value="">Choose Supplier...</option>
                                        {suppliers.filter(s => !selectedSupplierIds.includes(s.id)).map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.categories?.join(', ')})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Response Deadline</label>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={e => setDeadline(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selected ({selectedSupplierIds.length})</label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSupplierIds.map(id => (
                                        <div key={id} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border border-indigo-100">
                                            {suppliers.find(s => s.id === id)?.name}
                                            <button onClick={() => handleRemoveSupplier(id)} className="hover:text-red-500">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                    {selectedSupplierIds.length === 0 && (
                                        <div className="text-xs text-slate-300 font-bold italic py-2">No suppliers selected yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Items Section */}
                    <section>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-emerald-500 pl-4">Requested Items</h4>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 mb-8 grid grid-cols-12 gap-4 items-end">
                            <div className="col-span-6">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Item Name / Description</label>
                                <input
                                    type="text"
                                    value={newItem.materialName}
                                    onChange={e => setNewItem({ ...newItem, materialName: e.target.value })}
                                    list="inventory-suggestions"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                                    placeholder="e.g. Premium Basmati Rice"
                                />
                                <datalist id="inventory-suggestions">
                                    {materials.map(m => <option key={m.id} value={m.name} />)}
                                    {products.map(p => <option key={p.id} value={p.name} />)}
                                </datalist>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Qty</label>
                                <input
                                    type="number"
                                    value={newItem.quantity}
                                    onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit</label>
                                <input
                                    type="text"
                                    value={newItem.unit}
                                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                                    placeholder="kg"
                                />
                            </div>
                            <div className="col-span-2">
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="w-full bg-indigo-600 text-white p-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">{index + 1}</div>
                                        <div>
                                            <div className="text-sm font-black text-slate-800">{item.materialName}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{item.quantity} {item.unit}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveItem(index)} className="text-slate-300 hover:text-red-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                            {items.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 font-bold uppercase tracking-widest text-xs">
                                    No items added to this request.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-6">
                    <button
                        onClick={onCancel}
                        className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-xs"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={items.length === 0 || selectedSupplierIds.length === 0}
                        className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all disabled:opacity-50"
                    >
                        Create & Save RFQ
                    </button>
                </div>
            </div>
        </div>
    );
};
