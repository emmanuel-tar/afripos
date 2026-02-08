import React, { useState } from 'react';
import { Order, Payment, PaymentMethod, Customer } from '../../types';
import { toast } from 'sonner';
import { useCRMStore } from '../../stores/useCRMStore';
import { useWalletStore } from '../../stores/useWalletStore';
import { useAppStore } from '../../stores/useAppStore';

interface PaymentModalProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onComplete: (payments: Payment[]) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ order, isOpen, onComplete, onClose }) => {
    const totalAmount = order.subtotal * 1.075;
    const [payments, setPayments] = useState<Partial<Payment>[]>([]);
    const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null);
    const [cashTendered, setCashTendered] = useState<string>('');
    const [isConfirming, setIsConfirming] = useState(false);

    const customers = useCRMStore(state => state.customers);
    const orderCustomer = order.customerId ? customers.find(c => c.id === order.customerId) : null;
    const walletStore = useWalletStore();
    const currentUser = useAppStore(state => state.user);

    const amountPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const remaining = totalAmount - amountPaid;

    const handleAddPayment = (method: PaymentMethod, amount: number, extra = {}) => {
        const newPayment: Payment = {
            id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            method,
            amount,
            timestamp: Date.now(),
            ...extra
        };
        setPayments([...payments, newPayment]);
        setCurrentMethod(null);
        setCashTendered('');
    };

    const handleConfirmTransaction = () => {
        if (amountPaid < totalAmount) {
            toast.error(`Incomplete payment. Remaining: ₦${remaining.toLocaleString()}`);
            return;
        }
        onComplete(payments as Payment[]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-[95%] h-[90vh] bg-slate-50 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
                {/* Left: Summary */}
                <div className="md:w-[400px] w-full bg-white border-r border-slate-200 flex flex-col p-6 sm:p-10 shrink-0">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">Secure Checkout</h3>

                    <div className="space-y-6 mb-auto">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Due</div>
                            <div className="text-4xl font-black text-slate-900 font-mono">₦{totalAmount.toLocaleString()}</div>
                        </div>

                        <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Paid</div>
                            <div className="text-3xl font-black text-indigo-600 font-mono">₦{amountPaid.toLocaleString()}</div>
                        </div>

                        {remaining > 0 && (
                            <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Balance Remaining</div>
                                <div className="text-3xl font-black text-red-600 font-mono">₦{remaining.toLocaleString()}</div>
                            </div>
                        )}

                        {amountPaid > totalAmount && (
                            <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                                <div className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Change to Return</div>
                                <div className="text-3xl font-black text-green-600 font-mono">₦{(amountPaid - totalAmount).toLocaleString()}</div>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Active Terminal</div>
                        <div className="flex items-center justify-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-600 uppercase">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            TERMINAL: #TM-8821
                        </div>
                    </div>
                </div>

                {/* Right: Interaction */}
                <div className="flex-1 flex flex-col overflow-hidden h-full">
                    <div className="p-10 border-b border-slate-200 bg-white flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Payment Method</span>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12">
                        {!currentMethod ? (
                            <div className="grid grid-cols-2 gap-6">
                                <button onClick={() => setCurrentMethod('CASH')} className="h-44 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-indigo-600 hover:shadow-2xl transition-all group flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    </div>
                                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Cash</span>
                                </button>
                                <button onClick={() => setCurrentMethod('POS')} className="h-44 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-indigo-600 hover:shadow-2xl transition-all group flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                    </div>
                                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Card / POS</span>
                                </button>
                                <button onClick={() => setCurrentMethod('TRANSFER')} className="h-44 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-indigo-600 hover:shadow-2xl transition-all group flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    </div>
                                    <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Bank Transfer</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!orderCustomer) {
                                            toast.error("This order is not linked to a guest. Add guest to use wallet.");
                                            return;
                                        }
                                        setCurrentMethod('WALLET');
                                    }}
                                    className={`h-44 bg-white rounded-[2rem] border-2 border-slate-100 transition-all group flex flex-col items-center justify-center gap-4 ${!orderCustomer ? 'opacity-50 grayscale' : 'hover:border-indigo-600 hover:shadow-2xl'}`}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                    </div>
                                    <div className="text-center px-4">
                                        <span className="text-sm font-black text-slate-800 uppercase tracking-widest block">Wallet Balance</span>
                                        {orderCustomer && (
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase">₦{(orderCustomer.wallets?.cash || 0).toLocaleString()} Available</span>
                                        )}
                                    </div>
                                </button>
                                <button onClick={() => toast.info("Split logic enabled. Multiple methods can be added sequentiallly.")} className="h-44 bg-slate-900 rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-4 text-white opacity-50 cursor-not-allowed">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 4a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2V4zm-7 8a2 2 0 012-2h4a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1z" /></svg>
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-widest">Split Details</span>
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 animate-in slide-in-from-bottom-5">
                                <button onClick={() => setCurrentMethod(null)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-6 hover:translate-x-[-4px] transition-transform">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                                    Back to methods
                                </button>

                                <h4 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Processing {currentMethod} Payment</h4>

                                {currentMethod === 'CASH' ? (
                                    <div className="space-y-8">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Amount Tendered (₦)</label>
                                            <input
                                                autoFocus
                                                type="number"
                                                value={cashTendered}
                                                onChange={(e) => setCashTendered(e.target.value)}
                                                placeholder={`Enter amount (e.g. ${remaining})`}
                                                className="w-full text-5xl font-black bg-slate-50 border-none rounded-3xl p-8 focus:ring-4 ring-indigo-50 transition-all font-mono"
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[1000, 2000, 5000, 10000].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => setCashTendered(val.toString())}
                                                    className="p-4 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-sm hover:bg-indigo-100 transition-colors"
                                                >
                                                    ₦{val.toLocaleString()}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setCashTendered(remaining.toString())}
                                                className="col-span-2 p-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-black transition-colors"
                                            >
                                                EXACT: ₦{remaining.toLocaleString()}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleAddPayment('CASH', parseFloat(cashTendered), { cashTendered: parseFloat(cashTendered), changeGiven: Math.max(0, parseFloat(cashTendered) - remaining) })}
                                            className="w-full py-6 rounded-3xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                                        >
                                            Add Cash Payment
                                        </button>
                                    </div>
                                ) : currentMethod === 'WALLET' ? (
                                    <div className="space-y-8">
                                        {(() => {
                                            const cashBalance = orderCustomer?.wallets?.cash || 0;
                                            const creditLimit = orderCustomer?.creditConfig?.isEnabled ? orderCustomer.creditConfig.creditLimit : 0;
                                            const currentCreditUsed = Math.max(0, -cashBalance);
                                            const availableCredit = creditLimit - currentCreditUsed;

                                            return (
                                                <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white flex flex-col items-center">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-40">Wallet Liquidity</div>
                                                    <div className="flex gap-8">
                                                        <div className="text-center">
                                                            <div className="text-[8px] font-black uppercase opacity-60">Liquid Cash</div>
                                                            <div className="text-2xl font-black font-mono">₦{cashBalance.toLocaleString()}</div>
                                                        </div>
                                                        {orderCustomer?.creditConfig?.isEnabled && (
                                                            <div className="text-center border-l border-white/10 pl-8">
                                                                <div className="text-[8px] font-black uppercase opacity-60 text-emerald-400">Available Credit</div>
                                                                <div className="text-2xl font-black font-mono text-emerald-100">₦{availableCredit.toLocaleString()}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Amount to Deduct (₦)</label>
                                            <input
                                                autoFocus
                                                type="number"
                                                value={cashTendered}
                                                onChange={(e) => setCashTendered(e.target.value)}
                                                placeholder={`Max: ${Math.min(remaining, (orderCustomer?.wallets?.cash || 0))}`}
                                                className="w-full text-5xl font-black bg-slate-50 border-none rounded-3xl p-8 focus:ring-4 ring-indigo-50 transition-all font-mono"
                                            />
                                        </div>

                                        <button
                                            onClick={async () => {
                                                const amount = parseFloat(cashTendered);
                                                if (isNaN(amount) || amount <= 0) {
                                                    toast.error("Invalid amount");
                                                    return;
                                                }
                                                const cashBalance = orderCustomer?.wallets?.cash || 0;
                                                const creditLimit = orderCustomer?.creditConfig?.isEnabled ? orderCustomer.creditConfig.creditLimit : 0;
                                                const currentCreditUsed = Math.max(0, -cashBalance);
                                                const availableCredit = creditLimit - currentCreditUsed;
                                                const totalSpendable = cashBalance + availableCredit;

                                                if (amount > totalSpendable) {
                                                    const needed = amount - totalSpendable;
                                                    toast.error(`Insufficient funds. You need ₦${needed.toLocaleString()} more in balance or credit.`);
                                                    return;
                                                }

                                                // Proceed with wallet deduction
                                                const success = await walletStore.deduct(
                                                    orderCustomer!.id,
                                                    'CASH',
                                                    amount,
                                                    currentUser?.id || 'SYS',
                                                    currentUser?.name || 'System',
                                                    order.id,
                                                    'ORDER',
                                                    `POS Payment for Order #${order.id.slice(-6)}`
                                                );

                                                if (success) {
                                                    handleAddPayment('WALLET', amount);
                                                    toast.success("Wallet payment added");
                                                } else {
                                                    toast.error("Transaction failed");
                                                }
                                            }}
                                            className="w-full py-6 rounded-3xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                                        >
                                            Confirm Wallet Deduction
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center animate-bounce shadow-sm">
                                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            </div>
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Waiting for terminal response...</p>
                                        </div>
                                        <button
                                            onClick={() => handleAddPayment(currentMethod, remaining, { reference: `REF-${Date.now().toString().slice(-6)}` })}
                                            className="w-full py-6 rounded-3xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                                        >
                                            Confirm ₦{remaining.toLocaleString()} Successfully Paid
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Payment History Segmented List */}
                        {payments.length > 0 && (
                            <div className="mt-10">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Breakdown</h5>
                                <div className="space-y-3">
                                    {payments.map((p, idx) => (
                                        <div key={p.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-between items-center animate-in slide-in-from-left-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black tracking-tighter">
                                                    {p.method?.slice(0, 3)}
                                                </div>
                                                <span className="text-xs font-black text-slate-800">{p.method}</span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-sm font-black text-slate-900">₦{p.amount?.toLocaleString()}</span>
                                                <button onClick={() => setPayments(payments.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-10 bg-white border-t border-slate-200 mt-auto">
                        {!isConfirming ? (
                            <button
                                onClick={() => amountPaid >= totalAmount ? setIsConfirming(true) : toast.error("Full amount not covered yet")}
                                disabled={amountPaid < totalAmount}
                                className={`w-full py-8 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] transition-all ${amountPaid >= totalAmount ? 'bg-green-600 text-white shadow-2xl shadow-green-200 hover:bg-green-700 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                            >
                                Process Transaction
                            </button>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <div className="text-center">
                                    <h5 className="text-xl font-black text-slate-900 uppercase">Confirm Final Closure?</h5>
                                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">This will finalize the order and free up Table {order.tableNumber}</p>
                                </div>
                                <div className="flex gap-4 w-full">
                                    <button onClick={() => setIsConfirming(false)} className="flex-1 py-6 rounded-[1.5rem] bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs hover:bg-slate-200">Wait, Go Back</button>
                                    <button onClick={handleConfirmTransaction} className="flex-[2] py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100">Yes, Complete Order</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
