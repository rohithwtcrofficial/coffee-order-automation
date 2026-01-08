// orderReceivedEmail.ts

export interface OrderItem {
  productName: string;
  grams: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  category?: string;
  roastLevel?: string;
  imageUrl?: string;
}

export interface FeaturedProduct {
  name: string;
  price: number;
  imageUrl: string;
  link: string;
}

export interface OrderReceivedEmailData {
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
  label?: string;
};
  featuredProducts?: FeaturedProduct[]; // ✅ OPTIONAL
}


export function generateOrderReceivedEmail(
  data: OrderReceivedEmailData
): { subject: string; html: string } {

  // -------------------------
  // Order Items Table
  // -------------------------
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px; width:80px;">
          <img
            src="${item.imageUrl || 'https://westernterraincoffee.com/images/placeholder.png'}"
            alt="${item.productName}"
            width="70"
            style="border-radius:6px; display:block;"
          />
        </td>
        <td style="padding:10px;">
          <strong>${item.productName}</strong><br/>
          <small style="color:#666;">
            ${item.grams}g • Qty ${item.quantity}
          </small>
        </td>
        <td style="padding:10px; text-align:right;">
          ₹${item.subtotal.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join('');


    // const featuredProducts = data.featuredProducts ?? [];

  // -------------------------
  // Keep Shopping Section
  // -------------------------
  const hasFeaturedProducts =
    Array.isArray(data.featuredProducts) &&
    data.featuredProducts.length > 0;

  const keepShoppingHtml = hasFeaturedProducts
    ? `
      <h3 style="margin-top:30px;">🛒 Keep shopping for</h3>

      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          ${data.featuredProducts!
            .slice(0, 3)
            .map(
              (product) => `
              <td align="center" style="padding:10px; width:33%;">
                <a href="${product.link}" style="text-decoration:none; color:#333;">
                  <img
                    src="${product.imageUrl}"
                    alt="${product.name}"
                    width="120"
                    style="border-radius:8px; display:block; margin:auto;"
                  />
                  <p style="margin:8px 0 4px; font-size:14px;">
                    <strong>${product.name}</strong>
                  </p>
                  <p style="margin:0; font-size:14px;">
                    ₹${product.price.toFixed(2)}
                  </p>
                </a>
              </td>
            `
            )
            .join('')}
        </tr>
      </table>

      <div style="margin:30px 0; text-align:center;">
        <a href="https://westernterraincoffee.com/categories/"
           style="background:#f59e0b; color:#000; padding:10px 18px;
                  text-decoration:none; border-radius:6px; font-weight:bold;">
          Browse all products
        </a>
      </div>
    `
    : '';

  const orderLink = `https://westernterraincoffee.com/western217/orders`;

  // -------------------------
  // Final HTML
  // -------------------------
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Order Received</title>
</head>
<body style="font-family:Arial, sans-serif; max-width:600px; margin:auto; color:#333;">

  <h2 style="text-align:center;">📥 Order Received</h2>

  <p>Hi <strong>${data.customerName}</strong>,</p>

  <p>
    Thank you for your order! We’ve received your order and will start packing it shortly.
  </p>

  <p><strong>Order Number:</strong>#${data.orderNumber}</p>

  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-top:10px;">
    ${itemsHtml}
    <tr>
      <td colspan="2" style="padding:10px; text-align:right;">
        <strong>Total</strong>
      </td>
      <td style="padding:10px; text-align:right;">
        <strong>₹${data.totalAmount.toFixed(2)}</strong>
      </td>
    </tr>
  </table>

  <div style="margin:24px 0; text-align:center;">
    <a href="${orderLink}"
       style="background:#111827; color:#fff; padding:12px 20px;
              text-decoration:none; border-radius:6px; display:inline-block;">
      View your orders
    </a>
  </div>

  <h3>📦 Shipping Address</h3>
<p>
  ${data.customerName}<br/>
  ${data.address?.street ?? '-'}<br/>
  ${data.address?.city ?? ''}, ${data.address?.state ?? ''} ${data.address?.postalCode ?? ''}<br/>
  ${data.address?.country ?? ''}
</p>


  <div style="background:#f9f9f9; padding:14px; margin-top:20px;">
    <strong>What happens next?</strong>
    <ul style="margin:8px 0 0 16px;">
      <li>Your order will be packed securely</li>
      <li>You’ll receive shipping updates by email</li>
    </ul>
  </div>

  ${keepShoppingHtml}

  <hr style="margin:24px 0;" />

  <p style="text-align:center; font-size:12px; color:#777;">
    Need help? Contact <strong>westernterrains@gmail.com</strong><br/>
    © 2026 <strong>Western Terrain Coffee Roasters</strong>
  </p>

</body>
</html>
  `;

  return {
    subject: `Order Received – #${data.orderNumber}`,
    html,
  };
}
