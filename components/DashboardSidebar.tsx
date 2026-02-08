import React from 'react';
import { AppView, Branch, User } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { useCartStore } from '../stores/useCartStore';

interface DashboardSidebarProps {
    canAccessKDS: boolean;
    canAccessInventory: boolean;
    canAccessSettings: boolean;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
    canAccessKDS,
    canAccessInventory,
    canAccessSettings
}) => {
    const { setView, currentBranch, logout } = useAppStore();
    const { setTableNumber } = useCartStore();
    const [isSalesOpen, setIsSalesOpen] = React.useState(true);

    const handleFastOrder = () => {
        setTableNumber('FAST');
        setView(AppView.MENU, { initialCheckout: false });
    };

    return (
        <div className="w-64 bg-slate-900 p-4 flex flex-col gap-2 shadow-2xl z-20 overflow-y-auto">
            <div className="mb-6 p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                <div className="text-white/30 text-[9px] uppercase font-black tracking-widest mb-1">Location</div>
                <div className="text-white font-black text-xs uppercase">{currentBranch?.name}</div>
            </div>

            {/* Sales Group */}
            <div className="flex flex-col gap-1">
                <button
                    onClick={() => setIsSalesOpen(!isSalesOpen)}
                    className="flex justify-between items-center w-full p-4 rounded-2xl bg-white/5 text-white/50 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        Sales & POS
                    </div>
                    <svg className={`w-4 h-4 transition-transform duration-300 ${isSalesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </button>

                <div className={`flex flex-col gap-1 transition-all duration-300 overflow-hidden ${isSalesOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <button onClick={handleFastOrder} className="flex items-center gap-4 p-4 rounded-[1.2rem] bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-lg active:scale-95 group">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <span className="text-sm">Quick Sell</span>
                    </button>

                    <button onClick={() => setView(AppView.FLOOR_MAP)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-sm">Floor Map</span>
                    </button>

                    <button onClick={() => setView(AppView.RESERVATIONS)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-sm">Reservations</span>
                    </button>

                    {canAccessKDS && (
                        <button onClick={() => setView(AppView.STATION_DISPLAY)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <span className="text-sm">Kitchen Display</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Operations Group */}
            <div className="mt-4 flex flex-col gap-1">
                <div className="p-4 text-white/20 font-black uppercase tracking-widest text-[9px]">Management</div>


                {canAccessInventory && (
                    <>
                        <button onClick={() => setView(AppView.INVENTORY)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <span className="text-sm">Inventory</span>
                        </button>
                        <button onClick={() => setView(AppView.PURCHASING)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            </div>
                            <span className="text-sm">Purchasing</span>
                        </button>
                        <button onClick={() => setView(AppView.MANUFACTURING)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <span className="text-sm">Manufacturing</span>
                        </button>
                    </>
                )}

                {canAccessSettings && (
                    <>
                        <button onClick={() => setView(AppView.FINANCE)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-sm">Finance</span>
                        </button>
                        <button onClick={() => setView(AppView.HR)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <span className="text-sm">HR & Staff</span>
                        </button>
                        <button onClick={() => setView(AppView.CRM)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <span className="text-sm">Customers</span>
                        </button>
                        <button onClick={() => setView(AppView.NOTIFICATION_SETTINGS)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                            </div>
                            <span className="text-sm">Notifications</span>
                        </button>
                        <button onClick={() => setView(AppView.WALLET_MANAGEMENT)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </div>
                            <span className="text-sm">Wallet Master</span>
                        </button>
                        <button onClick={() => setView(AppView.SETTINGS)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                            </div>
                            <span className="text-sm">Settings</span>
                        </button>
                        <button onClick={() => setView(AppView.SYSTEM_CONFIG)} className="flex items-center gap-4 p-4 rounded-[1.2rem] text-red-400 hover:bg-white/5 hover:text-red-300 transition-all font-black active:scale-95 group">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-red-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <span className="text-sm">Control Center</span>
                        </button>
                    </>
                )}
            </div>

            <div className="mt-auto pt-4 border-t border-white/5">
                <button onClick={logout} className="w-full flex items-center gap-4 p-4 rounded-[1.2rem] text-red-500 hover:bg-red-500/10 transition-all font-black uppercase active:scale-95 group">
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="text-sm">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default DashboardSidebar;
