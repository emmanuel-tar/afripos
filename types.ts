
export enum AppView {
  LOGIN_ID = 'LOGIN_ID',
  LOGIN_PASSWORD = 'LOGIN_PASSWORD',
  DASHBOARD = 'DASHBOARD',
  MENU = 'MENU',
  TRANSACTION_HISTORY = 'TRANSACTION_HISTORY',
  SETTINGS = 'SETTINGS',
  INVENTORY = 'INVENTORY',
  FLOOR_MAP = 'FLOOR_MAP',
  STATION_DISPLAY = 'STATION_DISPLAY',
  FINANCE = 'FINANCE',
  HR = 'HR',
  CRM = 'CRM',
  PURCHASING = 'PURCHASING',
  MANUFACTURING = 'MANUFACTURING',
  RESERVATIONS = 'RESERVATIONS',
  NOTIFICATION_SETTINGS = 'NOTIFICATION_SETTINGS',
  SYSTEM_CONFIG = 'SYSTEM_CONFIG',
  CLOSE_BILL = 'CLOSE_BILL',
  WALLET_MANAGEMENT = 'WALLET_MANAGEMENT',
  PUBLIC_BOOKING = 'PUBLIC_BOOKING',
  BOOKING_SELF_SERVICE = 'BOOKING_SELF_SERVICE',
  STAFF_LOGIN = 'STAFF_LOGIN',
  PRINTER_ROUTING = 'PRINTER_ROUTING',
  DEVICE_MANAGEMENT = 'DEVICE_MANAGEMENT'
}

export type SyncStatus = 'SYNCED' | 'QUEUED' | 'SYNCING' | 'ERROR';

export type NotificationChannel = 'SMS' | 'WHATSAPP';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
export type NotificationEvent =
  | 'RESERVATION_CREATED'
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_REMINDER'
  | 'RESERVATION_SEATED'
  | 'RESERVATION_CANCELLED'
  | 'NO_SHOW';

export interface NotificationTemplate {
  id: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  content: string;
  isActive: boolean;
}

export interface BranchNotificationSetting {
  branchId: string;
  enabledEvents: NotificationEvent[];
  preferredChannel: NotificationChannel;
  fallbackToSms: boolean;
  reminderMinutesBefore: number;
}

export interface NotificationLog {
  id: string;
  timestamp: number;
  customerId: string;
  customerName: string;
  reservationId: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  status: NotificationStatus;
  errorMessage?: string;
  content: string;
}

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW' | 'PAYMENT_EXPIRED';

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'REFUNDED' | 'FORFEITED';

export type DepositType = 'NONE' | 'FIXED' | 'PERCENTAGE' | 'FULL' | 'PER_PERSON';

export interface DepositRule {
  id: string;
  name: string;
  type: DepositType;
  value: number; // Amount or percentage
  locationId?: string; // Optional: all branches if empty
  roomId?: string; // Optional: specific room
  daysOfWeek?: number[]; // [0-6] 0=Sunday
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  minPartySize?: number;
  maxPartySize?: number;
  isRefundable: boolean;
  refundCutoffHours: number;
  isActive: boolean;
}

export interface PaymentRecord {
  id: string;
  reservationId: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod | 'WALLET' | 'USSD' | 'BANK_TRANSFER';
  timestamp: number;
  status: 'SUCCESS' | 'FAILED' | 'VOIDED';
  reference: string;
}

export type WalletType = 'CASH' | 'PROMOTIONAL' | 'REFUND';

export type WalletTransactionType =
  | 'TOP_UP'
  | 'DEDUCTION'
  | 'LOCK'
  | 'RELEASE'
  | 'TRANSFER'
  | 'EXPIRY';

export interface WalletTransaction {
  id: string;
  customerId: string;
  walletType: WalletType;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string; // Order ID, Reservation ID, etc.
  referenceType?: 'ORDER' | 'RESERVATION' | 'ADJUSTMENT' | 'REFUND';
  notes?: string;
  staffId: string;
  staffName: string;
  timestamp: number;
}

export interface CustomerCreditConfig {
  isEnabled: boolean;
  creditLimit: number;
  dueDateDays: number;
  isPenaltyEnabled: boolean;
  penaltyRate?: number;
}

export interface Reservation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  partySize: number;
  tableId?: string;
  tableName?: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  totalDepositRequired: number;
  depositPaid: number;
  paymentDeadline?: number;
  notes?: string;
  locationId: string;
  createdAt: number;
  sendConfirmation: boolean;
  notificationStatus?: NotificationStatus;
  source: 'ONLINE' | 'INTERNAL';
  reference: string;
}

export type PrintLocation = 'KITCHEN' | 'BAR' | 'GRILL' | 'STORE';

export interface PrinterConfig {
  id: string;
  name: string;
  location: PrintLocation;
  enabled: boolean;
  ipAddress?: string; // For network printers
  connectionType: 'USB' | 'NETWORK' | 'BLUETOOTH';
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
  barcode?: string; // New field for scanning
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
  itemId: string; // materialId or productId
  type: 'RAW_MATERIAL' | 'PRODUCT';
  name: string; // materialName
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number; // Amount or Percentage, let's assume value for now or we add discountPercent
  taxRate?: number; // Percentage
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
  discountAmount?: number; // New field
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
  barcode?: string; // New field for scanning
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

export type PaymentMethod = 'CASH' | 'POS' | 'TRANSFER' | 'COMPLIMENTARY' | 'WALLET' | 'CREDIT';

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
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'scheduled' | 'hold' | 'served';
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
  notes?: string;

  // Printing tracking
  printedAt?: number;
  reprintCount?: number;
  syncStatus?: SyncStatus;
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'dirty';
export type TableShape = 'SQUARE' | 'ROUND' | 'RECTANGULAR';

export interface Table {
  id: string;
  number: string;
  status: TableStatus;
  capacity: number;
  shape: TableShape;
  roomId: string;
  floorId: string;
  x: number;
  y: number;
  rotation?: number;
  joinedWith?: string[];
  assignedStaffId?: string;
  locationId: string;
  isActive: boolean;
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  type: 'VIP' | 'REGULAR' | 'OUTDOOR' | 'BAR' | 'LOUNGE';
  pricingMultiplier: number; // e.g. 1.1 for +10%
  locationId: string;
  isActive: boolean;
  order: number;
}

export interface Floor {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
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
  creditBalance: number; // For backward compatibility / total of available wallets
  totalSpent: number;
  lastVisit?: number;
  wallets?: {
    cash: number;
    promotional: number;
    refund: number;
    locked: number;
  };
  creditConfig?: CustomerCreditConfig;
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


export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  managerId?: string;
  isMain?: boolean;
}

export interface TerminalConfig {
  id: string;
  name: string;
  warehouseId?: string; // Default warehouse for this terminal
  availablePrinters?: PrinterConfig[];
  defaultPrinterId?: string;
  printRoles?: PrintLocation[]; // Roles this terminal can print for
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

// Manufacturing Module Types
export interface RecipeIngredient {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  productId: string; // The finished product this recipe produces
  productName: string;
  yieldQuantity: number; // How many units this recipe produces
  yieldUnit: string;
  ingredients: RecipeIngredient[];
  laborCost?: number; // Additional labor cost per batch
  overheadCost?: number; // Overhead cost per batch
  totalCost: number; // Calculated total cost per batch
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type ProductionOrderStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  recipeId: string;
  recipeName: string;
  plannedQuantity: number;
  actualQuantity?: number;
  status: ProductionOrderStatus;
  startTime?: number;
  completionTime?: number;
  assignedTo?: string; // User ID
  assignedToName?: string;
  notes?: string;
  batchNumber?: string;
  qualityCheck?: {
    passed: boolean;
    checkedBy: string;
    checkedAt: number;
    notes?: string;
  };
  createdBy: string;
  createdAt: number;
  locationId: string;
}

export interface ManufacturingProcess {
  id: string;
  name: string;
  description?: string;
  steps: {
    stepNumber: number;
    name: string;
    description?: string;
    duration?: number; // in minutes
    requiresEquipment?: string;
  }[];
  recipes: string[]; // Recipe IDs that use this process
  createdBy: string;
  createdAt: number;
}
export type DeviceRole = 'WAITER' | 'CASHPOINT' | 'KDS' | 'ADMIN';

export interface Device {
  id: string;
  name: string;
  type: DeviceRole;
  status: 'PENDING' | 'APPROVED' | 'REVOKED';
  ip?: string;
  token?: string;
  lastSeen?: number;
  pairedAt?: number;
}

export interface PairingRequest {
  id: string;
  deviceName: string;
  deviceType: DeviceRole;
  ip: string;
  timestamp: number;
}
