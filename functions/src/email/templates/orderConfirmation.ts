interface OrderItem {
  productName: string;
  grams: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  category?: string;
  roastLevel?: string;
  imageUrl?: string;
}

interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export function generateOrderConfirmationEmail(data: OrderConfirmationData) {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px;">
          <strong>${item.productName}</strong><br/>
          <small>${item.category ?? ''} ${item.roastLevel ? `• ${item.roastLevel} Roast` : ''}</small>
        </td>
        <td style="padding:10px; text-align:center;">${item.grams}g</td>
        <td style="padding:10px; text-align:center;">${item.quantity}</td>
        <td style="padding:10px; text-align:right;">₹${item.subtotal.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const html = `
  <div style="font-family:Arial, sans-serif; max-width:600px; margin:auto;">
    <h2 style="text-align:center;">☕ Order Confirmed!</h2>
    <p>Thank you for your order, <strong>${data.customerName}</strong></p>

    <p><strong>Order Number:</strong> ${data.orderNumber}</p>

    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <thead>
        <tr style="background:#f3f3f3;">
          <th align="left">Product</th>
          <th>Size</th>
          <th>Qty</th>
          <th align="right">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr>
          <td colspan="3" align="right" style="padding:10px;"><strong>Total</strong></td>
          <td align="right" style="padding:10px;"><strong>₹${data.totalAmount.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>

    <h3>📦 Shipping Address</h3>
    <p>
      ${data.customerName}<br/>
      ${data.address.street}<br/>
      ${data.address.city}, ${data.address.state} ${data.address.postalCode}<br/>
      ${data.address.country}
    </p>

    <p style="background:#f9f9f9; padding:12px;">
      ☕ <strong>What's next?</strong><br/>
      We roast your coffee fresh and ship it quickly. You’ll receive another email once your order is shipped.
    </p>

    <hr/>
    <p style="text-align:center; font-size:12px;">
      © 2026 <strong>Western Terrain Coffee Roasters</strong><br/>
      <a href="https://westernterraincoffee.com/">westernterraincoffee.com</a>
    </p>
  </div>
  `;

  return {
    subject: `Order Confirmed – ${data.orderNumber}`,
    html,
  };
}
