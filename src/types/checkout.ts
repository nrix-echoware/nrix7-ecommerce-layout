
export interface CheckoutForm {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  zipCode: string;
  paymentMethod: 'upi' | 'cod';
  upiId?: string;
}

export interface OrderSummary {
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    attributes?: Record<string, string>;
  }[];
  subtotal: number;
  shipping: number;
  total: number;
}
