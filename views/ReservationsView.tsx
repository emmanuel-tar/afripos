import React, { useState, useEffect } from 'react';
import { useReservationStore } from '../stores/useReservationStore';
import { useCRMStore } from '../stores/useCRMStore';
import { useAppStore } from '../stores/useAppStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { Reservation, ReservationStatus, PaymentRecord } from '../types';
import { toast } from 'sonner';
import { useDepositStore } from '../stores/useDepositStore';
import MockPaymentModal from '../components/reservations/MockPaymentModal';

const ReservationsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { reservations, fetchReservations, addReservation, updateReservationStatus, isLoading } = useReservationStore();
    const { rules, calculateDeposit } = useDepositStore();
    const { customers, fetchCustomers } = useCRMStore();
    const { currentBranch } = useAppStore();

    const [isAdding, setIsAdding] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [pendingReservation, setPendingReservation] = useState<Reservation | null>(null);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // Form State
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        partySize: 2,
        notes: '',
        sendConfirmation: true,
        customerId: '',
    });
    const [customerSearch, setCustomerSearch] = useState('');
    const [showGuestResults, setShowGuestResults] = useState(false);

    useEffect(() => {
        fetchReservations();
        fetchCustomers();
    }, []);

    const { amount } = calculateDeposit(formData, rules);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentBranch) return;

        const newReservation: Reservation = {
            id: `RES-${Date.now()}`,
            customerId: formData.customerId || `CUST-${Date.now()}`, // Use selected ID or fallback
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            date: formData.date,
            time: formData.time,
            partySize: formData.partySize,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            totalDepositRequired: amount,
            depositPaid: 0,
            notes: formData.notes,
            branchId: currentBranch.id,
            createdAt: Date.now(),
            sendConfirmation: formData.sendConfirmation
        };

        if (amount > 0) {
            setPendingReservation(newReservation);
            setShowPayment(true);
            setIsAdding(false);
        } else {
            await addReservation(newReservation, currentBranch);
            setIsAdding(false);
            toast.success(`Reservation for ${formData.customerName} created`);
        }
    };

    const handlePaymentSuccess = async (record: PaymentRecord) => {
        if (!pendingReservation || !currentBranch) return;
        const paidReservation: Reservation = {
            ...pendingReservation,
            depositPaid: record.amount,
            paymentStatus: record.amount >= pendingReservation.totalDepositRequired ? 'FULLY_PAID' : 'PARTIALLY_PAID',
            status: 'CONFIRMED'
        };
        await addReservation(paidReservation, currentBranch);
        setShowPayment(false);
        setPendingReservation(null);
        toast.success(`Reservation secured with payment!`);
    };

    const handleStatusUpdate = async (id: string, status: ReservationStatus) => {
        if (!currentBranch) return;
        await updateReservationStatus(id, status, currentBranch);
        toast.info(`Status updated to ${status}`);
    };

    const filteredReservations = reservations.filter(r => r.date === filterDate);

    return (
        <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-10 py-8 shrink-0">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <button
                            onClick={onBack}
                            className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-3 hover:text-indigo-600 transition-colors flex items-center gap-2 outline-none"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Dashboard
                        </button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Reservations Book</h1>
                    </div>

                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all flex items-center gap-3 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                        New Booking
                    </button>
                </div>
            </div>

            {/* Content Overflow Area */}
            <div className="flex-1 overflow-y-auto p-10">
                <div className="max-w-7xl mx-auto">
                    {/* Toolbar */}
                    <div className="mb-10 flex items-center gap-8 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing For</label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-black text-xs outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                        </div>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Pending</span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Confirmed</span>
                            <span className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Seated</span>
                        </div>
                    </div>

                    {/* Reservation Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredReservations.map(res => (
                            <div key={res.id} className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-full -mr-8 -mt-8 ${res.status === 'CONFIRMED' ? 'bg-indigo-500' :
                                    res.status === 'SEATED' ? 'bg-emerald-500' :
                                        res.status === 'CANCELLED' ? 'bg-red-500' : 'bg-amber-500'
                                    }`}></div>

                                <div className="flex justify-between items-start mb-8 relative">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{res.customerName}</h3>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{res.customerPhone}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${res.status === 'CONFIRMED' ? 'bg-indigo-600 text-white' :
                                                res.status === 'SEATED' ? 'bg-emerald-100 text-emerald-600' :
                                                    res.status === 'CANCELLED' ? 'bg-red-100 text-red-600' :
                                                        res.status === 'NO_SHOW' ? 'bg-slate-900 text-slate-400' :
                                                            'bg-amber-100 text-amber-600'
                                                }`}>
                                                {res.status}
                                            </span>
                                            {res.totalDepositRequired > 0 && (
                                                <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter ${res.paymentStatus === 'FULLY_PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {res.paymentStatus === 'FULLY_PAID' ? 'Deposit Paid' : `₦${res.totalDepositRequired} Pending`}
                                                </span>
                                            )}
                                        </div>
                                        {res.sendConfirmation && (
                                            <div className="mt-2 flex flex-col items-end gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${res.notificationStatus === 'FAILED' ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`}></div>
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                        {res.notificationStatus === 'FAILED' ? 'Delivery Error' : 'Notify Active'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (currentBranch) {
                                                            useNotificationStore.getState().sendNotification('RESERVATION_CONFIRMED', res, currentBranch);
                                                            toast.success('Resending confirmation...');
                                                        }
                                                    }}
                                                    className="text-[8px] font-black text-indigo-600 uppercase hover:underline"
                                                >
                                                    Manual Resend
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6 mb-10 border-t border-slate-50 pt-8 mt-4">
                                    <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time</div>
                                            <div className="text-lg font-black text-slate-800">{res.time}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Party Size</div>
                                            <div className="text-lg font-black text-slate-800">{res.partySize} PPL</div>
                                        </div>
                                    </div>
                                    {res.notes && (
                                        <p className="text-[11px] font-bold text-slate-500 italic px-2 leading-relaxed">"{res.notes}"</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50">
                                    {res.status === 'PENDING' && (
                                        <button
                                            onClick={() => handleStatusUpdate(res.id, 'CONFIRMED')}
                                            className="col-span-2 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                        >
                                            Confirm Table
                                        </button>
                                    )}
                                    {res.status === 'CONFIRMED' && (
                                        <button
                                            onClick={() => handleStatusUpdate(res.id, 'SEATED')}
                                            className="col-span-2 bg-emerald-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                                        >
                                            Mark as Seated
                                        </button>
                                    )}
                                    {['PENDING', 'CONFIRMED'].includes(res.status) && (
                                        <>
                                            <button
                                                onClick={() => handleStatusUpdate(res.id, 'CANCELLED')}
                                                className="bg-white border border-slate-100 text-red-500 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:border-red-100 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(res.id, 'NO_SHOW')}
                                                className="bg-white border border-slate-100 text-slate-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all"
                                            >
                                                No Show
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {filteredReservations.length === 0 && (
                            <div className="col-span-full py-40 flex flex-col items-center justify-center bg-white rounded-[4rem] border-2 border-dashed border-slate-200">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest mb-1">No bookings for this date</h3>
                                <p className="text-slate-400 font-bold text-xs italic">A quiet floor is a good time to prep!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal: Add Reservation */}
            {isAdding && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">New Booking</h3>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Guest Arrival Details</p>
                            </div>
                            <button onClick={() => setIsAdding(false)} className="bg-white p-3 rounded-2xl text-slate-400 hover:text-red-500 transition-all shadow-sm border border-slate-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 relative">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Search or Enter Guest Name</label>
                                    <input
                                        type="text" required
                                        value={formData.customerName}
                                        onChange={e => {
                                            setFormData({ ...formData, customerName: e.target.value });
                                            setCustomerSearch(e.target.value);
                                            setShowGuestResults(true);
                                        }}
                                        onFocus={() => setShowGuestResults(true)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-8 py-4 font-bold outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                                        placeholder="Search by name, phone or email..."
                                    />
                                    {showGuestResults && customerSearch.length > 1 && (
                                        <div className="absolute z-[210] top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                                            {customers.filter(c =>
                                                c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                                c.phone?.includes(customerSearch)
                                            ).map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({
                                                            ...formData,
                                                            customerName: c.name,
                                                            customerPhone: c.phone || '',
                                                            customerId: c.id
                                                        });
                                                        setShowGuestResults(false);
                                                    }}
                                                    className="w-full p-4 flex justify-between items-center hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                                                >
                                                    <div className="text-left">
                                                        <div className="text-sm font-black text-slate-800">{c.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400">{c.phone}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">₦{(c.wallets?.cash || 0).toLocaleString()} Wallet</div>
                                                    </div>
                                                </button>
                                            ))}
                                            {customers.filter(c =>
                                                c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                                c.phone?.includes(customerSearch)
                                            ).length === 0 && (
                                                    <div className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No matching guest</div>
                                                )}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                                    <input
                                        type="tel" required
                                        value={formData.customerPhone}
                                        onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                                        placeholder="+234..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Party Size</label>
                                    <input
                                        type="number" min="1" required
                                        value={formData.partySize}
                                        onChange={e => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Arrival Date</label>
                                    <input
                                        type="date" required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Arrival Time</label>
                                    <input
                                        type="time" required
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Special Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600 min-h-[100px]"
                                        placeholder="Window table, birthday, allergy..."
                                    />
                                </div>
                            </div>

                            {amount > 0 && (
                                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest font-black">Deposit Required</div>
                                        <div className="text-[9px] font-bold text-amber-600 uppercase mt-1">₦{amount.toLocaleString()} due now</div>
                                    </div>
                                    <div className="bg-white px-4 py-2 rounded-xl text-amber-600 font-black text-xs shadow-sm">
                                        SECURE BOOKING
                                    </div>
                                </div>
                            )}

                            <div className="bg-indigo-50/50 p-6 rounded-[2rem] flex items-center justify-between border border-indigo-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Active Notification</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase">Send SMS/WhatsApp instantly</div>
                                    </div>
                                </div>
                                <label className="cursor-pointer">
                                    <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.sendConfirmation ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.sendConfirmation ? 'left-7' : 'left-1'}`}></div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.sendConfirmation}
                                        onChange={e => setFormData({ ...formData, sendConfirmation: e.target.checked })}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all active:scale-[0.98]"
                            >
                                {amount > 0 ? `Pay ₦${amount.toLocaleString()} & Book` : 'Secure Reservation'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && pendingReservation && (
                <MockPaymentModal
                    reservation={pendingReservation}
                    onSuccess={handlePaymentSuccess}
                    onCancel={() => setShowPayment(false)}
                />
            )}
        </div>
    );
};

export default ReservationsView;
