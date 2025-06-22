
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, ProductsState } from '../../types/product';
import { mockProducts } from '../../data/mockProducts';

const initialState: ProductsState = {
  items: mockProducts,
  selectedProduct: null,
  loading: false,
  category: 'all',
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedProduct: (state, action: PayloadAction<Product>) => {
      state.selectedProduct = action.payload;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    setCategory: (state, action: PayloadAction<'all' | 'fashion' | 'electronics'>) => {
      state.category = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setSelectedProduct, clearSelectedProduct, setCategory, setLoading } = productsSlice.actions;
export default productsSlice.reducer;
