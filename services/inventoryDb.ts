
import { RawMaterial, Supplier, StockTransaction, PurchaseOrder, Warehouse } from '../types';
import { db } from './offlineDb';

export const getRawMaterials = async (): Promise<RawMaterial[]> => {
    return await db.materials.toArray();
};

export const saveRawMaterials = async (materials: RawMaterial[]) => {
    await db.materials.bulkPut(materials);
};

export const getProducts = async (): Promise<any[]> => {
    return await db.products.toArray();
};

export const saveProducts = async (products: any[]): Promise<void> => {
    await db.products.bulkPut(products);
};

export const getSuppliers = async (): Promise<Supplier[]> => {
    return await db.suppliers.toArray();
};

export const saveSuppliers = async (suppliers: Supplier[]) => {
    await db.suppliers.bulkPut(suppliers);
};

export const getStockTransactions = async (): Promise<StockTransaction[]> => {
    return await db.transactions.toArray();
};

export const saveStockTransaction = async (transaction: StockTransaction) => {
    await db.transactions.put(transaction);
};

export const getTransactionsForItem = async (itemId: string): Promise<StockTransaction[]> => {
    return await db.transactions.where('itemId').equals(itemId).toArray();
};

// Purchase Orders
export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
    return await db.purchaseOrders.toArray();
};

export const savePurchaseOrder = async (po: PurchaseOrder): Promise<void> => {
    await db.purchaseOrders.put(po);
};

// Warehouses
export const getWarehouses = async (): Promise<Warehouse[]> => {
    return await db.warehouses.toArray();
};

export const saveWarehouse = async (warehouse: Warehouse): Promise<void> => {
    await db.warehouses.put(warehouse);
};

export const saveWarehouses = async (warehouses: Warehouse[]): Promise<void> => {
    await db.warehouses.bulkPut(warehouses);
};

export const deleteWarehouse = async (id: string): Promise<void> => {
    await db.warehouses.delete(id);
};
