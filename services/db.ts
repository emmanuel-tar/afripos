
import { Order } from '../types';
import { db } from './offlineDb';

export const saveOrder = async (order: Order) => {
  const updatedOrder: Order = {
    ...order,
    syncStatus: order.syncStatus === 'SYNCED' ? 'QUEUED' : (order.syncStatus || 'QUEUED')
  };
  await db.orders.put(updatedOrder);
};

export const getOrders = async (): Promise<Order[]> => {
  return await db.orders.toArray();
};

export const getUnsyncedOrders = async (): Promise<Order[]> => {
  return await db.orders
    .where('syncStatus')
    .equals('QUEUED')
    .toArray();
};

export const markAsSynced = async (orderId: string) => {
  await db.orders.update(orderId, { syncStatus: 'SYNCED' });
};

export const deleteOrder = async (orderId: string) => {
  await db.orders.delete(orderId);
};

export const getActiveTableOrder = async (tableNumber: string): Promise<Order | undefined> => {
  const activeOrders = await db.orders
    .where('tableNumber')
    .equals(tableNumber)
    .filter(o => ['pending', 'preparing', 'ready', 'hold'].includes(o.status))
    .toArray();
  return activeOrders[0];
};

export const transferOrderToTable = async (orderId: string, newTableNumber: string) => {
  await db.orders.update(orderId, { tableNumber: newTableNumber });
};

export const clearAllData = async () => {
  await db.orders.clear();
};

export const getSyncStatus = async () => {
  return await db.orders.count();
};
