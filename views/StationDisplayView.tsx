
import React, { useState, useEffect, useMemo } from 'react';
import { Order } from '../types';
import { PRINT_LOCATIONS } from '../constants';
import { saveOrder } from '../services/db';
import { toast } from 'sonner';

interface StationDisplayViewProps {
  onBack: () => void;
}

const StationDisplayView: React.FC<StationDisplayViewProps> = ({ onBack }) => {
  const [station, setStation] = useState<typeof PRINT_LOCATIONS[number]>('KITCHEN');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'SCHEDULED'>('ACTIVE');
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const refreshOrders = async () => {
      const all = await (await import('../services/db')).getOrders();
      const filtered = all.filter(o => {
        const hasItemForStation = o.items.some(i => i.printLocation === station);
        if (!hasItemForStation) return false;

        if (activeTab === 'ACTIVE') {
          return o.status === 'preparing' || o.status === 'pending' || o.status === 'ready';
        } else {
          return o.status === 'scheduled';
        }
      });
      setOrders(filtered.sort((a, b) => a.timestamp - b.timestamp));
    };
    refreshOrders();
    const interval = setInterval(refreshOrders, 3000);
    return () => clearInterval(interval);
  }, [station, activeTab]);

  const handleStatusUpdate = async (order: Order, nextStatus: Order['status']) => {
    const updated = { ...order, status: nextStatus };
    await saveOrder(updated);
    toast.success(`Order ${order.id.slice(-4)} set to ${nextStatus}`);
  };

  const getTimeElapsed = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    return diff;
  };

  return (
    <div className="h-full bg-slate-900 flex flex-col text-white">
      <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-center bg-slate-800 gap-6">
        <div>
          <button onClick={onBack} className="text-indigo-400 font-bold flex items-center gap-2 mb-2 hover:translate-x-[-4px] transition-transform">
            ← Logout Station
          </button>
          <h1 className="text-3xl font-black tracking-tight uppercase">{station} DISPLAY</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex bg-slate-700 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'ACTIVE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Live Orders
            </button>
            <button
              onClick={() => setActiveTab('SCHEDULED')}
              className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'SCHEDULED' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Scheduled
            </button>
          </div>

          <div className="flex bg-slate-700 p-1 rounded-2xl border border-white/10">
            {PRINT_LOCATIONS.map(loc => (
              <button
                key={loc}
                onClick={() => setStation(loc)}
                className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${station === loc ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-8 flex gap-8 items-start">
        {orders.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 font-black space-y-4">
            <svg className="w-20 h-20 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            <div className="text-2xl uppercase tracking-widest">No {activeTab.toLowerCase()} tasks</div>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className={`min-w-[320px] bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col border-t-8 ${activeTab === 'ACTIVE' ? 'border-indigo-600' : 'border-amber-500'}`}>
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {order.tableNumber === 'FAST' ? 'Express' : `Table ${order.tableNumber}`}
                  </div>
                  <div className="text-2xl font-black">{order.id.slice(-4)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {activeTab === 'ACTIVE' ? 'Wait Time' : 'Prep Time'}
                  </div>
                  <div className={`text-xl font-black ${activeTab === 'ACTIVE'
                      ? getTimeElapsed(order.timestamp) > 15 ? 'text-red-600 animate-pulse' : 'text-slate-800'
                      : 'text-amber-600'
                    }`}>
                    {activeTab === 'ACTIVE' ? `${getTimeElapsed(order.timestamp)}m` : new Date(order.scheduledTime || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4 flex-1">
                {order.items.filter(item => item.printLocation === station).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-slate-50 pb-3 last:border-0">
                    <div className="flex-1">
                      <div className="font-black text-lg leading-tight uppercase text-slate-800">{item.name}</div>
                      {item.selectedModifiers?.map(m => (
                        <div key={m.id} className="text-[10px] text-indigo-500 font-bold uppercase mt-1">+ {m.name}</div>
                      ))}
                    </div>
                    <div className="bg-slate-100 text-slate-800 w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-inner border border-slate-200">
                      {item.quantity}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50 mt-auto">
                <button
                  onClick={() => handleStatusUpdate(order, activeTab === 'ACTIVE' ? 'ready' : 'preparing')}
                  className={`w-full py-4 text-white rounded-2xl font-black shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest ${activeTab === 'ACTIVE'
                      ? order.status === 'ready' ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                      : 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                    }`}
                  disabled={order.status === 'ready'}
                >
                  {activeTab === 'ACTIVE'
                    ? order.status === 'ready' ? 'Waiting Pickup' : 'Mark Ready'
                    : 'Start Preparation'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StationDisplayView;
