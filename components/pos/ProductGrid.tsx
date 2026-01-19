import React, { useMemo } from 'react';
import { Product, RawMaterial } from '../../types';
import { getProductProductionMetrics } from '../../utils/inventoryUtils';

interface ProductGridProps {
    selectedCategory: string;
    currency: string;
    onProductClick: (product: Product) => void;
    products: Product[];
    materials: RawMaterial[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({
    selectedCategory,
    currency,
    onProductClick,
    products,
    materials
}) => {
    const filteredProducts = useMemo(() =>
        products.filter(p => p.category === selectedCategory),
        [selectedCategory, products]
    );

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
                const metrics = getProductProductionMetrics(product, materials);
                const isUnavailable = metrics.status === 'UNAVAILABLE';

                return (
                    <button
                        key={product.id}
                        onClick={() => !isUnavailable && onProductClick(product)}
                        disabled={isUnavailable}
                        className={`bg-white p-5 rounded-[2rem] border shadow-sm transition-all text-left group flex flex-col h-full relative ${isUnavailable
                                ? 'opacity-60 grayscale border-slate-200 cursor-not-allowed'
                                : 'hover:shadow-xl hover:border-indigo-200 border-slate-200'
                            }`}
                    >
                        {isUnavailable && (
                            <div className="absolute top-4 right-4 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-md">
                                Out of Stock
                            </div>
                        )}
                        <div className="relative mb-4 overflow-hidden rounded-2xl h-40 shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="font-black text-slate-800 text-lg leading-tight mb-2">{product.name}</div>
                        <div className="mt-auto flex items-center justify-between">
                            <div className="text-indigo-600 font-black text-xl">{currency}{product.price.toLocaleString()}</div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-inner ${isUnavailable
                                    ? 'bg-slate-100 text-slate-300'
                                    : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'
                                }`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
