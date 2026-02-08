import React, { useState } from 'react';
import { Recipe, RecipeIngredient, Product, RawMaterial } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { useAppStore } from '../../stores/useAppStore';

interface RecipeFormProps {
    initialData?: Partial<Recipe>;
    onSave: (recipe: Recipe) => void;
    onCancel: () => void;
}

const RecipeForm: React.FC<RecipeFormProps> = ({ initialData, onSave, onCancel }) => {
    const { materials, products } = useInventoryStore();
    const { user } = useAppStore();

    const [name, setName] = useState(initialData?.name || '');
    const [productId, setProductId] = useState(initialData?.productId || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [yieldQuantity, setYieldQuantity] = useState(initialData?.yieldQuantity || 1);
    const [yieldUnit, setYieldUnit] = useState(initialData?.yieldUnit || 'kg');
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>(initialData?.ingredients || []);
    const [laborCost, setLaborCost] = useState(initialData?.laborCost || 0);
    const [overheadCost, setOverheadCost] = useState(initialData?.overheadCost || 0);

    const [selectedMaterialId, setSelectedMaterialId] = useState('');
    const [ingredientQty, setIngredientQty] = useState(1);

    const handleAddIngredient = () => {
        const material = materials.find(m => m.id === selectedMaterialId);
        if (material) {
            const existing = ingredients.find(i => i.materialId === selectedMaterialId);
            if (existing) {
                setIngredients(ingredients.map(i => i.materialId === selectedMaterialId
                    ? { ...i, quantity: i.quantity + ingredientQty }
                    : i
                ));
            } else {
                setIngredients([...ingredients, {
                    materialId: material.id,
                    materialName: material.name,
                    quantity: ingredientQty,
                    unit: material.unit || 'units',
                    costPerUnit: material.costPerUnit || 0
                }]);
            }
            setSelectedMaterialId('');
            setIngredientQty(1);
        }
    };

    const handleRemoveIngredient = (id: string) => {
        setIngredients(ingredients.filter(i => i.materialId !== id));
    };

    const calculateTotalCost = () => {
        const ingredientCost = ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.costPerUnit), 0);
        return ingredientCost + laborCost + overheadCost;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedProduct = products.find(p => p.id === productId);

        const recipe: Recipe = {
            id: initialData?.id || `rcp-${Date.now()}`,
            name,
            productId,
            productName: selectedProduct?.name || 'Unknown Product',
            description,
            yieldQuantity,
            yieldUnit,
            ingredients,
            laborCost,
            overheadCost,
            totalCost: calculateTotalCost(),
            createdBy: user?.name || 'System',
            createdAt: initialData?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        onSave(recipe);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">{initialData?.id ? 'Edit Recipe' : 'New Recipe'}</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Production Specification</p>
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-red-500 transition-colors">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex">
                    {/* Left: Basic Info */}
                    <div className="w-2/5 p-10 border-r border-slate-100 space-y-8 bg-slate-50/30">
                        <div className="space-y-6">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">General Details</h4>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recipe Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                                    placeholder="e.g. Master Tomato Sauce"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Product</label>
                                <select
                                    value={productId}
                                    onChange={e => setProductId(e.target.value)}
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                                >
                                    <option value="">Select Finished Good...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Yield Qty</label>
                                    <input
                                        type="number"
                                        value={yieldQuantity}
                                        onChange={e => setYieldQuantity(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Yield Unit</label>
                                    <input
                                        type="text"
                                        value={yieldUnit}
                                        onChange={e => setYieldUnit(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                                        placeholder="kg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Additional Costs</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Labor Cost</label>
                                    <input
                                        type="number"
                                        value={laborCost}
                                        onChange={e => setLaborCost(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Overhead</label>
                                    <input
                                        type="number"
                                        value={overheadCost}
                                        onChange={e => setOverheadCost(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl mt-8">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Estimated Cost</div>
                            <div className="text-4xl font-black">₦{calculateTotalCost().toLocaleString()}</div>
                            <div className="mt-4 text-[10px] font-bold text-slate-500 uppercase">Per {yieldQuantity} {yieldUnit}</div>
                        </div>
                    </div>

                    {/* Right: Ingredients */}
                    <div className="flex-1 p-10 flex flex-col">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-l-4 border-amber-500 pl-4">Ingredient Composition</h4>

                        <div className="flex gap-4 mb-8">
                            <div className="flex-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Select Raw Material</label>
                                <select
                                    value={selectedMaterialId}
                                    onChange={e => setSelectedMaterialId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                                >
                                    <option value="">Choose Material...</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.quantity} {m.unit} in stock)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-24">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Qty</label>
                                <input
                                    type="number"
                                    value={ingredientQty}
                                    onChange={e => setIngredientQty(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleAddIngredient}
                                disabled={!selectedMaterialId}
                                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest self-end hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50 h-[46px]"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {ingredients.map(ing => (
                                <div key={ing.materialId} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-indigo-200 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-indigo-600 text-sm">
                                            {ing.materialName[0]}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-800">{ing.materialName}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">{ing.quantity} {ing.unit} • ₦{(ing.quantity * ing.costPerUnit).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveIngredient(ing.materialId)}
                                        className="text-slate-200 hover:text-red-500 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            ))}
                            {ingredients.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-bold uppercase tracking-widest text-xs">
                                    No ingredients added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name || !productId || ingredients.length === 0}
                        className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all disabled:opacity-50"
                    >
                        Save Recipe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeForm;
