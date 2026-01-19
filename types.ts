
export enum AppView {
  LOGIN_ID = 'LOGIN_ID',
  LOGIN_PASSWORD = 'LOGIN_PASSWORD',
  DASHBOARD = 'DASHBOARD',
  MENU = 'MENU',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
  INVENTORY = 'INVENTORY',
  FLOOR_MAP = 'FLOOR_MAP',
  STATION_DISPLAY = 'STATION_DISPLAY',
  FINANCE = 'FINANCE',
  HR = 'HR',
  CRM = 'CRM',
  PURCHASING = 'PURCHASING'
}

export type PrintLocation = 'KITCHEN' | 'BAR' | 'GRILL' | 'STORE';

export interface PrinterConfig {
  id: string;
  name: string;
  location: PrintLocation;
  enabled: boolean;
  isDefault?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  vatRate: number;
  serviceChargeRate: number;
  currency: string;
  enableVat: boolean;
  enableServiceCharge: boolean;
  enablePrepareLater: boolean;
  printers?: PrinterConfig[];
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'waiter' | 'manager' | 'chef' | 'bartender';
  locationId: string;
  pin?: string;
  baseSalary?: number;
  joinedDate?: number;
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  startTime: number;
  endTime?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface RawMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  lastUsed?: number;
  image?: string;
  minStockAlert?: number;
  supplierId?: string;
  category?: string;
}

export type StockTransactionType = 'IN' | 'OUT' | 'WASTE' | 'ADJUST' | 'SALE' | 'PURCHASE';

export interface StockTransaction {
  id: string;
  itemId: string; // Product ID or RawMaterial ID
  itemType: 'PRODUCT' | 'RAW_MATERIAL';
  type: StockTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitPrice?: number;
  totalCost?: number;
  reason?: string;
  timestamp: number;
  userId: string;
  userName: string;
  referenceId?: string; // Order ID or Purchase Order ID
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  categories: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export type PurchaseOrderStatus = 'DRAFT' | 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  dateCreated: number;
  dateReceived?: number;
  expectedDate?: number;
  notes?: string;
  createdBy: string;
  receivedBy?: string;
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  category: string;
  image?: string;
  stock?: number;
  unit?: string;
  printLocation?: PrintLocation;
  section?: string;
  ingredients?: { materialId: string; amount: number; unit: string }[];
  availableModifiers?: Modifier[];
  minStockAlert?: number;
}

export interface CartItem extends Product {
  cartId: string; // Unique ID for specific item instance in cart
  quantity: number;
  selectedModifiers?: Modifier[];
  notes?: string;
  isVoided?: boolean;
}

export type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER' | 'COMPLIMENTARY';

// Payment interface for split payments
export interface Payment {
  id: string;
  method: PaymentMethod;
  amount: number;
  timestamp: number;
  reference?: string; // For card/transfer transactions
  cashTendered?: number; // Amount given by customer (for cash)
  changeGiven?: number; // Change returned (for cash)
}

// Order modification tracking
export interface OrderModification {
  id: string;
  type: 'add' | 'remove' | 'modify';
  itemId: string;
  itemName: string;
  reason?: string;
  timestamp: number;
  staffId: string;
  staffName: string;
}

export interface Order {
  id: string;
  tableNumber?: string;
  items: CartItem[];
  subtotal: number;
  discount: number; // Percentage
  total: number;
  customerCount: number;
  paymentMethod?: PaymentMethod; // Kept for backward compatibility
  payments?: Payment[]; // For split payments
  timestamp: number;
  scheduledTime?: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'scheduled' | 'hold';
  locationId: string;
  cashierId: string;
  cashierName?: string;

  // New fields for Phase 1 enhancements
  tipAmount?: number;
  tipPercent?: number;
  vatAmount?: number;
  serviceChargeAmount?: number;
  customerEmail?: string;
  customerPhone?: string;
  customerId?: string; // Link to CRM
  modifications?: OrderModification[];

  // Printing tracking
  printedAt?: number;
  reprintCount?: number;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'dirty';

export interface Table {
  id: string;
  number: string;
  status: TableStatus;
  capacity: number;
  x?: number; // For drag & drop positioning in future
  y?: number;
  joinedWith?: string[]; // IDs of tables joined with this one
  assignedStaffId?: string;
}

export interface Expense {
  id: string;
  category: 'REPLENISHMENT' | 'RENT' | 'UTILITIES' | 'REPAIRS' | 'SALARY' | 'MARKETING' | 'OTHER';
  amount: number;
  description: string;
  timestamp: number;
  userId: string;
  userName: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  creditBalance: number;
  totalSpent: number;
  lastVisit?: number;
}

export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  poId?: string; // Linked PO
  supplierId: string;
  supplierName: string;
  dateIssued: number;
  dueDate: number;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  items: PurchaseOrderItem[]; // Can differ from PO if partial delivery
  notes?: string;
}

export interface SupplierPayment {
  id: string;
  invoiceId?: string; // Optional, can be account payment
  supplierId: string;
  amount: number;
  date: number;
  method: 'CASH' | 'TRANSFER' | 'CHEQUE';
  reference?: string;
  recordedBy: string;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  supplierId: string;
  amount: number;
  reason: string;
  date: number;
  status: 'DRAFT' | 'USED' | 'REFUNDED';
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  supplierIds: string[]; // Sent to multiple suppliers
  items: { materialName: string; quantity: number; unit: string; }[];
  status: 'DRAFT' | 'SENT' | 'CLOSED';
  deadline: number;
  dateCreated: number;
}
