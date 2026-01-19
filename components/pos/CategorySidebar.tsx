import React from 'react';
import { CATEGORIES } from '../../constants';
import clsx from 'clsx';

interface CategorySidebarProps {
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    onBack: () => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
    selectedCategory,
    onSelectCategory,
    onBack
}) => {
    return (
        <div className="w-56 bg-slate-900 flex flex-col p-3 gap-2 shadow-2xl z-20">
            <button onClick={onBack} className="mb-6 flex items-center gap-3 p-4 text-white bg-white/5 rounded-2xl hover:bg-white/10 transition-all font-bold border border-white/5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back
            </button>
            {CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => onSelectCategory(cat)}
                    className={clsx(
                        "p-4 rounded-2xl text-left font-bold text-sm transition-all",
                        selectedCategory === cat
                            ? 'bg-indigo-600 text-white shadow-xl translate-x-1'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
};
