import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { logger } from './utils/logger';
import { sendEmail } from './email/sender';

import { generateOrderConfirmationEmail } from './email/templates/orderConfirmation';
import { generateProcessingEmail } from './email/templates/processing';
import { generateShippedEmail } from './email/templates/shipped';
import { generateDeliveredEmail } from './email/templates/delivered';
import { generateCancelledEmail } from './email/templates/cancelled';

/**
 * 🔐 Global options (MANDATORY for secrets)
 */
setGlobalOptions({
  region: 'us-central1',
  secrets: ['EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM_NAME'],
});

/**
 * Initialize Admin SDK
 */
admin.initializeApp();
const db = admin.firestore();

/**
 * Types
 */
interface OrderData {
  customerId: string;
  orderNumber: string;
  status: string;
  trackingId?: string;
  totalAmount: number;
 items: Array<{
  productName: string;
  grams: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  category?: string;
  roastLevel?: string;
  imageUrl?: string;
}>;
  lastEmailSentStatus?: string;
}

interface CustomerData {
  name: string;
  email: string;
  address: any;
}

/**
 * 🆕 Order Created → Confirmation Email
 */
export const onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data() as OrderData | undefined;
    if (!order) return;

    try {
      const customerSnap = await db
        .collection('customers')
        .doc(order.customerId)
        .get();

      const customer = customerSnap.data() as CustomerData | undefined;
      if (!customer?.email) return;

      const template = generateOrderConfirmationEmail({
        customerName: customer.name,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        address: customer.address,
      });

      await sendEmail(customer.email, template.subject, template.html);

      await db.collection('emailLogs').add({
        orderId,
        emailType: 'ORDER_CONFIRMATION',
        recipientEmail: customer.email,
        status: 'success',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.success(`Order ${orderId}: Confirmation email sent`);
    } catch (err) {
      logger.error(`Order ${orderId}: Confirmation failed`, err);
    }
  }
);

/**
 * 🔄 Order Status Updated → Status Email
 */
export const onOrderStatusChange = onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    const orderId = event.params.orderId;

    const beforeRaw = event.data?.before.data() as OrderData;
    const afterRaw = event.data?.after.data() as OrderData;
    if (!beforeRaw || !afterRaw) return;

    // ✅ NORMALIZE STATUS (THIS FIXES EVERYTHING)
    const before: OrderData = {
      ...beforeRaw,
      status: beforeRaw.status?.toUpperCase(),
    };

    const after: OrderData = {
      ...afterRaw,
      status: afterRaw.status?.toUpperCase(),
    };

    // ✅ Safe comparison
    if (before.status === after.status) return;

    if (after.lastEmailSentStatus === after.status) return;

    try {
      const customerSnap = await db
        .collection('customers')
        .doc(after.customerId)
        .get();

      const customer = customerSnap.data() as CustomerData | undefined;
      if (!customer?.email) return;

      const productNames = after.items.map(i => i.productName);
      let template;

      switch (after.status) {
        case 'PROCESSING':
          template = generateProcessingEmail({
            customerName: customer.name,
            orderNumber: after.orderNumber,
            productNames,
          });
          break;

        case 'SHIPPED':
          template = generateShippedEmail({
            customerName: customer.name,
            orderNumber: after.orderNumber,
            trackingId: after.trackingId || 'Will be updated',
            productNames,
          });
          break;

        case 'DELIVERED':
          template = generateDeliveredEmail({
            customerName: customer.name,
            orderNumber: after.orderNumber,
            productNames,
          });
          break;

        case 'CANCELLED':
          template = generateCancelledEmail({
            customerName: customer.name,
            orderNumber: after.orderNumber,
            totalAmount: after.totalAmount,
          });
          break;

        default:
          return;
      }

      await sendEmail(customer.email, template.subject, template.html);

      await db.collection('orders').doc(orderId).update({
        lastEmailSentStatus: after.status,
      });

      await db.collection('emailLogs').add({
        orderId,
        emailType: `STATUS_${after.status}`,
        recipientEmail: customer.email,
        status: 'success',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.success(`Order ${orderId}: ${after.status} email sent`);
    } catch (err) {
      logger.error(`Order ${orderId}: Status email failed`, err);
    }
  }
);
