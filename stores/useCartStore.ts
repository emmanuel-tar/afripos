import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, Modifier } from '../types';

interface CartState {
    cart: CartItem[];
    activeOrderId: string | null;
    tableNumber: string | null;
    customerCount: number;
    customerCount: number;
    discountPercent: number;
    customerId: string | null;

    // Actions
    addToCart: (product: Product, modifiers?: Modifier[]) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, delta: number) => void;
    setTableNumber: (tableNumber: string | null) => void;
    setActiveOrderId: (id: string | null) => void;
    setCustomerCount: (count: number) => void;
    setDiscountPercent: (percent: number) => void;
    setCustomerId: (id: string | null) => void;
    clearCart: () => void;
    voidItem: (cartId: string) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            cart: [],
            activeOrderId: null,
            tableNumber: null,
            customerCount: 1,
            discountPercent: 0,
            customerId: null,

            addToCart: (product, modifiers = []) => {
                const { cart } = get();
                const modKeyToAdd = modifiers.map(m => m.id).sort().join(',');

                const existingIdx = cart.findIndex(item =>
                    item.id === product.id &&
                    item.selectedModifiers?.map(m => m.id).sort().join(',') === modKeyToAdd &&
                    !item.isVoided
                );

                if (existingIdx > -1) {
                    const updatedCart = [...cart];
                    updatedCart[existingIdx] = {
                        ...updatedCart[existingIdx],
                        quantity: updatedCart[existingIdx].quantity + 1
                    };
                    set({ cart: updatedCart });
                } else {
                    const cartId = `ci-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    const newCartItem: CartItem = {
                        ...product,
                        cartId,
                        quantity: 1,
                        selectedModifiers: [...modifiers],
                        isVoided: false
                    };
                    set({ cart: [...cart, newCartItem] });
                }
            },

            removeFromCart: (cartId) => {
                const { cart } = get();
                set({ cart: cart.filter(item => item.cartId !== cartId) });
            },

            updateQuantity: (cartId, delta) => {
                const { cart } = get();
                const existingIdx = cart.findIndex(item => item.cartId === cartId);

                if (existingIdx === -1) return;

                const updatedCart = [...cart];
                const newQuantity = updatedCart[existingIdx].quantity + delta;

                if (newQuantity <= 0) {
                    set({ cart: cart.filter(item => item.cartId !== cartId) });
                } else {
                    updatedCart[existingIdx] = {
                        ...updatedCart[existingIdx],
                        quantity: newQuantity
                    };
                    set({ cart: updatedCart });
                }
            },

            voidItem: (cartId) => {
                const { cart } = get();
                set({ cart: cart.map(item => item.cartId === cartId ? { ...item, isVoided: true } : item) });
            },

            setTableNumber: (tableNumber) => set({ tableNumber }),
            setActiveOrderId: (activeOrderId) => set({ activeOrderId }),
            setCustomerCount: (customerCount) => set({ customerCount }),
            setDiscountPercent: (discountPercent) => set({ discountPercent }),
            setCustomerId: (customerId) => set({ customerId }),
            clearCart: () => set({ cart: [], activeOrderId: null, customerCount: 1, discountPercent: 0, tableNumber: null, customerId: null })
        }),
        {
            name: 'afripos-cart-storage',
            skipHydration: true, // We might want to manually hydrate or be careful with syncing
        }
    )
);
