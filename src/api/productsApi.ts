import axios from 'axios';
import { Product } from '../types/product';

 const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:9997'; // Change if your Go API runs elsewhere
//const API_BASE_URL = 'https://bfde-2402-e280-240b-1f-a274-cdd7-f79c-d9ba.ngrok-free.app'; // Change if your Go API runs elsewhere


export const fetchProducts = async (): Promise<Product[]> => {
  const response = await axios.get<Product[]>(`${API_BASE_URL}/products`);
  return response.data;
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await axios.get<Product>(`${API_BASE_URL}/products/${id}`);
  return response.data;
};

export const fetchProductsPaginated = async (skip = 0, take = 3): Promise<Product[]> => {
  const response = await axios.get<Product[]>(`${API_BASE_URL}/products?skip=${skip}&take=${take}`);
  return response.data;
};

export const fetchCartHash = async (): Promise<string> => {
  const response = await axios.get<{ hash: string }>(`${API_BASE_URL}/products/cart/hash`);
  return response.data.hash;
}; 
