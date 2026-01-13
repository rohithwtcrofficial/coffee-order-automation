// orderPackedEmail.ts

export interface FeaturedProduct {
  name: string;
  price: number;
  imageUrl: string;
  link: string;
}

export interface OrderPackedEmailData {
  customerName: string;
  orderNumber: string;
  productNames: string[];
  featuredProducts?: FeaturedProduct[];
}

export function generateOrderPackedEmail(
  data: OrderPackedEmailData
): { subject: string; html: string } {
  
  const orderLink = `https://westernterraincoffee.com/western217/orders`;

  // -------------------------
  // Featured Products Section
  // -------------------------
  const hasFeaturedProducts =
    Array.isArray(data.featuredProducts) &&
    data.featuredProducts.length > 0;

  const featuredProductsHtml = hasFeaturedProducts
    ? `
      <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:40px; background:#f9fafb; border-radius:12px; padding:24px;">
        <tr>
          <td>
            <h2 style="margin:0 0 20px 0; font-size:20px; font-weight:700; color:#111827; text-align:center;">
              ☕ You Might Also Like
            </h2>
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                ${data.featuredProducts!
                  .slice(0, 3)
                  .map(
                    (product) => `
                    <td align="center" style="padding:12px; width:33%;">
                      <a href="${product.link}" style="text-decoration:none;">
                        <table width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #e5e7eb;">
                          <tr>
                            <td style="padding:12px;">
                              <img
                                src="${product.imageUrl}"
                                alt="${product.name}"
                                width="140"
                                height="140"
                                style="border-radius:8px; display:block; margin:0 auto;"
                              />
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:0 12px 12px 12px;">
                              <p style="margin:0 0 8px 0; font-size:14px; font-weight:600; color:#111827; line-height:1.4;">
                                ${product.name}
                              </p>
                              <p style="margin:0 0 12px 0; font-size:16px; font-weight:700; color:#059669;">
                                ₹${product.price.toFixed(2)}
                              </p>
                              <div style="background:#059669; color:#ffffff; padding:10px 16px; text-align:center; border-radius:6px; font-size:14px; font-weight:600;">
                                Shop Now
                              </div>
                            </td>
                          </tr>
                        </table>
                      </a>
                    </td>
                  `
                  )
                  .join('')}
              </tr>
            </table>
            <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
              <tr>
                <td align="center">
                  <a href="https://westernterraincoffee.com/categories/"
                     style="display:inline-block; background:#111827; color:#ffffff; padding:14px 32px; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">
                    Browse All Products
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    : '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Packed</title>
</head>
<body style="margin:0; padding:0; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color:#f3f4f6;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellspacing="0" cellpadding="0" style="max-width:600px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header with Brand -->
          <tr>
            <td style="background:linear-gradient(135deg, #059669 0%, #047857 100%); padding:32px 24px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:-0.5px;">
                Western Terrain Coffee
              </h1>
              <p style="margin:8px 0 0 0; color:#d1fae5; font-size:14px; font-weight:500;">
                Premium Coffee Roasters
              </p>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding:40px 24px 24px 24px; text-align:center; background:#eff6ff; border-bottom:3px solid #3b82f6;">
              <div style="display:inline-block; width:64px; height:64px; background:#3b82f6; border-radius:50%; margin-bottom:16px; line-height:64px; text-align:center;">
                <span style="font-size:32px;">📦</span>
              </div>
              <h2 style="margin:0 0 8px 0; font-size:24px; font-weight:700; color:#1e40af;">
                Order Packed!
              </h2>
              <p style="margin:0; font-size:16px; color:#1e3a8a;">
                Your order is ready for dispatch, <strong>${data.customerName}</strong>
              </p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding:32px 24px;">
              <table width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb; border-radius:10px; padding:20px; margin-bottom:24px;">
                <tr>
                  <td>
                    <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280; font-weight:500;">
                      Order Number
                    </p>
                    <p style="margin:0; font-size:20px; font-weight:700; color:#111827;">
                      #${data.orderNumber}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <p style="margin:0 0 20px 0; font-size:16px; color:#374151; line-height:1.6;">
                Good news! Your order has been <strong>packed securely</strong> and is now ready to be shipped. Our team has taken extra care to ensure your coffee arrives fresh and in perfect condition.
              </p>

              <!-- Product List -->
              <h3 style="margin:0 0 16px 0; font-size:18px; font-weight:700; color:#111827;">
                Packed Items
              </h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="background:#eff6ff; border-radius:10px; padding:20px; margin-bottom:32px; border:1px solid #bfdbfe;">
                ${data.productNames
                  .map(
                    (name) => `
                <tr>
                  <td style="padding:8px 0;">
                    <table cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width:24px; vertical-align:top;">
                          <span style="font-size:16px;">☕</span>
                        </td>
                        <td style="padding-left:8px;">
                          <p style="margin:0; font-size:15px; color:#1e3a8a; font-weight:500;">
                            ${name}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                  )
                  .join('')}
              </table>

              <!-- What's Next Timeline -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:32px; border-left:4px solid #3b82f6; background:#eff6ff; padding:20px;">
                <tr>
                  <td>
                    <h3 style="margin:0 0 16px 0; font-size:16px; font-weight:700; color:#1e40af;">
                      What Happens Next?
                    </h3>
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:8px 0;">
                          <table cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="width:24px; vertical-align:top;">
                                <span style="display:inline-block; width:20px; height:20px; background:#3b82f6; color:#ffffff; text-align:center; border-radius:50%; font-size:12px; font-weight:700; line-height:20px;">1</span>
                              </td>
                              <td style="padding-left:12px;">
                                <p style="margin:0; font-size:14px; color:#1e3a8a;">
                                  <strong>Ready for Pickup</strong> - Your parcel will be handed over to our delivery partner
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <table cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="width:24px; vertical-align:top;">
                                <span style="display:inline-block; width:20px; height:20px; background:#3b82f6; color:#ffffff; text-align:center; border-radius:50%; font-size:12px; font-weight:700; line-height:20px;">2</span>
                              </td>
                              <td style="padding-left:12px;">
                                <p style="margin:0; font-size:14px; color:#1e3a8a;">
                                  <strong>Shipping Confirmation</strong> - Tracking details will be shared once shipped
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <table cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="width:24px; vertical-align:top;">
                                <span style="display:inline-block; width:20px; height:20px; background:#3b82f6; color:#ffffff; text-align:center; border-radius:50%; font-size:12px; font-weight:700; line-height:20px;">3</span>
                              </td>
                              <td style="padding-left:12px;">
                                <p style="margin:0; font-size:14px; color:#1e3a8a;">
                                  <strong>In Transit</strong> - Track your package in real-time
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <table cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="width:24px; vertical-align:top;">
                                <span style="display:inline-block; width:20px; height:20px; background:#3b82f6; color:#ffffff; text-align:center; border-radius:50%; font-size:12px; font-weight:700; line-height:20px;">4</span>
                              </td>
                              <td style="padding-left:12px;">
                                <p style="margin:0; font-size:14px; color:#1e3a8a;">
                                  <strong>Delivery</strong> - Your coffee arrives fresh at your doorstep
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin:32px 0;">
                <tr>
                  <td align="center">
                    <a href="${orderLink}"
                       style="display:inline-block; background:#111827; color:#ffffff; padding:16px 40px; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                      View Order Status
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background:#dbeafe; border-radius:10px; padding:20px; border-left:4px solid #3b82f6;">
                <tr>
                  <td>
                    <p style="margin:0; font-size:14px; color:#1e3a8a; line-height:1.6;">
                      <strong style="color:#1e40af;">🚚 Shipping Timeline:</strong><br/>
                      Your order will be dispatched shortly. Delivery timelines depend on your location and our logistics partner's schedule. You'll receive tracking information as soon as it ships!
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Featured Products -->
          <tr>
            <td style="padding:0 24px 32px 24px;">
              ${featuredProductsHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111827; padding:32px 24px; text-align:center;">
              <p style="margin:0 0 16px 0; font-size:14px; color:#9ca3af;">
                Need help with your order?
              </p>
              <p style="margin:0 0 20px 0;">
                <a href="mailto:westernterrains@gmail.com" style="color:#10b981; text-decoration:none; font-weight:600; font-size:15px;">
                  westernterrains@gmail.com
                </a>
              </p>
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://westernterraincoffee.com" style="color:#9ca3af; text-decoration:none; font-size:13px; margin:0 12px;">Shop</a>
                    <span style="color:#4b5563;">•</span>
                    <a href="https://westernterraincoffee.com/about" style="color:#9ca3af; text-decoration:none; font-size:13px; margin:0 12px;">About Us</a>
                    <span style="color:#4b5563;">•</span>
                    <a href="https://westernterraincoffee.com/contact" style="color:#9ca3af; text-decoration:none; font-size:13px; margin:0 12px;">Contact</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0 0; font-size:12px; color:#6b7280;">
                © 2026 Western Terrain Coffee Roasters. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return {
    subject: `Your Order is Packed – #${data.orderNumber} | Western Terrain Coffee`,
    html,
  };
}