
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'fashion' | 'electronics';
  image: string;
  description: string;
  featured: boolean;
}

interface ProductsState {
  items: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  category: 'all' | 'fashion' | 'electronics';
}

// Mock products data
const mockProducts: Product[] = Array.from({ length: 100 }, (_, i) => {
  const categories = ['fashion', 'electronics'] as const;
  const category = categories[i % 2];
  
  return {
    id: `product-${i + 1}`,
    name: category === 'fashion' 
      ? `Minimal ${['Shirt', 'Dress', 'Jacket', 'Pants', 'Sweater'][i % 5]}` 
      : `Tech ${['Phone', 'Laptop', 'Watch', 'Headphones', 'Speaker'][i % 5]}`,
    price: Math.floor(Math.random() * 500) + 50,
    category,
    image: `https://picsum.photos/400/500?random=${i + 1}`,
    description: `Beautifully crafted ${category} item with attention to detail and minimal aesthetic.`,
    featured: i < 6,
  };
});

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
