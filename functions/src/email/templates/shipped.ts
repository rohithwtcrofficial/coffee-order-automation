interface ShippedEmailData {
  customerName: string;
  orderNumber: string;
  trackingId: string;
  productNames: string[];
}

export function generateShippedEmail(data: ShippedEmailData) {
  const productsList = data.productNames
    .map(name => `<li>📦 ${name}</li>`)
    .join('');

  const html = `
  <div style="font-family:Arial, sans-serif; max-width:600px; margin:auto;">
    <h2>🚚 Your Order Has Shipped!</h2>

    <p><strong>Order Number:</strong> ${data.orderNumber}</p>

    <div style="background:#f3f3f3; padding:12px; margin:16px 0;">
      <strong>Tracking ID:</strong><br/>
      ${data.trackingId}
    </div>

    <p>Hi <strong>${data.customerName}</strong>,</p>

    <p>Your freshly roasted coffee is on its way:</p>

    <ul>
      ${productsList}
    </ul>

    <p style="background:#eef7ff; padding:12px;">
      ☕ <strong>Brewing tip:</strong><br/>
      Let your coffee rest for 24–48 hours after delivery for best flavour.
    </p>

    <hr/>
    <p style="text-align:center; font-size:12px;">
      © 2026 <strong>Western Terrain Coffee Roasters</strong><br/>
      <a href="https://westernterraincoffee.com/">westernterraincoffee.com</a>
    </p>
  </div>
  `;

  return {
    subject: `Order Shipped – ${data.orderNumber}`,
    html,
  };
}
