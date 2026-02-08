import React, { useState, useEffect } from 'react';
import { Recipe, ProductionOrder, ManufacturingProcess } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { useManufacturingStore } from '../stores/useManufacturingStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import RecipeList from '../components/manufacturing/RecipeList';
import RecipeForm from '../components/manufacturing/RecipeForm';
import ProductionOrderList from '../components/manufacturing/ProductionOrderList';
import ProductionOrderForm from '../components/manufacturing/ProductionOrderForm';

const ManufacturingView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'recipes' | 'orders' | 'processes'>('recipes');
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  // Completion Modal State
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [actualQty, setActualQty] = useState(0);

  const { user } = useAppStore();
  const { fetchInventory } = useInventoryStore();
  const {
    recipes, productionOrders, manufacturingProcesses, isLoading,
    fetchManufacturingData, addRecipe, updateRecipe, addProductionOrder,
    startProduction, completeProduction, cancelProduction
  } = useManufacturingStore();

  useEffect(() => {
    fetchManufacturingData();
    fetchInventory(); // Ensure we have products and materials for forms
  }, []);

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (editingRecipe) {
      await updateRecipe(recipe);
    } else {
      await addRecipe(recipe);
    }
    setShowRecipeForm(false);
    setEditingRecipe(null);
  };

  const handleSaveOrder = async (order: ProductionOrder) => {
    await addProductionOrder(order);
    setShowOrderForm(false);
  };

  const handleCompleteSubmit = async () => {
    if (selectedOrder && actualQty > 0) {
      await completeProduction(selectedOrder.id, actualQty, user?.id || 'sys', user?.name || 'System');
      setShowCompleteModal(false);
      setSelectedOrder(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl font-black text-slate-400 uppercase tracking-widest">Initialising Floor...</div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manufacturing Floor</h1>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'recipes', label: 'Recipes', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
              { id: 'orders', label: 'Production', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { id: 'processes', label: 'Workflow', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all outline-none ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} /></svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Overflow Area */}
      <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
        <div className="max-w-7xl mx-auto pb-20">
          {activeTab === 'recipes' && (
            <RecipeList
              recipes={recipes}
              onSelectRecipe={(r) => { setEditingRecipe(r); setShowRecipeForm(true); }}
              onCreateNew={() => { setEditingRecipe(null); setShowRecipeForm(true); }}
            />
          )}
          {activeTab === 'orders' && (
            <ProductionOrderList
              orders={productionOrders}
              onSelectOrder={(o) => setSelectedOrder(o)}
              onCreateNew={() => setShowOrderForm(true)}
            />
          )}
          {activeTab === 'processes' && (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-20 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Standard Operating Procedures</h3>
              <p className="text-slate-400 font-bold max-w-md mx-auto leading-relaxed">Manufacturing workflows and digital step-by-step guides are coming soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Inspector / Context Actions for Orders */}
      {selectedOrder && (
        <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.05)] border-l border-slate-100 z-[150] flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-1 block">Order Details</span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">#{selectedOrder.orderNumber}</h3>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="text-slate-300 hover:text-slate-600 outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10 space-y-8">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Production Status</label>
              <div className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50">
                <span className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedOrder.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                    selectedOrder.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                  {selectedOrder.status}
                </span>
                <div className="mt-4 font-black text-xl text-slate-800">{selectedOrder.recipeName}</div>
                <div className="text-xs font-bold text-slate-400 mt-1">Planned: {selectedOrder.plannedQuantity} Units</div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Floor Notes</label>
              <p className="text-sm font-bold text-slate-500 italic leading-relaxed">
                {selectedOrder.notes || "No production notes provided."}
              </p>
            </div>

            {selectedOrder.status === 'PLANNED' && (
              <button
                onClick={() => { startProduction(selectedOrder.id); setSelectedOrder({ ...selectedOrder, status: 'IN_PROGRESS' }); }}
                className="w-full bg-indigo-600 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl transition-all"
              >
                Start Production
              </button>
            )}

            {selectedOrder.status === 'IN_PROGRESS' && (
              <button
                onClick={() => { setActualQty(selectedOrder.plannedQuantity); setShowCompleteModal(true); }}
                className="w-full bg-emerald-600 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-xl transition-all"
              >
                Complete Production
              </button>
            )}

            {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
              <button
                onClick={() => { cancelProduction(selectedOrder.id); setSelectedOrder(null); }}
                className="w-full border border-red-100 text-red-500 p-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all mt-4"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showRecipeForm && (
        <RecipeForm
          initialData={editingRecipe || {}}
          onSave={handleSaveRecipe}
          onCancel={() => { setShowRecipeForm(false); setEditingRecipe(null); }}
        />
      )}

      {showOrderForm && (
        <ProductionOrderForm
          onSave={handleSaveOrder}
          onCancel={() => setShowOrderForm(false)}
        />
      )}

      {/* Completion Quantity Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Confirm Output</h3>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-8">Enter actual units produced</p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Actual Quantity</label>
                <input
                  type="number"
                  value={actualQty}
                  onChange={e => setActualQty(Number(e.target.value))}
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-3xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase">Planned: {selectedOrder?.plannedQuantity} Units</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteSubmit}
                  className="flex-1 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-xl"
                >
                  Finalise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturingView;
