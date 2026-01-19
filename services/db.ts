
import { Order } from '../types';

const DB_KEY = 'afripos_local_db';

export const saveOrder = (order: Order) => {
  const currentData = localStorage.getItem(DB_KEY);
  const orders: Order[] = currentData ? JSON.parse(currentData) : [];
  
  const existingIdx = orders.findIndex(o => o.id === order.id);
  if (existingIdx > -1) {
    orders[existingIdx] = order;
  } else {
    orders.push(order);
  }
  
  localStorage.setItem(DB_KEY, JSON.stringify(orders));
};

export const getOrders = (): Order[] => {
  const currentData = localStorage.getItem(DB_KEY);
  return currentData ? JSON.parse(currentData) : [];
};

export const deleteOrder = (orderId: string) => {
  const orders = getOrders();
  const updated = orders.filter(o => o.id !== orderId);
  localStorage.setItem(DB_KEY, JSON.stringify(updated));
};

export const getActiveTableOrder = (tableNumber: string): Order | undefined => {
  const orders = getOrders();
  return orders.find(o => 
    o.tableNumber === tableNumber && 
    (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'hold')
  );
};

export const transferOrderToTable = (orderId: string, newTableNumber: string) => {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx > -1) {
    orders[idx].tableNumber = newTableNumber;
    localStorage.setItem(DB_KEY, JSON.stringify(orders));
  }
};

export const clearAllData = () => {
  localStorage.removeItem(DB_KEY);
};

export const getSyncStatus = () => {
  const orders = getOrders();
  return orders.length;
};
