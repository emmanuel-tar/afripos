import { create } from 'zustand';
import { Recipe, ProductionOrder, ManufacturingProcess } from '../types';
import * as manufacturingDb from '../services/manufacturingDb';
import { useInventoryStore } from './useInventoryStore';

interface ManufacturingState {
    recipes: Recipe[];
    productionOrders: ProductionOrder[];
    manufacturingProcesses: ManufacturingProcess[];
    isLoading: boolean;

    // Actions
    fetchManufacturingData: () => Promise<void>;

    // Recipe Actions
    addRecipe: (recipe: Recipe) => Promise<void>;
    updateRecipe: (recipe: Recipe) => Promise<void>;
    deleteRecipe: (id: string) => Promise<void>;

    // Production Order Actions
    addProductionOrder: (order: ProductionOrder) => Promise<void>;
    updateProductionOrder: (order: ProductionOrder) => Promise<void>;
    startProduction: (orderId: string) => Promise<void>;
    completeProduction: (orderId: string, actualQuantity: number, userId: string, userName: string) => Promise<void>;
    cancelProduction: (orderId: string) => Promise<void>;

    // Process Actions
    addProcess: (process: ManufacturingProcess) => Promise<void>;
    updateProcess: (process: ManufacturingProcess) => Promise<void>;
    deleteProcess: (id: string) => Promise<void>;
}

export const useManufacturingStore = create<ManufacturingState>((set, get) => ({
    recipes: [],
    productionOrders: [],
    manufacturingProcesses: [],
    isLoading: false,

    fetchManufacturingData: async () => {
        set({ isLoading: true });
        try {
            const [recipes, productionOrders, manufacturingProcesses] = await Promise.all([
                manufacturingDb.getRecipes(),
                manufacturingDb.getProductionOrders(),
                manufacturingDb.getManufacturingProcesses()
            ]);
            set({ recipes, productionOrders, manufacturingProcesses, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch manufacturing data:', error);
            set({ isLoading: false });
        }
    },

    addRecipe: async (recipe) => {
        await manufacturingDb.saveRecipe(recipe);
        set(state => ({ recipes: [...state.recipes, recipe] }));
    },

    updateRecipe: async (recipe) => {
        await manufacturingDb.saveRecipe(recipe);
        set(state => ({ recipes: state.recipes.map(r => r.id === recipe.id ? recipe : r) }));
    },

    deleteRecipe: async (id) => {
        await manufacturingDb.deleteRecipe(id);
        set(state => ({ recipes: state.recipes.filter(r => r.id !== id) }));
    },

    addProductionOrder: async (order) => {
        await manufacturingDb.saveProductionOrder(order);
        set(state => ({ productionOrders: [order, ...state.productionOrders] }));
    },

    updateProductionOrder: async (order) => {
        await manufacturingDb.saveProductionOrder(order);
        set(state => ({ productionOrders: state.productionOrders.map(o => o.id === order.id ? order : o) }));
    },

    startProduction: async (orderId) => {
        const order = get().productionOrders.find(o => o.id === orderId);
        if (order) {
            const updatedOrder: ProductionOrder = {
                ...order,
                status: 'IN_PROGRESS',
                startTime: Date.now()
            };
            await get().updateProductionOrder(updatedOrder);
        }
    },

    completeProduction: async (orderId, actualQuantity, userId, userName) => {
        const order = get().productionOrders.find(o => o.id === orderId);
        const recipe = get().recipes.find(r => r.id === order?.recipeId);

        if (order && recipe) {
            const updatedOrder: ProductionOrder = {
                ...order,
                status: 'COMPLETED',
                actualQuantity,
                completionTime: Date.now()
            };
            await get().updateProductionOrder(updatedOrder);

            // INTEGRATION: Update Inventory
            const inventoryStore = useInventoryStore.getState();

            // 1. Deduct Ingredients
            await inventoryStore.deductIngredients(
                recipe.ingredients.map(ing => ({
                    materialId: ing.materialId,
                    amount: (ing.quantity / recipe.yieldQuantity) * actualQuantity,
                    unit: ing.unit
                })),
                order.id,
                userId,
                userName
            );

            // 2. Add Finished Product
            const product = inventoryStore.products.find(p => p.id === recipe.productId);
            if (product) {
                const previousStock = product.stock || 0;
                const newStock = previousStock + actualQuantity;

                await inventoryStore.updateProduct({
                    ...product,
                    stock: newStock
                });

                await inventoryStore.recordTransaction({
                    itemId: product.id,
                    itemType: 'PRODUCT',
                    type: 'IN', // 'IN' for newly manufactured stock
                    quantity: actualQuantity,
                    previousStock,
                    newStock,
                    userId,
                    userName,
                    referenceId: order.id,
                    reason: `Manufactured from Order #${order.orderNumber}`
                });
            }
        }
    },

    cancelProduction: async (orderId) => {
        const order = get().productionOrders.find(o => o.id === orderId);
        if (order) {
            const updatedOrder: ProductionOrder = {
                ...order,
                status: 'CANCELLED'
            };
            await get().updateProductionOrder(updatedOrder);
        }
    },

    addProcess: async (process) => {
        await manufacturingDb.saveManufacturingProcess(process);
        set(state => ({ manufacturingProcesses: [...state.manufacturingProcesses, process] }));
    },

    updateProcess: async (process) => {
        await manufacturingDb.saveManufacturingProcess(process);
        set(state => ({ manufacturingProcesses: state.manufacturingProcesses.map(p => p.id === process.id ? process : p) }));
    },

    deleteProcess: async (id) => {
        await manufacturingDb.deleteManufacturingProcess(id);
        set(state => ({ manufacturingProcesses: state.manufacturingProcesses.filter(p => p.id !== id) }));
    }
}));
