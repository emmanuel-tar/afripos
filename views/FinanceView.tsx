
import React, { useEffect, useMemo, useState } from 'react';
import { useFinanceStore } from '../stores/useFinanceStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { getOrders } from '../services/db';
import { Expense, Order, Product } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CURRENCY = '₦';

interface FinanceViewProps {
    onBack: () => void;
}

const FinanceView: React.FC<FinanceViewProps> = ({ onBack }) => {
    const { expenses, fetchExpenses, addExpense, removeExpense } = useFinanceStore();
    const { products, materials } = useInventoryStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        category: 'OTHER',
        amount: 0,
        description: ''
    });

    useEffect(() => {
        fetchExpenses();
        setOrders(getOrders());
    }, [fetchExpenses]);

    const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);

    const financialMetrics = useMemo(() => {
        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

        // Calculate COGS approximately
        let totalCOGS = 0;
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.id);
                if (product && product.ingredients) {
                    let itemCost = 0;
                    product.ingredients.forEach(ing => {
                        const material = materials.find(m => m.id === ing.materialId);
                        if (material) {
                            itemCost += ing.amount * material.costPerUnit;
                        }
                    });
                    totalCOGS += itemCost * item.quantity;
                } else if (product?.costPrice) {
                    totalCOGS += product.costPrice * item.quantity;
                }
            });
        });

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenses;

        return {
            totalRevenue,
            totalCOGS,
            totalExpenses,
            grossProfit,
            netProfit,
            margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        };
    }, [completedOrders, expenses, products, materials]);

    const handleAddExpense = () => {
        if (!newExpense.amount || !newExpense.description) {
            toast.error("Please fill in all expense details.");
            return;
        }

        const expense: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            category: newExpense.category as any,
            amount: Number(newExpense.amount),
            description: newExpense.description,
            timestamp: Date.now(),
            userId: 'admin', // Placeholder
            userName: 'System Admin' // Placeholder
        };

        addExpense(expense);
        setIsExpenseModalOpen(false);
        setNewExpense({ category: 'OTHER', amount: 0, description: '' });
        toast.success("Expense recorded successfully.");
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 h-screen overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-12 py-8 shrink-0">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2 cursor-pointer hover:text-indigo-700" onClick={onBack}>← Back to Dashboard</div>
                        <h2 className="text-5xl font-black text-slate-800 tracking-tight">Finance & Profits</h2>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsExpenseModalOpen(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all flex items-center gap-2">
                            <span>+</span> Record Expense
                        </button>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Revenue</div>
                        <div className="text-3xl font-black text-slate-800">{CURRENCY}{financialMetrics.totalRevenue.toLocaleString()}</div>
                        <div className="mt-2 text-[10px] font-bold text-emerald-500 uppercase">{completedOrders.length} Completed Orders</div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operating Expenses</div>
                        <div className="text-3xl font-black text-red-600">{CURRENCY}{financialMetrics.totalExpenses.toLocaleString()}</div>
                        <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase">{expenses.length} Entries</div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gross Profit</div>
                        <div className="text-3xl font-black text-indigo-600">{CURRENCY}{financialMetrics.grossProfit.toLocaleString()}</div>
                        <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase">After COGS ({CURRENCY}{financialMetrics.totalCOGS.toLocaleString()})</div>
                    </div>
                    <div className={`p-8 rounded-[3rem] border shadow-lg ${financialMetrics.netProfit >= 0 ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
                        <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-4">Net Profit</div>
                        <div className="text-4xl font-black">{CURRENCY}{financialMetrics.netProfit.toLocaleString()}</div>
                        <div className="mt-2 text-[10px] font-bold uppercase tracking-widest">
                            {financialMetrics.margin.toFixed(1)}% Net Margin
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 flex flex-col lg:flex-row gap-12">
                {/* Expenses List */}
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-8">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Expense Journal</h3>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="space-y-4">
                        {expenses.sort((a, b) => b.timestamp - a.timestamp).map(expense => (
                            <div key={expense.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex justify-between items-center group hover:border-indigo-600 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs">
                                        {expense.category[0]}
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">{expense.category}</div>
                                        <div className="text-lg font-black text-slate-800">{expense.description}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">{format(expense.timestamp, 'dd MMM yyyy • HH:mm')}</div>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-8">
                                    <div>
                                        <div className="text-xl font-black text-red-600">-{CURRENCY}{expense.amount.toLocaleString()}</div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase">Recorded by {expense.userName}</div>
                                    </div>
                                    <button onClick={() => removeExpense(expense.id)} className="opacity-0 group-hover:opacity-100 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {expenses.length === 0 && (
                            <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-300 text-center">
                                <div className="text-slate-300 font-black text-xl uppercase tracking-widest">No expenses recorded yet</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Stats */}
                <div className="w-full lg:w-96 shrink-0 space-y-8">
                    <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                        <h4 className="text-lg font-black uppercase tracking-widest mb-6 border-b border-white/10 pb-4 text-indigo-400">P&L Quick Look</h4>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-white/40 uppercase">Revenue</span>
                                <span className="font-black">{CURRENCY}{financialMetrics.totalRevenue.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-white/40 uppercase">COGS</span>
                                <span className="font-black text-red-400">-{CURRENCY}{financialMetrics.totalCOGS.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-white/40 uppercase">Operating Exp</span>
                                <span className="font-black text-red-400">-{CURRENCY}{financialMetrics.totalExpenses.toLocaleString()}</span>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="text-xs font-black text-white/60 uppercase">Net Income</span>
                                <span className={`text-2xl font-black ${financialMetrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {CURRENCY}{financialMetrics.netProfit.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-indigo-600 px-10 py-8 text-white">
                            <h3 className="text-3xl font-black tracking-tight">Record Expense</h3>
                            <p className="text-indigo-100 font-bold text-sm">Log operational costs for your branch.</p>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Category</label>
                                    <select
                                        value={newExpense.category}
                                        onChange={e => setNewExpense({ ...newExpense, category: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="REPLENISHMENT">Replenishment</option>
                                        <option value="RENT">Rent</option>
                                        <option value="UTILITIES">Utilities</option>
                                        <option value="REPAIRS">Repairs</option>
                                        <option value="SALARY">Staff Salary</option>
                                        <option value="MARKETING">Marketing</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Amount ({CURRENCY})</label>
                                    <input
                                        type="number"
                                        value={newExpense.amount || ''}
                                        onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Description</label>
                                <input
                                    type="text"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    placeholder="e.g. Electricity bill for Dec"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setIsExpenseModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Cancel</button>
                                <button onClick={handleAddExpense} className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">Record Entry</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceView;
