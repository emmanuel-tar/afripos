import React, { useState } from 'react';
import { useCRMStore } from '../../../stores/useCRMStore';
import { Customer } from '../../../types';

interface CustomerSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { customers } = useCRMStore();
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-8 border-b border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">Select Guest</h3>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-lg"
                        autoFocus
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                            <button
                                key={customer.id}
                                onClick={() => onSelect(customer)}
                                className="w-full text-left bg-white p-6 rounded-3xl border border-slate-100 hover:border-indigo-600 hover:shadow-lg transition-all group"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-xl font-black text-slate-800 group-hover:text-indigo-600">{customer.name}</div>
                                        <div className="flex items-center gap-4 mt-1">
                                            {customer.phone && <div className="text-xs font-bold text-slate-400">{customer.phone}</div>}
                                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {customer.loyaltyPoints} Pts
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-20 text-slate-400 font-bold">
                            No guests found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
