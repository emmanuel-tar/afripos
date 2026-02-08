
import { Product, Modifier, RawMaterial, Table, User, Branch } from './types';

export const CURRENCY = '₦';

export const CATEGORIES = [
  'Swallow & Soups',
  'Rice Dishes',
  'Proteins',
  'Sides',
  'Drinks',
  'Desserts',
  'Raw Ingredients'
];

export const PRINT_LOCATIONS = ['KITCHEN', 'BAR', 'GRILL', 'STORE'] as const;

export const STORAGE_SECTIONS = [
  'Main Store',
  'Cold Room 1',
  'Beverage Fridge',
  'Kitchen Pantry',
  'Dry Store'
];

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'br-1',
    name: 'Victoria Island HQ',
    vatRate: 7.5,
    serviceChargeRate: 5.0,
    currency: '₦',
    enableVat: true,
    enableServiceCharge: true,
    enablePrepareLater: true,
    printers: [
      { id: 'p1', name: 'Kitchen Printer', location: 'KITCHEN', enabled: true, isDefault: true, connectionType: 'NETWORK' },
      { id: 'p2', name: 'Bar Printer', location: 'BAR', enabled: true, isDefault: true, connectionType: 'NETWORK' },
      { id: 'p3', name: 'Grill Station Printer', location: 'GRILL', enabled: true, isDefault: true, connectionType: 'NETWORK' },
      { id: 'p4', name: 'Store Printer', location: 'STORE', enabled: true, isDefault: false, connectionType: 'NETWORK' }
    ]
  },
  {
    id: 'br-2',
    name: 'Lekki Phase 1',
    vatRate: 7.5,
    serviceChargeRate: 5.0,
    currency: '₦',
    enableVat: true,
    enableServiceCharge: true,
    enablePrepareLater: false,
    printers: [
      { id: 'p5', name: 'Main Kitchen', location: 'KITCHEN', enabled: true, isDefault: true, connectionType: 'NETWORK' },
      { id: 'p6', name: 'Bar Station', location: 'BAR', enabled: true, isDefault: true, connectionType: 'NETWORK' }
    ]
  }
];

export const DEFAULT_STAFF: User[] = [
  { id: '00', name: 'System Admin', role: 'admin', locationId: 'br-1', pin: '0000' },
  { id: '11', name: 'Chioma Adeyemi', role: 'waiter', locationId: 'br-1', pin: '1111' },
  { id: '22', name: 'Chef Tunde', role: 'chef', locationId: 'br-1', pin: '2222' }
];

export const MOCK_MODIFIERS: Modifier[] = [
  { id: 'm1', name: 'Extra Beef', price: 1500 },
  { id: 'm2', name: 'Extra Fish', price: 1200 },
  { id: 'm3', name: 'Takeaway Pack', price: 200 },
  { id: 'm4', name: 'Spicy Level: Hot', price: 0 },
  { id: 'm5', name: 'Extra Egg', price: 300 }
];

export const MOCK_MATERIALS: RawMaterial[] = [
  { id: 'rm1', name: 'Parboiled Rice', quantity: 100, unit: 'kg', costPerUnit: 1200 },
  { id: 'rm2', name: 'Vegetable Oil', quantity: 50, unit: 'L', costPerUnit: 2500 },
  { id: 'rm3', name: 'Chicken Breast', quantity: 30, unit: 'kg', costPerUnit: 4500 },
  { id: 'rm4', name: 'Egusi Seeds', quantity: 20, unit: 'kg', costPerUnit: 3800 }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Jollof Rice with Chicken',
    price: 4500,
    costPrice: 1800,
    category: 'Rice Dishes',
    image: 'https://picsum.photos/200/200?random=1',
    printLocation: 'KITCHEN',
    section: 'Kitchen Pantry',
    stock: 50,
    availableModifiers: [MOCK_MODIFIERS[0], MOCK_MODIFIERS[2], MOCK_MODIFIERS[3]],
    ingredients: [{ materialId: 'rm1', amount: 0.2, unit: 'kg' }, { materialId: 'rm3', amount: 0.25, unit: 'kg' }]
  },
  {
    id: '3',
    name: 'Egusi Soup & Pounded Yam',
    price: 5500,
    costPrice: 2200,
    category: 'Swallow & Soups',
    image: 'https://picsum.photos/200/200?random=3',
    printLocation: 'KITCHEN',
    section: 'Cold Room 1',
    stock: 30,
    availableModifiers: [MOCK_MODIFIERS[0], MOCK_MODIFIERS[1]],
    ingredients: [{ materialId: 'rm4', amount: 0.15, unit: 'pcs' }]
  },
  {
    id: '9',
    name: 'Zobo Drink',
    price: 1000,
    costPrice: 300,
    category: 'Drinks',
    image: 'https://picsum.photos/200/200?random=9',
    printLocation: 'BAR',
    section: 'Beverage Fridge',
    stock: 120
  }
];

export const MOCK_TABLES: Table[] = [
  { id: 't1', number: '1', status: 'available', capacity: 4, shape: 'SQUARE', roomId: 'r1', floorId: 'f1', x: 100, y: 100, rotation: 0, locationId: 'br-1', isActive: true },
  { id: 't2', number: '2', status: 'occupied', capacity: 2, shape: 'SQUARE', roomId: 'r1', floorId: 'f1', x: 300, y: 100, rotation: 0, locationId: 'br-1', isActive: true },
  { id: 't3', number: '3', status: 'available', capacity: 4, shape: 'ROUND', roomId: 'r1', floorId: 'f1', x: 500, y: 100, rotation: 0, locationId: 'br-1', isActive: true },
  { id: 't4', number: '4', status: 'reserved', capacity: 6, shape: 'RECTANGULAR', roomId: 'r1', floorId: 'f1', x: 700, y: 100, rotation: 0, locationId: 'br-1', isActive: true },
  { id: 't5', number: '5', status: 'available', capacity: 2, shape: 'SQUARE', roomId: 'r1', floorId: 'f1', x: 100, y: 300, rotation: 0, locationId: 'br-1', isActive: true },
  { id: 't6', number: '6', status: 'dirty', capacity: 4, shape: 'SQUARE', roomId: 'r1', floorId: 'f1', x: 300, y: 300, rotation: 0, locationId: 'br-1', isActive: true },
  { id: 't7', number: '7', status: 'available', capacity: 8, shape: 'RECTANGULAR', roomId: 'r1', floorId: 'f1', x: 500, y: 300, rotation: 0, locationId: 'br-1', isActive: true },
  { id: 't8', number: 'VIP 1', status: 'available', capacity: 10, shape: 'ROUND', roomId: 'r2', floorId: 'f1', x: 700, y: 300, rotation: 0, locationId: 'br-1', isActive: true },
];

export const LOW_STOCK_THRESHOLD_MULTIPLIER = 5;
export const SCARCITY_PREMIUM = 1.25;

// Local Server & Sync Config
export const LOCAL_SERVER_URL = 'http://192.168.1.100:8080/api';
export const SYNC_INTERVAL_MS = 10000; // 10 seconds
export const MOCK_SYNC_DELAY_MS = 1500;
