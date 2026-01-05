// src/lib/types.ts
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  roastLevel: string;
  grams: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  imageUrl?: string; // Added this field
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  trackingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  roastLevel: string;
  description: string;
  availableGrams: number[];
  pricePerVariant: Record<number, number>;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = Order['status'];
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';