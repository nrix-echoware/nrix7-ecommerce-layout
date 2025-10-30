import { CartItem } from "../types/product";
import { TokenManager } from "./authApi";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:9997';

export interface CreateOrderItemReq {
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
}

export interface ShippingAddressReq {
  full_name: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
}

export interface CreateUserOrderReq {
  items: CreateOrderItemReq[];
  shipping: ShippingAddressReq;
  total: number;
}

export async function createUserOrder(payload: CreateUserOrderReq) {
  const token = TokenManager.getAccessToken();
  const res = await fetch(`${API_BASE}/user/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createUserOrder failed: ${res.status}`);
  return res.json() as Promise<{ id: string; backend_total: number }>; 
}

export async function getMyOrder(id: string) {
  const token = TokenManager.getAccessToken();
  const res = await fetch(`${API_BASE}/user/orders/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`getMyOrder failed: ${res.status}`);
  return res.json();
}

export async function listOrderStatusForUser(orderId: string) {
  const token = TokenManager.getAccessToken();
  const res = await fetch(`${API_BASE}/user/orders/${orderId}/status`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`listOrderStatusForUser failed: ${res.status}`);
  return res.json();
}

export async function listOrders(skip = 0, take = 10, adminKey?: string) {
  const res = await fetch(`${API_BASE}/orders?skip=${skip}&take=${take}`, {
    headers: adminKey ? { "X-Admin-API-Key": adminKey } : undefined,
  });
  if (!res.ok) throw new Error(`listOrders failed: ${res.status}`);
  return res.json();
}

export async function getOrder(id: string, adminKey?: string) {
  const res = await fetch(`${API_BASE}/orders/${id}`, {
    headers: adminKey ? { "X-Admin-API-Key": adminKey } : undefined,
  });
  if (!res.ok) throw new Error(`getOrder failed: ${res.status}`);
  return res.json();
}

export async function listMyOrders(skip = 0, take = 10) {
  const token = TokenManager.getAccessToken();
  const res = await fetch(`${API_BASE}/user/orders?skip=${skip}&take=${take}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`listMyOrders failed: ${res.status}`);
  return res.json();
}

export async function appendOrderStatus(orderId: string, status: string, reason?: string, adminKey?: string) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(adminKey ? { "X-Admin-API-Key": adminKey } : {}),
    },
    body: JSON.stringify({ new_status: status, reason }),
  });
  if (!res.ok) throw new Error(`appendOrderStatus failed: ${res.status}`);
  return res.json();
}

export async function listOrderStatus(orderId: string, adminKey?: string) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    headers: adminKey ? { "X-Admin-API-Key": adminKey } : undefined,
  });
  if (!res.ok) throw new Error(`listOrderStatus failed: ${res.status}`);
  return res.json();
}

export async function cancelMyOrder(orderId: string) {
  const token = TokenManager.getAccessToken();
  const res = await fetch(`${API_BASE}/user/orders/${orderId}/cancel`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`cancelMyOrder failed: ${res.status}`);
  return res.json();
}

export async function requestRefund(orderId: string) {
  const token = TokenManager.getAccessToken();
  const res = await fetch(`${API_BASE}/user/orders/${orderId}/refund`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`requestRefund failed: ${res.status}`);
  return res.json();
}

export function cartToOrderItems(cart: CartItem[]): CreateOrderItemReq[] {
  return cart.map((c) => ({
    product_id: c.productId || c.id,
    variant_id: c.productId && c.id && c.id !== c.productId ? c.id : undefined,
    quantity: c.quantity,
    price: Math.round(c.price), // Price in rupees as integer
  }));
}


