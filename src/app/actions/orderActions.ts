// src/app/actions/orderActions.ts
'use server';

import { adminDb } from '@/lib/firebase/admin';
import { findOrCreateCustomer, updateCustomerStats } from '@/lib/utils/customerUtils';
import { OrderItem } from '@/lib/types/order';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

interface CreateOrderInput {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      label?: string;
    };
  };
  items: OrderItem[];
  totalAmount: number;
}

export async function createOrder(input: CreateOrderInput) {
  try {
    // Find or create customer and get address ID
    const { customerId, addressId, isNewCustomer, isNewAddress } = 
      await findOrCreateCustomer(input.customer);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create order
    const order = {
      orderNumber,
      customerId,
      deliveryAddressId: addressId,
      items: input.items,
      totalAmount: input.totalAmount,
      currency: 'INR',
      status: 'PLACED',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const orderRef = await adminDb.collection('orders').add(order);

    // Update customer stats
    await updateCustomerStats(customerId, input.totalAmount);

    // Revalidate pages
    revalidatePath('/orders');
    revalidatePath('/customers');

    return {
      success: true,
      orderId: orderRef.id,
      orderNumber,
      customerId,
      addressId,
      isNewCustomer,
      isNewAddress,
      message: isNewCustomer 
        ? 'Order created with new customer'
        : isNewAddress
        ? 'Order created with new delivery address'
        : 'Order created successfully',
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}