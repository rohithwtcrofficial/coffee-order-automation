export interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  items: Array<{
    productName: string;
    category: string;
    roastLevel: string;
    grams: number;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
    imageUrl?: string;
  }>;
  totalAmount: number;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export function generateOrderConfirmationEmail(
  data: OrderConfirmationData
): { subject: string; html: string } {
  return {
    subject: `Order Confirmation - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
          }
          .header { 
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 32px;
          }
          .header p {
            margin: 5px 0;
            font-size: 16px;
            opacity: 0.95;
          }
          .content { 
            padding: 30px;
          }
          .order-item { 
            background: #f9fafb;
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 8px;
            border-left: 4px solid #7c3aed;
          }
          .order-item strong {
            display: block;
            font-size: 16px;
            margin-bottom: 8px;
          }
          .order-item p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
          .total { 
            background: #f3e8ff;
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 8px;
            text-align: right;
          }
          .total h3 {
            margin: 0;
            color: #7c3aed;
            font-size: 24px;
          }
          .address-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .info-box {
            background: #eff6ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer { 
            text-align: center; 
            padding: 30px 20px;
            background: #f9fafb;
            color: #666;
            font-size: 14px;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Order Confirmed!</h1>
            <p>Thank you for your order, ${data.customerName}</p>
            <p style="font-size: 18px; margin-top: 15px; font-weight: 600;">
              Order #${data.orderNumber}
            </p>
          </div>
          
          <div class="content">
            <h2 style="color: #111827; margin-bottom: 20px;">Your Order</h2>
            ${data.items.map(item => `
              <div class="order-item">
                <strong>${item.productName}</strong>
                <p>${item.category} • ${item.roastLevel} Roast</p>
                <p>Size: ${item.grams}g × Quantity: ${item.quantity}</p>
                <p style="font-weight: 600; color: #111827;">₹${item.subtotal.toFixed(2)}</p>
              </div>
            `).join('')}
            
            <div class="total">
              <h3>Total: ₹${data.totalAmount.toFixed(2)}</h3>
            </div>
            
            <h3 style="color: #111827; margin: 30px 0 15px;">Shipping Address</h3>
            <div class="address-box">
              <p style="margin: 5px 0; color: #111827;">
                <strong>${data.customerName}</strong><br>
                ${data.address.street}<br>
                ${data.address.city}, ${data.address.state} ${data.address.postalCode}<br>
                ${data.address.country}
              </p>
            </div>
            
            <div class="info-box">
              <p style="margin: 0 0 10px 0;"><strong>☕ What's Next?</strong></p>
              <p style="margin: 0; color: #374151;">
                We're roasting your beans fresh! You'll receive another email when your order ships with tracking information.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>Questions? Reply to this email or contact us at support@coffeebrands.com</p>
            <p style="margin-top: 15px;">© 2024 Coffee Brands. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}