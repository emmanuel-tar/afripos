import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useAppStore } from '../stores/useAppStore';
import {
    NotificationTemplate,
    NotificationEvent,
    NotificationChannel,
    BranchNotificationSetting
} from '../types';
import { toast } from 'sonner';

const NotificationSettingsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const {
        templates, settings, logs, isLoading,
        fetchNotifications, saveTemplate, deleteTemplate, saveSetting
    } = useNotificationStore();
    const { currentBranch } = useAppStore();

    const [activeTab, setActiveTab] = useState<'templates' | 'settings' | 'logs'>('templates');
    const [editingTemplate, setEditingTemplate] = useState<Partial<NotificationTemplate> | null>(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleSaveTemplate = async () => {
        if (editingTemplate && editingTemplate.event && editingTemplate.channel && editingTemplate.content) {
            await saveTemplate({
                id: editingTemplate.id || `TMP-${Date.now()}`,
                event: editingTemplate.event as NotificationEvent,
                channel: editingTemplate.channel as NotificationChannel,
                content: editingTemplate.content,
                isActive: editingTemplate.isActive ?? true
            });
            setEditingTemplate(null);
            toast.success('Template saved successfully');
        }
    };

    const branchSetting = settings.find(s => s.branchId === currentBranch?.id) || {
        branchId: currentBranch?.id || 'default',
        enabledEvents: [],
        preferredChannel: 'WHATSAPP',
        fallbackToSms: true,
        reminderMinutesBefore: 30
    };

    const toggleEvent = (event: NotificationEvent) => {
        const enabledEvents = branchSetting.enabledEvents.includes(event)
            ? branchSetting.enabledEvents.filter(e => e !== event)
            : [...branchSetting.enabledEvents, event];

        saveSetting({ ...branchSetting, enabledEvents });
    };

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
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Notification Engine</h1>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        {(['templates', 'settings', 'logs'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Overflow Area */}
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
                <div className="max-w-7xl mx-auto pb-20">
                    {activeTab === 'templates' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Template Form */}
                            <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm h-fit">
                                <h3 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">
                                    {editingTemplate?.id ? 'Edit Template' : 'Create Template'}
                                </h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Event Trigger</label>
                                            <select
                                                value={editingTemplate?.event || ''}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, event: e.target.value as any })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                                            >
                                                <option value="">Select Event...</option>
                                                <option value="RESERVATION_CREATED">Reservation Created</option>
                                                <option value="RESERVATION_CONFIRMED">Reservation Confirmed</option>
                                                <option value="RESERVATION_REMINDER">Pre-Arrival Reminder</option>
                                                <option value="RESERVATION_SEATED">Guest Seated</option>
                                                <option value="RESERVATION_CANCELLED">Reservation Cancelled</option>
                                                <option value="NO_SHOW">No-Show Flagged</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Channel</label>
                                            <select
                                                value={editingTemplate?.channel || ''}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, channel: e.target.value as any })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none"
                                            >
                                                <option value="">Select Channel...</option>
                                                <option value="SMS">SMS</option>
                                                <option value="WHATSAPP">WhatsApp</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message Content</label>
                                            <span className={`text-[9px] font-black uppercase ${editingTemplate?.content?.length || 0 > 160 ? 'text-amber-500' : 'text-slate-300'}`}>
                                                {editingTemplate?.content?.length || 0} / 160 (SMS Count)
                                            </span>
                                        </div>
                                        <textarea
                                            value={editingTemplate?.content || ''}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-6 font-bold outline-none min-h-[160px] text-slate-700 leading-relaxed"
                                            placeholder="Use placeholders like {{customer_name}}, {{reservation_time}}..."
                                        />
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {['customer_name', 'reservation_date', 'reservation_time', 'party_size', 'branch_name'].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setEditingTemplate({ ...editingTemplate, content: (editingTemplate?.content || '') + ` {{${p}}}` })}
                                                    className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-indigo-100 transition-colors"
                                                >
                                                    + {{ p }}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Premium Live Preview */}
                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 mt-8 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                            </div>
                                        </div>
                                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Device Preview ({editingTemplate?.channel})</label>
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                                            <p className="text-white font-bold text-sm leading-relaxed">
                                                {editingTemplate?.content ? editingTemplate.content
                                                    .replace('{{customer_name}}', 'John Doe')
                                                    .replace('{{reservation_time}}', '19:00')
                                                    .replace('{{branch_name}}', currentBranch?.name || 'AfriPOS Central')
                                                    : 'Template content will appear here...'}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex justify-between items-center text-[9px] font-black text-white/30 uppercase tracking-widest">
                                            <span>Carrier: AfriPOS Network</span>
                                            <span>Just now</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button
                                            onClick={() => setEditingTemplate(null)}
                                            className="flex-1 px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]"
                                        >
                                            Discard
                                        </button>
                                        <button
                                            onClick={handleSaveTemplate}
                                            disabled={!editingTemplate?.event || !editingTemplate?.channel || !editingTemplate?.content}
                                            className="flex-1 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl disabled:opacity-50"
                                        >
                                            Finalise Template
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Template List */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] pl-4 border-l-4 border-slate-200">Active Library</h3>
                                {templates.map(t => (
                                    <div key={t.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{t.channel} • {t.event.replace('_', ' ')}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingTemplate(t)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                <button onClick={() => deleteTemplate(t.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 leading-relaxed italic">"{t.content}"</p>
                                    </div>
                                ))}
                                {templates.length === 0 && (
                                    <div className="text-center py-20 bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                        <div className="text-slate-300 font-black uppercase text-xs tracking-widest">Library Empty</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-[4rem] border border-slate-200 p-16 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-32 translate-x-32 opacity-50"></div>

                            <div className="relative">
                                <h2 className="text-3xl font-black text-slate-900 mb-2">Branch Automation</h2>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-12">Configure triggers for {currentBranch?.name}</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-8">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">Delivery Policy</h4>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Priority Channel</label>
                                                <div className="flex gap-2">
                                                    {(['SMS', 'WHATSAPP'] as const).map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => saveSetting({ ...branchSetting, preferredChannel: c })}
                                                            className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex-1 border transition-all ${branchSetting.preferredChannel === c ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            {c}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                                                <div className={`w-12 h-6 rounded-full relative transition-colors ${branchSetting.fallbackToSms ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${branchSetting.fallbackToSms ? 'left-7' : 'left-1'}`}></div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={branchSetting.fallbackToSms}
                                                    onChange={e => saveSetting({ ...branchSetting, fallbackToSms: e.target.checked })}
                                                    className="hidden"
                                                />
                                                <div>
                                                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">SMS Fallback</div>
                                                    <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Automated SMS if WhatsApp delivery fails</div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-4">Active Triggers</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { id: 'RESERVATION_CREATED', label: 'Confirmation' },
                                                { id: 'RESERVATION_CONFIRMED', label: 'Approved' },
                                                { id: 'RESERVATION_REMINDER', label: 'Reminder' },
                                                { id: 'RESERVATION_SEATED', label: 'Check-in' },
                                                { id: 'RESERVATION_CANCELLED', label: 'Cancellation' },
                                                { id: 'NO_SHOW', label: 'No Show' }
                                            ].map(event => (
                                                <button
                                                    key={event.id}
                                                    onClick={() => toggleEvent(event.id as NotificationEvent)}
                                                    className={`w-full flex justify-between items-center p-6 rounded-3xl border transition-all ${branchSetting.enabledEvents.includes(event.id as NotificationEvent)
                                                        ? 'bg-slate-50 border-indigo-200 shadow-sm'
                                                        : 'bg-white border-slate-100 opacity-60'
                                                        }`}
                                                >
                                                    <div className="text-left">
                                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{event.label}</div>
                                                        <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{event.id.replace('RESERVATION_', '').replace('_', ' ')}</div>
                                                    </div>
                                                    <div className={`w-4 h-4 rounded-full border-2 ${branchSetting.enabledEvents.includes(event.id as NotificationEvent)
                                                        ? 'bg-indigo-600 border-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]'
                                                        : 'border-slate-200'
                                                        }`}></div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recipient</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Channel</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Event</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Preview</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-6">
                                                <div className="text-xs font-black text-slate-800">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-10 py-6 font-black text-sm text-slate-800">{log.customerName}</td>
                                            <td className="px-10 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${log.channel === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                                                    }`}>
                                                    {log.channel}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase">{log.event.replace('RESERVATION_', '')}</td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${log.status === 'SENT' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                    <span className={`text-[10px] font-black uppercase ${log.status === 'SENT' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {log.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="max-w-[150px] truncate text-[10px] font-bold text-slate-400 italic">"{log.content}"</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {logs.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-10 py-20 text-center">
                                                <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No logs recorded yet</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationSettingsView;
