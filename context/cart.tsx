import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── Types ───────────────────────────────────────────────────────────────
export type SelectedOption = {
  option_set_id: string;
  option_set_name: string;
  option_id: string;
  option_name: string;
};

export type SelectedModifier = {
  modifier_set_id: string;
  modifier_set_name: string;
  modifier_id: string;
  modifier_name: string;
  modifier_price: number;
};

export type CartItem = {
  item_id: string;
  /** Unique key for this cart line (item_id + selections hash) */
  cart_key: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  selectedOptions: SelectedOption[];
  selectedModifiers: SelectedModifier[];
};

type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (
    item: Omit<CartItem, "quantity" | "cart_key">,
    quantity?: number
  ) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = "@store_cart";

/** Build a unique key from item_id + sorted selections */
function buildCartKey(
  itemId: string,
  options: SelectedOption[],
  modifiers: SelectedModifier[]
): string {
  const optKey = options
    .map((o) => o.option_id)
    .sort()
    .join(",");
  const modKey = modifiers
    .map((m) => m.modifier_id)
    .sort()
    .join(",");
  return `${itemId}__${optKey}__${modKey}`;
}

const CartContext = createContext<CartContextType>({
  items: [],
  totalItems: 0,
  totalPrice: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
});

// ── Provider ────────────────────────────────────────────────────────────
export const CartProvider = ({ children }: PropsWithChildren) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from local storage on mount
  useEffect(() => {
    loadLocalCart();
  }, []);

  const loadLocalCart = async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  };

  const saveLocalCart = async (newItems: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (err) {
      console.error("Failed to save cart:", err);
    }
  };

  const addItem = useCallback(
    (
      item: Omit<CartItem, "quantity" | "cart_key">,
      quantity: number = 1
    ) => {
      const cartKey = buildCartKey(
        item.item_id,
        item.selectedOptions || [],
        item.selectedModifiers || []
      );

      setItems((prev) => {
        const existing = prev.find((i) => i.cart_key === cartKey);
        let updated: CartItem[];
        if (existing) {
          updated = prev.map((i) =>
            i.cart_key === cartKey
              ? { ...i, quantity: i.quantity + quantity }
              : i
          );
        } else {
          updated = [
            ...prev,
            {
              ...item,
              cart_key: cartKey,
              quantity,
              selectedOptions: item.selectedOptions || [],
              selectedModifiers: item.selectedModifiers || [],
            },
          ];
        }
        saveLocalCart(updated);
        return updated;
      });
    },
    []
  );

  const removeItem = useCallback((cartKey: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.cart_key !== cartKey);
      saveLocalCart(updated);
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartKey);
      return;
    }
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.cart_key === cartKey ? { ...i, quantity } : i
      );
      saveLocalCart(updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveLocalCart([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const modifiersExtra = (i.selectedModifiers || []).reduce(
      (ms, m) => ms + (m.modifier_price || 0),
      0
    );
    return sum + (i.price + modifiersExtra) * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
