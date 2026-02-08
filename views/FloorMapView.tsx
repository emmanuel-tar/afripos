
import React, { useState, useEffect } from 'react';
import { CURRENCY } from '../constants';
import { TableStatus, Order, Table } from '../types';
import { getOrders, transferOrderToTable } from '../services/db';
import { useTableStore } from '../stores/useTableStore';
import { useCartStore } from '../stores/useCartStore'; // Import Added
import { CreateTableModal, TransferTableModal, JoinTableModal } from '../components/pos/modals/TableManagementModals';
import { Bell, CheckCircle2, ShoppingCart } from 'lucide-react'; // Icon Added
import { toast } from 'sonner';
import { saveOrder as dbSaveOrder } from '../services/db';

interface FloorMapViewProps {
  onBack: () => void;
  onSelectTable: (tableNumber: string) => void;
  onSettleTable: (order: Order) => void;
}

const FloorMapView: React.FC<FloorMapViewProps> = ({ onBack, onSelectTable, onSettleTable }) => {
  const { tables, initializeTables, deleteTable, transferTable: transferTableStore, joinTables } = useTableStore();
  const { sessions } = useCartStore(); // Access Sessions

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTableIdForDetails, setSelectedTableIdForDetails] = useState<string | null>(null);

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tableToTransfer, setTableToTransfer] = useState<Table | null>(null);
  const [tableToJoin, setTableToJoin] = useState<Table | null>(null);

  // Initialize tables and fetch orders
  useEffect(() => {
    initializeTables();
    const fetchOrders = async () => {
      const all = await getOrders();
      const filtered = all.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.tableNumber);
      setActiveOrders(filtered);
    };
    const interval = setInterval(fetchOrders, 5000); // Polling for updates
    fetchOrders();
    return () => clearInterval(interval);
  }, [initializeTables]);

  const getTableData = (tableNumber: string) => {
    return activeOrders.find(o => o.tableNumber === tableNumber);
  };

  const getDraftSession = (tableNumber: string) => {
    // Check if there is a local session with items
    const session = sessions[tableNumber];
    if (session && session.cart.length > 0) return session;
    return null;
  };

  const getStatus = (table: Table): TableStatus => {
    // If we have local state overrides or joined status, consider them
    if (table.status === 'reserved' || table.status === 'dirty') return table.status;

    // Check for active order
    const order = getTableData(table.number);
    if (order) return 'occupied';

    // Check for Draft
    const draft = getDraftSession(table.number);
    if (draft) return 'occupied'; // Treat as occupied visually, but maybe different color

    // Check if part of a joined group where another table is occupied
    // This is a simplified check. In a full implementation, we'd check all linked tables.

    return 'available';
  };

  const getStatusColor = (status: TableStatus, isReady: boolean = false, isDraft: boolean = false) => {
    if (isReady) return 'bg-green-500 text-white shadow-[0_0_25px_rgba(34,197,94,0.6)] animate-pulse ring-4 ring-green-100';

    if (isDraft) return 'bg-sky-500 text-white shadow-sky-200 ring-4 ring-sky-50 border-2 border-white';

    switch (status) {
      case 'occupied': return 'bg-indigo-600 text-white shadow-indigo-200 ring-4 ring-indigo-50';
      case 'reserved': return 'bg-amber-500 text-white';
      case 'dirty': return 'bg-slate-400 text-white';
      default: return 'bg-white text-slate-800 border-2 border-slate-100 hover:border-indigo-200';
    }
  };

  const handleTableClick = (table: Table) => {
    if (isEditMode) {
      // In edit mode, maybe show a small menu or just allow selection for deletion?
      // For now, let's just select it for details to show delete option.
      setSelectedTableIdForDetails(table.id);
      return;
    }

    const order = getTableData(table.number);
    if (order) {
      setSelectedOrder(order);
      setSelectedTableIdForDetails(table.id);
    } else {
      if (table.status === 'reserved' || table.status === 'dirty') {
        setSelectedTableIdForDetails(table.id); // Show details to allow clearing status
      } else {
        onSelectTable(table.number);
      }
    }
  };

  const handleTransfer = async (targetTableId: string) => {
    if (!tableToTransfer) return;

    const targetTable = tables.find(t => t.id === targetTableId);
    if (!targetTable) return;

    // 1. Update DB Order
    const order = getTableData(tableToTransfer.number);
    if (order) {
      await transferOrderToTable(order.id, targetTable.number);
    }

    // 2. Update Local Store
    transferTableStore(tableToTransfer.id, targetTableId);

    // 3. Refresh
    const all = await getOrders();
    setActiveOrders(all.filter(o => o.status !== 'completed' && o.status !== 'cancelled'));
    setTableToTransfer(null);
    setSelectedOrder(null);
    setSelectedTableIdForDetails(null);
  };

  const handleJoin = (targetTableId: string) => {
    if (!tableToJoin) return;
    joinTables(tableToJoin.id, targetTableId);
    setTableToJoin(null);
    setSelectedTableIdForDetails(null);
  };

  const handlePrintBill = () => {
    if (!selectedOrder) return;
    window.print();
  };

  const selectedTable = tables.find(t => t.id === selectedTableIdForDetails);

  return (
    <div className="h-full bg-slate-50 flex flex-col p-8 overflow-y-auto">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <button onClick={onBack} className="text-indigo-600 font-bold flex items-center gap-2 mb-2 hover:translate-x-[-4px] transition-transform">
            ← Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Floor Management</h1>
            <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" checked={isEditMode} onChange={e => setIsEditMode(e.target.checked)} />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Edit Mode</span>
            </label>
          </div>
        </div>
        <div className="flex gap-4">
          {isEditMode && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              + Add Table
            </button>
          )}
          <div className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div> Occupied ({activeOrders.length})
          </div>
          <div className="hidden lg:flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-slate-200 text-[10px] font-black uppercase tracking-widest shadow-sm">
            <div className="w-3 h-3 rounded-full bg-green-500"></div> Available ({tables.length - activeOrders.length})
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 max-w-7xl mx-auto w-full pb-20">
        {tables.map(table => {
          const status = getStatus(table);
          const order = getTableData(table.number);
          const draft = getDraftSession(table.number);
          const isJoined = table.joinedWith && table.joinedWith.length > 0;
          const isDraft = !!draft && !order;

          return (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`
                aspect-square rounded-[3rem] shadow-xl flex flex-col items-center justify-center transition-all active:scale-95 group relative
                ${getStatusColor(status, order?.status === 'ready', isDraft)}
                ${isJoined ? 'ring-4 ring-offset-2 ring-indigo-300' : ''}
              `}
            >
              {order?.status === 'ready' && (
                <div className="absolute -top-2 -left-2 bg-green-600 text-white p-2 rounded-2xl shadow-lg border-2 border-white animate-bounce z-10">
                  <Bell className="w-5 h-5 fill-white" />
                </div>
              )}
              {isDraft && (
                <div className="absolute -top-2 -right-2 bg-sky-500 text-white p-2 rounded-2xl shadow-lg border-2 border-white animate-bounce z-10">
                  <ShoppingCart className="w-4 h-4 stroke-white" />
                </div>
              )}

              <div className="text-4xl font-black mb-1">{table.number}</div>
              <div className={`text-[10px] font-bold uppercase tracking-widest ${status === 'occupied' ? 'opacity-70' : 'text-slate-400'}`}>
                {table.capacity} Pax
              </div>

              {isJoined && (
                <div className="absolute top-4 right-4 text-indigo-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                </div>
              )}

              {order && (
                <div className="mt-3 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-tighter">
                  {CURRENCY}{order.total.toLocaleString()}
                </div>
              )}

              {isDraft && (
                <div className="mt-3 px-4 py-1.5 bg-sky-700/40 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-tighter relative overflow-hidden">
                  <span className="relative z-10">DRAFT</span>
                </div>
              )}

              {status === 'available' && !isDraft && (
                <div className="absolute inset-0 border-2 border-dashed border-slate-100 rounded-[3rem] -m-1 group-hover:border-indigo-200 transition-colors"></div>
              )}

              {isEditMode && (
                <div
                  className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-600 z-10"
                  onClick={(e) => { e.stopPropagation(); deleteTable(table.id); }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Table Detail / Actions Modal */}
      {(selectedOrder || (isEditMode && selectedTableIdForDetails)) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
              <div>
                <h3 className="text-4xl font-black tracking-tighter">TABLE {selectedTable?.number}</h3>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">
                  {selectedOrder ? 'Order Details & Billing' : 'Table Management'}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedOrder && (
                  <button
                    onClick={handlePrintBill}
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl transition-all flex items-center gap-2"
                    title="Print Bill"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Print</span>
                  </button>
                )}

                {/* Close Button */}
                <button onClick={() => { setSelectedOrder(null); setSelectedTableIdForDetails(null); }} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {/* Management Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => selectedTable && setTableToTransfer(selectedTable)}
                  className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold text-slate-700 uppercase tracking-widest text-xs flex flex-col items-center gap-2"
                >
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  Transfer Table
                </button>
                <button
                  onClick={() => selectedTable && setTableToJoin(selectedTable)}
                  className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all font-bold text-slate-700 uppercase tracking-widest text-xs flex flex-col items-center gap-2"
                >
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Join Table
                </button>
              </div>

              {selectedOrder ? (
                <>
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
                    <div className="flex flex-col items-end gap-2 text-green-400 font-black text-xs uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedOrder.status === 'ready' ? 'bg-amber-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></div>
                        {selectedOrder.status === 'ready' ? 'MEAL READY' : 'Order Active'}
                      </div>

                      {selectedOrder.status === 'ready' && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const updated = { ...selectedOrder, status: 'served' as const };
                            await dbSaveOrder(updated);
                            setSelectedOrder(updated);
                            toast.success("Order marked as served!");
                          }}
                          className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all transform active:scale-90 shadow-lg"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          CONFIRM PICKUP
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest">
                  No Active Order
                </div>
              )}
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
              {selectedOrder ? (
                <>
                  <button
                    onClick={() => selectedTable && onSelectTable(selectedTable.number)}
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
                </>
              ) : (
                <button
                  onClick={() => selectedTable && onSelectTable(selectedTable.number)}
                  className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  Start Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Helper Modals */}
      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      {tableToTransfer && (
        <TransferTableModal
          isOpen={!!tableToTransfer}
          onClose={() => setTableToTransfer(null)}
          fromTable={tableToTransfer}
          onTransfer={handleTransfer}
        />
      )}
      {tableToJoin && (
        <JoinTableModal
          isOpen={!!tableToJoin}
          onClose={() => setTableToJoin(null)}
          primaryTable={tableToJoin}
          onJoin={handleJoin}
        />
      )}

      {/* Hidden Print Container for Summary prints */}
      {selectedOrder && (
        <div id="print-receipt" className="hidden print:block font-mono text-[12px] leading-tight">
          <div className="text-center mb-4">
            <h2 className="text-lg font-black uppercase">AFRI POS</h2>
            <div className="text-xs">PRO-FORMA BILL</div>
            <div className="text-[10px]">{new Date().toLocaleString()}</div>
            <div className="border-b border-dashed border-black my-2"></div>
            <div className="font-black">TABLE: {selectedTable?.number}</div>
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
