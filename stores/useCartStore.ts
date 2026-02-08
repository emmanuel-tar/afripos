import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, Modifier } from '../types';

interface CartState {
    cart: CartItem[];
    activeOrderId: string | null;
    tableNumber: string | null;
    customerCount: number;
    discountPercent: number;
    customerId: string | null;

    // Session State
    sessions: Record<string, {
        cart: CartItem[];
        customerCount: number;
        discountPercent: number;
        customerId: string | null;
        activeOrderId: string | null;
    }>;
    currentSessionId: string;

    // Actions
    addToCart: (product: Product, modifiers?: Modifier[]) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, delta: number) => void;
    setTableNumber: (tableNumber: string | null) => void; // Switching table = switching session
    switchSession: (sessionId: string) => void;

    // Session-specific setters
    setActiveOrderId: (id: string | null) => void;
    setCustomerCount: (count: number) => void;
    setDiscountPercent: (percent: number) => void;
    setCustomerId: (id: string | null) => void;

    clearCart: () => void;
    clearSession: (sessionId: string) => void;
    voidItem: (cartId: string) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            // Global State
            tableNumber: null, // Derived from currentSessionId if it's a table, or standalone
            currentSessionId: 'default',

            // Session Storage
            sessions: {
                'default': {
                    cart: [],
                    customerCount: 1,
                    discountPercent: 0,
                    customerId: null,
                    activeOrderId: null
                }
            },

            // Getters for current session (helper, not exported in state but used internally)
            // We can't use internal helpers easily in object literal return, so we repeat the lookup logic or use strict getters.

            // Computed properties to maintain backward compatibility for components reading 'cart' directly?
            // Zustand doesn't support computed properties natively in the state object structure easily without middleware.
            // We will forego backward compatibility and require components to read `useCartStore(s => s.sessions[s.currentSessionId].cart)`?
            // NO, that requires refactoring ALL components. 
            // BETTER APPROACH: Keep `cart`, `customerCount` etc on root as "Current View", and `sessions` as storage.
            // When switching session, swap root state with session state.

            cart: [],
            activeOrderId: null,
            customerCount: 1,
            discountPercent: 0,
            customerId: null,

            addToCart: (product, modifiers = []) => {
                const { cart, currentSessionId, sessions } = get();
                const modKeyToAdd = modifiers.map(m => m.id).sort().join(',');

                // Logic to update local cart
                let updatedCart = [...cart];
                const existingIdx = updatedCart.findIndex(item =>
                    item.id === product.id &&
                    item.selectedModifiers?.map(m => m.id).sort().join(',') === modKeyToAdd &&
                    !item.isVoided
                );

                if (existingIdx > -1) {
                    updatedCart[existingIdx] = {
                        ...updatedCart[existingIdx],
                        quantity: updatedCart[existingIdx].quantity + 1
                    };
                } else {
                    const cartId = `ci-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    const newCartItem: CartItem = {
                        ...product,
                        cartId,
                        quantity: 1,
                        selectedModifiers: [...modifiers],
                        isVoided: false
                    };
                    updatedCart = [...updatedCart, newCartItem];
                }

                // Update root state AND session state
                set(state => ({
                    cart: updatedCart,
                    sessions: {
                        ...state.sessions,
                        [currentSessionId]: {
                            ...state.sessions[currentSessionId],
                            cart: updatedCart
                        }
                    }
                }));
            },

            removeFromCart: (cartId) => {
                const { cart, currentSessionId } = get();
                const updatedCart = cart.filter(item => item.cartId !== cartId);

                set(state => ({
                    cart: updatedCart,
                    sessions: {
                        ...state.sessions,
                        [currentSessionId]: {
                            ...state.sessions[currentSessionId],
                            cart: updatedCart
                        }
                    }
                }));
            },

            updateQuantity: (cartId, delta) => {
                const { cart, currentSessionId } = get();
                const existingIdx = cart.findIndex(item => item.cartId === cartId);

                if (existingIdx === -1) return;

                let updatedCart = [...cart];
                const newQuantity = updatedCart[existingIdx].quantity + delta;

                if (newQuantity <= 0) {
                    updatedCart = cart.filter(item => item.cartId !== cartId);
                } else {
                    updatedCart[existingIdx] = {
                        ...updatedCart[existingIdx],
                        quantity: newQuantity
                    };
                }

                set(state => ({
                    cart: updatedCart,
                    sessions: {
                        ...state.sessions,
                        [currentSessionId]: {
                            ...state.sessions[currentSessionId],
                            cart: updatedCart
                        }
                    }
                }));
            },

            voidItem: (cartId) => {
                const { cart, currentSessionId } = get();
                const updatedCart = cart.map(item => item.cartId === cartId ? { ...item, isVoided: true } : item);

                set(state => ({
                    cart: updatedCart,
                    sessions: {
                        ...state.sessions,
                        [currentSessionId]: {
                            ...state.sessions[currentSessionId],
                            cart: updatedCart
                        }
                    }
                }));
            },

            setTableNumber: (tableNumber) => {
                // When we set table number, we are effectively switching sessions IF the table number is new.
                // However, the existing app usage might be `setTableNumber` just to label the current order.
                // For "Table Service", `tableNumber` IS the session ID.

                if (!tableNumber) {
                    set({ tableNumber: null });
                    return;
                }

                get().switchSession(tableNumber);
            },

            switchSession: (sessionId) => {
                const state = get();
                const existingSession = state.sessions[sessionId];

                if (existingSession) {
                    // Restore session
                    set({
                        currentSessionId: sessionId,
                        tableNumber: sessionId === 'default' || sessionId === 'FAST' ? null : sessionId,
                        cart: existingSession.cart,
                        customerCount: existingSession.customerCount,
                        discountPercent: existingSession.discountPercent,
                        customerId: existingSession.customerId,
                        activeOrderId: existingSession.activeOrderId
                    });
                } else {
                    // Create new session
                    const newSession = {
                        cart: [],
                        customerCount: 1,
                        discountPercent: 0,
                        customerId: null,
                        activeOrderId: null
                    };

                    set({
                        currentSessionId: sessionId,
                        tableNumber: sessionId === 'default' || sessionId === 'FAST' ? null : sessionId,
                        sessions: {
                            ...state.sessions,
                            [sessionId]: newSession
                        },
                        // Reset root state to empty/new
                        cart: [],
                        customerCount: 1,
                        discountPercent: 0,
                        customerId: null,
                        activeOrderId: null
                    });
                }
            },

            setActiveOrderId: (activeOrderId) => set(state => ({
                activeOrderId,
                sessions: { ...state.sessions, [state.currentSessionId]: { ...state.sessions[state.currentSessionId], activeOrderId } }
            })),

            setCustomerCount: (customerCount) => set(state => ({
                customerCount,
                sessions: { ...state.sessions, [state.currentSessionId]: { ...state.sessions[state.currentSessionId], customerCount } }
            })),

            setDiscountPercent: (discountPercent) => set(state => ({
                discountPercent,
                sessions: { ...state.sessions, [state.currentSessionId]: { ...state.sessions[state.currentSessionId], discountPercent } }
            })),

            setCustomerId: (customerId) => set(state => ({
                customerId,
                sessions: { ...state.sessions, [state.currentSessionId]: { ...state.sessions[state.currentSessionId], customerId } }
            })),

            clearCart: () => set(state => ({
                cart: [],
                activeOrderId: null,
                customerCount: 1,
                discountPercent: 0,
                customerId: null,
                sessions: {
                    ...state.sessions,
                    [state.currentSessionId]: {
                        cart: [],
                        customerCount: 1,
                        discountPercent: 0,
                        customerId: null,
                        activeOrderId: null
                    }
                }
            })),

            clearSession: (sessionId) => set(state => {
                const newSessions = { ...state.sessions };
                delete newSessions[sessionId];
                return { sessions: newSessions };
            })
        }),
        {
            name: 'afripos-cart-storage',
            skipHydration: true,
        }
    )
);
