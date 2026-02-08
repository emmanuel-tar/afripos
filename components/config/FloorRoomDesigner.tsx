import React, { useState, useEffect } from 'react';
import { useConfigStore } from '../../stores/useConfigStore';
import { Floor, Room } from '../../types';
import { toast } from 'sonner';

const FloorRoomDesigner: React.FC = () => {
    const { floors, rooms, fetchLayout, saveFloor, deleteFloor, saveRoom, deleteRoom, isLoading } = useConfigStore();

    const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
    const [isAddingFloor, setIsAddingFloor] = useState(false);
    const [isAddingRoom, setIsAddingRoom] = useState(false);

    const [editingFloor, setEditingFloor] = useState<Partial<Floor> | null>(null);
    const [editingRoom, setEditingRoom] = useState<Partial<Room> | null>(null);

    useEffect(() => {
        fetchLayout();
    }, []);

    const handleSaveFloor = async () => {
        if (!editingFloor?.name) return;
        const floor: Floor = {
            id: editingFloor.id || `FL-${Date.now()}`,
            name: editingFloor.name,
            order: editingFloor.order || floors.length + 1,
            isActive: editingFloor.isActive ?? true
        };
        await saveFloor(floor);
        setEditingFloor(null);
        setIsAddingFloor(false);
        toast.success(`Floor "${floor.name}" saved`);
    };

    const handleSaveRoom = async () => {
        if (!editingRoom?.name || !selectedFloorId) return;
        const room: Room = {
            id: editingRoom.id || `RM-${Date.now()}`,
            floorId: selectedFloorId,
            name: editingRoom.name,
            type: editingRoom.type || 'REGULAR',
            pricingMultiplier: editingRoom.pricingMultiplier || 1.0,
            isActive: editingRoom.isActive ?? true,
            order: editingRoom.order || rooms.length + 1
        };
        await saveRoom(room);
        setEditingRoom(null);
        setIsAddingRoom(false);
        toast.success(`Room "${room.name}" saved`);
    };

    const selectedFloor = floors.find(f => f.id === selectedFloorId);
    const floorRooms = rooms.filter(r => r.floorId === selectedFloorId);

    return (
        <div className="flex h-[700px] gap-10">
            {/* Sidebar: Floors */}
            <div className="w-80 flex flex-col gap-6">
                <div className="flex justify-between items-end px-2">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Environment Levels</h3>
                    <button
                        onClick={() => { setEditingFloor({ name: '', order: floors.length + 1, isActive: true }); setIsAddingFloor(true); }}
                        className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                    >
                        + Add Floor
                    </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                    {floors.map(floor => (
                        <button
                            key={floor.id}
                            onClick={() => setSelectedFloorId(floor.id)}
                            className={`w-full p-6 bg-white border-2 rounded-[2rem] text-left transition-all flex justify-between items-center group ${selectedFloorId === floor.id ? 'border-indigo-600 shadow-xl' : 'border-slate-100 hover:border-slate-200 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedFloorId === floor.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                    {floor.order}
                                </div>
                                <div className="font-black text-slate-800 uppercase tracking-tight text-sm">{floor.name}</div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span onClick={(e) => { e.stopPropagation(); setEditingFloor(floor); setIsAddingFloor(true); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 00-2 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></span>
                                <span onClick={(e) => { e.stopPropagation(); if (confirm('Delete floor and all its rooms?')) deleteFloor(floor.id); }} className="p-2 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></span>
                            </div>
                        </button>
                    ))}
                    {floors.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-300 font-black text-[10px] uppercase tracking-widest px-10">
                            No floors designed yet
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area: Rooms */}
            <div className="flex-1 bg-white border border-slate-200 rounded-[4rem] p-12 shadow-sm flex flex-col relative overflow-hidden">
                {!selectedFloorId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                        </div>
                        <h4 className="text-xl font-black text-slate-300 uppercase tracking-widest">Select a floor to design rooms</h4>
                        <p className="text-slate-400 font-bold text-xs mt-2 italic">Building up your restaurant structure</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{selectedFloor?.name} <span className="text-slate-200">Sections</span></h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure room types and pricing</p>
                            </div>
                            <button
                                onClick={() => { setEditingRoom({ name: '', type: 'REGULAR', pricingMultiplier: 1.0, isActive: true }); setIsAddingRoom(true); }}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                            >
                                + New Room / Section
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {floorRooms.map(room => (
                                <div key={room.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:border-indigo-600 transition-all group relative">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${room.type === 'VIP' ? 'bg-amber-100 text-amber-600' :
                                                        room.type === 'OUTDOOR' ? 'bg-emerald-100 text-emerald-600' :
                                                            'bg-indigo-100 text-indigo-600'
                                                    }`}>
                                                    {room.type}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-300 uppercase">Multiplier: {room.pricingMultiplier}x</span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{room.name}</h4>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingRoom(room); setIsAddingRoom(true); }} className="p-2 text-slate-400 hover:text-indigo-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                            <button onClick={() => deleteRoom(room.id)} className="p-2 text-slate-300 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                            <div className={`text-xs font-black uppercase ${room.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {room.isActive ? 'Operation Active' : 'Offline'}
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-white p-4 rounded-2xl border border-slate-100">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact</div>
                                            <div className="text-xs font-black text-slate-800 uppercase">
                                                {room.pricingMultiplier > 1 ? `+${Math.round((room.pricingMultiplier - 1) * 100)}% Pricing` : 'Standard Rates'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {floorRooms.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                                    <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.2em]">Zero rooms defined on this level</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {isAddingFloor && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-slate-800 uppercase">{editingFloor?.id ? 'Edit Floor' : 'Create Level'}</h3>
                            <button onClick={() => setIsAddingFloor(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Display Name</label>
                                <input
                                    type="text"
                                    value={editingFloor?.name}
                                    onChange={e => setEditingFloor({ ...editingFloor, name: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-600 transition-all"
                                    placeholder="e.g. Roof Top, Ground Floor"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Stack Order</label>
                                    <input
                                        type="number"
                                        value={editingFloor?.order}
                                        onChange={e => setEditingFloor({ ...editingFloor, order: parseInt(e.target.value) })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none"
                                    />
                                </div>
                                <div className="flex flex-col justify-end pb-1">
                                    <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                        <input
                                            type="checkbox"
                                            checked={editingFloor?.isActive}
                                            onChange={e => setEditingFloor({ ...editingFloor, isActive: e.target.checked })}
                                            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-600"
                                        />
                                        <span className="text-[9px] font-black text-slate-700 uppercase">Active Level</span>
                                    </label>
                                </div>
                            </div>
                            <button onClick={handleSaveFloor} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                                Secure Floor Definition
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAddingRoom && (
                <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="text-2xl font-black text-slate-800 uppercase">{editingRoom?.id ? 'Edit Section' : 'Add Section'}</h3>
                            <button onClick={() => setIsAddingRoom(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Section Name</label>
                                <input
                                    type="text"
                                    value={editingRoom?.name}
                                    onChange={e => setEditingRoom({ ...editingRoom, name: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none focus:border-indigo-600 transition-all"
                                    placeholder="e.g. VIP Lounge, Main Hall, Patio"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Category Type</label>
                                    <select
                                        value={editingRoom?.type}
                                        onChange={e => setEditingRoom({ ...editingRoom, type: e.target.value as Room['type'] })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none"
                                    >
                                        <option value="REGULAR">REGULAR</option>
                                        <option value="VIP">VIP</option>
                                        <option value="OUTDOOR">OUTDOOR</option>
                                        <option value="BAR">BAR</option>
                                        <option value="LOUNGE">LOUNGE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Pricing Multiplier</label>
                                    <input
                                        type="number" step="0.05"
                                        value={editingRoom?.pricingMultiplier}
                                        onChange={e => setEditingRoom({ ...editingRoom, pricingMultiplier: parseFloat(e.target.value) })}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold outline-none font-mono"
                                    />
                                    <p className="text-[8px] font-bold text-indigo-400 uppercase mt-2 ml-2">e.g. 1.1 = +10% charge</p>
                                </div>
                            </div>
                            <button onClick={handleSaveRoom} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                                Update Section Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloorRoomDesigner;
