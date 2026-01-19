import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order, Modifier, PaymentMethod, Payment, Branch, User } from '../types';
import { CATEGORIES } from '../constants';
import { saveOrder, getActiveTableOrder, deleteOrder, getOrders } from '../services/db';
import { printKitchenOrder, printInvoice, printOrderSummary } from '../services/printService';
import { useCartStore } from '../stores/useCartStore';
import { useAppStore } from '../stores/useAppStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { toast } from 'sonner';

// Components
import { CategorySidebar } from '../components/pos/CategorySidebar';
import { ProductGrid } from '../components/pos/ProductGrid';
import { CartSidebar } from '../components/pos/CartSidebar';
import { ModifierModal } from '../components/pos/modals/ModifierModal';
import { CheckoutModal } from '../components/pos/modals/CheckoutModal';
import { TipModal } from '../components/pos/modals/TipModal';
import { CashTenderedModal } from '../components/pos/modals/CashTenderedModal';
import { SplitPaymentModal } from '../components/pos/modals/SplitPaymentModal';
import { PrintOptionsModal } from '../components/pos/modals/PrintOptionsModal';

interface MenuViewProps {
  tableNumber: string;
  onOrderComplete: () => void;
  onBack: () => void;
  user: User;
  branchSettings: Branch;
  initialCheckout?: boolean;
}

const MenuView: React.FC<MenuViewProps> = ({
  tableNumber,
  onOrderComplete,
  onBack,
  user,
  branchSettings,
  initialCheckout = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [modifierTarget, setModifierTarget] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(initialCheckout);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  // New modals state
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isCashTenderedOpen, setIsCashTenderedOpen] = useState(false);
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercent, setTipPercent] = useState(0);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  const {
    cart,
    activeOrderId,
    setActiveOrderId,
    addToCart,
    clearCart,
    setCustomerCount,
    setDiscountPercent,
    customerCount,
    discountPercent
  } = useCartStore();

  const isFastOrder = tableNumber === 'FAST';

  // Cleanup on mount/unmount and load order
  useEffect(() => {
    const loadExistingOrder = async () => {
      if (!isFastOrder) {
        const existing = await getActiveTableOrder(tableNumber);
        if (existing) {
          // If we found an existing order for this table, we could hydrate the cart here
          // For now, this just demonstrates the async call
          console.log('Found existing order for table:', tableNumber, existing);
        }
      }
    };
    loadExistingOrder();
  }, [tableNumber, isFastOrder]);

  const handleProductClick = (product: Product) => {
    if (product.availableModifiers && product.availableModifiers.length > 0) {
      setModifierTarget(product);
    } else {
      addToCart(product, []);
    }
  };

  const handleAddToCart = (product: Product, modifiers: Modifier[]) => {
    addToCart(product, modifiers);
    setModifierTarget(null);
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => {
      if (item.isVoided) return sum;
      const modsTotal = item.selectedModifiers?.reduce((s, m) => s + m.price, 0) || 0;
      return sum + ((item.price + modsTotal) * item.quantity);
    }, 0);
  };

  const calculateTotal = () => {
    const sub = getSubtotal();
    const disc = sub * (discountPercent / 100);
    const afterDisc = sub - disc;
    const vat = branchSettings.enableVat ? (afterDisc * (branchSettings.vatRate / 100)) : 0;
    const serviceCharge = branchSettings.enableServiceCharge ? (afterDisc * (branchSettings.serviceChargeRate / 100)) : 0;
    return afterDisc + vat + serviceCharge + tipAmount;
  };

  // Start checkout flow - opens tip modal first
  const handleStartCheckout = () => {
    setIsTipModalOpen(true);
  };

  // After tip selection, open payment method selection
  const handleTipSelected = (amount: number, percent: number) => {
    setTipAmount(amount);
    setTipPercent(percent);
    setIsTipModalOpen(false);
    setIsCheckoutOpen(true);
  };

  // After payment method selected
  const handlePaymentMethodSelected = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setIsCheckoutOpen(false);

    if (method === 'CASH') {
      setIsCashTenderedOpen(true);
    } else {
      // For non-cash, complete immediately
      completeCheckout(method);
    }
  };

  // Handle split payment option
  const handleSplitPayment = () => {
    setIsCheckoutOpen(false);
    setIsSplitPaymentOpen(true);
  };

  // Complete checkout with cash tendered
  const handleCashPayment = (tendered: number, change: number) => {
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      method: 'CASH',
      amount: calculateTotal(),
      timestamp: Date.now(),
      cashTendered: tendered,
      changeGiven: change
    };

    completeCheckoutWithPayments([payment]);
    setIsCashTenderedOpen(false);
  };

  // Complete checkout with split payments
  const handleSplitPaymentComplete = (payments: Payment[]) => {
    completeCheckoutWithPayments(payments);
    setIsSplitPaymentOpen(false);
  };

  // Complete checkout with single payment method (non-cash)
  const completeCheckout = (method: PaymentMethod) => {
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      method,
      amount: calculateTotal(),
      timestamp: Date.now()
    };

    completeCheckoutWithPayments([payment]);
  };

  // Final checkout completion with all payment data
  const completeCheckoutWithPayments = async (payments: Payment[]) => {
    const sub = getSubtotal();
    const disc = sub * (discountPercent / 100);
    const afterDisc = sub - disc;
    const vat = branchSettings.enableVat ? (afterDisc * (branchSettings.vatRate / 100)) : 0;
    const serviceCharge = branchSettings.enableServiceCharge ? (afterDisc * (branchSettings.serviceChargeRate / 100)) : 0;

    const newOrder: Order = {
      id: activeOrderId || `ORD-${Date.now()}`,
      tableNumber: isFastOrder ? undefined : tableNumber,
      items: [...cart],
      subtotal: sub,
      discount: discountPercent,
      customerCount,
      total: calculateTotal(),
      payments,
      paymentMethod: payments[0]?.method, // For backward compatibility
      timestamp: Date.now(),
      status: 'completed',
      locationId: branchSettings.id,
      cashierId: user.id,
      cashierName: user.name,
      tipAmount,
      tipPercent,
      vatAmount: vat,
      serviceChargeAmount: serviceCharge,
      printedAt: Date.now(),
      reprintCount: 0
    };

    await saveOrder(newOrder);

    // Deduct stock
    const allIngredients: { materialId: string, amount: number, unit: string }[] = [];
    cart.forEach(item => {
      if (item.ingredients && !item.isVoided) {
        item.ingredients.forEach(ing => {
          allIngredients.push({
            materialId: ing.materialId,
            unit: ing.unit,
            amount: ing.amount * item.quantity
          });
        });
      }
    });

    if (allIngredients.length > 0) {
      await useInventoryStore.getState().deductIngredients(
        allIngredients,
        newOrder.id,
        user.id,
        user.name
      );
    }

    setLastOrder(newOrder);
    clearCart();
    setTipAmount(0);
    setTipPercent(0);
    toast.success('Order completed successfully!');

    // Automatically print invoice after successful payment
    try {
      const printed = await printInvoice(newOrder, branchSettings);
      if (printed) {
        toast.success('Invoice printed successfully');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Failed to print invoice. You can reprint from order history.');
    }
  };

  const handleSendOrder = async (status: Order['status'] = 'preparing') => {
    // similar logic to handleCheckout but status pending/preparing
    const newOrder: Order = {
      id: activeOrderId || `ORD-${Date.now()}`,
      tableNumber,
      items: [...cart],
      subtotal: getSubtotal(),
      discount: discountPercent,
      customerCount,
      total: calculateTotal(),
      timestamp: Date.now(),
      status,
      locationId: branchSettings.id,
      cashierId: user.id,
      cashierName: user.name,
      printedAt: status === 'preparing' ? Date.now() : undefined,
      reprintCount: 0
    };
    await saveOrder(newOrder);
    setActiveOrderId(newOrder.id);

    if (status === 'preparing') {
      toast.success("Order Sent to Kitchen!");

      // Print kitchen order ticket
      try {
        const printed = await printKitchenOrder(newOrder, branchSettings);
        if (printed) {
          toast.success('Kitchen order printed successfully');
        }
      } catch (error) {
        console.error('Error printing kitchen order:', error);
        toast.error('Failed to print kitchen order');
      }
    }
  };

  // Handle print button click
  const handlePrintClick = async () => {
    if (activeOrderId) {
      const orders = await getOrders();
      const order = orders.find(o => o.id === activeOrderId);
      if (order) {
        setOrderToPrint(order);
        setIsPrintOptionsOpen(true);
      }
    }
  };

  // Handle reprint invoice
  const handleReprintInvoice = async () => {
    if (!orderToPrint) return;

    try {
      const updatedOrder = {
        ...orderToPrint,
        reprintCount: (orderToPrint.reprintCount || 0) + 1
      };
      await saveOrder(updatedOrder);

      const printed = await printInvoice(updatedOrder, branchSettings);
      if (printed) {
        toast.success('Invoice reprinted successfully');
        setIsPrintOptionsOpen(false);
      }
    } catch (error) {
      console.error('Error reprinting invoice:', error);
      toast.error('Failed to reprint invoice');
    }
  };

  // Handle reprint kitchen order
  const handleReprintKitchenOrder = async () => {
    if (!orderToPrint) return;

    try {
      const updatedOrder = {
        ...orderToPrint,
        reprintCount: (orderToPrint.reprintCount || 0) + 1
      };
      await saveOrder(updatedOrder);

      const printed = await printKitchenOrder(updatedOrder, branchSettings);
      if (printed) {
        toast.success('Kitchen order reprinted successfully');
        setIsPrintOptionsOpen(false);
      }
    } catch (error) {
      console.error('Error reprinting kitchen order:', error);
      toast.error('Failed to reprint kitchen order');
    }
  };

  // Handle print summary
  const handlePrintSummary = async () => {
    if (!orderToPrint) return;

    try {
      const printed = await printOrderSummary(orderToPrint, branchSettings);
      if (printed) {
        toast.success('Order summary printed successfully');
        setIsPrintOptionsOpen(false);
      }
    } catch (error) {
      console.error('Error printing summary:', error);
      toast.error('Failed to print order summary');
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white relative">
      <CategorySidebar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onBack={onBack}
      />

      <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">{branchSettings.name}</div>
            <h2 className="text-4xl font-black text-slate-800">{selectedCategory}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Guests:</span>
              <input type="number" min="1" value={customerCount} onChange={(e) => setCustomerCount(Number(e.target.value))} className="w-12 font-black text-indigo-600 text-center outline-none bg-transparent" />
            </div>
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl font-black text-sm flex items-center gap-3 uppercase tracking-widest">
              {isFastOrder ? '⚡ Quick Sell' : `🪑 Table ${tableNumber}`}
            </div>
          </div>
        </div>

        <ProductGrid
          selectedCategory={selectedCategory}
          currency={branchSettings.currency}
          onProductClick={handleProductClick}
        />
      </div>

      <CartSidebar
        branchSettings={branchSettings}
        onVoidOrder={() => { clearCart(); }} // Should ideally be deleteOrder logic
        onTransfer={() => setIsTransferModalOpen(true)}
        onSplit={() => toast.info("Split Bill Feature Coming Soon")}
        onDiscount={() => {
          const p = prompt("Enter discount %");
          if (p) setDiscountPercent(parseFloat(p));
        }}
        onHold={() => handleSendOrder('hold')}
        onFireKitchen={() => handleSendOrder('preparing')}
        onCheckout={() => handleStartCheckout()}
        onPrint={handlePrintClick}
        onItemTransfer={(item) => toast.info(`Transfer ${item.name}`)}
        isFastOrder={isFastOrder}
      />

      {/* Modals */}
      {modifierTarget && (
        <ModifierModal
          product={modifierTarget}
          onClose={() => setModifierTarget(null)}
          onAddToCart={handleAddToCart}
          currency={branchSettings.currency}
        />
      )}

      {/* Tip Modal - First step in checkout */}
      {isTipModalOpen && (
        <TipModal
          subtotal={getSubtotal()}
          currency={branchSettings.currency}
          onClose={() => setIsTipModalOpen(false)}
          onSelectTip={handleTipSelected}
        />
      )}

      {/* Payment Method Selection */}
      {isCheckoutOpen && (
        <CheckoutModal
          total={calculateTotal()}
          tableNumber={tableNumber}
          onClose={() => setIsCheckoutOpen(false)}
          onCheckout={handlePaymentMethodSelected}
          onSplitPayment={handleSplitPayment}
          currency={branchSettings.currency}
        />
      )}

      {/* Cash Tendered Modal */}
      {isCashTenderedOpen && (
        <CashTenderedModal
          total={calculateTotal()}
          currency={branchSettings.currency}
          onClose={() => setIsCashTenderedOpen(false)}
          onConfirm={handleCashPayment}
        />
      )}

      {/* Split Payment Modal */}
      {isSplitPaymentOpen && (
        <SplitPaymentModal
          total={calculateTotal()}
          currency={branchSettings.currency}
          onClose={() => setIsSplitPaymentOpen(false)}
          onComplete={handleSplitPaymentComplete}
        />
      )}

      {/* Print Options Modal */}
      {isPrintOptionsOpen && orderToPrint && (
        <PrintOptionsModal
          orderId={orderToPrint.id}
          reprintCount={orderToPrint.reprintCount}
          onClose={() => setIsPrintOptionsOpen(false)}
          onPrintInvoice={handleReprintInvoice}
          onPrintKitchenOrder={handleReprintKitchenOrder}
          onPrintSummary={handlePrintSummary}
        />
      )}

      {lastOrder && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[3rem] text-center">
            <h2 className="text-3xl font-black text-green-600 mb-4">Order Completed!</h2>
            <button onClick={onOrderComplete} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black">Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuView;
