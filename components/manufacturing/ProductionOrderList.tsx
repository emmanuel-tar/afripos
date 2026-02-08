import React from 'react';
import { ProductionOrder } from '../../types';

interface ProductionOrderListProps {
    orders: ProductionOrder[];
    onSelectOrder: (order: ProductionOrder) => void;
    onCreateNew: () => void;
}

const ProductionOrderList: React.FC<ProductionOrderListProps> = ({ orders, onSelectOrder, onCreateNew }) => {
    return (
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Active Floor Orders</h3>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Live Production Tracking</p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    New Order
                </button>
            </div>

            <div className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            onClick={() => onSelectOrder(order)}
                            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:bg-indigo-50 transition-colors"></div>

                            <div className="flex justify-between items-start mb-6 relative">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-indigo-300 transition-colors">#{order.orderNumber}</span>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                        order.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' :
                                            order.status === 'PLANNED' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {order.status.replace('_', ' ')}
                                </span>
                            </div>

                            <h4 className="font-black text-slate-800 text-xl mb-2 relative group-hover:text-indigo-600 transition-colors">{order.recipeName}</h4>

                            <div className="space-y-4 pt-4 border-t border-slate-50 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty Planned</span>
                                    <span className="text-sm font-black text-slate-800">{order.plannedQuantity} Units</span>
                                </div>
                                {order.status === 'COMPLETED' && (
                                    <div className="flex justify-between items-center text-emerald-600">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Qty Produced</span>
                                        <span className="text-sm font-black">{order.actualQuantity} Units</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created By</span>
                                    <span className="text-[11px] font-bold text-slate-500">{order.createdBy}</span>
                                </div>
                            </div>

                            {order.status === 'IN_PROGRESS' && (
                                <div className="mt-6 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-indigo-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Processing...</span>
                                </div>
                            )}
                        </div>
                    ))}

                    {orders.length === 0 && (
                        <div className="col-span-full py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest mb-1">Production floor clear</h3>
                            <p className="text-slate-400 font-bold text-xs italic">Schedule a new order to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductionOrderList;
