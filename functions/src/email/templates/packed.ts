// orderPackedEmail.ts

export interface OrderPackedEmailData {
  customerName: string;
  orderNumber: string;
  productNames: string[];
}

export function generateOrderPackedEmail(
  data: OrderPackedEmailData
): { subject: string; html: string } {
  return {
    subject: `Your Order is Packed – #${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Order Packed</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: Arial, sans-serif;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      margin-top: 0;
    }
    .product-list {
      background-color: #eef2ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .info-box {
      background-color: #eef2ff;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #6366f1;
    }
    .footer {
      padding: 30px;
      text-align: center;
      background-color: #f9fafb;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">

    <div class="header">
      <h1>📦 Order Packed</h1>
      <p>Order ##${data.orderNumber} is ready for dispatch</p>
    </div>

    <div class="content">
      <h2>Hi ${data.customerName},</h2>

      <p>
        Good news! Your order has been <strong>packed securely</strong>
        and is now ready to be shipped.
      </p>

      <div class="product-list">
        <h3>Packed Items:</h3>
        ${data.productNames
          .map(
            (name) => `<p style="margin: 8px 0;">☕ ${name}</p>`
          )
          .join('')}
      </div>

      <div class="info-box">
        <p style="margin: 0 0 10px 0;">
          <strong>What happens next?</strong>
        </p>
        <ul style="margin: 0; padding-left: 18px;">
          <li>Your parcel will be handed over to our delivery partner</li>
          <li>Tracking details will be shared once shipped</li>
          <li>Delivery timelines depend on your location</li>
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>
        Need help? Contact us at
        <strong>westernterrains@gmail.com</strong>
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
