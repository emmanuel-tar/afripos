
import React, { useState, useEffect } from 'react';
import { Order, AppView, PaymentMethod } from '../types';
import { getOrders, saveOrder } from '../services/db';
import { useAppStore } from '../stores/useAppStore';
import { toast } from 'sonner';
import { Printer, RefreshCcw, Ban, Eye, Search } from 'lucide-react';
import { format } from 'date-fns';

const CURRENCY = '₦';

interface TransactionHistoryViewProps {
    onBack: () => void;
}

const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({ onBack }) => {
    const setView = useAppStore(state => state.setView);
    const user = useAppStore(state => state.user);
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            const allOrders = await getOrders();
            // Filter only completed or cancelled orders for history, sorted by date desc
            const history = allOrders
                .filter(o => ['completed', 'cancelled', 'served'].includes(o.status))
                .sort((a, b) => b.timestamp - a.timestamp);
            setOrders(history);
            setFilteredOrders(history);
        };
        fetchOrders();
    }, []);

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = orders.filter(o =>
            o.id.toLowerCase().includes(lowerSearch) ||
            o.tableNumber?.toLowerCase().includes(lowerSearch) ||
            o.cashierName?.toLowerCase().includes(lowerSearch) ||
            o.total.toString().includes(lowerSearch)
        );
        setFilteredOrders(filtered);
    }, [searchTerm, orders]);

    const handleReopenCallback = async (order: Order) => {
        if (!user || !['admin', 'manager'].includes(user.role)) {
            toast.error("Unauthorized: Only Managers can reopen closed checks.");
            return;
        }

        if (window.confirm(`Are you sure you want to reopen Order #${order.id.slice(-6)}? This will move it back to active status.`)) {
            const updatedOrder: Order = {
                ...order,
                status: 'served', // Set to served so it appears in active orders but is marked done
                paymentMethod: undefined, // Clear main payment method to allow re-payment
                // We keep the payments array so they can be voided/adjusted in OrderDetail if needed, 
                // or the user can just add more items and pay the difference.
                // For simplicity in this iteration, we treat it as an active order again.
            };
            await saveOrder(updatedOrder);
            toast.success("Order reopened successfully.");
            // Navigate to Order Detail
            setView(AppView.CLOSE_BILL, { tableNumber: order.tableNumber });
        }
    };

    const handleVoidOrder = async (order: Order) => {
        if (!user || !['admin', 'manager'].includes(user.role)) {
            toast.error("Unauthorized: Only Managers can void transactions.");
            return;
        }

        const reason = prompt("Enter reason for voiding this transaction:");
        if (!reason) return;

        const updatedOrder: Order = {
            ...order,
            status: 'cancelled',
            notes: order.notes ? `${order.notes} | Voided: ${reason}` : `Voided: ${reason}`,
            modifications: [
                ...(order.modifications || []),
                {
                    id: Date.now().toString(),
                    type: 'remove',
                    itemId: 'ALL',
                    itemName: 'ENTIRE ORDER',
                    reason: reason,
                    timestamp: Date.now(),
                    staffId: user.id || 'SYS',
                    staffName: user.name || 'System'
                }
            ]
        };

        await saveOrder(updatedOrder);
        setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
        toast.success("Transaction voided.");
    };

    const handleReprint = (order: Order) => {
        setSelectedOrder(order);
        // Delay print to allow modal or state to settle if needed, but here we just print
        setTimeout(() => {
            window.print();
        }, 100);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-10 py-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-indigo-600 font-bold flex items-center gap-2 hover:translate-x-[-4px] transition-transform uppercase text-xs tracking-widest">
                        ← Back
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Transaction History</h1>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search ID, Table, Staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-slate-100 border-none rounded-xl font-bold text-sm w-96 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-10">
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Date & Time</th>
                                <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Order ID</th>
                                <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Table</th>
                                <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Total</th>
                                <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Staff</th>
                                <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest">No records found</td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-bold text-slate-800 text-sm">{format(order.timestamp, 'dd MMM yyyy')}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-1">{format(order.timestamp, 'HH:mm')}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">#{order.id.slice(-6)}</span>
                                        </td>
                                        <td className="p-6 font-bold text-slate-800 text-sm">{order.tableNumber || 'N/A'}</td>
                                        <td className="p-6 text-right font-black text-slate-900 font-mono">
                                            {CURRENCY}{order.total.toLocaleString()}
                                        </td>
                                        <td className="p-6 text-xs font-bold text-slate-600">{order.cashierName || 'System'}</td>
                                        <td className="p-6 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                order.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleReprint(order)}
                                                    className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-600 transition-colors"
                                                    title="Reprint Receipt"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                {order.status !== 'cancelled' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleReopenCallback(order)}
                                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-amber-600 hover:border-amber-600 transition-colors"
                                                            title="Reopen Order"
                                                        >
                                                            <RefreshCcw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleVoidOrder(order)}
                                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 hover:border-red-600 transition-colors"
                                                            title="Void Transaction"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden Print Container */}
            {selectedOrder && (
                <div id="print-receipt" className="hidden print:block font-mono text-[12px] leading-tight p-4">
                    <div className="text-center mb-4">
                        <h2 className="text-lg font-black uppercase">AFRI POS</h2>
                        <div className="text-xs">SALES RECEIPT</div>
                        <div className="text-[10px]">{new Date(selectedOrder.timestamp).toLocaleString()}</div>
                        <div className="border-b border-dashed border-black my-2"></div>
                        <div className="font-black">TABLE: {selectedOrder.tableNumber}</div>
                        <div>CASHIER: {selectedOrder.cashierName}</div>
                        <div>ORDER #: {selectedOrder.id.slice(-6)}</div>
                    </div>
                    <div className="space-y-1 mb-4">
                        {selectedOrder.items.map((item, i) => (
                            <div key={i} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                                <span>{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-dashed border-black pt-2 flex justify-between font-black text-base">
                        <span>TOTAL:</span>
                        <span>{CURRENCY}{selectedOrder.total.toLocaleString()}</span>
                    </div>
                    {/* Payment Details */}
                    {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                        <div className="mt-4 border-t border-dashed border-black pt-2 text-[10px]">
                            <div className="font-black mb-1">PAYMENT DETAILS:</div>
                            {selectedOrder.payments.map((p, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{p.method}</span>
                                    <span>{CURRENCY}{p.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="text-center mt-6 text-[10px] uppercase font-black">Thank you for your patronage!</div>
                </div>
            )}
        </div>
    );
};

export default TransactionHistoryView;
