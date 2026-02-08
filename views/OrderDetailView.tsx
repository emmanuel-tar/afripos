import React, { useState, useEffect } from 'react';
import { Order, CartItem, AppView, User, Payment, PaymentMethod } from '../types';
import { getActiveTableOrder, saveOrder } from '../services/db';
import { useAppStore } from '../stores/useAppStore';
import { useCartStore } from '../stores/useCartStore';
import { toast } from 'sonner';
import { Cloud, CloudOff, Clock, User as UserIcon, RefreshCcw } from 'lucide-react';
import PaymentModal from '../components/pos/PaymentModal';

const OrderDetailView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { viewParams, setView, user } = useAppStore();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            if (viewParams?.tableNumber) {
                const activeOrder = await getActiveTableOrder(viewParams.tableNumber);
                if (activeOrder) {
                    setOrder(activeOrder);
                } else {
                    toast.error("No active order found for this table");
                    onBack();
                }
            }
            setIsLoading(false);
        };
        fetchOrder();
    }, [viewParams, onBack]);

    const handleVoidItem = async (cartId: string) => {
        if (!user || !['admin', 'manager'].includes(user.role)) {
            toast.error("Unauthorized: Manager approval required to void items");
            return;
        }

        if (!order) return;

        const updatedItems = order.items.map(item =>
            item.cartId === cartId ? { ...item, isVoided: true } : item
        );

        const subtotal = updatedItems.reduce((acc, item) =>
            acc + (item.isVoided ? 0 : item.price * item.quantity), 0
        );

        const updatedOrder = {
            ...order,
            items: updatedItems,
            subtotal,
            total: subtotal // Simplified total logic
        };

        await saveOrder(updatedOrder);
        setOrder(updatedOrder);
        toast.success("Item voided successfully");
    };

    if (isLoading) return <div className="h-full flex items-center justify-center font-black text-slate-400 animate-pulse">LOADING ORDER DETAILS...</div>;
    if (!order) return null;

    const duration = order.timestamp ? Math.floor((Date.now() - order.timestamp) / 60000) : 0;

    return (
        <div className="h-full w-full flex flex-col overflow-hidden bg-slate-50">
            {/* Top Toolbar */}
            <div className="bg-white border-b border-slate-200 px-10 py-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Table {order.tableNumber}</h2>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-200">ACTIVE SESSION</span>

                            {/* Sync Status Badge */}
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${order.syncStatus === 'SYNCED'
                                    ? 'bg-green-50 text-green-600 border-green-200'
                                    : 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse'
                                }`}>
                                {order.syncStatus === 'SYNCED' ? <Cloud className="w-3 h-3" /> : <RefreshCcw className="w-3 h-3 animate-spin" />}
                                {order.syncStatus === 'SYNCED' ? 'Local Server: Synced' : 'Syncing to Server...'}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Started {duration}m ago
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <UserIcon className="w-3 h-3" /> Waiter: {order.cashierName || 'System'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => toast.info("Printing Pro-forma Invoice...")}
                        className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center gap-3"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2H9a2 2 0 00-2-2H9a2 2 0 00-2 2v4" /></svg>
                        Bill Preview
                    </button>
                    <button
                        className="px-6 py-3 rounded-2xl bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg active:scale-95 flex items-center gap-3"
                        onClick={() => toast.info("Bill reopened for modifications")}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Reopen Order
                    </button>
                    <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Close Bill
                    </button>
                </div>
            </div>

            <div className="flex-1 flex p-10 gap-10 overflow-hidden">
                {/* Items List */}
                <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest">Order Summary</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Table</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
                                <tr>
                                    <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Item</th>
                                    <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                    <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Price</th>
                                    <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Total</th>
                                    <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.cartId} className={`border-b border-slate-50 group hover:bg-slate-50/50 transition-colors ${item.isVoided ? 'opacity-40 grayscale' : ''}`}>
                                        <td className="p-6">
                                            <div className="text-sm font-black text-slate-800">{item.name}</div>
                                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                                <div className="text-[10px] text-slate-400 font-bold mt-1">
                                                    + {item.selectedModifiers.map(m => m.name).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6 text-center text-sm font-black text-slate-600">{item.quantity}</td>
                                        <td className="p-6 text-right text-sm font-black text-slate-600">₦{item.price.toLocaleString()}</td>
                                        <td className="p-6 text-right text-sm font-black text-slate-900 font-mono">₦{(item.price * item.quantity).toLocaleString()}</td>
                                        <td className="p-6 text-right">
                                            {!item.isVoided && (
                                                <button
                                                    onClick={() => handleVoidItem(item.cartId)}
                                                    className="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                    title="Void Item"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            )}
                                            {item.isVoided && (
                                                <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">VOID</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals Panel */}
                <div className="w-[400px] flex flex-col gap-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>

                        <div className="mb-8 border-b border-white/10 pb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Waitstaff Assigned</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-xs">J.D</div>
                                <span className="text-sm font-black">{order.cashierName || 'John Doe'}</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="flex justify-between items-center text-white/50">
                                <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                                <span className="font-black">₦{order.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-white/50">
                                <span className="text-[10px] font-black uppercase tracking-widest">VAT (7.5%)</span>
                                <span className="font-black">₦{(order.subtotal * 0.075).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-white/50">
                                <span className="text-[10px] font-black uppercase tracking-widest">Service Charge</span>
                                <span className="font-black">₦0</span>
                            </div>
                        </div>

                        <div className="border-t border-white/20 pt-8 mt-auto">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Total Amount Payable</h4>
                                    <div className="text-5xl font-black tracking-tighter">₦{(order.subtotal * 1.075).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Terminal Session</div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-black text-slate-700">POS-TERMINAL-01</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">#TM-8821</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal Integration */}
            {isPaymentModalOpen && (
                <PaymentModal
                    order={order}
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    onComplete={async (payments) => {
                        const closedOrder = {
                            ...order,
                            status: 'completed' as const,
                            payments,
                            total: order.subtotal * 1.075 // Final total including tax
                        };
                        await saveOrder(closedOrder);
                        setIsPaymentModalOpen(false);
                        toast.success("Transaction Completed Successfully");
                        onBack(); // Go back to floor map
                    }}
                />
            )}
        </div>
    );
};

export default OrderDetailView;
