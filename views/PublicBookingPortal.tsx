import React, { useState, useMemo } from 'react';
import { DEFAULT_BRANCHES } from '../constants';
import { useConfigStore } from '../stores/useConfigStore';
import { useReservationStore } from '../stores/useReservationStore';
import { useTableStore } from '../stores/useTableStore';
import { useDepositStore } from '../stores/useDepositStore';
import { useAppStore } from '../stores/useAppStore';
import { AvailabilityEngine } from '../services/availabilityEngine';
import { Table, Branch, Reservation, PaymentMethod } from '../types';
import { toast } from 'sonner';

type BookingStep = 'SEARCH' | 'SELECT_TABLE' | 'GUEST_INFO' | 'PAYMENT' | 'CONFIRMATION';

const PublicBookingPortal: React.FC = () => {
    const branches = DEFAULT_BRANCHES;
    const { tables } = useTableStore();
    const { reservations, addReservation } = useReservationStore();
    const { calculateDeposit } = useDepositStore();

    const [step, setStep] = useState<BookingStep>('SEARCH');
    const [bookingData, setBookingData] = useState({
        locationId: '',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        partySize: 2,
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        notes: '',
        tableId: '',
        tableName: '',
        totalDeposit: 0
    });

    const [availableTables, setAvailableTables] = useState<Table[]>([]);
    const [confirmedBooking, setConfirmedBooking] = useState<Reservation | null>(null);

    const activeBranch = branches.find(b => b.id === bookingData.locationId);

    const handleSearch = () => {
        if (!bookingData.locationId) {
            toast.error("Please select a branch");
            return;
        }

        const found = AvailabilityEngine.findAvailableTables(
            tables,
            reservations,
            bookingData.date,
            bookingData.time,
            bookingData.partySize,
            bookingData.locationId
        );

        setAvailableTables(found);
        if (found.length === 0) {
            toast.error("No tables available for selected time and party size.");
        } else {
            setStep('SELECT_TABLE');
        }
    };

    const handleTableSelect = (table: Table) => {
        const deposit = calculateDeposit({
            date: bookingData.date,
            partySize: bookingData.partySize,
            locationId: bookingData.locationId
        }, useDepositStore.getState().rules);

        setBookingData({
            ...bookingData,
            tableId: table.id,
            tableName: table.number,
            totalDeposit: deposit.amount
        });
        setStep('GUEST_INFO');
    };

    const handleConfirmBooking = async () => {
        if (!bookingData.customerName || !bookingData.customerPhone) {
            toast.error("Please provide your name and phone number");
            return;
        }

        if (bookingData.totalDeposit > 0) {
            setStep('PAYMENT');
        } else {
            await finalizeBooking();
        }
    };

    const finalizeBooking = async (paymentRef?: string) => {
        const newRes: Reservation = {
            id: `RES-${Date.now()}`,
            customerId: `GUEST-${Date.now()}`,
            customerName: bookingData.customerName,
            customerPhone: bookingData.customerPhone,
            date: bookingData.date,
            time: bookingData.time,
            partySize: bookingData.partySize,
            tableId: bookingData.tableId,
            tableName: bookingData.tableName,
            status: 'PENDING',
            paymentStatus: bookingData.totalDeposit > 0 ? 'FULLY_PAID' : 'FULLY_PAID', // Simplified for demo
            totalDepositRequired: bookingData.totalDeposit,
            depositPaid: bookingData.totalDeposit,
            locationId: bookingData.locationId,
            createdAt: Date.now(),
            sendConfirmation: true,
            source: 'ONLINE',
            reference: Math.random().toString(36).substring(2, 8).toUpperCase()
        };

        await addReservation(newRes, activeBranch!);
        setConfirmedBooking(newRes);
        setStep('CONFIRMATION');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 py-6 px-10 flex justify-between items-center sticky top-0 z-50">
                <div className="text-indigo-600 font-black text-2xl tracking-tight uppercase">AFRI<span className="text-slate-800">POS</span> <span className="text-xs font-bold text-slate-400 align-top ml-1">RESERVATIONS</span></div>
                <div className="flex gap-4">
                    <button className="text-[10px] font-black text-indigo-600 tracking-widest uppercase hover:underline">Manage Booking</button>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-12">
                {/* Progress Indicators */}
                {step !== 'CONFIRMATION' && (
                    <div className="flex justify-between mb-12 relative px-4">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
                        {['SEARCH', 'SELECT_TABLE', 'GUEST_INFO', 'PAYMENT'].map((s, i) => {
                            const stepsOrder = ['SEARCH', 'SELECT_TABLE', 'GUEST_INFO', 'PAYMENT'];
                            const isActive = s === step;
                            const isPast = stepsOrder.indexOf(s) < stepsOrder.indexOf(step);
                            return (
                                <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-sm transition-all ${isActive ? 'bg-indigo-600 border-indigo-600 text-white scale-125' :
                                    isPast ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'
                                    }`}>
                                    {isPast ? '✓' : i + 1}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
                    {step === 'SEARCH' && (
                        <div className="p-12">
                            <h2 className="text-4xl font-black tracking-tight mb-2">Find a Table</h2>
                            <p className="text-slate-500 font-bold mb-10 uppercase text-xs tracking-widest">Select your branch and preferred time</p>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Select Branch</label>
                                    <select
                                        value={bookingData.locationId}
                                        onChange={e => setBookingData({ ...bookingData, locationId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all appearance-none"
                                    >
                                        <option value="">Choose a location...</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Reservation Date</label>
                                        <input
                                            type="date"
                                            value={bookingData.date}
                                            onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Guest Count</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={bookingData.partySize}
                                            onChange={e => setBookingData({ ...bookingData, partySize: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Arrival Time</label>
                                    <input
                                        type="time"
                                        value={bookingData.time}
                                        onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleSearch}
                                    className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform active:scale-95 mt-4"
                                >
                                    Check Availability
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'SELECT_TABLE' && (
                        <div className="p-12">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tight mb-2">Pick Your Spot</h2>
                                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">{availableTables.length} Tables Available @ {bookingData.time}</p>
                                </div>
                                <button onClick={() => setStep('SEARCH')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">← Edit Search</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {availableTables.map(table => (
                                    <button
                                        key={table.id}
                                        onClick={() => handleTableSelect(table)}
                                        className="flex items-center justify-between p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-indigo-600 hover:bg-white hover:shadow-xl transition-all group group relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform">
                                                {table.number}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Capacity</div>
                                                <div className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{table.capacity} Guests</div>
                                            </div>
                                        </div>
                                        <svg className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transform group-hover:translate-x-2 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'GUEST_INFO' && (
                        <div className="p-12">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tight mb-2">A Bit About You</h2>
                                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Table {bookingData.tableName} for {bookingData.partySize} guests</p>
                                </div>
                                <button onClick={() => setStep('SELECT_TABLE')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">← Back</button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. John Doe"
                                        value={bookingData.customerName}
                                        onChange={e => setBookingData({ ...bookingData, customerName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="080... or +234..."
                                            value={bookingData.customerPhone}
                                            onChange={e => setBookingData({ ...bookingData, customerPhone: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Email (Optional)</label>
                                        <input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={bookingData.customerEmail}
                                            onChange={e => setBookingData({ ...bookingData, customerEmail: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Special Requests</label>
                                    <textarea
                                        placeholder="Allergies, birthday surprise, etc."
                                        value={bookingData.notes}
                                        onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all h-32"
                                    />
                                </div>

                                <button
                                    onClick={handleConfirmBooking}
                                    className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform active:scale-95 mt-4"
                                >
                                    {bookingData.totalDeposit > 0 ? `Proceed to Payment (₦${bookingData.totalDeposit.toLocaleString()})` : 'Confirm Booking'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'PAYMENT' && (
                        <div className="p-12">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tight mb-2">Secure Deposit</h2>
                                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Required to confirm your reservation</p>
                                </div>
                                <button onClick={() => setStep('GUEST_INFO')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">← Back</button>
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white mb-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10 animate-pulse"></div>
                                <div className="flex justify-between items-end relative">
                                    <div>
                                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 font-sans">Payment Amount</div>
                                        <div className="text-5xl font-black tracking-tighter">₦{bookingData.totalDeposit.toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Booking for</div>
                                        <div className="text-lg font-black">{bookingData.date} @ {bookingData.time}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {['Credit/Debit Card', 'Bank Transfer', 'USSD Code'].map(method => (
                                    <button
                                        key={method}
                                        onClick={() => finalizeBooking()}
                                        className="w-full flex items-center justify-between p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-600 hover:shadow-lg transition-all group"
                                    >
                                        <span className="font-black text-xs text-slate-700 uppercase tracking-widest group-hover:text-indigo-600">{method}</span>
                                        <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'CONFIRMATION' && confirmedBooking && (
                        <div className="p-20 text-center animate-in fade-in zoom-in duration-700">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-8 animate-bounce">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-5xl font-black tracking-tight mb-4">You're All Set!</h2>
                            <p className="text-slate-500 font-bold mb-10 uppercase text-xs tracking-[0.2em]">Booking Reference: <span className="text-indigo-600">{confirmedBooking.reference}</span></p>

                            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 text-left mb-10 max-w-md mx-auto">
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-slate-200 pb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch</span>
                                        <span className="text-sm font-black text-slate-800">{activeBranch?.name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table</span>
                                        <span className="text-sm font-black text-slate-800">{confirmedBooking.tableName}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200 pb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</span>
                                        <span className="text-sm font-black text-slate-800">{confirmedBooking.date} @ {confirmedBooking.time}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Party Size</span>
                                        <span className="text-sm font-black text-slate-800">{confirmedBooking.partySize} Guests</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-10">A confirmation has been sent via SMS & WHATSAPP</p>

                            <div className="flex gap-4 max-w-md mx-auto">
                                <button onClick={() => window.print()} className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:border-indigo-600 transition-all">Print Receipt</button>
                                <button onClick={() => {
                                    setStep('SEARCH');
                                    setBookingData({
                                        locationId: '',
                                        date: new Date().toISOString().split('T')[0],
                                        time: '19:00',
                                        partySize: 2,
                                        customerName: '',
                                        customerPhone: '',
                                        customerEmail: '',
                                        notes: '',
                                        tableId: '',
                                        tableName: '',
                                        totalDeposit: 0
                                    });
                                }} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 shadow-xl transition-all">New Booking</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="mt-auto py-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Powered by AfriPOS • Secure Payment Guaranteed
            </footer>
        </div>
    );
};

export default PublicBookingPortal;
