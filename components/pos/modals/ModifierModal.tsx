import React, { useState } from 'react';
import { Product, Modifier } from '../../../types';
import clsx from 'clsx';
import { MOCK_MODIFIERS } from '../../../constants'; // Or passed as prop

interface ModifierModalProps {
    product: Product;
    onClose: () => void;
    onAddToCart: (product: Product, modifiers: Modifier[]) => void;
    currency: string;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({
    product,
    onClose,
    onAddToCart,
    currency
}) => {
    const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);

    const toggleModifier = (mod: Modifier) => {
        if (selectedModifiers.find(m => m.id === mod.id)) {
            setSelectedModifiers(prev => prev.filter(m => m.id !== mod.id));
        } else {
            setSelectedModifiers(prev => [...prev, mod]);
        }
    };

    const handleAdd = () => {
        onAddToCart(product, selectedModifiers);
        onClose();
    };

    // Assuming product.availableModifiers is populated, or using MOCK
    const modifiers = product.availableModifiers || MOCK_MODIFIERS;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-10 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-2">{product.name}</h3>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Select Modifiers & Add-ons</p>
                </div>

                <div className="p-8 overflow-y-auto grid gap-4">
                    {modifiers.map(mod => {
                        const isSelected = !!selectedModifiers.find(m => m.id === mod.id);
                        return (
                            <button
                                key={mod.id}
                                onClick={() => toggleModifier(mod)}
                                className={clsx(
                                    "flex items-center justify-between p-6 rounded-3xl border-2 transition-all group",
                                    isSelected ? 'border-indigo-600 bg-indigo-50 shadow-inner' : 'border-slate-100 hover:border-indigo-200'
                                )}
                            >
                                <span className={clsx("font-black text-lg", isSelected ? 'text-indigo-900' : 'text-slate-700')}>{mod.name}</span>
                                <span className={clsx("font-bold text-sm", isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600')}>
                                    +{currency}{mod.price.toLocaleString()}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="p-8 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
                    <button onClick={onClose} className="py-5 font-black text-slate-400 uppercase tracking-widest text-xs hover:text-slate-600">Cancel</button>
                    <button onClick={handleAdd} className="py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-indigo-100 uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">
                        Add to Order
                    </button>
                </div>
            </div>
        </div>
    );
};
