import { CartLine, discountAmountFor, effectivePrice, MenuItem, Restaurant } from "@restaurant-app/shared";
import React, { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

interface CartContextValue {
  restaurant: Restaurant | null;
  lines: CartLine[];
  subtotal: number;
  discountAmount: number;
  itemCount: number;
  addItem: (restaurant: Restaurant, menuItem: MenuItem) => void;
  decrementItem: (menuItemId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: PropsWithChildren) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [lines, setLines] = useState<CartLine[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = lines.reduce((sum, l) => sum + effectivePrice(l.menuItem) * l.quantity, 0);
    const discountAmount = restaurant ? discountAmountFor(subtotal, restaurant.discountPercent) : 0;
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

    return {
      restaurant,
      lines,
      subtotal,
      discountAmount,
      itemCount,
      addItem(nextRestaurant, menuItem) {
        // A cart is scoped to a single restaurant (as on Zomato/Swiggy) — switching
        // restaurants starts a fresh cart instead of mixing items from two places.
        const isDifferentRestaurant = restaurant !== null && restaurant.id !== nextRestaurant.id;
        setRestaurant(nextRestaurant);
        if (isDifferentRestaurant) {
          setLines([{ menuItem, quantity: 1 }]);
          return;
        }
        setLines((current) => {
          const existing = current.find((l) => l.menuItem.id === menuItem.id);
          if (existing) {
            return current.map((l) =>
              l.menuItem.id === menuItem.id ? { ...l, quantity: l.quantity + 1 } : l
            );
          }
          return [...current, { menuItem, quantity: 1 }];
        });
      },
      decrementItem(menuItemId) {
        setLines((current) => {
          const next = current
            .map((l) => (l.menuItem.id === menuItemId ? { ...l, quantity: l.quantity - 1 } : l))
            .filter((l) => l.quantity > 0);
          if (next.length === 0) setRestaurant(null);
          return next;
        });
      },
      clear() {
        setLines([]);
        setRestaurant(null);
      },
    };
  }, [restaurant, lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
