import React, { useState } from 'react';
import { PrinterConfig, PrintLocation } from '../types';
import { PRINT_LOCATIONS, DEFAULT_BRANCHES } from '../constants';
import { useAppStore } from '../stores/useAppStore';
import { toast } from 'sonner';

interface PrinterRoutingViewProps {
    onBack: () => void;
}

const PrinterRoutingView: React.FC<PrinterRoutingViewProps> = ({ onBack }) => {
    const [printers, setPrinters] = useState<PrinterConfig[]>(DEFAULT_BRANCHES[0].printers || []);
    const [isAdding, setIsAdding] = useState(false);

    const handleTogglePrinter = (id: string) => {
        setPrinters(prev => prev.map(p =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
        ));
    };

    const handleTestPrint = (printerName: string) => {
        toast.info(`Sending test page to ${printerName}...`);
        setTimeout(() => toast.success(`Test page printed successfully on ${printerName}`), 1500);
    };

    return (
        <div className="h-full bg-slate-50 flex flex-col p-8 overflow-y-auto">
            <div className="mb-10 flex justify-between items-center">
                <div>
                    <button onClick={onBack} className="text-indigo-600 font-bold flex items-center gap-2 mb-2 hover:translate-x-[-4px] transition-transform">
                        ← Back to Settings
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Printer Routing</h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                    + Add New Printer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {printers.map(printer => (
                    <div key={printer.id} className={`bg-white rounded-[2.5rem] p-8 shadow-xl border-2 transition-all ${printer.enabled ? 'border-transparent' : 'border-slate-100 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="bg-slate-100 p-4 rounded-2xl">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={printer.enabled} onChange={() => handleTogglePrinter(printer.id)} className="sr-only peer" />
                                <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-1 uppercase">{printer.name}</h3>
                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6">Station: {printer.location}</div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-4">
                                <span className="text-slate-400 font-bold uppercase tracking-tighter">Connection</span>
                                <span className="text-slate-800 font-black uppercase tracking-tighter">{printer.connectionType || 'NETWORK'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-4">
                                <span className="text-slate-400 font-bold uppercase tracking-tighter">IP Address</span>
                                <span className="text-slate-800 font-black tracking-tighter">{printer.ipAddress || '192.168.1.100'}</span>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => handleTestPrint(printer.name)}
                                className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
                            >
                                Test Print
                            </button>
                            <button className="p-4 bg-slate-100 text-slate-400 rounded-xl hover:text-slate-600 active:scale-95 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrinterRoutingView;
