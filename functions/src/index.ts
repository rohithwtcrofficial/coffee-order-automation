// functions/src/index.ts
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { sendEmail } from './email/sender';
import { generateOrderConfirmationEmail } from './email/templates/orderConfirmation';
import { generateProcessingEmail } from './email/templates/processing';
import { generateShippedEmail } from './email/templates/shipped';
import { generateDeliveredEmail } from './email/templates/delivered';
import { generateCancelledEmail } from './email/templates/cancelled';

admin.initializeApp();
const db = admin.firestore();

/**
 * Order Created → Confirmation email
 */
export const onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const orderData = event.data?.data();
    if (!orderData) return;

    try {
      const customerDoc = await db
        .collection('customers')
        .doc(orderData.customerId)
        .get();

      const customerData = customerDoc.data();
      if (!customerData?.email) return;

      const template = generateOrderConfirmationEmail({
        customerName: customerData.name,
        orderNumber: orderData.orderNumber,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        address: customerData.address,
      });

      await sendEmail(customerData.email, template.subject, template.html);
    } catch (err) {
      console.error('onOrderCreated error:', err);
    }
  }
);

/**
 * Order Status Changed → Status email
 */
export const onOrderStatusChange = onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    if (before.status === after.status) return;

    try {
      const customerDoc = await db
        .collection('customers')
        .doc(after.customerId)
        .get();

      const customerData = customerDoc.data();
      if (!customerData?.email) return;

      const productNames = after.items.map((i: any) => i.productName);

      let template;
      switch (after.status) {
        case 'PROCESSING':
          template = generateProcessingEmail({
            customerName: customerData.name,
            orderNumber: after.orderNumber,
            productNames,
          });
          break;

        case 'SHIPPED':
          template = generateShippedEmail({
            customerName: customerData.name,
            orderNumber: after.orderNumber,
            trackingId: after.trackingId,
            productNames,
          });
          break;

        case 'DELIVERED':
          template = generateDeliveredEmail({
            customerName: customerData.name,
            orderNumber: after.orderNumber,
            productNames,
          });
          break;

        case 'CANCELLED':
          template = generateCancelledEmail({
            customerName: customerData.name,
            orderNumber: after.orderNumber,
            totalAmount: after.totalAmount,
          });
          break;

        default:
          return;
      }

      await sendEmail(customerData.email, template.subject, template.html);
    } catch (err) {
      console.error('onOrderStatusChange error:', err);
    }
  }
);
