
import React, { useState } from 'react';
import { Table } from '../../../types';
import { useTableStore } from '../../../stores/useTableStore';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CreateTableModalProps extends ModalProps {
}

export const CreateTableModal: React.FC<CreateTableModalProps> = ({ isOpen, onClose }) => {
    const { addTable } = useTableStore();
    const [number, setNumber] = useState('');
    const [capacity, setCapacity] = useState('4');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addTable({
            id: `t-${Date.now()}`,
            number,
            capacity: parseInt(capacity),
            status: 'available'
        });
        onClose();
        setNumber('');
        setCapacity('4');
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Create New Table</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Table Number</label>
                        <input
                            type="text"
                            required
                            value={number}
                            onChange={e => setNumber(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:ring-0 outline-none font-bold text-slate-800 transition-colors"
                            placeholder="e.g. 12 or VIP 1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Capacity (Pax)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={capacity}
                            onChange={e => setCapacity(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-600 focus:ring-0 outline-none font-bold text-slate-800 transition-colors"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                            Create Table
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface TransferTableModalProps extends ModalProps {
    fromTable: Table;
    onTransfer: (toTableId: string) => void;
}

export const TransferTableModal: React.FC<TransferTableModalProps> = ({ isOpen, onClose, fromTable, onTransfer }) => {
    const { tables } = useTableStore();
    const availableTables = tables.filter(t => t.id !== fromTable.id && t.status === 'available');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Transfer Table {fromTable.number}</h3>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Select destination table</p>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-3 gap-4">
                    {availableTables.length === 0 ? (
                        <div className="col-span-3 text-center py-10 text-slate-400 font-bold">No available tables</div>
                    ) : (
                        availableTables.map(table => (
                            <button
                                key={table.id}
                                onClick={() => { onTransfer(table.id); onClose(); }}
                                className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2 group"
                            >
                                <span className="text-2xl font-black text-slate-800 group-hover:text-indigo-600">{table.number}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{table.capacity} Pax</span>
                            </button>
                        ))
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button onClick={onClose} className="w-full py-4 text-slate-500 font-bold uppercase tracking-widest hover:bg-white rounded-xl transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

interface JoinTableModalProps extends ModalProps {
    primaryTable: Table;
    onJoin: (secondaryTableId: string) => void;
}

export const JoinTableModal: React.FC<JoinTableModalProps> = ({ isOpen, onClose, primaryTable, onJoin }) => {
    const { tables } = useTableStore();
    // Can join with any table that is not already joined to another group (basic logic)
    // self excluding
    const candidates = tables.filter(t => t.id !== primaryTable.id && (!t.joinedWith || t.joinedWith.length === 0));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Join Table {primaryTable.number} With...</h3>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto grid grid-cols-3 gap-4">
                    {candidates.length === 0 ? (
                        <div className="col-span-3 text-center py-10 text-slate-400 font-bold">No compatible tables</div>
                    ) : (
                        candidates.map(table => (
                            <button
                                key={table.id}
                                onClick={() => { onJoin(table.id); onClose(); }}
                                className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2 group"
                            >
                                <span className="text-2xl font-black text-slate-800 group-hover:text-indigo-600">{table.number}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{table.capacity} Pax</span>
                            </button>
                        ))
                    )}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                    <button onClick={onClose} className="w-full py-4 text-slate-500 font-bold uppercase tracking-widest hover:bg-white rounded-xl transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
