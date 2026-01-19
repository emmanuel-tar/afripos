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

    const handleFastOrder = () => {
        setTableNumber('FAST');
        setView(AppView.MENU, { initialCheckout: false });
    };

    return (
        <div className="w-64 bg-slate-900 p-4 flex flex-col gap-3 shadow-2xl z-20">
            <div className="mb-8 p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center">
                <div className="text-white/30 text-[9px] uppercase font-black tracking-widest mb-2">Location</div>
                <div className="text-white font-black text-sm uppercase">{currentBranch?.name}</div>
            </div>

            <button onClick={handleFastOrder} className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl active:scale-95 group">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                Quick Sell
            </button>

            <button onClick={() => setView(AppView.FLOOR_MAP)} className="flex items-center gap-4 p-5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                Tables
            </button>

            {canAccessKDS && (
                <button onClick={() => setView(AppView.STATION_DISPLAY)} className="flex items-center gap-4 p-5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    Kitchen
                </button>
            )}

            {canAccessInventory && (
                <button onClick={() => setView(AppView.INVENTORY)} className="flex items-center gap-4 p-5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    Stock
                </button>
            )}

            {canAccessSettings && (
                <button onClick={() => setView(AppView.SETTINGS)} className="flex items-center gap-4 p-5 rounded-[1.5rem] text-slate-400 hover:bg-white/5 hover:text-white transition-all font-black active:scale-95">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                    </div>
                    Admin
                </button>
            )}

            <div className="mt-auto">
                <button onClick={logout} className="w-full flex items-center gap-4 p-5 rounded-[1.5rem] text-red-500 hover:bg-red-500/10 transition-all font-black uppercase active:scale-95">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default DashboardSidebar;
