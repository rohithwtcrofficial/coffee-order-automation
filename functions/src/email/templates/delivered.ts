export interface DeliveredEmailData {
  customerName: string;
  orderNumber: string;
  productNames: string[];
}

export function generateDeliveredEmail(
  data: DeliveredEmailData
): { subject: string; html: string } {

  const productsList = data.productNames
    .map(name => `<li>📦 ${name}</li>`)
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Order Delivered</title>
</head>
<body style="font-family:Arial, sans-serif; max-width:600px; margin:auto; color:#333;">

  <h2 style="text-align:center;">✨ Order Delivered</h2>

  <p>Hi <strong>${data.customerName}</strong>,</p>

  <p>
    Your order <strong>#${data.orderNumber}</strong> has been delivered successfully.
    Thank you for choosing <strong>Western Terrain Coffee Roasters</strong>.
  </p>

  <div style="background:#f9f9f9; padding:14px; margin:16px 0;">
    <h4>Delivered Items:</h4>
    <ul>
      ${productsList}
    </ul>
  </div>

  <div style="background:#eef7ff; padding:14px; margin:16px 0;">
    <h4>☕ Storage & Usage Tips</h4>
    <ul>
      <li>Store coffee in an airtight container</li>
      <li>Keep away from direct sunlight and moisture</li>
      <li>Use a clean, dry spoon for best freshness</li>
    </ul>
  </div>

  <p>
    If you have any questions or need assistance, feel free to reach out to us.
    We’d also love to hear your feedback!
  </p>

  <hr style="margin:24px 0;" />

  <p style="text-align:center; font-size:12px; color:#777;">
    Need help? Contact us at <strong>westernterrains@gmail.com</strong><br/>
    © 2026 <strong>Western Terrain Coffee Roasters</strong><br/>
    <a href="https://westernterraincoffee.com" style="color:#777;">
      westernterraincoffee.com
    </a>
  </p>

</body>
</html>
  `;

  return {
    subject: `Order Delivered – #${data.orderNumber}`,
    html,
  };
}
