export interface ProcessingEmailData {
  customerName: string;
  orderNumber: string;
  productNames: string[];
}

export function generateProcessingEmail(
  data: ProcessingEmailData
): { subject: string; html: string } {
  return {
    subject: `Your Coffee is Being Roasted - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 30px; }
          .product-list { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 30px; background: #f9fafb; color: #666; }
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
            
            <div class="product-list">
              <h3>Your Products:</h3>
              ${data.productNames.map(name => `<p style="margin: 8px 0;">☕ ${name}</p>`).join('')}
            </div>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0 0 10px 0;"><strong>Why fresh roasting matters:</strong></p>
              <p style="margin: 0;">We roast to order to ensure you receive the freshest, most flavorful coffee possible. Peak flavor occurs 2-14 days after roasting!</p>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2026 Western Terrain Coffee Roasters. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}