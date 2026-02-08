import React, { useState, useEffect } from 'react';
import { Table, Order } from '../../../types';
import { getTables, saveOrder, getActiveTableOrder } from '../../../services/db';
import { toast } from 'sonner';

interface TransferModalProps {
    currentTableNumber: string;
    isOpen: boolean;
    onClose: () => void;
    onTransferComplete: (newTableNumber: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ currentTableNumber, isOpen, onClose, onTransferComplete }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadTables();
        }
    }, [isOpen]);

    const loadTables = async () => {
        setIsLoading(true);
        try {
            const allTables = await getTables();
            // Filter out current table and occupied tables (optional: allow merge later)
            // For now, simpler transfer to empty table
            const available = allTables.filter(t => t.number !== currentTableNumber && t.status === 'available');
            setTables(available);
        } catch (error) {
            toast.error("Failed to load tables");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransfer = async () => {
        if (!selectedTable) return;
        setIsLoading(true);

        try {
            const currentOrder = await getActiveTableOrder(currentTableNumber);
            if (!currentOrder) {
                toast.error("No active order to transfer");
                onClose();
                return;
            }

            const updatedOrder: Order = {
                ...currentOrder,
                tableNumber: selectedTable,
                // Ensure status remains active
            };

            // Save order with new table number
            await saveOrder(updatedOrder);

            // If the old order ID was table-based, we might need to be careful, 
            // but usually ID is UUID so it's fine. 
            // We just need to make sure the old table is freed if we track table status separately.
            // Assuming table status is derived from active orders for now in this simple DB service.

            toast.success(`Transferred to Table ${selectedTable}`);
            onTransferComplete(selectedTable);
            onClose();

        } catch (error) {
            console.error(error);
            toast.error("Transfer failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">Transfer Table</h3>
                        <p className="text-slate-500 font-bold text-sm">Moving Order from Table {currentTableNumber}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-slate-400 font-bold animate-pulse">Loading Tables...</div>
                    ) : tables.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 font-bold">No available tables found.</div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {tables.map(table => (
                                <button
                                    key={table.id}
                                    onClick={() => setSelectedTable(table.number)}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${selectedTable === table.number
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md transform scale-105'
                                        : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="font-black text-xl">{table.number}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400">{table.shape}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 rounded-xl bg-slate-100 font-black text-slate-600 uppercase tracking-widest text-xs hover:bg-slate-200">Cancel</button>
                    <button
                        onClick={handleTransfer}
                        disabled={!selectedTable || isLoading}
                        className={`flex-[2] py-4 rounded-xl font-black text-white uppercase tracking-widest text-xs transition-all shadow-lg ${!selectedTable || isLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                    >
                        Confirm Transfer
                    </button>
                </div>
            </div>
        </div>
    );
};
