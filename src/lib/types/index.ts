// src/lib/types/index.ts

export type OrderStatus = 
  | 'PLACED' 
  | 'PROCESSING' 
  | 'PACKED' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type RoastLevel = 
  | 'LIGHT' 
  | 'MEDIUM' 
  | 'MEDIUM_DARK' 
  | 'DARK';

export type ProductCategory =
  | 'COFFEE_BEANS'
  | 'FILTER_COFFEE'
  | 'INSTANT_COFFEE'
  | 'TEA';

// Admin
export interface Admin {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  name: string;
  createdAt: Date;
}

// Product
export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  roastLevel: RoastLevel;
  availableGrams: number[]; // [250, 500, 1000]
  pricePerVariant: Record<number, number>; // { 250: 12, 500: 22, 1000: 40 }
  description: string;
  isActive: boolean;
  stockQuantity: number;
  imageUrl?: string;
  tastingNotes?: string[];
  origin?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Customer
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
}

// Order Item
export interface OrderItem {
  productId: string;
  productName: string;
  grams: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  category?: string;
  roastLevel?: string;
}

// Order
export interface Order {
  id: string;
  orderNumber: string; // ORD-2024-001234
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  trackingId?: string;
  lastEmailSentStatus?: OrderStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin ID
}

// Email Log
export interface EmailLog {
  id: string;
  orderId: string;
  emailType: string;
  recipientEmail: string;
  status: 'success' | 'failed';
  error?: string;
  metadata: {
    orderNumber: string;
    customerName: string;
    items: string[];
  };
  sentAt: Date;
}