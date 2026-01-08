export interface ShippedEmailData {
  customerName: string;
  orderNumber: string;
  trackingId: string;
  trackingUrl?: string;
  courierName?: string;
  productNames: string[];
}

export function generateShippedEmail(
  data: ShippedEmailData
): { subject: string; html: string } {

  const productsList = data.productNames
    .map(name => `<li>📦 ${name}</li>`)
    .join('');

  const trackingBlock = data.trackingUrl
    ? `<a href="${data.trackingUrl}" target="_blank">${data.trackingId}</a>`
    : data.trackingId;

  const courierLine = data.courierName
    ? `<p><strong>Courier:</strong> ${data.courierName}</p>`
    : '';

  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Order Shipped</title>
  </head>
  <body style="font-family:Arial, sans-serif; max-width:600px; margin:auto; color:#333;">

    <h2 style="text-align:center;">🚚 Your Order Has Shipped</h2>

    <p><strong>Order Number:</strong> #${data.orderNumber}</p>

    ${courierLine}

    <div style="background:#f3f3f3; padding:12px; margin:16px 0;">
      <strong>Tracking ID:</strong><br/>
      ${trackingBlock}
    </div>

    <p>Hi <strong>${data.customerName}</strong>,</p>

    <p>
      Good news! Your order has been shipped and is now on its way to you.
      You can track the shipment using the tracking ID above.
    </p>

    <ul>
      ${productsList}
    </ul>

    <div style="background:#eef7ff; padding:12px; margin-top:16px;">
      <strong>Delivery information:</strong>
      <ul style="margin:8px 0 0 16px;">
        <li>Delivery timelines depend on your location</li>
        <li>Please ensure someone is available to receive the parcel</li>
        <li>Contact us if you face any delivery issues</li>
      </ul>
    </div>

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
    subject: `Order Shipped – #${data.orderNumber}`,
    html,
  };
}

