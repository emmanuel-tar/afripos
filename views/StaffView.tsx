
import React, { useEffect, useState, useMemo } from 'react';
import { useHRStore } from '../stores/useHRStore';
import { User, Shift } from '../types';
import { format, differenceInHours, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

const CURRENCY = '₦';

interface StaffViewProps {
    onBack: () => void;
}

const StaffView: React.FC<StaffViewProps> = ({ onBack }) => {
    const { staff, shifts, fetchHRData, addStaff, updateStaff, removeStaff, clockIn, clockOut } = useHRStore();
    const [activeTab, setActiveTab] = useState<'ROSTER' | 'SHIFTS' | 'PAYROLL'>('ROSTER');
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Partial<User> | null>(null);

    useEffect(() => {
        fetchHRData();
    }, [fetchHRData]);

    const payrollData = useMemo(() => {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        return staff.map(user => {
            const userShifts = shifts.filter(s =>
                s.userId === user.id &&
                s.endTime &&
                isWithinInterval(new Date(s.startTime), { start: monthStart, end: monthEnd })
            );

            const totalHours = userShifts.reduce((sum, s) => {
                return sum + differenceInHours(new Date(s.endTime!), new Date(s.startTime));
            }, 0);

            const baseSalary = user.baseSalary || 20000; // Default min salary
            const hourlyRate = baseSalary / 160; // Assuming 160h month
            const earned = totalHours * hourlyRate;

            return {
                ...user,
                totalHours,
                earned
            };
        });
    }, [staff, shifts]);

    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff?.name || !editingStaff?.role) return;

        if (editingStaff.id) {
            updateStaff(editingStaff as User);
            toast.success("Staff profile updated.");
        } else {
            const newUser: User = {
                ...(editingStaff as User),
                id: `STF-${Math.random().toString(36).substr(2, 9)}`,
                joinedDate: Date.now(),
                locationId: 'br-1' // Default
            };
            addStaff(newUser);
            toast.success("New staff member added.");
        }
        setIsStaffModalOpen(false);
        setEditingStaff(null);
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 h-screen overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-12 py-8 shrink-0">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px] mb-2 cursor-pointer hover:text-indigo-700" onClick={onBack}>← Back to Dashboard</div>
                        <h2 className="text-5xl font-black text-slate-800 tracking-tight">Staff & HR</h2>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => { setEditingStaff({}); setIsStaffModalOpen(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all">
                            + Add Staff
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-slate-100">
                    {(['ROSTER', 'SHIFTS', 'PAYROLL'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"></div>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12">
                {activeTab === 'ROSTER' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {staff.map(user => (
                            <div key={user.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:border-indigo-600 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform"></div>
                                <div className="relative mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl uppercase mb-4">
                                        {user.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">{user.role}</div>
                                    <h3 className="text-2xl font-black text-slate-800">{user.name}</h3>
                                </div>
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-400 uppercase">Joined</span>
                                        <span className="text-slate-800">{user.joinedDate ? format(user.joinedDate, 'MMM yyyy') : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-400 uppercase">Base Salary</span>
                                        <span className="text-slate-800">{CURRENCY}{(user.baseSalary || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => { setEditingStaff(user); setIsStaffModalOpen(true); }} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Edit Profile</button>
                                    <button onClick={() => {
                                        const activeShift = shifts.find(s => s.userId === user.id && s.status === 'OPEN');
                                        if (activeShift) clockOut(activeShift.id);
                                        else clockIn(user.id, user.name);
                                        toast.success(activeShift ? `${user.name} clocked out` : `${user.name} clocked in`);
                                    }} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${shifts.find(s => s.userId === user.id && s.status === 'OPEN') ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                        {shifts.find(s => s.userId === user.id && s.status === 'OPEN') ? 'Clock Out' : 'Clock In'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'SHIFTS' && (
                    <div className="space-y-4">
                        {shifts.sort((a, b) => b.startTime - a.startTime).map(shift => (
                            <div key={shift.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex justify-between items-center group">
                                <div className="flex items-center gap-6">
                                    <div className={`w-3 h-3 rounded-full ${shift.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                    <div>
                                        <div className="text-lg font-black text-slate-800">{shift.userName}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                                            {format(shift.startTime, 'EEE, dd MMM • HH:mm')}
                                            {shift.endTime ? ` - ${format(shift.endTime, 'HH:mm')}` : ' (Active)'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-slate-800 uppercase tracking-widest">
                                        {shift.endTime ? `${differenceInHours(new Date(shift.endTime), new Date(shift.startTime))} Hours` : 'In Progress'}
                                    </div>
                                    <div className={`text-[9px] font-black uppercase px-2 py-1 rounded-full inline-block mt-1 ${shift.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                        {shift.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {shifts.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <div className="text-slate-300 font-black text-xl uppercase tracking-widest">No shift logs found</div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'PAYROLL' && (
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm">
                        <h3 className="text-2xl font-black text-slate-800 mb-8 flex justify-between items-center">
                            Payroll Summary - {format(new Date(), 'MMMM yyyy')}
                            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Estimated Totals</span>
                        </h3>
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-slate-100">
                                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hours Worked</th>
                                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Est. Earnings</th>
                                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Base Salary</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payrollData.map(user => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-all">
                                        <td className="py-6">
                                            <div className="font-black text-slate-800">{user.name}</div>
                                            <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{user.role}</div>
                                        </td>
                                        <td className="py-6 text-center font-black text-slate-800">{user.totalHours} hrs</td>
                                        <td className="py-6 text-right font-black text-emerald-600">{CURRENCY}{user.earned.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="py-6 text-right font-black text-slate-400">{CURRENCY}{(user.baseSalary || 20000).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-slate-200">
                                    <td colSpan={2} className="pt-8 text-lg font-black text-slate-800">Total Month Liability</td>
                                    <td colSpan={2} className="pt-8 text-right text-3xl font-black text-indigo-600">
                                        {CURRENCY}{payrollData.reduce((sum, u) => sum + u.earned, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Staff Modal */}
            {isStaffModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsStaffModalOpen(false)}></div>
                    <form onSubmit={handleSaveStaff} className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-indigo-600 px-10 py-10 text-white">
                            <h3 className="text-3xl font-black tracking-tight">{editingStaff?.id ? 'Edit Profile' : 'Add New Staff'}</h3>
                            <p className="text-indigo-100 font-bold text-sm">Fill in the employee details below.</p>
                        </div>
                        <div className="p-10 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingStaff?.name || ''}
                                    onChange={e => setEditingStaff({ ...editingStaff, name: e.target.value })}
                                    placeholder="e.g. Kola Owolabi"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Role</label>
                                    <select
                                        value={editingStaff?.role || 'waiter'}
                                        onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value as any })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="waiter">Waiter</option>
                                        <option value="chef">Chef</option>
                                        <option value="manager">Manager</option>
                                        <option value="bartender">Bartender</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Base Salary</label>
                                    <input
                                        type="number"
                                        value={editingStaff?.baseSalary || ''}
                                        onChange={e => setEditingStaff({ ...editingStaff, baseSalary: Number(e.target.value) })}
                                        placeholder="20000"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">Save Profile</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default StaffView;
