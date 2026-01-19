import React, { useMemo } from 'react';
import { Product } from '../../types';
import { MOCK_PRODUCTS } from '../../constants';

interface ProductGridProps {
    selectedCategory: string;
    currency: string;
    onProductClick: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
    selectedCategory,
    currency,
    onProductClick
}) => {
    const filteredProducts = useMemo(() =>
        MOCK_PRODUCTS.filter(p => p.category === selectedCategory),
        [selectedCategory]
    );

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
                <button
                    key={product.id}
                    onClick={() => onProductClick(product)}
                    className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all text-left group flex flex-col h-full relative"
                >
                    <div className="relative mb-4 overflow-hidden rounded-2xl h-40 shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="font-black text-slate-800 text-lg leading-tight mb-2">{product.name}</div>
                    <div className="mt-auto flex items-center justify-between">
                        <div className="text-indigo-600 font-black text-xl">{currency}{product.price.toLocaleString()}</div>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-inner">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};
