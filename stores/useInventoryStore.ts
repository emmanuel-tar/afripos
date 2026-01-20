import { create } from 'zustand';
import { RawMaterial, Supplier, StockTransaction, StockTransactionType, PurchaseOrder, Product, Warehouse } from '../types';
import * as inventoryDb from '../services/inventoryDb';
import { MOCK_MATERIALS, MOCK_PRODUCTS } from '../constants';

interface InventoryState {
    materials: RawMaterial[];
    products: Product[];
    suppliers: Supplier[];
    transactions: StockTransaction[];
    purchaseOrders: PurchaseOrder[];
    warehouses: Warehouse[];
    isLoading: boolean;

    // Actions
    fetchInventory: () => void;

    // Product Actions
    addProduct: (product: Product) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string) => void;

    // Material Actions
    addMaterial: (material: RawMaterial) => void;
    updateMaterial: (material: RawMaterial) => void;
    deleteMaterial: (id: string) => void;

    // Supplier Actions
    addSupplier: (supplier: Supplier) => void;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (id: string) => void;

    // Warehouse Actions
    addWarehouse: (warehouse: Warehouse) => void;
    updateWarehouse: (warehouse: Warehouse) => void;
    deleteWarehouse: (id: string) => void;

    recordTransaction: (transaction: Omit<StockTransaction, 'id' | 'timestamp'>) => void;

    // Deduction helper
    deductIngredients: (ingredients: { materialId: string; amount: number; unit: string }[], orderId: string, userId: string, userName: string) => void;

    // PO Actions
    fetchPurchaseOrders: () => void;
    createPurchaseOrder: (po: PurchaseOrder) => void;
    updatePurchaseOrder: (po: PurchaseOrder) => void;
    receivePurchaseOrder: (poId: string, userId: string, userName: string) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
    materials: [],
    products: [],
    suppliers: [],
    transactions: [],
    purchaseOrders: [],
    warehouses: [],
    isLoading: false,

    fetchInventory: async () => {
        set({ isLoading: true });
        try {
            let materials = await inventoryDb.getRawMaterials();
            let products = await inventoryDb.getProducts();

            if (materials.length === 0) {
                materials = MOCK_MATERIALS;
                await inventoryDb.saveRawMaterials(materials);
            }
            if (products.length === 0) {
                products = MOCK_PRODUCTS;
                await inventoryDb.saveProducts(products);
            }

            const suppliers = await inventoryDb.getSuppliers();
            const transactions = await inventoryDb.getStockTransactions();
            const purchaseOrders = await inventoryDb.getPurchaseOrders();
            const warehouses = await inventoryDb.getWarehouses();

            set({ materials, products, suppliers, transactions, purchaseOrders, warehouses, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            set({ isLoading: false });
        }
    },

    addProduct: async (product) => {
        const newProducts = [...get().products, product];
        await inventoryDb.saveProducts(newProducts);
        set({ products: newProducts });
    },

    updateProduct: async (product) => {
        const newProducts = get().products.map(p => p.id === product.id ? product : p);
        await inventoryDb.saveProducts(newProducts);
        set({ products: newProducts });
    },

    deleteProduct: async (id) => {
        const newProducts = get().products.filter(p => p.id !== id);
        await inventoryDb.saveProducts(newProducts);
        set({ products: newProducts });
    },

    addMaterial: async (material) => {
        const newMaterials = [...get().materials, material];
        await inventoryDb.saveRawMaterials(newMaterials);
        set({ materials: newMaterials });
    },

    updateMaterial: async (material) => {
        const newMaterials = get().materials.map(m => m.id === material.id ? material : m);
        await inventoryDb.saveRawMaterials(newMaterials);
        set({ materials: newMaterials });
    },

    deleteMaterial: async (id) => {
        const newMaterials = get().materials.filter(m => m.id !== id);
        await inventoryDb.saveRawMaterials(newMaterials);
        set({ materials: newMaterials });
    },

    addSupplier: async (supplier) => {
        const newSuppliers = [...get().suppliers, supplier];
        await inventoryDb.saveSuppliers(newSuppliers);
        set({ suppliers: newSuppliers });
    },

    updateSupplier: async (supplier) => {
        const newSuppliers = get().suppliers.map(s => s.id === supplier.id ? supplier : s);
        await inventoryDb.saveSuppliers(newSuppliers);
        set({ suppliers: newSuppliers });
    },

    deleteSupplier: async (id) => {
        const newSuppliers = get().suppliers.filter(s => s.id !== id);
        await inventoryDb.saveSuppliers(newSuppliers);
        set({ suppliers: newSuppliers });
    },

    addWarehouse: async (warehouse) => {
        const newWarehouses = [...get().warehouses, warehouse];
        await inventoryDb.saveWarehouse(warehouse);
        set({ warehouses: newWarehouses });
    },

    updateWarehouse: async (warehouse) => {
        const newWarehouses = get().warehouses.map(w => w.id === warehouse.id ? warehouse : w);
        await inventoryDb.saveWarehouse(warehouse);
        set({ warehouses: newWarehouses });
    },

    deleteWarehouse: async (id) => {
        const newWarehouses = get().warehouses.filter(w => w.id !== id);
        await inventoryDb.deleteWarehouse(id);
        set({ warehouses: newWarehouses });
    },

    recordTransaction: async (transactionData) => {
        const transaction: StockTransaction = {
            ...transactionData,
            id: `trx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        };
        await inventoryDb.saveStockTransaction(transaction);
        set({ transactions: [...get().transactions, transaction] });
    },

    deductIngredients: async (ingredients, orderId, userId, userName) => {
        const { materials, recordTransaction, updateMaterial } = get();

        for (const ing of ingredients) {
            const material = materials.find(m => m.id === ing.materialId);
            if (material) {
                const previousStock = material.quantity;
                const newStock = previousStock - ing.amount;

                const updatedMaterial = { ...material, quantity: newStock, lastUsed: Date.now() };
                await updateMaterial(updatedMaterial);

                await recordTransaction({
                    itemId: ing.materialId,
                    itemType: 'RAW_MATERIAL',
                    type: 'SALE',
                    quantity: ing.amount,
                    previousStock,
                    newStock,
                    userId,
                    userName,
                    referenceId: orderId,
                    reason: `Auto-deduction for order ${orderId}`
                });
            }
        }
    },

    fetchPurchaseOrders: async () => {
        const purchaseOrders = await inventoryDb.getPurchaseOrders();
        set({ purchaseOrders });
    },

    createPurchaseOrder: async (po) => {
        await inventoryDb.savePurchaseOrder(po);
        set(state => ({ purchaseOrders: [po, ...state.purchaseOrders] }));
    },

    updatePurchaseOrder: async (po) => {
        await inventoryDb.savePurchaseOrder(po);
        set(state => ({ purchaseOrders: state.purchaseOrders.map(p => p.id === po.id ? po : p) }));
    },

    receivePurchaseOrder: async (poId, userId, userName) => {
        const { purchaseOrders, updatePurchaseOrder, updateMaterial, recordTransaction, materials } = get();
        const po = purchaseOrders.find(p => p.id === poId);

        if (po && po.status !== 'RECEIVED') {
            const updatedPo: PurchaseOrder = {
                ...po,
                status: 'RECEIVED',
                dateReceived: Date.now(),
                receivedBy: userName
            };

            await updatePurchaseOrder(updatedPo);

            // Update stock for each item
            for (const item of po.items) {
                if (item.type === 'RAW_MATERIAL') {
                    const material = materials.find(m => m.id === item.itemId);
                    if (material) {
                        const previousStock = material.quantity;
                        const newStock = previousStock + item.quantity;
                        await updateMaterial({ ...material, quantity: newStock });

                        await recordTransaction({
                            itemId: item.itemId,
                            itemType: 'RAW_MATERIAL',
                            type: 'PURCHASE',
                            quantity: item.quantity,
                            previousStock,
                            newStock,
                            unitPrice: item.unitPrice,
                            totalCost: item.total,
                            userId,
                            userName,
                            referenceId: po.id,
                            reason: `PO Received: ${po.poNumber}`
                        });
                    }
                } else if (item.type === 'PRODUCT') {
                    // This handles direct product purchases (e.g., beverages, retail items)
                    const product = get().products.find(p => p.id === item.itemId);
                    if (product) {
                        const previousStock = product.stock || 0;
                        const newStock = previousStock + item.quantity;
                        await get().updateProduct({ ...product, stock: newStock });

                        await recordTransaction({
                            itemId: item.itemId,
                            itemType: 'PRODUCT',
                            type: 'PURCHASE',
                            quantity: item.quantity,
                            previousStock,
                            newStock,
                            unitPrice: item.unitPrice,
                            totalCost: item.total,
                            userId,
                            userName,
                            referenceId: po.id,
                            reason: `PO Received: ${po.poNumber}`
                        });
                    }
                }
            }

            // INTEGRATION: Record Expense in Finance
            try {
                // Dynamically import to avoid circular dependency if any, though stores usually fine.
                // Using generic pattern if available or direct import.
                // Note: We need to import useFinanceStore at top of file.
                const { useFinanceStore } = await import('./useFinanceStore');
                await useFinanceStore.getState().addExpense({
                    id: `EXP-${Date.now()}`,
                    category: 'REPLENISHMENT',
                    amount: po.totalAmount,
                    description: `PO Paid: ${po.poNumber} (${po.supplierName})`,
                    timestamp: Date.now(),
                    userId,
                    userName
                });
                console.log('Expense automatically recorded for PO:', po.poNumber);
            } catch (err) {
                console.error('Failed to record automatic expense for PO:', err);
            }
        }
    }
}));
