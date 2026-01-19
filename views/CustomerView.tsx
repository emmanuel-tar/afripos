
import React, { useEffect, useState, useMemo } from 'react';
import { useCRMStore } from '../stores/useCRMStore';
import { Customer } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CURRENCY = '₦';

interface CustomerViewProps {
    onBack: () => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ onBack }) => {
    const { customers, fetchCustomers, addCustomer, updateCustomer, removeCustomer, awardPoints, redeemPoints, updateBalance } = useCRMStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customers, searchTerm]);

    const handleSaveCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCustomer?.name) return;

        if (editingCustomer.id) {
            updateCustomer(editingCustomer as Customer);
            toast.success("Customer profile updated.");
        } else {
            const newCustomer: Customer = {
                ...(editingCustomer as Customer),
                id: `CUST-${Math.random().toString(36).substr(2, 9)}`,
                loyaltyPoints: 0,
                creditBalance: 0,
                totalSpent: 0,
                lastVisit: Date.now()
            };
            addCustomer(newCustomer);
            toast.success("New customer registered.");
        }
        setIsCustomerModalOpen(false);
        setEditingCustomer(null);
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 h-screen overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-12 py-8 shrink-0">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2 cursor-pointer hover:text-indigo-700" onClick={onBack}>← Back to Dashboard</div>
                        <h2 className="text-5xl font-black text-slate-800 tracking-tight">CRM & Guests</h2>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => {
                            const data = JSON.stringify(customers, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `customers-${format(new Date(), 'yyyy-MM-dd')}.json`;
                            a.click();
                        }} className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-indigo-600 transition-all">
                            Export
                        </button>
                        <button onClick={() => { setEditingCustomer({}); setIsCustomerModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all flex items-center gap-2">
                            <span>+</span> Register Guest
                        </button>
                    </div>
                </div>

                {/* Search & Metrics */}
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                    <div className="flex-1 relative w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="Search by name, phone or email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-10 py-5 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                    <div className="flex gap-6 shrink-0">
                        <div className="bg-white px-8 py-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Guests</div>
                                <div className="text-xl font-black text-slate-800">{customers.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredCustomers.map(customer => (
                        <div key={customer.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-600 transition-all group relative overflow-hidden flex flex-col">
                            <div className="p-10 pb-6 flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl uppercase">
                                        {customer.name[0]}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loyalty Points</div>
                                        <div className="text-2xl font-black text-amber-600">{customer.loyaltyPoints.toLocaleString()} PTS</div>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">{customer.name}</h3>
                                <div className="space-y-2 text-sm font-bold text-slate-500 mb-8">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        {customer.phone || 'No phone'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        {customer.email || 'No email'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pb-8 border-t border-slate-50 pt-8">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Wallet Balance</div>
                                        <div className={`text-xl font-black ${customer.creditBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {CURRENCY}{customer.creditBalance.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Spent</div>
                                        <div className="text-xl font-black text-slate-800">{CURRENCY}{customer.totalSpent.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 flex gap-3 mt-auto border-t border-slate-100">
                                <button onClick={() => { setEditingCustomer(customer); setIsCustomerModalOpen(true); }} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-600 transition-all">Edit Guest</button>
                                <button onClick={() => {
                                    const amount = Number(prompt("Enter top-up amount:"));
                                    if (amount) {
                                        updateBalance(customer.id, amount);
                                        toast.success(`Added ${CURRENCY}${amount} to ${customer.name}'s wallet`);
                                    }
                                }} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">Top Up</button>
                                <button onClick={() => {
                                    const points = Number(prompt(`Redeem points (Available: ${customer.loyaltyPoints})\nRate: 1 Point = ${CURRENCY}1`));
                                    if (points && points <= customer.loyaltyPoints) {
                                        redeemPoints(customer.id, points);
                                        toast.success(`Redeemed ${points} points for ${CURRENCY}${points} credit`);
                                    } else if (points > customer.loyaltyPoints) {
                                        toast.error("Insufficient points");
                                    }
                                }} className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-violet-700 shadow-lg shadow-violet-100 transition-all">Redeem</button>
                            </div>
                        </div>
                    ))}
                    {filteredCustomers.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-[3.5rem] border border-dashed border-slate-300">
                            <div className="text-slate-300 font-black text-xl uppercase tracking-widest">No matching guests found</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Customer Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCustomerModalOpen(false)}></div>
                    <form onSubmit={handleSaveCustomer} className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-indigo-600 px-10 py-10 text-white">
                            <h3 className="text-3xl font-black tracking-tight">{editingCustomer?.id ? 'Update Guest' : 'New Guest Registration'}</h3>
                            <p className="text-indigo-100 font-bold text-sm">Grow your loyalty database.</p>
                        </div>
                        <div className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingCustomer?.name || ''}
                                    onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                    placeholder="e.g. Ebuka Davies"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={editingCustomer?.phone || ''}
                                        onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                        placeholder="080 123 4567"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={editingCustomer?.email || ''}
                                        onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                                        placeholder="guest@example.com"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Physical Address</label>
                                <textarea
                                    value={editingCustomer?.address || ''}
                                    onChange={e => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                                    placeholder="Street address city..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all h-24"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">Complete Registration</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CustomerView;
