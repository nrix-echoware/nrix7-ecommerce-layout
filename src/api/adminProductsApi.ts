import axios from 'axios';
import { Product } from '../types/product';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9997';

function getAdminKey(): string | null {
  return sessionStorage.getItem('admin_api_key');
}

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const key = getAdminKey();
  if (key) {
    if (config.headers) {
      (config.headers as any)['X-Admin-API-Key'] = key;
    } else {
      config.headers = { 'X-Admin-API-Key': key } as any;
    }
  }
  return config;
});

export async function listProducts(skip = 0, take = 100): Promise<Product[]> {
  const { data } = await client.get<Product[]>(`/products?skip=${skip}&take=${take}`);
  return data;
}

export async function createProduct(payload: Product): Promise<string> {
  const { data } = await client.post<{ id: string }>(`/products`, normalizeProduct(payload));
  return data.id;
}

export async function updateProduct(id: string, payload: Product): Promise<string> {
  const { data } = await client.put<{ id: string }>(`/products/${id}`, normalizeProduct(payload));
  return data.id;
}

export async function deleteProduct(id: string): Promise<void> {
  await client.delete(`/products/${id}`);
}

// Backend expects variant attributes as array of {name,value}, and image as image_url
function normalizeProduct(p: Product) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    price: p.price,
    featured: !!p.featured,
    images: p.images,
    variants: (p.variants || []).map(v => ({
      id: v.id,
      sku: v.sku,
      attributes: Object.entries(v.attributes || {}).map(([name, value]) => ({ name, value })),
      image_url: v.image,
      price: v.price,
      in_stock: v.inStock,
    })),
  };
} 