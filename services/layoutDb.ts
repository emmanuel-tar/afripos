import { db } from './offlineDb';
import { Floor, Room, Table } from '../types';

export const layoutDb = {
    // Floors
    async getFloors(): Promise<Floor[]> {
        return await db.table('floors').orderBy('order').toArray();
    },
    async saveFloor(floor: Floor): Promise<any> {
        return await db.table('floors').put(floor);
    },
    async deleteFloor(id: string): Promise<void> {
        await db.table('floors').delete(id);
        // Cascading delete rooms and tables? For high-control we might want this or manual cleanup
        const rooms = await db.table('rooms').where('floorId').equals(id).toArray();
        for (const room of rooms) {
            await this.deleteRoom(room.id);
        }
    },

    // Rooms
    async getRooms(floorId?: string): Promise<Room[]> {
        if (floorId) {
            return await db.table('rooms').where('floorId').equals(floorId).toArray();
        }
        return await db.table('rooms').orderBy('order').toArray();
    },
    async saveRoom(room: Room): Promise<any> {
        return await db.table('rooms').put(room);
    },
    async deleteRoom(id: string): Promise<void> {
        await db.table('rooms').delete(id);
        // Tables cleanup
        const tables = await db.table('tables').where('roomId').equals(id).toArray();
        for (const table of tables) {
            await db.table('tables').delete(table.id);
        }
    },

    // Tables (Syncing with useTableStore)
    async getTables(): Promise<Table[]> {
        return await db.table('tables').toArray();
    },
    async saveTable(table: Table): Promise<any> {
        return await db.table('tables').put(table);
    },
    async deleteTable(id: string): Promise<void> {
        await db.table('tables').delete(id);
    },

    // System Reset Logic
    async resetOperationalData(): Promise<void> {
        await Promise.all([
            db.table('orders').clear(),
            db.table('transactions').clear(),
            db.table('purchaseOrders').clear(),
            db.table('expenses').clear(),
            db.table('invoices').clear(),
            db.table('payments').clear(),
            db.table('rfqs').clear(),
            db.table('productionOrders').clear(),
            db.table('notificationLogs').clear(),
            db.table('reservations').clear()
        ]);
    },

    async resetConfigurationData(): Promise<void> {
        await Promise.all([
            db.table('products').clear(),
            db.table('materials').clear(),
            db.table('recipes').clear(),
            db.table('suppliers').clear(),
            db.table('staff').clear(),
            db.table('floors').clear(),
            db.table('rooms').clear(),
            db.table('tables').clear(),
            db.table('notificationTemplates').clear(),
            db.table('notificationSettings').clear(),
            db.table('warehouses').clear()
        ]);
    }
};
