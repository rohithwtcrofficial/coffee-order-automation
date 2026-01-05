// src/lib/actions/orders.ts
'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    // Validate status
    const validStatuses = ['PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: 'Invalid status value',
      };
    }

    // Get the order document
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // Update the order status
    await orderRef.update({
      status: newStatus,
      updatedAt: new Date(),
      [`statusHistory.${newStatus}`]: new Date(), // Track when each status was set
    });

    // Revalidate the orders pages to show updated data
    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);

    return {
      success: true,
      message: `Order status updated to ${newStatus}`,
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: 'Failed to update order status. Please try again.',
    };
  }
}