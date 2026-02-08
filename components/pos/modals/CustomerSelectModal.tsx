import React, { useState } from 'react';
import { useCRMStore } from '../../../stores/useCRMStore';
import { Customer } from '../../../types';
import { toast } from 'sonner';

interface CustomerSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

export const CustomerSelectModal: React.FC<CustomerSelectModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { customers, isLoading, addCustomer } = useCRMStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegMode, setIsRegMode] = useState(false);
    const [regData, setRegData] = useState({ name: '', phone: '' });

    if (!isOpen) return null;

    const handleQuickReg = (e: React.FormEvent) => {
        e.preventDefault();
        if (!regData.name) return;

        const newCustomer: Customer = {
            id: `CUST-${Math.random().toString(36).substr(2, 9)}`,
            name: regData.name,
            phone: regData.phone,
            loyaltyPoints: 0,
            creditBalance: 0,
            totalSpent: 0,
            lastVisit: Date.now(),
            wallets: { cash: 0, promotional: 0, refund: 0, locked: 0 }
        };

        addCustomer(newCustomer);
        onSelect(newCustomer);
        toast.success(`Registered and selected ${newCustomer.name}`);
        setIsRegMode(false);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-8 border-b border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Select Guest</h3>
                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Loyalty & Accounts</div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setIsRegMode(!isRegMode);
                                    if (!isRegMode) setRegData({ name: searchTerm, phone: '' });
                                }}
                                className={`${isRegMode ? 'bg-slate-100 text-slate-600' : 'bg-indigo-600 text-white'} px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg flex items-center gap-2`}
                            >
                                <span>{isRegMode ? '← Search' : '+ Guest'}</span>
                            </button>
                            <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
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
                    {isRegMode ? (
                        <form onSubmit={handleQuickReg} className="p-6 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 animate-in slide-in-from-top-4 duration-300">
                            <div className="text-center mb-8">
                                <div className="text-xl font-black text-slate-800 tracking-tight">Quick Registration</div>
                                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Add guest to database instantly</div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ebuka Davies"
                                        value={regData.name}
                                        onChange={e => setRegData({ ...regData, name: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Phone (Optional)</label>
                                    <input
                                        type="tel"
                                        placeholder="080 123 4567"
                                        value={regData.phone}
                                        onChange={e => setRegData({ ...regData, phone: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-black outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                    />
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 shadow-xl transition-all mt-4">
                                    Register & Select
                                </button>
                            </div>
                        </form>
                    ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Guest List...</div>
                        </div>
                    ) : filteredCustomers.length > 0 ? (
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
