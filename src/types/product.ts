
export interface Variant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  image: string;
  price: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: 'fashion' | 'electronics';
  description: string;
  images: string[]; // main product images
  price: number; // used only for non-variant products
  variants?: Variant[];
  featured?: boolean;
}

export interface CartItem {
  id: string; // variant ID or product ID
  productId: string;
  name: string;
  attributes?: {
    color?: string;
    size?: string;
    model?: string;
  };
  image: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  total: number;
  hash: string | null;
}

export interface ProductsState {
  items: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  category: 'all' | 'fashion' | 'electronics';
}
