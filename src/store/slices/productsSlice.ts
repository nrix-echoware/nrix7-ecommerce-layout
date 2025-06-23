import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Product, ProductsState } from '../../types/product';
import { fetchProducts } from '../../api/productsApi';

export const getProducts = createAsyncThunk<Product[]>(
  'products/getProducts',
  async () => {
    return await fetchProducts();
  }
);

const initialState: ProductsState = {
  items: [],
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
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.items = action.payload ?? []
        state.loading = false;
      })
      .addCase(getProducts.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setSelectedProduct, clearSelectedProduct, setCategory, setLoading } = productsSlice.actions;
export default productsSlice.reducer;
