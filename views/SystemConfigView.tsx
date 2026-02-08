import React, { useState } from 'react';
import SystemReset from '../components/config/SystemReset';
import FloorRoomDesigner from '../components/config/FloorRoomDesigner';
import TableCanvasDesigner from '../components/config/TableCanvasDesigner';

const SystemConfigView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'designer' | 'layout' | 'reset'>('layout');

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
                            Back to Management
                        </button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Control Center</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">High-Control System Configuration & Mapping</p>
                    </div>

                    <div className="flex bg-slate-100 p-2 rounded-[2rem] gap-2 border border-slate-200">
                        <button
                            onClick={() => setActiveTab('layout')}
                            className={`px-8 py-3 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'layout' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Floors & Rooms
                        </button>
                        <button
                            onClick={() => setActiveTab('designer')}
                            className={`px-8 py-3 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'designer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Table Mapper
                        </button>
                        <button
                            onClick={() => setActiveTab('reset')}
                            className={`px-8 py-3 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'reset' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}
                        >
                            Full System Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-12">
                <div className="max-w-7xl mx-auto pb-20">
                    {activeTab === 'layout' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <FloorRoomDesigner />
                        </div>
                    )}
                    {activeTab === 'designer' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <TableCanvasDesigner />
                        </div>
                    )}
                    {activeTab === 'reset' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <SystemReset />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemConfigView;
