import React, { useState } from 'react';
import { useDepositStore } from '../../stores/useDepositStore';
import { useAppStore } from '../../stores/useAppStore';
import { DepositRule, DepositType } from '../../types';
import { toast } from 'sonner';

const DepositRuleSettings: React.FC = () => {
    const { rules, saveRule, deleteRule } = useDepositStore();
    const { currentBranch } = useAppStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<DepositRule> | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRule || !editingRule.name) return;

        const rule: DepositRule = {
            id: editingRule.id || `rule-${Date.now()}`,
            name: editingRule.name,
            type: editingRule.type || 'FIXED',
            value: editingRule.value || 0,
            branchId: editingRule.branchId,
            daysOfWeek: editingRule.daysOfWeek || [],
            isRefundable: editingRule.isRefundable ?? true,
            refundCutoffHours: editingRule.refundCutoffHours || 24,
            isActive: editingRule.isActive ?? true,
        };

        await saveRule(rule);
        setIsEditing(false);
        setEditingRule(null);
        toast.success(`Rule "${rule.name}" saved successfully`);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Deposit Rules</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Configure automated prepayment policies</p>
                </div>
                <button
                    onClick={() => {
                        setEditingRule({ branchId: currentBranch?.id });
                        setIsEditing(true);
                    }}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    Add Rule
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map(rule => (
                    <div key={rule.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{rule.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rule.isActive ? 'Active' : 'Draft'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setEditingRule(rule);
                                        setIsEditing(true);
                                    }}
                                    className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button
                                    onClick={() => deleteRule(rule.id)}
                                    className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Type</span>
                                <span className="text-slate-800">{rule.type}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Value</span>
                                <span className="text-slate-800">{rule.value}{rule.type === 'PERCENTAGE' ? '%' : ' NGN'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                                <span className="text-slate-400">Refundable</span>
                                <span className={rule.isRefundable ? 'text-emerald-600' : 'text-red-500'}>{rule.isRefundable ? 'YES' : 'NO'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[300] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <form onSubmit={handleSave} className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editingRule?.id ? 'Edit Rule' : 'New Deposit Rule'}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure policy triggers</p>
                            </div>
                            <button type="button" onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-red-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rule Name</label>
                                <input
                                    type="text" required
                                    value={editingRule?.name || ''}
                                    onChange={e => setEditingRule({ ...editingRule, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                                    placeholder="e.g. VIP Saturday"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                                    <select
                                        value={editingRule?.type || 'FIXED'}
                                        onChange={e => setEditingRule({ ...editingRule, type: e.target.value as DepositType })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none"
                                    >
                                        <option value="FIXED">Fixed Amount</option>
                                        <option value="PERCENTAGE">Percentage</option>
                                        <option value="FULL">Full Prepayment</option>
                                        <option value="PER_PERSON">Per Person</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Value</label>
                                    <input
                                        type="number" required
                                        value={editingRule?.value || 0}
                                        onChange={e => setEditingRule({ ...editingRule, value: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Refundable Policy</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Allow refunds if cancelled early</div>
                                </div>
                                <label className="cursor-pointer">
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${editingRule?.isRefundable ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editingRule?.isRefundable ? 'left-6' : 'left-1'}`}></div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={editingRule?.isRefundable || false}
                                        onChange={e => setEditingRule({ ...editingRule, isRefundable: e.target.checked })}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 shadow-lg"
                            >
                                Save Policy
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default DepositRuleSettings;
