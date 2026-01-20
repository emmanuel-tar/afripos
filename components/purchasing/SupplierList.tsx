import React, { useState, useMemo } from 'react';
import { Supplier } from '../../types';
import { useInventoryStore } from '../../stores/useInventoryStore';

interface SupplierListProps {
    onSelectSupplier: (supplier: Supplier) => void;
    onAddNew: () => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({ onSelectSupplier, onAddNew }) => {
    const { suppliers } = useInventoryStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');

    // Extract unique categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        suppliers.forEach(s => s.categories.forEach(c => cats.add(c)));
        return Array.from(cats);
    }, [suppliers]);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.contactName?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'ALL' || s.categories.includes(categoryFilter);
            return matchesSearch && matchesCategory;
        });
    }, [suppliers, searchTerm, categoryFilter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="w-full md:w-1/3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Search Suppliers</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                            placeholder="Search name, contact person..."
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                <div className="w-full md:w-1/3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category Filter</label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                    >
                        <option value="ALL">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <button
                    onClick={onAddNew}
                    className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    Add Supplier
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map(supplier => (
                    <div
                        key={supplier.id}
                        onClick={() => onSelectSupplier(supplier)}
                        className="group bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 cursor-pointer transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-150 group-hover:bg-indigo-100"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {supplier.name[0]}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${supplier.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {supplier.status}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{supplier.name}</h3>
                            <div className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                {supplier.contactName || 'No contact person'}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {supplier.categories.map(c => (
                                    <span key={c} className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}

                {filteredSuppliers.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400">
                        <p className="font-bold">No suppliers found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
