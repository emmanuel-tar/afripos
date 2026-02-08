import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { DEFAULT_STAFF } from '../constants';
import { useAppStore } from '../stores/useAppStore';
import { toast } from 'sonner';

const StaffLoginView: React.FC = () => {
    const [pin, setPin] = useState('');
    const { setUser } = useAppStore();

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    useEffect(() => {
        if (pin.length === 4) {
            const staff = DEFAULT_STAFF.find(s => s.pin === pin);
            if (staff) {
                setUser(staff);
                toast.success(`Welcome back, ${staff.name}`);
            } else {
                toast.error("Invalid PIN. Please try again.");
                setPin('');
                if ('vibrate' in navigator) navigator.vibrate(200);
            }
        }
    }, [pin, setUser]);

    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Branding */}
                <div className="text-white mb-12 text-center">
                    <div className="text-indigo-400 font-black text-4xl tracking-tighter uppercase mb-2">
                        AFRI<span className="text-white">POS</span>
                    </div>
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Staff Terminal</div>
                </div>

                {/* PIN Display */}
                <div className="flex gap-4 mb-16">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-16 h-16 rounded-[1.5rem] border-2 transition-all duration-300 flex items-center justify-center ${pin.length > i
                                    ? 'bg-indigo-600 border-indigo-500 scale-110 shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                                    : 'bg-white/5 border-white/10'
                                }`}
                        >
                            {pin.length > i && <div className="w-3 h-3 bg-white rounded-full animate-in zoom-in duration-300"></div>}
                        </div>
                    ))}
                </div>

                {/* PIN Pad */}
                <div className="grid grid-cols-3 gap-4 w-full">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="h-24 bg-white/5 rounded-[2rem] border border-white/10 text-3xl font-black text-white hover:bg-white/10 active:bg-indigo-600 transition-all active:scale-90"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="h-24"></div>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-24 bg-white/5 rounded-[2rem] border border-white/10 text-3xl font-black text-white hover:bg-white/10 active:bg-indigo-600 transition-all active:scale-90"
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="h-24 bg-red-500/10 rounded-[2rem] border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 active:scale-90 transition-all font-black text-xs uppercase tracking-widest"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                        </svg>
                    </button>
                </div>

                {/* Emergency/Help */}
                <button className="mt-12 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-white/60 transition-colors">
                    Forgot PIN? Contact Admin
                </button>
            </div>
        </div>
    );
};

export default StaffLoginView;
