import { Recipe, ProductionOrder, ManufacturingProcess } from '../types';
import { db } from './offlineDb';

// Recipe operations
export const saveRecipe = async (recipe: Recipe) => {
  await db.recipes.put(recipe);
};

export const getRecipes = async (): Promise<Recipe[]> => {
  return await db.recipes.toArray();
};

export const getRecipeById = async (recipeId: string): Promise<Recipe | undefined> => {
  return await db.recipes.get(recipeId);
};

export const deleteRecipe = async (recipeId: string) => {
  await db.recipes.delete(recipeId);
};

// Production Order operations
export const saveProductionOrder = async (order: ProductionOrder) => {
  await db.productionOrders.put(order);
};

export const getProductionOrders = async (): Promise<ProductionOrder[]> => {
  return await db.productionOrders.toArray();
};

export const getProductionOrderById = async (orderId: string): Promise<ProductionOrder | undefined> => {
  return await db.productionOrders.get(orderId);
};

export const getActiveProductionOrders = async (): Promise<ProductionOrder[]> => {
  return await db.productionOrders
    .filter(order => ['PLANNED', 'IN_PROGRESS'].includes(order.status))
    .toArray();
};

export const deleteProductionOrder = async (orderId: string) => {
  await db.productionOrders.delete(orderId);
};

// Manufacturing Process operations
export const saveManufacturingProcess = async (process: ManufacturingProcess) => {
  await db.manufacturingProcesses.put(process);
};

export const getManufacturingProcesses = async (): Promise<ManufacturingProcess[]> => {
  return await db.manufacturingProcesses.toArray();
};

export const getManufacturingProcessById = async (processId: string): Promise<ManufacturingProcess | undefined> => {
  return await db.manufacturingProcesses.get(processId);
};

export const deleteManufacturingProcess = async (processId: string) => {
  await db.manufacturingProcesses.delete(processId);
};

// Utility functions
export const getRecipesByProduct = async (productId: string): Promise<Recipe[]> => {
  return await db.recipes.where('productId').equals(productId).toArray();
};

export const getProductionOrdersByRecipe = async (recipeId: string): Promise<ProductionOrder[]> => {
  return await db.productionOrders.where('recipeId').equals(recipeId).toArray();
};

export const getProductionOrdersByStatus = async (status: string): Promise<ProductionOrder[]> => {
  return await db.productionOrders.where('status').equals(status).toArray();
};
