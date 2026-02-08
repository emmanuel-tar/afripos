import React, { useState, useRef, useEffect } from 'react';
import { useTableStore } from '../../stores/useTableStore';
import { useConfigStore } from '../../stores/useConfigStore';
import { Table, TableShape } from '../../types';
import { toast } from 'sonner';

const TableCanvasDesigner: React.FC = () => {
    const { tables, addTable, updateTable, deleteTable } = useTableStore();
    const { floors, rooms, fetchLayout } = useConfigStore();

    const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

    // Canvas interaction state
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        fetchLayout();
    }, []);

    const filteredRooms = rooms.filter(r => r.floorId === selectedFloorId);
    const canvasTables = tables.filter(t => t.roomId === selectedRoomId);

    const handleAddTable = () => {
        if (!selectedRoomId || !selectedFloorId) {
            toast.error('Select a floor and room first');
            return;
        }
        const newTable: Table = {
            id: `TBL-${Date.now()}`,
            number: `${tables.length + 1}`,
            status: 'available',
            capacity: 4,
            shape: 'SQUARE',
            roomId: selectedRoomId,
            floorId: selectedFloorId,
            x: 100,
            y: 100,
            isActive: true
        };
        addTable(newTable);
        setSelectedTableId(newTable.id);
        toast.success(`Table ${newTable.number} added`);
    };

    const handleMouseDown = (e: React.MouseEvent, table: Table) => {
        e.stopPropagation();
        setIsDragging(true);
        setDraggedTableId(table.id);
        setSelectedTableId(table.id);

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !draggedTableId || !canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();

        // Calculate new position relative to canvas and adjusted for zoom
        const x = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
        const y = (e.clientY - canvasRect.top - dragOffset.y) / zoom;

        // Snap to grid option (optional, let's keep it fluid but bounded)
        const boundedX = Math.max(0, Math.min(x, 2000));
        const boundedY = Math.max(0, Math.min(y, 2000));

        const table = tables.find(t => t.id === draggedTableId);
        if (table) {
            updateTable({ ...table, x: boundedX, y: boundedY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDraggedTableId(null);
    };

    const renderChairs = (capacity: number, shape: TableShape) => {
        const chairs = [];
        const radius = shape === 'ROUND' ? 45 : 40;

        for (let i = 0; i < capacity; i++) {
            const angle = (i * 360) / capacity;
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

            chairs.push(
                <div
                    key={i}
                    className="absolute w-4 h-4 bg-slate-200 border border-slate-300 rounded-sm animate-pulse"
                    style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                        transition: 'all 0.3s ease'
                    }}
                />
            );
        }
        return chairs;
    };

    const selectedTable = tables.find(t => t.id === selectedTableId);

    return (
        <div className="flex h-[750px] gap-6 overflow-hidden">
            {/* Control Sidebar */}
            <div className="w-80 flex flex-col gap-6 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm shrink-0">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Environment</label>
                        <select
                            value={selectedFloorId || ''}
                            onChange={e => { setSelectedFloorId(e.target.value); setSelectedRoomId(null); }}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xs uppercase outline-none focus:border-indigo-600"
                        >
                            <option value="">Select Floor</option>
                            {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>

                        <select
                            value={selectedRoomId || ''}
                            onChange={e => setSelectedRoomId(e.target.value)}
                            disabled={!selectedFloorId}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-black text-xs uppercase outline-none focus:border-indigo-600 mt-3 disabled:opacity-30"
                        >
                            <option value="">Select Room</option>
                            {filteredRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>

                    <div className="h-px bg-slate-50"></div>

                    {selectedTable ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-900 uppercase">Table {selectedTable.number}</h3>
                                <button onClick={() => deleteTable(selectedTable.id)} className="text-red-500 hover:text-red-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Number</label>
                                    <input
                                        type="text"
                                        value={selectedTable.number}
                                        onChange={e => updateTable({ ...selectedTable, number: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Seating</label>
                                        <input
                                            type="number" min="1" max="12"
                                            value={selectedTable.capacity}
                                            onChange={e => updateTable({ ...selectedTable, capacity: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Geometry</label>
                                        <select
                                            value={selectedTable.shape}
                                            onChange={e => updateTable({ ...selectedTable, shape: e.target.value as TableShape })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold outline-none"
                                        >
                                            <option value="SQUARE">Square</option>
                                            <option value="ROUND">Round</option>
                                            <option value="RECTANGULAR">Rect</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest leading-relaxed">
                            Click a table on the canvas <br /> to configure properties
                        </div>
                    )}
                </div>

                <div className="mt-auto space-y-4">
                    <button
                        onClick={handleAddTable}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        + Add Custom Table
                    </button>
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                        <span>Zoom: {Math.round(zoom * 100)}%</span>
                        <div className="flex gap-2">
                            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center hover:bg-slate-200">-</button>
                            <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center hover:bg-slate-200">+</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-[4rem] relative overflow-hidden group/canvas">
                {/* Blueprint Grid */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-5"
                    style={{
                        backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)',
                        backgroundSize: '30px 30px'
                    }}
                />

                <div
                    ref={canvasRef}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="w-full h-full relative cursor-crosshair transform-gpu"
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                >
                    {canvasTables.map(table => (
                        <div
                            key={table.id}
                            onMouseDown={(e) => handleMouseDown(e, table)}
                            className={`absolute select-none cursor-move transition-shadow ${selectedTableId === table.id ? 'z-50' : 'z-10'
                                }`}
                            style={{
                                left: `${table.x}px`,
                                top: `${table.y}px`,
                                width: table.shape === 'RECTANGULAR' ? '120px' : '90px',
                                height: '90px'
                            }}
                        >
                            {/* Animated Chairs */}
                            <div className="absolute inset-0 z-0">
                                {renderChairs(table.capacity, table.shape)}
                            </div>

                            {/* Table Body */}
                            <div className={`
                                absolute inset-0 bg-white border-2 flex flex-col items-center justify-center shadow-lg transition-all
                                ${selectedTableId === table.id ? 'border-indigo-600 scale-105 shadow-2xl skew-y-1' : 'border-slate-200 group-hover:border-indigo-200'}
                                ${table.shape === 'ROUND' ? 'rounded-full' : table.shape === 'RECTANGULAR' ? 'rounded-3xl' : 'rounded-[1.5rem]'}
                                ${table.status === 'occupied' ? 'bg-indigo-50 border-indigo-200' : ''}
                            `}>
                                <div className="text-xl font-black text-slate-800 tracking-tight">{table.number}</div>
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{table.capacity} Pax</div>
                            </div>

                            {/* Status Indicator */}
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${table.status === 'occupied' ? 'bg-indigo-500' :
                                    table.status === 'reserved' ? 'bg-amber-400' :
                                        table.status === 'dirty' ? 'bg-slate-400' : 'bg-emerald-500'
                                }`} />
                        </div>
                    ))}

                    {canvasTables.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                            <h3 className="text-5xl font-black text-slate-300 uppercase tracking-[0.2em]">Floor Canvas</h3>
                            <p className="font-bold text-slate-400 uppercase mt-4">Drag tables here to design physical layout</p>
                        </div>
                    )}
                </div>

                {/* Legend Overlay */}
                <div className="absolute bottom-10 left-10 flex gap-6 bg-white/80 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-white/20 shadow-xl">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> <span className="text-[9px] font-black text-slate-500 uppercase">Available</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /> <span className="text-[9px] font-black text-slate-500 uppercase">Occupied</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-400" /> <span className="text-[9px] font-black text-slate-500 uppercase">Reserved</span></div>
                </div>
            </div>
        </div>
    );
};

export default TableCanvasDesigner;
