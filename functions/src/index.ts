import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { logger } from './utils/logger';
import { sendEmail } from './email/sender';
import { logEmailToFirestore } from './utils/emailLogger';

import { generateOrderReceivedEmail } from './email/templates/orderReceivedEmail';
import { generateOrderAcceptedEmail } from './email/templates/orderAcceptedEmail';
import { generateOrderPackedEmail } from './email/templates/orderPackedEmail';
import { generateShippedEmail } from './email/templates/orderShippedEmail';
import { generateDeliveredEmail } from './email/templates/orderDeliveredEmail';
import { generateCancelledEmail } from './email/templates/orderCancelledEmail';

/**
 * 🔐 Global options
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
 * Normalize order status
 */
function normalizeStatus(status?: string): string | null {
  if (!status) return null;

  const value = status.trim().toUpperCase();

  const map: Record<string, string> = {
    RECEIVED: 'ORDER_RECEIVED',
    ACCEPTED: 'ORDER_ACCEPTED',
    PACKED: 'ORDER_PACKED',
    SHIPPED: 'ORDER_SHIPPED',
    DELIVERED: 'ORDER_DELIVERED',
    CANCELLED: 'ORDER_CANCELLED',

    ORDER_RECEIVED: 'ORDER_RECEIVED',
    ORDER_ACCEPTED: 'ORDER_ACCEPTED',
    ORDER_PACKED: 'ORDER_PACKED',
    ORDER_SHIPPED: 'ORDER_SHIPPED',
    ORDER_DELIVERED: 'ORDER_DELIVERED',
    ORDER_CANCELLED: 'ORDER_CANCELLED',
  };

  return map[value] || value;
}

/**
 * 🆕 ORDER CREATED → ORDER_RECEIVED
 */
export const onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const orderId = event.params.orderId;
    const order = event.data?.data();
    if (!order) return;

    try {
      const customerSnap = await db
        .collection('customers')
        .doc(order.customerId)
        .get();

      const customer = customerSnap.data();
      if (!customer?.email) return;

      const featuredSnap = await db
        .collection('featured_products')
        .doc('homepage')
        .get();

      const featuredProducts =
        featuredSnap.exists && featuredSnap.data()?.active
          ? featuredSnap.data()?.products || []
          : [];

      // ✅ FIX: Pass db as second parameter
      const template = await generateOrderReceivedEmail({
  customerName: customer.name,
  orderNumber: order.orderNumber,
  items: order.items,
  totalAmount: order.totalAmount,
  address: order.deliveryAddress,
  featuredProducts,
}, db);  // ← Added db parameter here!

      await sendEmail(customer.email, template.subject, template.html);

      await db.collection('orders').doc(orderId).update({
        lastEmailSentStatus: 'ORDER_RECEIVED',
      });

      await logEmailToFirestore({
        orderId,
        emailType: 'ORDER_RECEIVED',
        recipientEmail: customer.email,
        status: 'success',
      });

      logger.success(`Order ${orderId}: ORDER_RECEIVED email sent`);
    } catch (err) {
      await logEmailToFirestore({
        orderId,
        emailType: 'ORDER_RECEIVED',
        recipientEmail: '',
        status: 'failed',
        error: err,
      });

      logger.error(`Order ${orderId}: ORDER_RECEIVED email failed`, err);
    }
  }
);

/**
 * 🔄 ORDER STATUS UPDATED
 */
export const onOrderStatusChange = onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    const orderId = event.params.orderId;
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const beforeStatus = normalizeStatus(before.status);
    const afterStatus = normalizeStatus(after.status);

    if (beforeStatus === afterStatus) return;
    if (after.lastEmailSentStatus === afterStatus) return;

    try {
      const customerSnap = await db
        .collection('customers')
        .doc(after.customerId)
        .get();

      const customer = customerSnap.data();
      if (!customer?.email) return;

      const productNames = after.items.map((i: any) => i.productName);
      let template;

      switch (afterStatus) {
        case 'ORDER_ACCEPTED':
          template = generateOrderAcceptedEmail({ customerName: customer.name, orderNumber: after.orderNumber, productNames });
          break;
        case 'ORDER_PACKED':
          template = generateOrderPackedEmail({ customerName: customer.name, orderNumber: after.orderNumber, productNames });
          break;
        case 'ORDER_SHIPPED':
          template = generateShippedEmail({ customerName: customer.name, orderNumber: after.orderNumber, trackingId: after.trackingId || 'Will be updated', productNames });
          break;
        case 'ORDER_DELIVERED':
          template = generateDeliveredEmail({ customerName: customer.name, orderNumber: after.orderNumber, productNames });
          break;
        case 'ORDER_CANCELLED':
          template = generateCancelledEmail({ customerName: customer.name, orderNumber: after.orderNumber, totalAmount: after.totalAmount });
          break;
        default:
          return;
      }

      await sendEmail(customer.email, template.subject, template.html);

      await db.collection('orders').doc(orderId).update({
        lastEmailSentStatus: afterStatus,
      });

      await logEmailToFirestore({
        orderId,
        emailType: afterStatus!,
        recipientEmail: customer.email,
        status: 'success',
      });

      logger.success(`Order ${orderId}: ${afterStatus} email sent`);
    } catch (err) {
      await logEmailToFirestore({
        orderId,
        emailType: afterStatus || 'UNKNOWN',
        recipientEmail: '',
        status: 'failed',
        error: err,
      });

      logger.error(`Order ${orderId}: ${afterStatus} email failed`, err);
    }
  }
);