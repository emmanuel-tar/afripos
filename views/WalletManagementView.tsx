import React, { useState, useMemo } from 'react';
import { useCRMStore } from '../stores/useCRMStore';
import { useWalletStore } from '../stores/useWalletStore';
import { useAppStore } from '../stores/useAppStore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { WalletType, WalletTransactionType } from '../types';
import WalletSummaryCard from '../components/crm/WalletSummaryCard';
import WalletLedger from '../components/crm/WalletLedger';

const CURRENCY = '₦';

const WalletManagementView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { customers, updateCustomer } = useCRMStore();
    const { transactions, topUp, deduct, expirePromotional } = useWalletStore();
    const { user } = useAppStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWalletType, setSelectedWalletType] = useState<WalletType | 'ALL'>('ALL');

    const metrics = useMemo(() => {
        return customers.reduce((acc, c) => {
            if (!c.wallets) return acc;
            acc.totalCash += c.wallets.cash || 0;
            acc.totalPromo += c.wallets.promotional || 0;
            acc.totalRefund += c.wallets.refund || 0;
            acc.totalLocked += c.wallets.locked || 0;
            return acc;
        }, { totalCash: 0, totalPromo: 0, totalRefund: 0, totalLocked: 0 });
    }, [customers]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm)
        ).sort((a, b) => (b.wallets?.cash || 0) - (a.wallets?.cash || 0));
    }, [customers, searchTerm]);

    const handleBulkExpire = async () => {
        if (!window.confirm("Are you sure you want to expire ALL promotional credits for ALL customers? This action is immutable.")) return;

        let count = 0;
        for (const customer of customers) {
            if (customer.wallets?.promotional > 0) {
                await expirePromotional(customer.id, user?.id || 'SYS', user?.name || 'System');
                count++;
            }
        }
        toast.success(`Expired promotional credits for ${count} customers`);
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 h-screen overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-12 py-8 shrink-0">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2 cursor-pointer hover:text-indigo-700" onClick={onBack}>← Back to Dashboard</div>
                        <h2 className="text-5xl font-black text-slate-800 tracking-tight">Wallet Master</h2>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleBulkExpire}
                            className="bg-white border border-red-200 text-red-500 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-50 transition-all font-black"
                        >
                            Expire All Promo Credits
                        </button>
                        <button onClick={() => {
                            const data = JSON.stringify(transactions, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `wallet-ledger-${format(new Date(), 'yyyy-MM-dd')}.json`;
                            a.click();
                        }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-slate-100 uppercase tracking-widest text-xs hover:bg-black transition-all">
                            Export Master Ledger
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-4 gap-6">
                    <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Cash Liability</div>
                        <div className="text-3xl font-black font-mono">{CURRENCY}{metrics.totalCash.toLocaleString()}</div>
                    </div>
                    <div className="bg-amber-500 p-6 rounded-3xl text-white shadow-xl shadow-amber-100">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Promo Float</div>
                        <div className="text-3xl font-black font-mono">{CURRENCY}{metrics.totalPromo.toLocaleString()}</div>
                    </div>
                    <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-100">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Refund Balances</div>
                        <div className="text-3xl font-black font-mono">{CURRENCY}{metrics.totalRefund.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-3xl text-white shadow-xl shadow-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Locked (Res)</div>
                        <div className="text-3xl font-black font-mono">{CURRENCY}{metrics.totalLocked.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex p-12 gap-12">
                {/* Left: Customer List */}
                <div className="w-1/3 flex flex-col gap-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search guests..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {filteredCustomers.map(customer => (
                            <div key={customer.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-600 transition-all group flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                                        {customer.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-800 text-sm">{customer.name}</div>
                                        <div className="text-[10px] font-bold text-slate-400">{customer.phone}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-slate-900 font-mono">{CURRENCY}{(customer.wallets?.cash || 0).toLocaleString()}</div>
                                    <div className="text-[9px] font-black text-emerald-600 uppercase">Available</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Master Ledger */}
                <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Global Transaction Audit</h3>
                        <div className="flex gap-2">
                            {['ALL', 'CASH', 'PROMOTIONAL', 'REFUND'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedWalletType(type as any)}
                                    className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${selectedWalletType === type ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-slate-600'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 p-8 overflow-hidden">
                        <WalletLedger
                            transactions={transactions.filter(tx => selectedWalletType === 'ALL' || tx.walletType === selectedWalletType)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletManagementView;
