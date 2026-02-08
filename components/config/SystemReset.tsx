import React, { useState } from 'react';
import { useConfigStore } from '../../stores/useConfigStore';
import { toast } from 'sonner';

const SystemReset: React.FC = () => {
    const { resetSystem, isLoading } = useConfigStore();

    const [step, setStep] = useState(1);
    const [acknowledged, setAcknowledged] = useState(false);
    const [resetScope, setResetScope] = useState<'FULL' | 'CONFIG_ONLY'>('CONFIG_ONLY');
    const [confirmPhrase, setConfirmPhrase] = useState('');
    const TARGET_PHRASE = 'RESET SYSTEM';

    const handleReset = async () => {
        if (confirmPhrase !== TARGET_PHRASE) {
            toast.error('Confirmation phrase mismatch');
            return;
        }

        try {
            await resetSystem(resetScope);
            toast.success('System reset completed successfully');
            // Force reload to clear all stores and ensure a clean state
            setTimeout(() => {
                localStorage.clear();
                window.location.reload();
            }, 2000);
        } catch (error) {
            toast.error('System reset failed');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Warning Banner */}
            <div className="bg-red-50 border-2 border-red-200 rounded-[2.5rem] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-bl-[10rem] -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative z-10 flex gap-6">
                    <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-xl shadow-red-200">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-red-900 uppercase tracking-tight">Crucial: Data Erasure Zone</h2>
                        <p className="text-red-700 font-bold text-base mt-1 leading-relaxed">
                            This action is <span className="underline decoration-4">irreversible</span>. Once executed, the selected data will be permanently purged from the local database. No undo is possible.
                        </p>
                    </div>
                </div>
            </div>

            {/* Selection Area */}
            <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-sm space-y-10">
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">1. Select Reset Depth</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <button
                            onClick={() => setResetScope('CONFIG_ONLY')}
                            className={`p-8 rounded-[2rem] border-2 text-left transition-all ${resetScope === 'CONFIG_ONLY' ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                        >
                            <div className={`w-6 h-6 rounded-full border-4 mb-4 flex items-center justify-center ${resetScope === 'CONFIG_ONLY' ? 'border-indigo-600' : 'border-slate-300'}`}>
                                {resetScope === 'CONFIG_ONLY' && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                            </div>
                            <div className="font-black text-lg text-slate-800 uppercase tracking-tight">Configuration Only</div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Wipe Products, Recipes, Staff, and Floor Layouts. Keeps Transaction Logs.</p>
                        </button>

                        <button
                            onClick={() => setResetScope('FULL')}
                            className={`p-8 rounded-[2rem] border-2 text-left transition-all ${resetScope === 'FULL' ? 'border-red-600 bg-red-50 shadow-lg' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                        >
                            <div className={`w-6 h-6 rounded-full border-4 mb-4 flex items-center justify-center ${resetScope === 'FULL' ? 'border-red-600' : 'border-slate-300'}`}>
                                {resetScope === 'FULL' && <div className="w-2 h-2 rounded-full bg-red-600"></div>}
                            </div>
                            <div className="font-black text-lg text-red-800 uppercase tracking-tight">Full System Wipe</div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Nuclear option. Clears everything including Orders, Finances, and Inventory logs.</p>
                        </button>
                    </div>
                </div>

                <div className="pt-10 border-t border-slate-50">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">2. Authorization & Confirmation</h3>
                    <div className="space-y-6">
                        <label className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={acknowledged}
                                onChange={e => setAcknowledged(e.target.checked)}
                                className="w-6 h-6 rounded-lg text-red-600 border-slate-300 focus:ring-red-600"
                            />
                            <span className="text-sm font-black text-slate-700 uppercase tracking-tight group-hover:text-red-600 transition-colors">I acknowledge that this action cannot be undone.</span>
                        </label>

                        {acknowledged && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Type "{TARGET_PHRASE}" to confirm</label>
                                <input
                                    type="text"
                                    value={confirmPhrase}
                                    onChange={e => setConfirmPhrase(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 text-2xl font-black text-slate-900 uppercase tracking-[0.2em] focus:border-red-600 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                    placeholder="COMMAND_PHRASE"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <button
                    disabled={!acknowledged || confirmPhrase !== TARGET_PHRASE || isLoading}
                    onClick={handleReset}
                    className={`w-full py-6 rounded-[2rem] font-black text-base uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl ${!acknowledged || confirmPhrase !== TARGET_PHRASE ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
                        }`}
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Execute Global Wipe
                        </>
                    )}
                </button>

                <div className="text-center pt-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.1em] italic">Access restricted to Super Administrators. All actions are logged.</p>
                </div>
            </div>
        </div>
    );
};

export default SystemReset;
