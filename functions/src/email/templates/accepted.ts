export interface OrderAcceptedEmailData {
  customerName: string;
  orderNumber: string;
  productNames: string[];
}

export function generateOrderAcceptedEmail(
  data: OrderAcceptedEmailData
): { subject: string; html: string } {
  return {
    subject: `Order Accepted – #${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .product-list {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding: 30px;
            background: #f9fafb;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">

          <div class="header">
            <h1>✅ Order Accepted</h1>
            <p>Order ##${data.orderNumber} has been confirmed</p>
          </div>

          <div class="content">
            <h2>Hi ${data.customerName},</h2>

            <p>
              Great news! Your order has been successfully accepted.
              Our team will now pack your items securely and prepare them for dispatch.
            </p>

            <div class="product-list">
              <h3>Your Order Includes:</h3>
              ${data.productNames
                .map(
                  (name) =>
                    `<p style="margin: 8px 0;">☕ ${name}</p>`
                )
                .join('')}
            </div>

            <div style="
              background: #ecfdf5;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #10b981;
            ">
              <p style="margin: 0 0 10px 0;">
                <strong>What happens next?</strong>
              </p>
              <ul style="margin: 0; padding-left: 18px;">
                <li>Your order will be packed</li>
                <li>It will be handed over to our delivery partner</li>
                <li>You’ll receive tracking details once shipped</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>
              Need help? Reach us at <strong>westernterrains@gmail.com</strong>
            </p>
            <p>
              © 2026 <strong>Western Terrain Coffee Roasters</strong>. All rights reserved.
            </p>
          </div>

        </div>
      </body>
      </html>
    `,
  };
}
