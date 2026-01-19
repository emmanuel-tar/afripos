import { RawMaterial, Supplier, StockTransaction, PurchaseOrder } from '../types';

const MATERIALS_KEY = 'afripos_raw_materials';
const SUPPLIERS_KEY = 'afripos_suppliers';
const TRANSACTIONS_KEY = 'afripos_stock_transactions';
const POS_KEY = 'afripos_purchase_orders';

export const getRawMaterials = (): RawMaterial[] => {
    const data = localStorage.getItem(MATERIALS_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveRawMaterials = (materials: RawMaterial[]) => {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
};

export const getSuppliers = (): Supplier[] => {
    const data = localStorage.getItem(SUPPLIERS_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveSuppliers = (suppliers: Supplier[]) => {
    localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
};

export const getStockTransactions = (): StockTransaction[] => {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveStockTransaction = (transaction: StockTransaction) => {
    const transactions = getStockTransactions();
    transactions.push(transaction);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const getTransactionsForItem = (itemId: string): StockTransaction[] => {
    return getStockTransactions().filter(t => t.itemId === itemId);
};

// Purchase Orders
export const getPurchaseOrders = (): PurchaseOrder[] => {
    const data = localStorage.getItem(POS_KEY);
    return data ? JSON.parse(data) : [];
};

export const savePurchaseOrder = (po: PurchaseOrder): void => {
    const pos = getPurchaseOrders();
    const index = pos.findIndex(p => p.id === po.id);
    if (index >= 0) pos[index] = po;
    else pos.push(po);
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
};
