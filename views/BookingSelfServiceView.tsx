import React, { useState } from 'react';
import { useReservationStore } from '../stores/useReservationStore';
import { Reservation } from '../types';
import { toast } from 'sonner';
import { DEFAULT_BRANCHES } from '../constants';

const BookingSelfServiceView: React.FC = () => {
    const { fetchReservationByRef, updateReservationStatus } = useReservationStore();

    const [auth, setAuth] = useState({ reference: '', phone: '' });
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!auth.reference || !auth.phone) {
            toast.error("Please provide both Reference ID and Phone Number");
            return;
        }

        setIsSearching(true);
        const res = await fetchReservationByRef(auth.reference, auth.phone);
        setIsSearching(false);

        if (res) {
            setReservation(res);
        } else {
            toast.error("No booking found with these details.");
        }
    };

    const handleCancel = async () => {
        if (!reservation) return;
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;

        const branch = DEFAULT_BRANCHES.find(b => b.id === reservation.locationId);
        await updateReservationStatus(reservation.id, 'CANCELLED', branch!);
        toast.success("Booking cancelled successfully.");
        setReservation({ ...reservation, status: 'CANCELLED' });
    };

    const activeBranch = DEFAULT_BRANCHES.find(b => b.id === reservation?.locationId);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 py-6 px-10 flex justify-between items-center sticky top-0 z-50">
                <div className="text-indigo-600 font-black text-2xl tracking-tight uppercase">AFRI<span className="text-slate-800">POS</span> <span className="text-xs font-bold text-slate-400 align-top ml-1">SELF-SERVICE</span></div>
                <button onClick={() => window.location.reload()} className="text-[10px] font-black text-slate-400 tracking-widest uppercase hover:underline">Exit Portal</button>
            </header>

            <main className="flex-1 max-w-2xl mx-auto w-full px-6 pt-12">
                {!reservation ? (
                    <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
                        <div className="p-12">
                            <h2 className="text-4xl font-black tracking-tight mb-2">Manage Booking</h2>
                            <p className="text-slate-500 font-bold mb-10 uppercase text-xs tracking-widest">Access your reservation details</p>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Booking Reference</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. ABC123"
                                        value={auth.reference}
                                        onChange={e => setAuth({ ...auth, reference: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="Used during booking"
                                        value={auth.phone}
                                        onChange={e => setAuth({ ...auth, phone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all transform active:scale-95 mt-4 disabled:opacity-50"
                                >
                                    {isSearching ? 'Searching...' : 'Retrieve Booking'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 p-12">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                    <div className={`text-xl font-black uppercase tracking-tight ${reservation.status === 'CANCELLED' ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {reservation.status}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reference</div>
                                    <div className="text-xl font-black text-indigo-600 tracking-tighter">{reservation.reference}</div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 mb-10">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</span>
                                        <span className="text-base font-black text-slate-800">{activeBranch?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</span>
                                        <span className="text-base font-black text-slate-800">{reservation.date} @ {reservation.time}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guest Count</span>
                                        <span className="text-base font-black text-slate-800">{reservation.partySize} Guests</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table Assigned</span>
                                        <span className="text-base font-black text-slate-800">{reservation.tableName || 'Pending'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-5 rounded-3xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:border-indigo-600 transition-all"
                                >
                                    Download Receipt
                                </button>
                                {reservation.status !== 'CANCELLED' && (
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 py-5 rounded-3xl bg-white border border-slate-200 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-200 transition-all"
                                    >
                                        Cancel Booking
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setReservation(null)}
                            className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-600 transition-all"
                        >
                            ← Look up another booking
                        </button>
                    </div>
                )}
            </main>

            <footer className="mt-auto py-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                AfriPOS Self-Service Portal • Reference ID Required
            </footer>
        </div>
    );
};

export default BookingSelfServiceView;
