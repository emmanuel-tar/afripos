import React, { useState } from 'react';
import { ProductionOrder, Recipe, ProductionOrderStatus } from '../../types';
import { useManufacturingStore } from '../../stores/useManufacturingStore';
import { useAppStore } from '../../stores/useAppStore';

interface ProductionOrderFormProps {
    onSave: (order: ProductionOrder) => void;
    onCancel: () => void;
}

const ProductionOrderForm: React.FC<ProductionOrderFormProps> = ({ onSave, onCancel }) => {
    const { recipes } = useManufacturingStore();
    const { user, terminalConfig } = useAppStore();

    const [recipeId, setRecipeId] = useState('');
    const [plannedQuantity, setPlannedQuantity] = useState(1);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedRecipe = recipes.find(r => r.id === recipeId);
        if (!selectedRecipe) return;

        const order: ProductionOrder = {
            id: `po-${Date.now()}`,
            orderNumber: `MFG-${Math.floor(1000 + Math.random() * 9000)}`,
            recipeId,
            recipeName: selectedRecipe.name,
            plannedQuantity,
            status: 'PLANNED',
            notes,
            createdBy: user?.name || 'System',
            createdAt: Date.now(),
            locationId: terminalConfig?.warehouseId || 'primary'
        };
        onSave(order);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Schedule Production</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Initialize Manufacturing Order</p>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Recipe</label>
                            <select
                                value={recipeId}
                                onChange={e => setRecipeId(e.target.value)}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm transition-all"
                            >
                                <option value="">Choose Recipe...</option>
                                {recipes.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} (Yields {r.yieldQuantity} {r.yieldUnit})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Planned Production Quantity</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    value={plannedQuantity}
                                    onChange={e => setPlannedQuantity(Number(e.target.value))}
                                    min="1"
                                    required
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm text-2xl"
                                />
                                <div className="text-slate-400 font-black uppercase text-xs tracking-widest">
                                    {recipes.find(r => r.id === recipeId)?.yieldUnit || 'units'}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Floor Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm min-h-[120px]"
                                placeholder="e.g. Expedited batch for evening service..."
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={!recipeId}
                            className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all disabled:opacity-50"
                        >
                            Initialize Order
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductionOrderForm;
