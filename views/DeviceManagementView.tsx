import React from 'react';
import { useDeviceStore } from '../stores/useDeviceStore';
import { Tablet, Laptop, Monitor, Trash2, CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

const DeviceManagementView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { pendingRequests, trustedDevices, approveDevice, rejectDevice, revokeDevice } = useDeviceStore();

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'WAITER': return <Tablet className="w-5 h-5" />;
            case 'CASHPOINT': return <Laptop className="w-5 h-5" />;
            case 'KDS': return <Monitor className="w-5 h-5" />;
            default: return <Shield className="w-5 h-5" />;
        }
    };

    return (
        <div className="h-full bg-slate-50 flex flex-col p-10 overflow-y-auto">
            <div className="mb-10 flex justify-between items-center">
                <div>
                    <button onClick={onBack} className="text-indigo-600 font-bold flex items-center gap-2 mb-2 hover:translate-x-[-4px] transition-transform">
                        ← Back to Settings
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Terminal Management</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Pending Requests */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-amber-500" />
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Pending Approvals</h2>
                        <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black">{pendingRequests.length}</span>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                        {pendingRequests.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                No pending requests
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Info</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingRequests.map(device => (
                                        <tr key={device.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                                        {getRoleIcon(device.type)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-sm uppercase">{device.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{device.type} • ID: {device.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-sm font-black text-slate-500">{device.ip}</td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => approveDevice(device.id)}
                                                        className="p-3 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => rejectDevice(device.id)}
                                                        className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Trusted Devices */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Trusted Terminals</h2>
                        <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">{trustedDevices.length}</span>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
                        {trustedDevices.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                No trusted devices paired
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Device Info</th>
                                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trustedDevices.map(device => (
                                        <tr key={device.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl relative">
                                                        {getRoleIcon(device.type)}
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-sm uppercase">{device.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {device.type} • Paired {device.pairedAt ? new Date(device.pairedAt).toLocaleDateString() : 'Unknown'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button
                                                    onClick={() => revokeDevice(device.id)}
                                                    className="p-3 bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
                                                    title="Revoke Permission"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-12 bg-indigo-100 rounded-[2.5rem] p-10 flex items-center justify-between border-2 border-indigo-200 shadow-indigo-100 shadow-inner">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-white rounded-3xl shadow-lg">
                        <Monitor className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-indigo-900 uppercase">Local Server Status: ACTIVE</h3>
                        <p className="text-indigo-600 font-bold text-sm">The hub is listening for new terminal pairing requests at port 8080.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-indigo-400">
                    <div className="text-[10px] font-black uppercase tracking-widest">Encryption: AES-256</div>
                </div>
            </div>
        </div>
    );
};

export default DeviceManagementView;
