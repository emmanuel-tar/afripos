
import React, { useState, useEffect } from 'react';
import { Table, Order, CartItem } from '../../../types';
import { getTables, saveOrder, getActiveTableOrder } from '../../../services/db';
import { toast } from 'sonner';

interface SplitTableModalProps {
    currentTableNumber: string;
    isOpen: boolean;
    onClose: () => void;
    onSplitComplete: () => void;
}

export const SplitTableModal: React.FC<SplitTableModalProps> = ({ currentTableNumber, isOpen, onClose, onSplitComplete }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [targetTable, setTargetTable] = useState<string | null>(null);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [allTables, order] = await Promise.all([
                getTables(),
                getActiveTableOrder(currentTableNumber)
            ]);

            const available = allTables.filter(t => t.number !== currentTableNumber && t.status === 'available');
            setTables(available);
            setCurrentOrder(order || null);
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItem = (cartId: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(cartId)) {
            newSet.delete(cartId);
        } else {
            newSet.add(cartId);
        }
        setSelectedItems(newSet);
    };

    const handleSplit = async () => {
        if (!targetTable || !currentOrder || selectedItems.size === 0) return;
        setIsLoading(true);

        try {
            const itemsToMove: CartItem[] = [];
            const itemsToKeep: CartItem[] = [];

            currentOrder.items.forEach(item => {
                if (selectedItems.has(item.cartId)) {
                    itemsToMove.push(item);
                } else {
                    itemsToKeep.push(item);
                }
            });

            // Update current order
            const updatedCurrentOrder: Order = {
                ...currentOrder,
                items: itemsToKeep,
                subtotal: itemsToKeep.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                total: itemsToKeep.reduce((acc, item) => acc + (item.price * item.quantity), 0) // simplified
            };

            // Create new order for target table
            const newOrder: Order = {
                ...currentOrder,
                id: `ORD-${Date.now()}-SPLIT`,
                tableNumber: targetTable,
                items: itemsToMove,
                subtotal: itemsToMove.reduce((acc, item) => acc + (item.price * item.quantity), 0),
                total: itemsToMove.reduce((acc, item) => acc + (item.price * item.quantity), 0), // simplified
                timestamp: Date.now(),
                status: 'pending', // or served/ready depending on flow
                payments: [],
                modifications: [],
                printedAt: undefined
            };

            await Promise.all([
                saveOrder(updatedCurrentOrder),
                saveOrder(newOrder)
            ]);

            toast.success(`Split successful. Items moved to Table ${targetTable}`);
            onSplitComplete();
            onClose();

        } catch (error) {
            console.error(error);
            toast.error("Split failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">Split Table</h3>
                        <p className="text-slate-500 font-bold text-sm">Select items to move to a new table</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex gap-8 flex-1 overflow-hidden">
                    {/* Left: Items Selection */}
                    <div className="flex-1 flex flex-col border-r border-slate-100 pr-8 overflow-y-auto">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Select Items to Move</h4>
                        {currentOrder?.items.map(item => (
                            <div
                                key={item.cartId}
                                onClick={() => toggleItem(item.cartId)}
                                className={`p-4 rounded-xl border mb-3 cursor-pointer transition-all flex justify-between items-center ${selectedItems.has(item.cartId)
                                    ? 'bg-indigo-50 border-indigo-500 shadow-md transform scale-[1.02]'
                                    : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div>
                                    <div className="font-bold text-slate-800">{item.name}</div>
                                    <div className="text-xs text-slate-400">Qty: {item.quantity}</div>
                                </div>
                                <div className="font-mono font-bold text-slate-600">₦{(item.price * item.quantity).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Table Selection */}
                    <div className="w-1/3 flex flex-col overflow-y-auto">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Select Target Table</h4>

                        <div className="grid grid-cols-2 gap-3">
                            {tables.map(table => (
                                <button
                                    key={table.id}
                                    onClick={() => setTargetTable(table.number)}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${targetTable === table.number
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md'
                                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="font-black text-lg">{table.number}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4 border-t border-slate-100 pt-6">
                    <button onClick={onClose} className="flex-1 py-4 rounded-xl bg-slate-100 font-black text-slate-600 uppercase tracking-widest text-xs hover:bg-slate-200">Cancel</button>
                    <button
                        onClick={handleSplit}
                        disabled={!targetTable || selectedItems.size === 0 || isLoading}
                        className={`flex-[2] py-4 rounded-xl font-black text-white uppercase tracking-widest text-xs transition-all shadow-lg ${!targetTable || selectedItems.size === 0 || isLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        {isLoading ? 'Processing...' : `Move ${selectedItems.size} Items to Table ${targetTable || '...'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
