import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { DEFAULT_STAFF } from '../constants';
import { useAppStore } from '../stores/useAppStore';
import { useTerminalStore } from '../stores/useTerminalStore';
import { toast } from 'sonner';
import { Wifi, WifiOff, Delete, UserCircle2, KeyRound } from 'lucide-react';

const StaffLoginView: React.FC = () => {
    const [step, setStep] = useState<'ID' | 'PIN'>('ID');
    const [staffId, setStaffId] = useState('');
    const [pin, setPin] = useState('');
    const { setUser, isOnline } = useAppStore();
    const { terminalName } = useTerminalStore();

    const handleNumberClick = (num: string) => {
        if (step === 'ID') {
            if (staffId.length < 4) setStaffId(prev => prev + num);
        } else {
            if (pin.length < 4) setPin(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        if (step === 'ID') {
            setStaffId(prev => prev.slice(0, -1));
        } else {
            setPin(prev => prev.slice(0, -1));
        }
    };

    const handleClear = () => {
        if (step === 'ID') setStaffId('');
        else setPin('');
    };

    // Auto-advance or validate
    useEffect(() => {
        if (step === 'ID' && staffId.length === 2) {
            // Some IDs are 2 digits in constants (00, 11, 22)
            // But let's allow the user to press "Next" or just wait?
            // Actually, for a terminal, we should probably have a "Next" button or fixed length.
            // Let's assume IDs are up to 4 digits, but for the mocks 2 is enough.
        }

        if (step === 'PIN' && pin.length === 4) {
            const staff = DEFAULT_STAFF.find(s => s.id === staffId && s.pin === pin);
            if (staff) {
                setUser(staff);
                toast.success(`Authenticated: ${staff.name}`);
            } else {
                toast.error("Invalid credentials. Try again.");
                setPin('');
                if ('vibrate' in navigator) navigator.vibrate(200);
            }
        }
    }, [staffId, pin, step, setUser]);

    const handleNext = () => {
        if (staffId.length > 0) {
            const staffExists = DEFAULT_STAFF.some(s => s.id === staffId);
            if (staffExists) {
                setStep('PIN');
            } else {
                toast.error("Staff ID not found");
                setStaffId('');
            }
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-between p-8 sm:p-12 overflow-hidden text-white font-sans">
            {/* Top Bar: Terminal Info & Status */}
            <div className="w-full flex justify-between items-center max-w-4xl">
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Terminal:</span>
                    <span className="text-sm font-black text-white">{terminalName || 'Unbound'}</span>
                </div>

                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-md flex flex-col items-center flex-1 justify-center py-12">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black tracking-tighter mb-4">
                        AFRI<span className="text-indigo-500">POS</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        {step === 'ID' ? <UserCircle2 className="w-5 h-5" /> : <KeyRound className="w-5 h-5 text-indigo-400" />}
                        <p className="text-xs font-black uppercase tracking-[0.3em]">
                            {step === 'ID' ? 'Enter Staff ID' : 'Enter Private PIN'}
                        </p>
                    </div>
                </div>

                {/* Display Field */}
                <div className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-10 flex flex-col items-center">
                    {step === 'ID' ? (
                        <div className="text-6xl font-black tracking-[0.2em] h-16 flex items-center">
                            {staffId || <span className="text-white/5 italic">----</span>}
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className={`w-12 h-12 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center ${pin.length > i ? 'bg-indigo-600 border-indigo-500 scale-110' : 'bg-white/5 border-white/10'
                                    }`}>
                                    {pin.length > i && <div className="w-3 h-3 bg-white rounded-full"></div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4 w-full">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="h-24 bg-white/5 rounded-[2rem] border border-white/10 text-3xl font-black hover:bg-white/10 active:bg-indigo-600 active:scale-90 transition-all"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleClear}
                        className="h-24 bg-white/5 rounded-[2rem] border border-white/10 text-xs font-black uppercase tracking-widest text-white/30 hover:text-white/60"
                    >
                        CLR
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-24 bg-white/5 rounded-[2rem] border border-white/10 text-3xl font-black hover:bg-white/10 active:bg-indigo-600 active:scale-90 transition-all"
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="h-24 bg-red-500/10 rounded-[2rem] border border-red-500/20 text-red-500 flex items-center justify-center active:scale-90 transition-all"
                    >
                        <Delete />
                    </button>
                </div>

                {/* Action Button */}
                {step === 'ID' && (
                    <button
                        onClick={handleNext}
                        disabled={!staffId}
                        className={`w-full mt-8 py-6 rounded-[2rem] text-xl font-black transition-all ${staffId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95' : 'bg-white/5 text-white/10'
                            }`}
                    >
                        NEXT
                    </button>
                )}
                {step === 'PIN' && (
                    <button
                        onClick={() => { setStep('ID'); setPin(''); }}
                        className="mt-8 text-xs font-black text-white/30 uppercase tracking-[0.2em] hover:text-white/60"
                    >
                        Back to ID entry
                    </button>
                )}
            </div>

            {/* Branding / App Info */}
            <div className="text-center">
                <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                    v4.2.0 • Gatekeeper Build
                </p>
            </div>
        </div>
    );
};

export default StaffLoginView;
