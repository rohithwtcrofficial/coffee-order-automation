// src/lib/types/order.ts

/* -------------------- ADDRESS -------------------- */
export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  label?: string;
  createdAt: Date | string;
}

/* -------------------- CUSTOMER -------------------- */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  totalOrders: number;
  totalSpent: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/* -------------------- ORDER ITEM -------------------- */
export interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  roastLevel: string;
  grams: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

/* -------------------- ORDER -------------------- */
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  deliveryAddressId: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status:
    | 'RECEIVED'
    | 'ACCEPTED'
    | 'PACKED'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED';
  trackingId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/* -------------------- PRODUCT DESCRIPTION (STRUCTURED) -------------------- */
export interface DescriptionPoint {
  label: string;   // e.g. "Bean", "Roast", "Body"
  value: string;   // e.g. "100% Arabica, single origin"
}

export interface DescriptionSection {
  id: string;
  title: string;               // e.g. "Key Details", "Taste Profile"
  points: DescriptionPoint[];  // structured specs
}

/* -------------------- PRODUCT -------------------- */
export interface Product {
  id: string;
  name: string;
  category: string;
  roastLevel: string;

  /**
   * Legacy description (string)
   * Keep for backward compatibility
   */
  description?: string;

  /**
   * New structured description
   * Used by new & edit product pages
   */
  descriptionSections?: DescriptionSection[] | null;

  availableGrams: number[];
  pricePerVariant: Record<number, number>;
  imageUrl?: string;
  isActive: boolean;

  createdAt: Date | string;
  updatedAt: Date | string;
}

/* -------------------- UTILITY TYPES -------------------- */
export type OrderStatus = Order['status'];

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
