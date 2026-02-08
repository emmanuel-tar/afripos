import React, { useState } from 'react';
import { Reservation, PaymentRecord, PaymentMethod, Customer } from '../../types';
import { useDepositStore } from '../../stores/useDepositStore';
import { toast } from 'sonner';
import { useWalletStore } from '../../stores/useWalletStore';
import { useCRMStore } from '../../stores/useCRMStore';
import { useAppStore } from '../../stores/useAppStore';

interface MockPaymentModalProps {
    reservation: Reservation;
    onSuccess: (record: PaymentRecord) => void;
    onCancel: () => void;
}

const MockPaymentModal: React.FC<MockPaymentModalProps> = ({ reservation, onSuccess, onCancel }) => {
    const [step, setStep] = useState<'SELECT_METHOD' | 'PROCESSING' | 'SUCCESS'>('SELECT_METHOD');
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const { processPayment } = useDepositStore();
    const walletStore = useWalletStore();
    const customers = useCRMStore(state => state.customers);
    const currentUser = useAppStore(state => state.user);

    const customer = customers.find(c => c.id === reservation.customerId);

    const handlePayment = async (method: string) => {
        if (method === 'WALLET') {
            if (!customer) {
                toast.error("No guest linked to this reservation. Cannot use wallet.");
                return;
            }
            const balance = customer.wallets?.cash || 0;
            if (balance < reservation.totalDepositRequired) {
                toast.error(`Insufficient wallet balance. Available: ₦${balance.toLocaleString()}`);
                return;
            }

            setStep('PROCESSING');
            // Mock processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const success = await walletStore.lockFunds(
                customer.id,
                reservation.totalDepositRequired,
                currentUser?.id || 'SYS',
                currentUser?.name || 'System',
                reservation.id
            );

            if (!success) {
                toast.error("Failed to lock funds in wallet.");
                setStep('SELECT_METHOD');
                return;
            }
        } else {
            setStep('PROCESSING');
            // Mock processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        setSelectedMethod(method);

        const record: PaymentRecord = {
            id: `PAY-${Date.now()}`,
            reservationId: reservation.id,
            customerId: reservation.customerId,
            customerName: reservation.customerName,
            amount: reservation.totalDepositRequired,
            method: method as any,
            timestamp: Date.now(),
            status: 'SUCCESS',
            reference: `REF-${Math.random().toString(36).substring(7).toUpperCase()}`
        };

        await processPayment(record);
        setStep('SUCCESS');
        setTimeout(() => onSuccess(record), 1500);
    };

    const methods = [
        { id: 'POS', name: 'Credit/Debit Card', icon: '💳' },
        { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: '🏦' },
        { id: 'USSD', name: 'USSD Code', icon: '🔢' },
        { id: 'WALLET', name: 'Digital Wallet', icon: '📱' }
    ];

    return (
        <div className="fixed inset-0 z-[400] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                {step === 'SELECT_METHOD' && (
                    <>
                        <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Secure Deposit</h3>
                            <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Due</span>
                                    <span className="text-xl font-black text-indigo-600 uppercase tracking-tight">₦{reservation.totalDepositRequired.toLocaleString()}</span>
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase">Reservation for {reservation.customerName}</div>
                            </div>
                        </div>

                        <div className="p-10 space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Choose Payment Method</p>
                            {methods.map(method => {
                                const isWallet = method.id === 'WALLET';
                                const isDisabled = isWallet && !customer;

                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => handlePayment(method.id)}
                                        disabled={isDisabled}
                                        className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all group ${isDisabled
                                            ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                                            : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-600 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl">{method.icon}</span>
                                            <div className="text-left">
                                                <span className="font-black text-xs text-slate-700 uppercase tracking-widest group-hover:text-indigo-600 block">{method.name}</span>
                                                {isWallet && customer && (
                                                    <span className="text-[9px] font-bold text-emerald-600 uppercase">₦{(customer.wallets?.cash || 0).toLocaleString()} Available</span>
                                                )}
                                                {isWallet && !customer && (
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase italic">Link guest to use wallet</span>
                                                )}
                                            </div>
                                        </div>
                                        {!isDisabled && (
                                            <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                        )}
                                    </button>
                                );
                            })}
                            <button
                                onClick={onCancel}
                                className="w-full mt-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                            >
                                Cancel Payment
                            </button>
                        </div>
                    </>
                )}

                {step === 'PROCESSING' && (
                    <div className="p-20 flex flex-col items-center justify-center space-y-8">
                        <div className="w-20 h-20 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Processing</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Authorizing via {selectedMethod}</p>
                        </div>
                    </div>
                )}

                {step === 'SUCCESS' && (
                    <div className="p-20 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-emerald-600 uppercase tracking-tight">Payment Secured</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Your reservation is now fully confirmed</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MockPaymentModal;
