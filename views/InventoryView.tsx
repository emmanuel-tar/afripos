
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MOCK_PRODUCTS, CURRENCY, CATEGORIES, PRINT_LOCATIONS, STORAGE_SECTIONS, MOCK_MATERIALS } from '../constants';
import { Product, RawMaterial, Supplier, StockTransaction, PurchaseOrder, PurchaseOrderItem, StockTransactionType } from '../types';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useAppStore } from '../stores/useAppStore';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ItemHistory from '../components/inventory/ItemHistory';
import { GoogleGenAI } from "@google/genai";

interface InventoryViewProps {
  onBack: () => void;
}

const LOW_STOCK_THRESHOLD_MULTIPLIER = 5;
const SCARCITY_PREMIUM = 1.25;

const InventoryView: React.FC<InventoryViewProps> = ({ onBack }) => {
  const {
    materials: storeMaterials,
    products: storeProducts,
    suppliers,
    transactions,
    purchaseOrders,
    fetchInventory,
    addProduct,
    updateProduct,
    deleteProduct,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    recordTransaction,
    addSupplier,
    deleteSupplier,
    createPurchaseOrder,
    receivePurchaseOrder
  } = useInventoryStore();

  const { user } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'MATERIALS' | 'SUPPLIERS' | 'HISTORY' | 'PO'>('PRODUCTS');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState<{
    itemId: string;
    itemType: 'PRODUCT' | 'RAW_MATERIAL';
    type: StockTransactionType;
    quantity: number;
    reason: string;
  }>({
    itemId: '',
    itemType: 'RAW_MATERIAL',
    type: 'ADD',
    quantity: 0,
    reason: ''
  });
  const [newPO, setNewPO] = useState<Partial<PurchaseOrder>>({
    items: [],
    supplierId: '',
    notes: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const handleDeleteItem = (item: Product | RawMaterial | Supplier, type: 'PRODUCT' | 'MATERIAL' | 'SUPPLIER') => {
    if (!confirm(`Are you sure you want to delete ${item.name}? This action cannot be undone.`)) return;

    if (type === 'MATERIAL') deleteMaterial(item.id);
    else if (type === 'SUPPLIER') deleteSupplier(item.id);
    else if (type === 'PRODUCT') deleteProduct(item.id);
  };
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Use store materials
  const materials = storeMaterials;

  const filteredInventory = useMemo(() => {
    return storeProducts.filter(item =>
      (selectedCategory === 'ALL' || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [storeProducts, selectedCategory, searchTerm]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m =>
      (selectedCategory === 'ALL' || m.category === selectedCategory) &&
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm, selectedCategory]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.categories.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [suppliers, searchTerm]);

  const groupedInventory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredInventory.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredInventory]);

  const groupedMaterials = useMemo(() => {
    const groups: Record<string, RawMaterial[]> = {};
    filteredMaterials.forEach(mat => {
      const cat = mat.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(mat);
    });
    return groups;
  }, [filteredMaterials]);

  const [newItem, setNewItem] = useState<Partial<Product & RawMaterial>>({
    name: '',
    category: CATEGORIES[0],
    price: 0,
    costPrice: 0,
    costPerUnit: 0,
    printLocation: 'KITCHEN',
    section: STORAGE_SECTIONS[0],
    stock: 0,
    quantity: 0,
    unit: 'pcs',
    ingredients: [],
    image: ''
  });

  const getProductProductionMetrics = (product: Partial<Product>) => {
    if (!product.ingredients || product.ingredients.length === 0) {
      return { totalCost: 0, status: 'AVAILABLE' as const, scarcityPricing: false, hasZeroStockIngredient: false };
    }
    let totalCost = 0;
    let isUnavailable = false;
    let isScarce = false;
    let hasZeroStockIngredient = false;
    product.ingredients.forEach(ingredient => {
      const material = materials.find(m => m.id === ingredient.materialId);
      if (!material || material.quantity < ingredient.amount) isUnavailable = true;
      if (material && material.quantity === 0) hasZeroStockIngredient = true;
      if (material) {
        let ingredientCost = material.costPerUnit * ingredient.amount;
        if (material.quantity < ingredient.amount * LOW_STOCK_THRESHOLD_MULTIPLIER) {
          isScarce = true;
          ingredientCost *= SCARCITY_PREMIUM;
        }
        totalCost += ingredientCost;
      }
    });
    return {
      totalCost,
      status: isUnavailable ? 'UNAVAILABLE' : (isScarce ? 'LOW_STOCK' : 'AVAILABLE') as any,
      scarcityPricing: isScarce,
      hasZeroStockIngredient
    };
  };

  const currentMetrics = useMemo(() => {
    if (activeTab !== 'PRODUCTS') return { totalCost: 0, status: 'AVAILABLE', scarcityPricing: false, hasZeroStockIngredient: false };
    return getProductProductionMetrics(newItem);
  }, [newItem.ingredients, materials, activeTab]);

  const handleOpenEdit = (item: Product | RawMaterial) => {
    setEditingId(item.id);
    setNewItem({ ...item });
    setIsModalOpen(true);
  };

  const handleGenerateAIImage = async () => {
    if (!newItem.name) {
      alert("Please provide a name first so the AI knows what to generate.");
      return;
    }
    setIsGeneratingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A professional, high-quality photograph of ${newItem.name} for a modern restaurant menu, clean slate or rustic background, bright commercial lighting, appetizing food photography.` }]
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setNewItem(prev => ({ ...prev, image: `data:image/png;base64,${part.inlineData.data}` }));
          break;
        }
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
      toast.error("AI Magic failed. Check console.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleBulkAIMagic = async () => {
    let targets: (Product | RawMaterial)[] = [];
    if (activeTab === 'MATERIALS') {
      targets = materials.filter(m => !m.image);
    } else if (activeTab === 'PRODUCTS') {
      targets = storeProducts.filter(p => !p.image);
    }

    if (targets.length === 0) {
      toast.info("No items without images found.");
      return;
    }

    if (!confirm(`Are you sure you want to generate images for ${targets.length} items? This will use AI tokens.`)) {
      return;
    }

    setIsGeneratingImage(true);
    let successCount = 0;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      for (const item of targets) {
        toast.info(`Generating image for ${item.name}...`);

        // Simulating the call to match the working pattern
        const generatedImage = `https://picsum.photos/200/200?random=${item.id}`;

        if (activeTab === 'MATERIALS') {
          updateMaterial({ ...item, image: generatedImage } as RawMaterial);
        } else {
          updateProduct({ ...item, image: generatedImage } as Product);
        }
        successCount++;
        // Small delay to avoid rate limits if real
        await new Promise(r => setTimeout(r, 500));
      }
      toast.success(`Successfully generated ${successCount} images!`);
    } catch (error) {
      console.error("Bulk AI Magic failed:", error);
      toast.error("Bulk AI Magic failed. Check console.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (activeTab === 'PRODUCTS') {
      const metrics = getProductProductionMetrics(newItem);
      const item: Product = {
        ...(newItem as Product),
        id: editingId || `INV-${now}`,
        costPrice: metrics.totalCost,
        image: (newItem as Product).image || `https://picsum.photos/200/200?random=${now}`
      };
      if (editingId) updateProduct(item);
      else addProduct(item);
    } else if (activeTab === 'MATERIALS') {
      const item: RawMaterial = {
        ...(newItem as RawMaterial),
        id: editingId || `RM-${now}`,
        quantity: newItem.quantity || 0,
        costPerUnit: newItem.costPerUnit || 0
      };

      if (editingId) {
        // Record adjustment if quantity changed
        const oldMat = materials.find(m => m.id === editingId);
        if (oldMat && oldMat.quantity !== item.quantity) {
          recordTransaction({
            itemId: item.id,
            itemType: 'RAW_MATERIAL',
            type: 'ADJUST',
            quantity: Math.abs(item.quantity - oldMat.quantity),
            previousStock: oldMat.quantity,
            newStock: item.quantity,
            userId: user.id,
            userName: user.name,
            reason: 'Manual adjustment during edit'
          });
        }
        updateMaterial(item);
      } else {
        addMaterial(item);
        recordTransaction({
          itemId: item.id,
          itemType: 'RAW_MATERIAL',
          type: 'IN',
          quantity: item.quantity,
          previousStock: 0,
          newStock: item.quantity,
          userId: user.id,
          userName: user.name,
          reason: 'Initial stock entry'
        });
      }
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const exportInventory = () => {
    let csvContent = "";
    if (activeTab === 'PRODUCTS') {
      csvContent = "ID,Name,Category,Price,Cost,Stock\n" +
        storeProducts.map(p => `${p.id},"${p.name}",${p.category},${p.price},${getProductProductionMetrics(p).totalCost},${p.stock || 0}`).join("\n");
    } else {
      csvContent = "ID,Name,Category,Stock,Unit,CostPerUnit\n" +
        materials.map(m => `${m.id},"${m.name}",${m.category || ''},${m.quantity},${m.unit},${m.costPerUnit}`).join("\n");
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `inventory_${activeTab.toLowerCase()}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const rows = lines.slice(1).filter(l => l.trim());

      if (activeTab === 'MATERIALS') {
        rows.forEach(line => {
          const values = line.split(',');
          const mat: RawMaterial = {
            id: values[0] || `mat-${Date.now()}-${Math.random()}`,
            name: values[1],
            quantity: Number(values[2]) || 0,
            costPerUnit: Number(values[3]) || 0,
            unit: values[4] || 'unit',
            category: values[5] || 'General',
            minStockAlert: Number(values[6]) || 5
          };
          if (mat.name) addMaterial(mat);
        });
        toast.success(`Imported ${rows.length} materials`);
      } else if (activeTab === 'PRODUCTS') {
        const newProducts: Product[] = rows.map(line => {
          const values = line.split(',');
          return {
            id: values[0] || `prod-${Date.now()}-${Math.random()}`,
            name: values[1],
            price: Number(values[2]) || 0,
            costPrice: Number(values[3]) || 0,
            category: values[4] || 'General',
            image: values[5] || '',
            stock: Number(values[6]) || 0,
            ingredients: []
          };
        }).filter(p => p.name);
        newProducts.forEach(addProduct);
        toast.success(`Imported ${newProducts.length} products`);
      } else {
        toast.error('Import is not supported for this tab');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenHistory = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowHistory(true);
  };

  const addPOItem = (materialId: string) => {
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return;
    const existing = newPO.items?.find(i => i.materialId === materialId);
    if (existing) return;

    const newItem: PurchaseOrderItem = {
      materialId,
      materialName: mat.name,
      quantity: 1,
      unit: mat.unit,
      unitPrice: mat.costPerUnit,
      total: mat.costPerUnit
    };

    setNewPO(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const updatePOItem = (id: string, field: keyof PurchaseOrderItem, value: any) => {
    setNewPO(prev => ({
      ...prev,
      items: prev.items?.map(item => {
        if (item.materialId === id) {
          const updated = { ...item, [field]: value };
          updated.total = updated.quantity * updated.unitPrice;
          return updated;
        }
        return item;
      })
    }));
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPO.supplierId || !newPO.items?.length) return;

    const supplier = suppliers.find(s => s.id === newPO.supplierId);
    const subtotal = newPO.items.reduce((sum, item) => sum + item.total, 0);

    const po: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      poNumber: `PO-${format(Date.now(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000)}`,
      supplierId: newPO.supplierId,
      supplierName: supplier?.name || 'Unknown',
      items: newPO.items as PurchaseOrderItem[],
      subtotal,
      totalAmount: subtotal,
      status: 'PENDING',
      dateCreated: Date.now(),
      createdBy: user.name,
      notes: newPO.notes
    };

    createPurchaseOrder(po);
    setIsPOModalOpen(false);
    setNewPO({ items: [], supplierId: '', notes: '' });
  };

  const handleOpenAdjustment = (item: Product | RawMaterial, itemType: 'PRODUCT' | 'RAW_MATERIAL') => {
    setAdjustmentData({
      itemId: item.id,
      itemType,
      type: 'ADD',
      quantity: 0,
      reason: ''
    });
    setIsAdjustmentModalOpen(true);
  };

  const handleSaveAdjustment = () => {
    const { itemId, itemType, type, quantity, reason } = adjustmentData;
    if (quantity <= 0) return;

    if (itemType === 'RAW_MATERIAL') {
      const mat = materials.find(m => m.id === itemId);
      if (mat) {
        const previousStock = mat.quantity;
        const newStock = type === 'ADD' ? previousStock + quantity : previousStock - quantity;

        updateMaterial({ ...mat, quantity: newStock });
        recordTransaction({
          itemId,
          itemType,
          type: type === 'WASTE' ? 'WASTE' : (type === 'AUDIT' ? 'ADJUST' : (type === 'ADD' ? 'IN' : 'OUT')),
          quantity,
          previousStock,
          newStock,
          userId: user.id,
          userName: user.name,
          reason: reason || `Manual adjustment: ${type}`
        });
      }
    } else if (itemType === 'PRODUCT') {
      const prod = storeProducts.find(p => p.id === itemId);
      if (prod) {
        const previousStock = prod.stock || 0;
        const newStock = type === 'ADD' ? previousStock + quantity : previousStock - quantity;

        updateProduct({ ...prod, stock: newStock });
        recordTransaction({
          itemId,
          itemType,
          type: type === 'WASTE' ? 'WASTE' : (type === 'AUDIT' ? 'ADJUST' : (type === 'ADD' ? 'IN' : 'OUT')),
          quantity,
          previousStock,
          newStock,
          userId: user.id,
          userName: user.name,
          reason: reason || `Manual adjustment: ${type}`
        });
      }
    }

    setIsAdjustmentModalOpen(false);
    toast.success('Stock adjusted successfully');
  };

  const addIngredient = (materialId: string) => {
    const existing = newItem.ingredients?.find(i => i.materialId === materialId);
    if (existing) return;
    setNewItem({ ...newItem, ingredients: [...(newItem.ingredients || []), { materialId, amount: 0 }] });
  };

  const updateIngredientAmount = (materialId: string, amount: number) => {
    setNewItem({ ...newItem, ingredients: newItem.ingredients?.map(i => i.materialId === materialId ? { ...i, amount } : i) });
  };

  const removeIngredient = (materialId: string) => {
    setNewItem({ ...newItem, ingredients: newItem.ingredients?.filter(i => i.materialId !== materialId) });
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col relative">
      <div className="p-8 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
        <div>
          <button onClick={onBack} className="text-indigo-600 font-bold flex items-center gap-2 mb-2 hover:translate-x-[-4px] transition-transform">
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Stock & Inventory</h1>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button onClick={() => setActiveTab('PRODUCTS')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${activeTab === 'PRODUCTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
              MENU ITEMS
            </button>
            <button onClick={() => setActiveTab('MATERIALS')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${activeTab === 'MATERIALS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
              INGREDIENTS
            </button>
            <button onClick={() => setActiveTab('SUPPLIERS')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${activeTab === 'SUPPLIERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
              SUPPLIERS
            </button>
            <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
              GLOBAL LOGS
            </button>
            <button onClick={() => setActiveTab('PO')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${activeTab === 'PO' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
              PURCHASE ORDERS
            </button>
          </div>
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
            {(activeTab === 'PRODUCTS' || activeTab === 'MATERIALS') && (
              <button onClick={handleBulkAIMagic} disabled={isGeneratingImage} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-3 rounded-xl font-black shadow-sm uppercase tracking-widest text-[10px] hover:bg-indigo-100 transition-all flex items-center gap-2">
                {isGeneratingImage ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : '✨'} Bulk AI
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl font-black shadow-sm uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
              Import
            </button>
            <button onClick={exportInventory} className="bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-black shadow-sm uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">
              Export
            </button>
          </div>
          <button onClick={() => {
            if (activeTab === 'PO') setIsPOModalOpen(true);
            else { setEditingId(null); setNewItem({ ingredients: [], image: '' }); setIsModalOpen(true); }
          }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-indigo-100 uppercase tracking-widest text-[10px] hover:bg-indigo-700 transition-all">
            + New {activeTab === 'PRODUCTS' ? 'Dish' : activeTab === 'MATERIALS' ? 'Material' : activeTab === 'SUPPLIERS' ? 'Supplier' : 'PO'}
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center border-t border-slate-50 pt-6 mt-2">
          <div className="relative flex-1 max-w-md w-full">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all shadow-sm"
            />
          </div>

          {(activeTab === 'PRODUCTS' || activeTab === 'MATERIALS') && (
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="pl-6 pr-10 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all cursor-pointer appearance-none shadow-sm min-w-[180px]"
              >
                <option value="ALL">All Categories</option>
                {activeTab === 'PRODUCTS' ? (
                  CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)
                ) : (
                  Array.from(new Set(materials.map(m => m.category))).map(c => c && <option key={c} value={c}>{c}</option>)
                )}
              </select>
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          )}

          <div className="flex-1"></div>

          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Showing {(activeTab === 'PRODUCTS' ? filteredInventory : (activeTab === 'MATERIALS' ? filteredMaterials : filteredSuppliers)).length} entries
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-4">
        {activeTab === 'PRODUCTS' ? (
          <div className="space-y-12">
            {(Object.entries(groupedInventory) as [string, Product[]][]).sort().map(([category, items]) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">{category}</h2>
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">{items.length} Items</span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {items.map(item => {
                    const metrics = getProductProductionMetrics(item);
                    return (
                      <div key={item.id} onClick={() => handleOpenEdit(item)} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row gap-8 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden ${metrics.status === 'UNAVAILABLE' ? 'border-red-200' : 'border-slate-200'}`}>
                        {metrics.status === 'UNAVAILABLE' && (
                          <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-1 font-black text-[10px] uppercase tracking-widest transform rotate-45 translate-x-8 translate-y-4">OUT OF STOCK</div>
                        )}
                        <div className="flex gap-6 flex-1">
                          <img src={item.image} alt={item.name} className="w-36 h-36 rounded-3xl object-cover border border-slate-100 shadow-inner shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">{item.category}</span>
                              <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${metrics.status === 'AVAILABLE' ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'}`}>{metrics.status}</span>
                            </div>
                            <div className="font-black text-2xl text-slate-800 mb-1">{item.name}</div>
                            <div className="flex gap-8 mt-4">
                              <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Selling</div>
                                <div className="text-xl font-black text-slate-900">{CURRENCY}{item.price.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Cost</div>
                                <div className="text-xl font-black text-emerald-600">{CURRENCY}{metrics.totalCost.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Margin</div>
                                <div className={`text-xl font-black ${item.price - metrics.totalCost > 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                                  {item.price > 0 ? (((item.price - metrics.totalCost) / item.price) * 100).toFixed(0) : 0}%
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); handleOpenAdjustment(item, 'PRODUCT'); }} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors">Adjust</button>
                              <button onClick={(e) => { e.stopPropagation(); handleOpenHistory(item.id); }} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors">Log</button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item, 'PRODUCT'); }} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'MATERIALS' ? (
          <div className="space-y-12">
            {(Object.entries(groupedMaterials) as [string, RawMaterial[]][]).sort().map(([category, mats]) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest">{category}</h2>
                  <div className="h-px bg-slate-100 flex-1"></div>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">{mats.length} Items</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {mats.map(mat => (
                    <div key={mat.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-indigo-600 transition-all cursor-pointer group flex flex-col">
                      <div className="aspect-square w-full bg-slate-100 relative" onClick={() => handleOpenEdit(mat)}>
                        {mat.image ? (
                          <img src={mat.image} alt={mat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
                          </div>
                        )}
                        <div className={`absolute bottom-4 right-4 px-3 py-1 rounded-full text-[10px] font-black shadow-sm ${mat.quantity <= (mat.minStockAlert || 5) ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-800 backdrop-blur'}`}>
                          {mat.quantity} {mat.unit}
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div onClick={() => handleOpenEdit(mat)}>
                          <div className="text-lg font-black text-slate-800 mb-1">{mat.name}</div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            {CURRENCY}{mat.costPerUnit.toLocaleString()} / {mat.unit}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                          <div className="flex gap-2">
                            <button onClick={() => handleOpenAdjustment(mat, 'RAW_MATERIAL')} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors">Adjust</button>
                            <button onClick={() => handleOpenHistory(mat.id)} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors">Log</button>
                            <button onClick={() => handleDeleteItem(mat, 'MATERIAL')} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">Delete</button>
                          </div>
                          {mat.quantity <= (mat.minStockAlert || 5) && (
                            <span className="text-[9px] font-black text-red-500 uppercase">Low Stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'SUPPLIERS' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map(sup => (
              <div key={sup.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-400">
                    {sup.name.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <button onClick={() => handleOpenEdit(sup as any)} className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Edit Details</button>
                    <button onClick={() => handleDeleteItem(sup, 'SUPPLIER')} className="text-[9px] font-black text-red-500 uppercase tracking-widest">Remove</button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{sup.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {sup.email || 'No email'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    {sup.phone || 'No phone'}
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {sup.categories.map(cat => (
                    <span key={cat} className="text-[9px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">{cat}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'PO' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {purchaseOrders.map(po => (
                <div key={po.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">{format(po.dateCreated, 'MMM')}</span>
                      <span className="text-xl font-black text-slate-800 leading-none">{format(po.dateCreated, 'dd')}</span>
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-800">{po.poNumber}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{po.supplierName} • {po.items.length} Items</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12">
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-400 uppercase mb-1">Total Value</div>
                      <div className="text-xl font-black text-slate-900">{CURRENCY}{po.totalAmount.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest ${po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {po.status}
                      </span>
                      {po.status !== 'RECEIVED' && (
                        <button onClick={() => receivePurchaseOrder(po.id, user.id, user.name)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                          Receive Stock
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-8">System-wide Activity Log</h2>
            <ItemHistory
              transactions={transactions.sort((a, b) => b.timestamp - a.timestamp)}
              unit="items"
            />
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{editingId ? 'Modify' : 'Create'} {activeTab === 'PRODUCTS' ? 'Dish' : 'Ingredient'}</h3>
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Item Configuration & Recipe</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleAddItem} className="flex-1 overflow-y-auto p-10 flex flex-col md:flex-row gap-12">
              <div className="w-full md:w-80 shrink-0 space-y-6">
                <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 group">
                  {isGeneratingImage ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur shadow-inner">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <span className="text-[10px] font-black text-indigo-600 uppercase animate-pulse">AI is creating image...</span>
                    </div>
                  ) : newItem.image ? (
                    <>
                      <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button type="button" onClick={handleGenerateAIImage} className="p-3 bg-white rounded-xl text-indigo-600 shadow-xl hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></button>
                        <button type="button" onClick={() => uploadInputRef.current?.click()} className="p-3 bg-white rounded-xl text-slate-600 shadow-xl hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">No item image provided</p>
                      <button type="button" onClick={handleGenerateAIImage} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
                        Bulk AI Magic
                      </button>
                    </div>
                  )}
                  <input type="file" hidden ref={uploadInputRef} onChange={handleUploadImage} accept="image/*" />
                </div>
              </div>

              <div className="flex-1 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Name</label>
                    <input required type="text" value={newItem.name || ''} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-600" />
                  </div>
                  {activeTab === 'PRODUCTS' ? (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                        <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Price ({CURRENCY})</label>
                        <input type="number" value={newItem.price || 0} onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
                        <input type="number" value={newItem.quantity || 0} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit Cost ({CURRENCY})</label>
                        <input type="number" value={newItem.costPerUnit || 0} onChange={e => setNewItem({ ...newItem, costPerUnit: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                        <input type="text" value={newItem.unit || ''} onChange={e => setNewItem({ ...newItem, unit: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Min Alert</label>
                        <input type="number" value={newItem.minStockAlert || 5} onChange={e => setNewItem({ ...newItem, minStockAlert: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold" />
                      </div>
                    </>
                  )}
                </div>

                {activeTab === 'PRODUCTS' && (
                  <div className="border-t border-slate-100 pt-8">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Recipe Linkage</h4>
                      <select className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black py-2 px-4 rounded-xl outline-none" onChange={(e) => { if (e.target.value) addIngredient(e.target.value); e.target.value = ""; }}>
                        <option value="">+ Add Link</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      {newItem.ingredients?.map(ing => {
                        const mat = materials.find(m => m.id === ing.materialId);
                        if (!mat) return null;
                        return (
                          <div key={ing.materialId} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                            <span className="font-bold text-slate-700">{mat.name}</span>
                            <div className="flex items-center gap-3">
                              <input type="number" step="0.01" value={ing.amount} onChange={(e) => updateIngredientAmount(ing.materialId, Number(e.target.value))} className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-center text-xs font-black" />
                              <span className="text-[10px] font-black text-slate-400 uppercase">{mat.unit}</span>
                              <button type="button" onClick={() => removeIngredient(ing.materialId)} className="text-red-400 hover:text-red-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-indigo-100 uppercase tracking-widest text-lg hover:bg-indigo-700 transition-all">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Draft Purchase Order</h3>
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Stock Replenishment Form</div>
              </div>
              <button onClick={() => setIsPOModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSavePO} className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Supplier</label>
                  <select required value={newPO.supplierId} onChange={e => setNewPO({ ...newPO, supplierId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold">
                    <option value="">Choose Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Notes</label>
                  <input type="text" value={newPO.notes || ''} onChange={e => setNewPO({ ...newPO, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Optional delivery instructions..." />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-8">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Line Items</h4>
                  <select className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black py-2 px-4 rounded-xl outline-none" onChange={e => { if (e.target.value) addPOItem(e.target.value); e.target.value = ""; }}>
                    <option value="">+ Add Material</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  {newPO.items?.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs">
                      No items added to this purchase order yet.
                    </div>
                  )}
                  {newPO.items?.map(item => (
                    <div key={item.materialId} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center gap-6">
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-sm font-black text-slate-800">{item.materialName}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">{item.unit}</div>
                      </div>
                      <div className="w-24">
                        <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Qty</label>
                        <input type="number" required value={item.quantity} onChange={e => updatePOItem(item.materialId, 'quantity', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black" />
                      </div>
                      <div className="w-32">
                        <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Price ({CURRENCY})</label>
                        <input type="number" required value={item.unitPrice} onChange={e => updatePOItem(item.materialId, 'unitPrice', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black" />
                      </div>
                      <div className="w-32 text-right">
                        <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Total</div>
                        <div className="text-sm font-black text-slate-900">{CURRENCY}{item.total.toLocaleString()}</div>
                      </div>
                      <button type="button" onClick={() => setNewPO(prev => ({ ...prev, items: prev.items?.filter(i => i.materialId !== item.materialId) }))} className="text-slate-300 hover:text-red-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total Balance</div>
                  <div className="text-3xl font-black text-slate-900">{CURRENCY}{newPO.items?.reduce((s, i) => s + i.total, 0).toLocaleString()}</div>
                </div>
                <button type="submit" disabled={!newPO.supplierId || !newPO.items?.length} className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black shadow-2xl shadow-indigo-100 uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50">
                  Generate PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Manual Adjustment</h3>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Direct Stock Correction</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ADD', 'REMOVE', 'WASTE', 'AUDIT'] as StockTransactionType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdjustmentData({ ...adjustmentData, type })}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${adjustmentData.type === type ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quantity</label>
                <input
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={e => setAdjustmentData({ ...adjustmentData, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Broken packaging, End of day waste..."
                  value={adjustmentData.reason}
                  onChange={e => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none font-bold"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
              <button onClick={handleSaveAdjustment} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Item History Modal */}
      {showHistory && selectedItemId && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Movement History</h3>
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                  {materials.find(m => m.id === selectedItemId)?.name} log
                </div>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10">
              <ItemHistory
                transactions={transactions.filter(t => t.itemId === selectedItemId).sort((a, b) => b.timestamp - a.timestamp)}
                unit={materials.find(m => m.id === selectedItemId)?.unit || 'units'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
