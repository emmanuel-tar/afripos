import React, { useState } from 'react';
import { useDeviceStore } from '../stores/useDeviceStore';
import { DeviceRole } from '../types';
import { Server, Monitor, Layout, Navigation, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

const ServerConnectionView: React.FC = () => {
    const { currentDevice, requestPairing } = useDeviceStore();
    const [name, setName] = useState('');
    const [type, setType] = useState<DeviceRole>('WAITER');
    const [ip, setIp] = useState('192.168.1.100');
    const [isRequesting, setIsRequesting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !ip.trim()) return;

        setIsRequesting(true);
        // Simulate network delay
        setTimeout(() => {
            requestPairing(name.trim(), type, ip.trim());
            setIsRequesting(false);
        }, 1500);
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

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Device ID</div>
                        <div className="text-sm font-black text-white font-mono">{currentDevice.id}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Role</div>
                        <div className="text-sm font-black text-indigo-400 uppercase">{currentDevice.type}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
                <div className="p-12 bg-indigo-600 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-20 translate-x-20"></div>
                    <div className="relative z-10">
                        <ShieldCheck className="w-12 h-12 mb-6" />
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Connect to Local Server</h1>
                        <p className="text-indigo-100 font-bold opacity-80">Establish a secure trust handshake with your branch server.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-12 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Terminal Name</label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:outline-none font-black text-slate-800 transition-all uppercase placeholder:opacity-30"
                                placeholder="E.G. WAITER-PAD-01"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Server IP Address</label>
                                <input
                                    required
                                    value={ip}
                                    onChange={e => setIp(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:outline-none font-black text-slate-800 transition-all placeholder:opacity-30"
                                    placeholder="192.168.1.100"
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Device Type</label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value as DeviceRole)}
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:outline-none font-black text-slate-800 transition-all uppercase appearance-none cursor-pointer"
                                >
                                    <option value="WAITER">WAITER PWA</option>
                                    <option value="CASHPOINT">CASHPOINT TERMINAL</option>
                                    <option value="KDS">KITCHEN DISPLAY (KDS)</option>
                                    <option value="ADMIN">ADMIN CONSOLE</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isRequesting}
                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                        {isRequesting ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                REQUESTING PAIRING...
                            </>
                        ) : (
                            <>
                                REQUEST PAIRING
                                <ArrowRight className="w-6 h-6" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Handshake v1.0 • Secure Local Network Only
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ServerConnectionView;
