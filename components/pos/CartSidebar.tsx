import React from 'react';
import { useCartStore } from '../../stores/useCartStore';
import { Branch, CartItem } from '../../types';
import clsx from 'clsx';
import { Plus, Minus, Trash2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

interface CartSidebarProps {
    branchSettings: Branch;
    onVoidOrder: () => void;
    onTransfer: () => void;
    onSplit: () => void;
    onDiscount: () => void;
    onHold: () => void;
    onFireKitchen: () => void;
    onCheckout: () => void;
    onPrint: () => void;
    onItemTransfer: (item: CartItem) => void;
    isFastOrder: boolean;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
    branchSettings,
    onVoidOrder,
    onTransfer,
    onSplit,
    onDiscount,
    onHold,
    onFireKitchen,
    onCheckout,
    onPrint,
    onItemTransfer,
    isFastOrder
}) => {
    const { cart, activeOrderId, addToCart, removeFromCart, voidItem, discountPercent } = useCartStore();

    const cartSubtotal = cart.reduce((sum, item) => {
        if (item.isVoided) return sum;
        const modsTotal = item.selectedModifiers?.reduce((s, m) => s + m.price, 0) || 0;
        return sum + ((item.price + modsTotal) * item.quantity);
    }, 0);

    const discountAmount = (cartSubtotal * (discountPercent / 100));
    const amountAfterDiscount = cartSubtotal - discountAmount;
    // Note: branchSettings should likely come from useAppStore, but passed as prop here for now or accessed directly

    // Recalculating totals here or use a helper
    // Ideally these calculations should be centralized or simpler
    const cartTotal = amountAfterDiscount; // + tax + service (omitted for brevity, or add back)

    return (
        <div className="w-[480px] border-l border-slate-200 flex flex-col bg-white shadow-2xl relative">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="text-2xl font-black text-slate-800">Check Summary</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeOrderId ? `REC: ${activeOrderId}` : 'DRAFT ORDER'}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onVoidOrder} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm group" title="Void Entire Order">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {!cart || cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                        <div className="w-16 h-16 opacity-10 rounded-full border-2 border-current flex items-center justify-center">0</div>
                        <p className="font-bold text-[10px] uppercase tracking-[0.3em]">No items selected</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.cartId} className={clsx("flex flex-col p-4 rounded-2xl border transition-all", item.isVoided ? 'bg-red-50 border-red-100 opacity-60' : 'bg-slate-50 border-slate-100 shadow-sm')}>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className={clsx("text-sm font-black", item.isVoided ? 'line-through text-red-800' : 'text-slate-800')}>
                                        {item.name}
                                        {item.isVoided && <span className="ml-2 text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">Void</span>}
                                    </div>
                                    <div className="text-[10px] text-indigo-500 font-bold uppercase">{branchSettings.currency}{item.price.toLocaleString()}</div>
                                </div>

                                {!item.isVoided && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                                            <button onClick={() => removeFromCart(item.cartId)} className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 font-bold flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                                            <span className="font-black text-slate-800 w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => addToCart(item, item.selectedModifiers || [])} className="w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 font-bold flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                                        </div>
                                        <button onClick={() => onItemTransfer(item)} className="w-8 h-8 bg-white text-slate-400 rounded-lg flex items-center justify-center hover:text-indigo-600" title="Move Item">
                                            <ArrowRightLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => voidItem(item.cartId)} className="w-8 h-8 bg-white text-slate-400 rounded-lg flex items-center justify-center hover:text-red-600" title="Void Item">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Operational Control Bar */}
            <div className="px-8 py-5 border-t border-slate-100 grid grid-cols-4 gap-4 bg-white">
                <button onClick={onTransfer} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95">
                    <ArrowRightLeft className="w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Xfer Table</span>
                </button>
                <button onClick={onSplit} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95">
                    <span className="text-[9px] font-black uppercase tracking-widest">Split Bill</span>
                </button>
                <button onClick={onDiscount} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95">
                    <span className="text-[9px] font-black uppercase tracking-widest">Discount</span>
                </button>
                <button onClick={onHold} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-amber-600 hover:text-white transition-all shadow-sm active:scale-95">
                    <span className="text-[9px] font-black uppercase tracking-widest">On Hold</span>
                </button>
            </div>

            {/* Totals & Actions */}
            <div className="p-8 border-t border-slate-200 bg-slate-50 space-y-4">
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
                        <span>Subtotal</span>
                        <span>{branchSettings.currency}{cartSubtotal.toLocaleString()}</span>
                    </div>
                    {discountPercent > 0 && (
                        <div className="flex justify-between items-center text-red-500 text-xs font-bold uppercase">
                            <span>Disc ({discountPercent}%)</span>
                            <span>-{branchSettings.currency}{discountAmount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-4xl font-black text-slate-900 pt-3">
                        <span>Total</span>
                        <span>{branchSettings.currency}{cartTotal.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        {!isFastOrder && (
                            <button disabled={!cart || cart.length === 0} onClick={onFireKitchen} className="flex-1 py-5 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-indigo-50 hover:bg-indigo-50 transition-all">
                                Fire Kitchen
                            </button>
                        )}
                        {activeOrderId && (
                            <button onClick={onPrint} className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl">
                                Print
                            </button>
                        )}
                    </div>
                    <button disabled={!cart || cart.length === 0} onClick={onCheckout} className={clsx("w-full py-6 text-white rounded-2xl font-black shadow-2xl uppercase tracking-[0.3em] text-xs transition-all active:scale-95", isFastOrder ? 'bg-indigo-600 shadow-indigo-100' : 'bg-green-600 shadow-green-100 hover:bg-green-700')}>
                        {isFastOrder ? 'Direct Checkout' : 'Final Settlement'}
                    </button>
                </div>
            </div>
        </div>
    );
};
