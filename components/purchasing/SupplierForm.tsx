import React, { useState } from 'react';
import { Supplier } from '../../types';

interface SupplierFormProps {
    initialData?: Partial<Supplier>;
    onSave: (supplier: Supplier) => void;
    onCancel: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        categories: [],
        status: 'ACTIVE',
        ...initialData
    });

    const [activeHelp, setActiveHelp] = useState<string | null>(null);

    const helpContent: Record<string, string> = {
        name: "The official registered name of the supplier company.",
        contactName: "Primary point of contact for orders and billing inquiries.",
        categories: "Tags to organize suppliers (e.g., 'Produce', 'Beverages'). Helps in filtering.",
        status: "Set to 'INACTIVE' to hide from selection in new Purchase Orders."
    };

    const toggleCategory = (cat: string) => {
        const cats = formData.categories || [];
        if (cats.includes(cat)) {
            setFormData({ ...formData, categories: cats.filter(c => c !== cat) });
        } else {
            setFormData({ ...formData, categories: [...cats, cat] });
        }
    };

    const commonCategories = ['Produce', 'Meat', 'Beverages', 'Dry Goods', 'Packaging', 'Equipment', 'Services'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        const supplier: Supplier = {
            id: initialData?.id || `sup-${Date.now()}`,
            name: formData.name,
            contactName: formData.contactName || '',
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            categories: formData.categories || [],
            status: formData.status || 'ACTIVE'
        };
        onSave(supplier);
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-2xl w-full mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                        {initialData?.id ? 'Edit Supplier' : 'New Supplier'}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                        {initialData?.id ? 'Update partner details' : 'Register a new business partner'}
                    </p>
                </div>
                <button onClick={onCancel} className="text-slate-400 hover:text-red-500 transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative group">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Company Name <span className="text-red-500">*</span>
                        <button type="button" onClick={() => setActiveHelp(activeHelp === 'name' ? null : 'name')} className="text-indigo-400 hover:text-indigo-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </label>
                    {activeHelp === 'name' && (
                        <div className="absolute left-0 -top-8 bg-slate-800 text-white text-xs p-2 rounded-lg z-10 w-64 shadow-lg animate-fade-in-up">
                            {helpContent.name}
                        </div>
                    )}
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                        placeholder="e.g. Acme Foods Ltd."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Contact Person
                            <button type="button" onClick={() => setActiveHelp(activeHelp === 'contactName' ? null : 'contactName')} className="text-indigo-400 hover:text-indigo-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                        </label>
                        {activeHelp === 'contactName' && (
                            <div className="absolute left-0 -top-12 bg-slate-800 text-white text-xs p-2 rounded-lg z-10 w-64 shadow-lg">
                                {helpContent.contactName}
                            </div>
                        )}
                        <input
                            type="text"
                            value={formData.contactName}
                            onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                            placeholder="e.g. John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                            placeholder="+234..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                        placeholder="orders@supplier.com"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Physical Address</label>
                    <textarea
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all min-h-[100px]"
                        placeholder="Full office or warehouse address..."
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Categories
                        <button type="button" onClick={() => setActiveHelp(activeHelp === 'categories' ? null : 'categories')} className="text-indigo-400 hover:text-indigo-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                    </label>
                    {activeHelp === 'categories' && (
                        <div className="absolute left-0 -mt-10 bg-slate-800 text-white text-xs p-2 rounded-lg z-10 w-64 shadow-lg">
                            {helpContent.categories}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        {commonCategories.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => toggleCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${formData.categories?.includes(cat)
                                        ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                                        : 'bg-white text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Account Status
                    </label>
                    <div className="flex bg-slate-50 p-1 rounded-xl w-fit">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, status: 'ACTIVE' })}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.status === 'ACTIVE' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, status: 'INACTIVE' })}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.status === 'INACTIVE' ? 'bg-white text-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Inactive
                        </button>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button type="button" onClick={onCancel} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">
                        Cancel
                    </button>
                    <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-2xl transition-all transform hover:-translate-y-1">
                        Save Supplier
                    </button>
                </div>
            </form>
        </div>
    );
};
