import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
    id: string; // Unique ID for cart item (e.g. pharmacyId + drugId)
    drugId: string;
    drugName: string;
    pharmacyName: string;
    pharmacyId: string;
    pharmacyAddress?: string;
    price: number;
    quantity: number;
    image?: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const items = get().items;
                const existingId = `${item.pharmacyId}-${item.drugName}`;
                const existingItem = items.find((i) => i.id === existingId);

                if (existingItem) {
                    set({
                        items: items.map((i) =>
                            i.id === existingId
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        ),
                    });
                } else {
                    set({
                        items: [...items, { ...item, id: existingId }],
                    });
                }
            },
            removeItem: (id) => {
                set({
                    items: get().items.filter((i) => i.id !== id),
                });
            },
            updateQuantity: (id, quantity) => {
                set({
                    items: get().items.map((i) =>
                        i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
                    ),
                });
            },
            clearCart: () => {
                set({ items: [] });
            },
            getTotal: () => {
                return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
            },
        }),
        {
            name: 'medifind-cart-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
