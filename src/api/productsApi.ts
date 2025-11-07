import axios from 'axios';
import { Product } from '../types/product';
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();


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
