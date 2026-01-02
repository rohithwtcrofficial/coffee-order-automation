// functions/src/index.ts
import * as functions from 'firebase-functions';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { defineString } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

// Modern params configuration (replaces functions.config())
const emailUser = defineString('EMAIL_USER', {
  description: 'Gmail address for sending emails',
  default: '',
});

const emailPassword = defineString('EMAIL_PASSWORD', {
  description: 'Gmail App Password (16 characters)',
  default: '',
});

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser.value(),
      pass: emailPassword.value(),
    },
  });
};

// Email Templates
const emailTemplates = {
  orderPlaced: (data: any) => ({
    subject: `Order Confirmation - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .order-item { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #7c3aed; }
          .total { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: right; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Order Confirmed!</h1>
            <p>Thank you for your order, ${data.customerName}</p>
            <p style="font-size: 18px; margin-top: 15px;">Order #${data.orderNumber}</p>
          </div>
          
          <div class="content">
            <h2>Your Order</h2>
            ${data.items.map((item: any) => `
              <div class="order-item">
                <strong>${item.productName}</strong>
                <p style="margin: 5px 0; color: #666;">${item.category} • ${item.roastLevel} Roast</p>
                <p style="margin: 5px 0;">Size: ${item.grams}g × Quantity: ${item.quantity}</p>
                <p style="margin: 5px 0; font-weight: bold;">₹${item.subtotal.toFixed(2)}</p>
              </div>
            `).join('')}
            
            <div class="total">
              <h3 style="margin: 0;">Total: ₹${data.totalAmount.toFixed(2)}</h3>
            </div>
            
            <h3>Shipping Address</h3>
            <p>
              ${data.customerName}<br>
              ${data.address.street}<br>
              ${data.address.city}, ${data.address.state} ${data.address.postalCode}<br>
              ${data.address.country}
            </p>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <strong>☕ What's Next?</strong>
              <p>We're roasting your beans fresh! You'll receive another email when your order ships with tracking information.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>Questions? Reply to this email or contact us</p>
            <p>© 2026 Western Terrain Coffee Roasters. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  processing: (data: any) => ({
    subject: `Your Coffee is Being Roasted - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔥 Your Coffee is Roasting!</h1>
            <p>Order #${data.orderNumber} is now being processed</p>
          </div>
          
          <div class="content">
            <h2>Hi ${data.customerName},</h2>
            <p>Great news! We've started roasting your coffee beans to perfection.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Products:</h3>
              ${data.productNames.map((name: string) => `<p>☕ ${name}</p>`).join('')}
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px;">
              <strong>Why fresh roasting matters:</strong>
              <p>We roast to order to ensure you receive the freshest, most flavorful coffee possible. Peak flavor occurs 2-14 days after roasting!</p>
            </div>
            
            <p>We'll send you another update once your order ships with tracking information.</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Western Terrain Coffee Roasters. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  shipped: (data: any) => ({
    subject: `Your Order Has Shipped - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .tracking { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚚 Your Order Has Shipped!</h1>
            <p>Order #${data.orderNumber} is on its way</p>
          </div>
          
          <div class="content">
            <h2>Hi ${data.customerName},</h2>
            <p>Exciting news! Your freshly roasted coffee is on its way to you.</p>
            
            <div class="tracking">
              <h3>Tracking Number</h3>
              <p style="font-size: 24px; font-weight: bold; color: #3b82f6; margin: 10px 0;">${data.trackingId || 'Will be updated soon'}</p>
              ${data.trackingId ? '<a href="#" class="btn">Track Your Package</a>' : ''}
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Your Products:</h3>
              ${data.productNames.map((name: string) => `<p>📦 ${name}</p>`).join('')}
            </div>
            
            <div style="background: #dbeafe; padding: 20px; border-radius: 8px;">
              <strong>💡 Brewing Tip:</strong>
              <p>Let your coffee rest for 24-48 hours after delivery for optimal flavor development. Store in an airtight container away from light and heat.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2026 Western Terrain Coffee Roasters. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  delivered: (data: any) => ({
    subject: `Delivered! Enjoy Your Coffee - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Delivered!</h1>
            <p>Enjoy your fresh coffee</p>
          </div>
          
          <div class="content">
            <h2>Hi ${data.customerName},</h2>
            <p>Your order #${data.orderNumber} has been delivered! We hope you're excited to brew your freshly roasted coffee.</p>
            
            <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>☕ Perfect Brewing Guide</h3>
              <ul>
                <li><strong>Ratio:</strong> 1:16 (1g coffee to 16g water)</li>
                <li><strong>Temperature:</strong> 195-205°F (90-96°C)</li>
                <li><strong>Grind:</strong> Medium for drip, fine for espresso</li>
                <li><strong>Freshness:</strong> Use within 2-4 weeks for best flavor</li>
              </ul>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              We'd love to hear what you think! Share your brewing experience with us.
            </p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Western Terrain Coffee Roasters!</p>
            <p>© 2026 Western Terrain Coffee Roasters. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  cancelled: (data: any) => ({
    subject: `Order Cancelled - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Order Cancelled</h1>
            <p>Order #${data.orderNumber}</p>
          </div>
          
          <div class="content">
            <h2>Hi ${data.customerName},</h2>
            <p>Your order #${data.orderNumber} has been cancelled as requested.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Refund Amount</h3>
              <p style="font-size: 24px; font-weight: bold; color: #6b7280;">₹${data.totalAmount.toFixed(2)}</p>
              <p style="color: #666;">Your refund will be processed within 5-7 business days to your original payment method.</p>
            </div>
            
            <p>We're sorry to see you go. If there was an issue with your order, please let us know so we can improve!</p>
          </div>
          
          <div class="footer">
            <p>© 2026 Western Terrain Coffee Roasters. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send Email Function
async function sendOrderEmail(
  to: string,
  template: { subject: string; html: string }
) {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"Western Terrain Coffee Roasters" <${emailUser.value()}>`,
      to,
      subject: template.subject,
      html: template.html,
    });
    
    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Cloud Function v2: Order Creation Trigger
export const onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const orderData = event.data?.data();
    
    if (!orderData) {
      console.error('No order data found');
      return;
    }
    
    try {
      // Get customer details
      const customerDoc = await db.collection('customers').doc(orderData.customerId).get();
      const customerData = customerDoc.data();
      
      if (!customerData?.email) {
        console.error('No customer email found');
        return;
      }
      
      // Prepare email data
      const emailData = {
        customerName: customerData.name,
        orderNumber: orderData.orderNumber,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        address: customerData.address,
      };
      
      // Send order confirmation email
      await sendOrderEmail(
        customerData.email,
        emailTemplates.orderPlaced(emailData)
      );
      
      console.log('Order confirmation email sent for:', orderData.orderNumber);
    } catch (error) {
      console.error('Error in onOrderCreated:', error);
    }
  }
);

// Cloud Function v2: Order Status Update Trigger
export const onOrderStatusChange = onDocumentUpdated(
  'orders/{orderId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    
    if (!before || !after) {
      console.error('Missing before/after data');
      return;
    }
    
    // Only send email if status changed
    if (before.status === after.status) {
      return;
    }
    
    try {
      // Get customer details
      const customerDoc = await db.collection('customers').doc(after.customerId).get();
      const customerData = customerDoc.data();
      
      if (!customerData?.email) {
        console.error('No customer email found');
        return;
      }
      
      const emailData = {
        customerName: customerData.name,
        orderNumber: after.orderNumber,
        productNames: after.items.map((item: any) => item.productName),
        trackingId: after.trackingId || '',
        totalAmount: after.totalAmount,
      };
      
      // Send appropriate email based on new status
      let template;
      switch (after.status) {
        case 'PROCESSING':
          template = emailTemplates.processing(emailData);
          break;
        case 'SHIPPED':
          template = emailTemplates.shipped(emailData);
          break;
        case 'DELIVERED':
          template = emailTemplates.delivered(emailData);
          break;
        case 'CANCELLED':
          template = emailTemplates.cancelled(emailData);
          break;
        default:
          return; // No email for other statuses
      }
      
      await sendOrderEmail(customerData.email, template);
      
      console.log(`${after.status} email sent for order:`, after.orderNumber);
    } catch (error) {
      console.error('Error in onOrderStatusChange:', error);
    }
  }
);