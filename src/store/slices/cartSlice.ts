
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from '../../types/product';

const CART_STORAGE_KEY = 'ethereal-cart';
const CART_HASH_STORAGE_KEY = 'ethereal-cart-hash';

const loadCartFromStorage = (): CartItem[] => {
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const getStoredHash = (): string | null => {
  try {
    return localStorage.getItem(CART_HASH_STORAGE_KEY);
  } catch {
    return null;
  }
};

const saveHashToStorage = (hash: string) => {
  try {
    localStorage.setItem(CART_HASH_STORAGE_KEY, hash);
  } catch (error) {
    console.error('Failed to save hash to localStorage:', error);
  }
};

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const initialState: CartState = {
  items: loadCartFromStorage(),
  isOpen: false,
  total: calculateTotal(loadCartFromStorage()),
  hash: getStoredHash(),
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const newItem = action.payload;
      const existingItem = state.items.find(item => item.id === newItem.id);
      
      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        state.items.push(newItem);
      }
      
      state.total = calculateTotal(state.items);
      saveCartToStorage(state.items);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.total = calculateTotal(state.items);
      saveCartToStorage(state.items);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== id);
        } else {
          item.quantity = quantity;
        }
      }
      
      state.total = calculateTotal(state.items);
      saveCartToStorage(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      saveCartToStorage([]);
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeCart: (state) => {
      state.isOpen = false;
    },
    validateCartHash: (state, action: PayloadAction<string>) => {
      const currentHash = action.payload;
      
      // If cart is empty, just update the hash
      if (state.items.length === 0) {
        state.hash = currentHash;
        saveHashToStorage(currentHash);
        return;
      }
      
      // If stored hash doesn't match current hash, clear the cart
      if (state.hash !== currentHash) {
        console.log('Cart invalidated - product data has changed');
        state.items = [];
        state.total = 0;
        state.hash = currentHash;
        saveCartToStorage([]);
        saveHashToStorage(currentHash);
      }
    },
    setCartHash: (state, action: PayloadAction<string>) => {
      state.hash = action.payload;
      saveHashToStorage(action.payload);
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  toggleCart, 
  closeCart,
  validateCartHash,
  setCartHash
} = cartSlice.actions;

export default cartSlice.reducer;
