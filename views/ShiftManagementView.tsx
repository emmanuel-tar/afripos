import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useTerminalStore } from '../stores/useTerminalStore';
import { Play, LogOut, User, Clock, ShieldCheck } from 'lucide-react';

const ShiftManagementView: React.FC = () => {
    const { user, logout } = useAppStore();
    const { startShift, activeShift } = useTerminalStore();

    if (!user) return null;

    const handleStartShift = () => {
        startShift(user.id, user.name);
    };

    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white font-sans overflow-hidden">
            <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-[4rem] p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center">
                    {/* User Avatar & Info */}
                    <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/30">
                        <User className="w-16 h-16 text-white" />
                    </div>

                    <h1 className="text-4xl font-black mb-2 text-center">{user.name}</h1>
                    <div className="flex items-center gap-2 mb-12">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                        <span className="text-sm font-black text-indigo-400 uppercase tracking-[0.3em]">{user.role}</span>
                    </div>

                    {/* Stats/Status */}
                    <div className="grid grid-cols-2 gap-6 w-full mb-12">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                            <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</div>
                            <div className="text-lg font-black text-red-400 uppercase">Off Shift</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
                            <Clock className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Activity</div>
                            <div className="text-lg font-black text-white">Today, 08:30</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4 w-full">
                        <button
                            onClick={handleStartShift}
                            className="w-full py-8 bg-indigo-600 hover:bg-indigo-700 rounded-[2rem] flex items-center justify-center gap-4 text-2xl font-black transition-all shadow-xl shadow-indigo-600/30 active:scale-95 group"
                        >
                            <Play className="w-8 h-8 fill-white group-hover:scale-110 transition-transform" />
                            START ACTIVE SHIFT
                        </button>

                        <button
                            onClick={logout}
                            className="w-full py-6 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-[2rem] flex items-center justify-center gap-3 text-lg font-black transition-all text-white/50 hover:text-red-400 active:scale-95"
                        >
                            <LogOut className="w-6 h-6" />
                            LOGOUT & CHANGE STAFF
                        </button>
                    </div>

                    {/* Roles Notice */}
                    <p className="mt-12 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] text-center max-w-sm leading-loose">
                        By starting your shift, this device will automatically route to the <span className="text-indigo-400">{user.role.toUpperCase()}</span> interface.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShiftManagementView;
