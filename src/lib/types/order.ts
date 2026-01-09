// src/lib/types/order.ts
export interface Address {
  id: string; // Add unique ID for each address
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean; // Mark primary/default address
  label?: string; // Optional label like "Home", "Office", etc.
  createdAt: Date | string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[]; // Changed from single address to array
  totalOrders: number;
  totalSpent: number;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  // imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  deliveryAddressId: string; // Reference to which address was used
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: 'RECEIVED' | 'ACCEPTED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  trackingId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type OrderStatus = Order['status'];
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';