import React, { useState } from 'react';
import { useTerminalStore } from '../stores/useTerminalStore';
import { ChevronRight, Smartphone } from 'lucide-react';

const TerminalBindingView: React.FC = () => {
    const [name, setName] = useState('');
    const { bindTerminal } = useTerminalStore();

    const handleSave = () => {
        if (name.trim()) {
            bindTerminal(name.trim());
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white overflow-hidden">
            <div className="w-full max-w-xl">
                {/* Icon & Title */}
                <div className="flex flex-col items-center mb-12 text-center">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(79,70,229,0.3)]">
                        <Smartphone className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Terminal Setup</h1>
                    <p className="text-slate-400 font-medium">Assign a name to this device to begin</p>
                </div>

                {/* Input Area */}
                <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-xl">
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 text-center">
                            Terminal Name / Location
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Bar POS 1"
                            className="w-full bg-transparent border-b-4 border-indigo-600/30 focus:border-indigo-600 py-6 text-4xl font-black text-center outline-none transition-all placeholder:text-white/10"
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!name.trim()}
                        className={`w-full py-8 rounded-[2rem] flex items-center justify-center gap-4 text-xl font-black transition-all ${name.trim()
                                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95 text-white'
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }`}
                    >
                        COMPLETE SETUP
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center">
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-widest leading-loose">
                        This binding is stored locally on this device.<br />
                        Unique Terminal ID will be automatically generated.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TerminalBindingView;
