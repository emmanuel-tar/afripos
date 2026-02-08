import React, { useState } from 'react';
import { Customer, CustomerCreditConfig } from '../../types';

interface CreditConfigModalProps {
    customer: Customer;
    onSave: (config: CustomerCreditConfig) => void;
    onClose: () => void;
}

const CreditConfigModal: React.FC<CreditConfigModalProps> = ({ customer, onSave, onClose }) => {
    const [config, setConfig] = useState<CustomerCreditConfig>(customer.creditConfig || {
        isEnabled: false,
        creditLimit: 0,
        dueDateDays: 30,
        isPenaltyEnabled: false,
        penaltyRate: 0
    });

    return (
        <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Credit Config</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Management for {customer.name}</p>
                    </div>
                    <button onClick={onClose} className="bg-white p-3 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm border border-slate-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div>
                            <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Enable Credit Line</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">Allow customer to spend on credit</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={config.isEnabled} onChange={e => setConfig({ ...config, isEnabled: e.target.checked })} className="sr-only peer" />
                            <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {config.isEnabled && (
                        <div className="space-y-6 animate-in slide-in-from-top-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Credit Limit (₦)</label>
                                <input
                                    type="number"
                                    value={config.creditLimit}
                                    onChange={e => setConfig({ ...config, creditLimit: parseFloat(e.target.value) })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-xl outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date (Days)</label>
                                    <input
                                        type="number"
                                        value={config.dueDateDays}
                                        onChange={e => setConfig({ ...config, dueDateDays: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Penalty Rate (%)</label>
                                    <input
                                        type="number"
                                        value={config.penaltyRate}
                                        onChange={e => setConfig({ ...config, penaltyRate: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            onClick={() => onSave(config)}
                            className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all active:scale-[0.98]"
                        >
                            Save Configuration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditConfigModal;
