import Dexie, { type Table } from 'dexie';
import {
    Order, Product, RawMaterial, Supplier,
    StockTransaction, PurchaseOrder, Expense,
    Customer, User, Shift
} from '../types';

export class AfriPOSDatabase extends Dexie {
    orders!: Table<Order>;
    products!: Table<Product>;
    materials!: Table<RawMaterial>;
    suppliers!: Table<Supplier>;
    transactions!: Table<StockTransaction>;
    purchaseOrders!: Table<PurchaseOrder>;
    expenses!: Table<Expense>;
    customers!: Table<Customer>;
    staff!: Table<User>;
    shifts!: Table<Shift>;

    constructor() {
        super('AfriPOSDatabase');
        this.version(1).stores({
            orders: 'id, tableNumber, status, timestamp',
            products: 'id, name, category',
            materials: 'id, name, category',
            suppliers: 'id, name',
            transactions: 'id, itemId, type, timestamp',
            purchaseOrders: 'id, poNumber, supplierId, status',
            expenses: 'id, category, timestamp',
            customers: 'id, name, phone, email',
            staff: 'id, name, role',
            shifts: 'id, userId, status, startTime'
        });
    }
}

export const db = new AfriPOSDatabase();

// Migration Utility
export const migrateFromLocalStorage = async () => {
    const keys = {
        orders: 'afripos_local_db',
        materials: 'afripos_materials',
        products: 'afripos_products',
        suppliers: 'afripos_suppliers',
        transactions: 'afripos_stock_transactions',
        purchaseOrders: 'afripos_purchase_orders',
        expenses: 'afripos_expenses',
        customers: 'afripos_customers',
        staff: 'afripos_staff',
        shifts: 'afripos_shifts'
    };

    const isMigrated = localStorage.getItem('afripos_db_migrated');
    if (isMigrated === 'true') return;

    console.log('Starting migration from localStorage to IndexedDB...');

    try {
        for (const [table, key] of Object.entries(keys)) {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    await (db as any)[table].bulkPut(parsed);
                } else if (table === 'staff' && typeof parsed === 'object') {
                    // Staff might be an array or object depending on how it was saved
                    await db.staff.bulkPut(Object.values(parsed));
                }
            }
        }
        localStorage.setItem('afripos_db_migrated', 'true');
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};
