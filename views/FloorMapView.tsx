
import React, { useState, useMemo } from 'react';
import { MOCK_TABLES, CURRENCY } from '../constants';
import { TableStatus, Order } from '../types';
import { getOrders } from '../services/db';

interface FloorMapViewProps {
  onBack: () => void;
  onSelectTable: (tableNumber: string) => void;
  onSettleTable: (order: Order) => void;
}

const FloorMapView: React.FC<FloorMapViewProps> = ({ onBack, onSelectTable, onSettleTable }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTableNum, setSelectedTableNum] = useState<string | null>(null);

  // Fetch live orders to determine table occupancy
  const activeOrders = useMemo(() => {
    const all = getOrders();
    return all.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.tableNumber);
  }, []);

  const getTableData = (tableNumber: string) => {
    return activeOrders.find(o => o.tableNumber === tableNumber);
  };

  const getStatus = (tableNumber: string): TableStatus => {
    const order = getTableData(tableNumber);
    if (order) return 'occupied';
    return 'available'; // Simplified for demo
  };

  const getStatusColor = (status: TableStatus) => {
    switch(status) {
      case 'occupied': return 'bg-indigo-600 text-white shadow-indigo-200 ring-4 ring-indigo-50';
      case 'reserved': return 'bg-amber-500 text-white';
      case 'dirty': return 'bg-slate-400 text-white';
      default: return 'bg-white text-slate-800 border-2 border-slate-100 hover:border-indigo-200';
    }
  };

  const handleTableClick = (tableNum: string) => {
    const order = getTableData(tableNum);
    if (order) {
      setSelectedOrder(order);
      setSelectedTableNum(tableNum);
    } else {
      onSelectTable(tableNum);
    }
  };

  const handlePrintBill = () => {
    if (!selectedOrder) return;
    window.print();
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col p-8 overflow-y-auto">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <button onClick={onBack} className="text-indigo-600 font-bold flex items-center gap-2 mb-2 hover:translate-x-[-4px] transition-transform">
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Floor Management</h1>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div> Occupied ({activeOrders.length})
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div> Available ({MOCK_TABLES.length - activeOrders.length})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 max-w-7xl mx-auto w-full pb-20">
        {MOCK_TABLES.map(table => {
          const status = getStatus(table.number);
          const order = getTableData(table.number);
          
          return (
            <button
              key={table.id}
              onClick={() => handleTableClick(table.number)}
              className={`
                aspect-square rounded-[3rem] shadow-xl flex flex-col items-center justify-center transition-all active:scale-95 group relative
                ${getStatusColor(status)}
              `}
            >
              <div className="text-4xl font-black mb-1">{table.number}</div>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${status === 'occupied' ? 'opacity-70' : 'text-slate-400'}`}>
                {table.capacity} Pax
              </div>
              {order && (
                <div className="mt-3 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-tighter">
                  {CURRENCY}{order.total.toLocaleString()}
                </div>
              )}
              {status === 'available' && (
                <div className="absolute inset-0 border-2 border-dashed border-slate-100 rounded-[3rem] -m-1 group-hover:border-indigo-200 transition-colors"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Table Summary Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <div>
                <h3 className="text-4xl font-black tracking-tighter">TABLE {selectedTableNum}</h3>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">Order Details & Billing</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrintBill}
                  className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all flex items-center gap-2"
                  title="Print Bill"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Print Bill</span>
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Cashier/Waiter</div>
                  <div className="text-xl font-black text-slate-800">{selectedOrder.cashierName || 'System'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Started At</div>
                  <div className="text-xl font-black text-slate-800">{new Date(selectedOrder.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ordered Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm">
                          {item.quantity}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-800">{item.name}</div>
                          {item.selectedModifiers?.map(m => (
                            <span key={m.id} className="text-[9px] font-bold text-indigo-500 uppercase mr-2">+ {m.name}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm font-black text-slate-900">{CURRENCY}{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[2rem] flex justify-between items-center shadow-2xl">
                <div>
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Current Balance</div>
                  <div className="text-4xl font-black tracking-tight">{CURRENCY}{selectedOrder.total.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2 text-green-400 font-black text-xs uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Order Active
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => onSelectTable(selectedTableNum!)}
                className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-800 rounded-3xl font-black uppercase tracking-widest shadow-sm hover:border-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                Add Items
              </button>
              <button 
                onClick={() => onSettleTable(selectedOrder)}
                className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                Settle & Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden Print Container for Summary prints */}
      {selectedOrder && (
          <div id="print-receipt" className="hidden print:block font-mono text-[12px] leading-tight">
            <div className="text-center mb-4">
              <h2 className="text-lg font-black uppercase">AFRI POS</h2>
              <div className="text-xs">PRO-FORMA BILL</div>
              <div className="text-[10px]">{new Date().toLocaleString()}</div>
              <div className="border-b border-dashed border-black my-2"></div>
              <div className="font-black">TABLE: {selectedTableNum}</div>
              <div>CASHIER: {selectedOrder.cashierName}</div>
            </div>
            <div className="space-y-1 mb-4">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-black pt-2 flex justify-between font-black text-base">
              <span>TOTAL DUE:</span>
              <span>{CURRENCY}{selectedOrder.total.toLocaleString()}</span>
            </div>
            <div className="text-center mt-6 text-[10px] uppercase font-black">Not a valid tax receipt</div>
          </div>
      )}
    </div>
  );
};

export default FloorMapView;
