
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from '../../types/product';

const loadCartFromStorage = (): CartItem[] => {
  try {
    const cart = localStorage.getItem('ethereal-cart');
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem('ethereal-cart', JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const initialState: CartState = {
  items: loadCartFromStorage(),
  isOpen: false,
  total: calculateTotal(loadCartFromStorage()),
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
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  toggleCart, 
  closeCart 
} = cartSlice.actions;

export default cartSlice.reducer;
