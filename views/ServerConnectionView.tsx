import React, { useState } from 'react';
import { useDeviceStore } from '../stores/useDeviceStore';
import { DeviceRole } from '../types';
import { Server, Monitor, Layout, Navigation, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

const ServerConnectionView: React.FC = () => {
    const { currentDevice, requestPairing, initializeAsHub, resetDevice } = useDeviceStore();
    const [viewMode, setViewMode] = useState<'CHOICE' | 'HUB_SETUP' | 'TERMINAL_SETUP'>('CHOICE');
    const [name, setName] = useState('');
    const [type, setType] = useState<DeviceRole>('WAITER');
    const [ip, setIp] = useState('192.168.1.100');
    const [isRequesting, setIsRequesting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (viewMode === 'HUB_SETUP') {
            initializeAsHub(name.trim());
        } else {
            if (!ip.trim()) return;
            setIsRequesting(true);
            setTimeout(() => {
                requestPairing(name.trim(), type, ip.trim());
                setIsRequesting(false);
            }, 1500);
        }
    };

    if (currentDevice?.status === 'PENDING') {
        return (
            <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in duration-700">
                <div className="w-32 h-32 bg-indigo-600/20 rounded-full flex items-center justify-center relative">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                    <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
                </div>

                <div className="text-center space-y-4 max-w-md">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Waiting for Approval</h1>
                    <p className="text-slate-400 font-bold leading-relaxed">
                        Device <span className="text-indigo-400">"{currentDevice.name}"</span> has requested access.
                        Please ask an administrator to approve this terminal from the local server dashboard.
                    </p>
                </div>

                <div className="flex flex-col gap-6 w-full max-w-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Device ID</div>
                            <div className="text-sm font-black text-white font-mono">{currentDevice.id}</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Role</div>
                            <div className="text-sm font-black text-indigo-400 uppercase">{currentDevice.type}</div>
                        </div>
                    </div>

                    <button
                        onClick={resetDevice}
                        className="w-full py-4 text-red-400 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 rounded-2xl border border-red-500/20 transition-all"
                    >
                        Cancel Request & Change Mode
                    </button>
                </div>
            </div>
        );
    }

    if (viewMode === 'CHOICE') {
        return (
            <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Setup as Server Hub */}
                    <button
                        onClick={() => setViewMode('HUB_SETUP')}
                        className="group bg-white p-12 rounded-[3.5rem] border-2 border-slate-200 hover:border-indigo-600 hover:shadow-2xl transition-all text-left flex flex-col items-center text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                            <Server className="w-12 h-12 text-indigo-600 group-hover:text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Setup as Server Hub</h2>
                            <p className="text-slate-400 font-bold">Recommended for the main manager computer. Acts as the central database.</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:translate-x-2 transition-all">
                            <ArrowRight className="w-6 h-6 text-slate-400" />
                        </div>
                    </button>

                    {/* Setup as Terminal */}
                    <button
                        onClick={() => setViewMode('TERMINAL_SETUP')}
                        className="group bg-white p-12 rounded-[3.5rem] border-2 border-slate-200 hover:border-indigo-600 hover:shadow-2xl transition-all text-left flex flex-col items-center text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                            <Monitor className="w-12 h-12 text-slate-600 group-hover:text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Connect as Terminal</h2>
                            <p className="text-slate-400 font-bold">For Cashpoints, Waiter pads, or KDS. Connects to the main Hub.</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:translate-x-2 transition-all">
                            <ArrowRight className="w-6 h-6 text-slate-400" />
                        </div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
                <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('CHOICE')} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 className="text-2xl font-black tracking-tighter uppercase">{viewMode === 'HUB_SETUP' ? 'Initialize Hub' : 'Terminal Setup'}</h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Name</label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:outline-none font-black text-slate-800 transition-all uppercase"
                                placeholder="E.G. MAIN-HUB-01"
                            />
                        </div>

                        {viewMode === 'TERMINAL_SETUP' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Server IP Address</label>
                                    <input
                                        required
                                        value={ip}
                                        onChange={e => setIp(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:outline-none font-black text-slate-800"
                                        placeholder="192.168.1.100"
                                    />
                                </div>
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Type</label>
                                    <select
                                        value={type}
                                        onChange={e => setType(e.target.value as DeviceRole)}
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:outline-none font-black text-slate-800 transition-all uppercase appearance-none"
                                    >
                                        <option value="WAITER">WAITER PWA</option>
                                        <option value="CASHPOINT">CASHPOINT</option>
                                        <option value="KDS">KITCHEN (KDS)</option>
                                        <option value="ADMIN">ADMIN CONSOLE</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isRequesting}
                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                        {isRequesting ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                REQUESTING...
                            </>
                        ) : (
                            <>
                                {viewMode === 'HUB_SETUP' ? 'INITIALIZE AS SERVER MASTER' : 'REQUEST PAIRING'}
                                <ArrowRight className="w-6 h-6" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ServerConnectionView;
