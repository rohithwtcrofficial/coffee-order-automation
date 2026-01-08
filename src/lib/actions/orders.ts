// src/lib/actions/orders.ts
'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

interface UpdateOrderStatusResult {
  success: boolean;
  error?: string;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  trackingId: string | null
): Promise<UpdateOrderStatusResult> {
  try {
    // Validate inputs
    if (!orderId || !newStatus) {
      return {
        success: false,
        error: 'Order ID and status are required',
      };
    }

    const validStatuses = ['RECEIVED', 'ACCEPTED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(newStatus)) {
      return {
        success: false,
        error: 'Invalid status value',
      };
    }

    // Validate tracking ID for shipped status
    if (newStatus === 'SHIPPED' && !trackingId?.trim()) {
      return {
        success: false,
        error: 'Tracking ID is required for shipped orders',
      };
    }

    // Get the order to verify it exists
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    const orderData = orderDoc.data();

    // Prepare update data
    const updateData: any = {
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Add or update tracking ID
if (trackingId?.trim()) {
  updateData.trackingId = trackingId.trim();
}
// Note: Tracking ID is kept when status changes to DELIVERED
// It's only removed when changing to non-shipping statuses

    // Update the order in Firestore
    await orderRef.update(updateData);

    // TODO: Send email notification to customer
    // await sendOrderStatusEmail(orderData.customerId, orderId, newStatus, trackingId);

    // Revalidate the order detail page and orders list
    revalidatePath(`/orders/${orderId}`);
    revalidatePath('/orders');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order status',
    };
  }
}

// Optional: Function to send email notifications
async function sendOrderStatusEmail(
  customerId: string,
  orderId: string,
  status: string,
  trackingId?: string | null
): Promise<void> {
  try {
    // Get customer data
    const customerDoc = await adminDb.collection('customers').doc(customerId).get();
    if (!customerDoc.exists) {
      console.error('Customer not found for email notification');
      return;
    }

    const customer = customerDoc.data();
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    const order = orderDoc.data();

    // TODO: Implement email sending logic using your preferred service
    // (e.g., SendGrid, AWS SES, Resend, etc.)
    
    console.log('Email notification would be sent to:', customer?.email);
    console.log('Status:', status);
    console.log('Tracking ID:', trackingId);
    console.log('Order Number:', order?.orderNumber);

    // Example email content structure:
    const emailData = {
      to: customer?.email,
      subject: `Order #${order?.orderNumber} - Status Update: ${status}`,
      body: {
        customerName: customer?.name,
        orderNumber: order?.orderNumber,
        status: status,
        trackingId: trackingId || undefined,
        orderLink: `${process.env.NEXT_PUBLIC_BASE_URL}/orders/${orderId}`,
      },
    };

    // Send email here
    // await emailService.send(emailData);
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't throw error - email failure shouldn't break the status update
  }
}