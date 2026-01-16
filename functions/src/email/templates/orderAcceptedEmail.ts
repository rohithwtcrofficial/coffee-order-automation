// orderAcceptedEmail.ts
import { 
  FeaturedProduct, 
  generateFeaturedProductsHtml 
} from './featuredProducts';

export interface OrderAcceptedEmailData {
  customerName: string;
  orderNumber: string;
  productNames: string[];
  featuredProducts?: FeaturedProduct[];
}

export function generateOrderAcceptedEmail(
  data: OrderAcceptedEmailData
): { subject: string; html: string } {
  
  const orderLink = `https://westernterraincoffee.com/western217/orders`;

  // -------------------------
  // Featured Products Section (using reusable component)
  // -------------------------
  const featuredProductsHtml = generateFeaturedProductsHtml(
    data.featuredProducts || [],
    {
      maxProducts: 3,
      showBrowseAllButton: true,
      browseAllUrl: 'https://westernterraincoffee.com/categories/',
      browseAllText: 'Browse All Products'
    }
  );

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Accepted</title>
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
            <td style="padding:40px 24px 24px 24px; text-align:center; background:#ecfdf5; border-bottom:3px solid #059669;">
              <div style="display:inline-block; width:64px; height:64px; background:#059669; border-radius:50%; margin-bottom:16px; line-height:64px; text-align:center;">
                <span style="font-size:32px;">✓</span>
              </div>
              <h2 style="margin:0 0 8px 0; font-size:24px; font-weight:700; color:#047857;">
                Order Accepted!
              </h2>
              <p style="margin:0; font-size:16px; color:#065f46;">
                We're preparing your order, <strong>${data.customerName}</strong>
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
                Great news! Your order has been successfully accepted and confirmed. Our team is now carefully preparing your items for dispatch.
              </p>

              <!-- Product List -->
              <h3 style="margin:0 0 16px 0; font-size:18px; font-weight:700; color:#111827;">
                Your Order Includes
              </h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="background:#ecfdf5; border-radius:10px; padding:20px; margin-bottom:32px; border:1px solid #d1fae5;">
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
                          <p style="margin:0; font-size:15px; color:#065f46; font-weight:500;">
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
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:32px; border-left:4px solid #059669; background:#ecfdf5; padding:20px;">
                <tr>
                  <td>
                    <h3 style="margin:0 0 16px 0; font-size:16px; font-weight:700; color:#047857;">
                      What Happens Next?
                    </h3>
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:8px 0;">
                          <table cellspacing="0" cellpadding="0">
                            <tr>
                              <td style="width:24px; vertical-align:top;">
                                <span style="display:inline-block; width:20px; height:20px; background:#059669; color:#ffffff; text-align:center; border-radius:50%; font-size:12px; font-weight:700; line-height:20px;">1</span>
                              </td>
                              <td style="padding-left:12px;">
                                <p style="margin:0; font-size:14px; color:#065f46;">
                                  <strong>Order Processing</strong> - Your order is being carefully packed by our team
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
                                <span style="display:inline-block; width:20px; height:20px; background:#059669; color:#ffffff; text-align:center; border-radius:50%; font-size:12px; font-weight:700; line-height:20px;">2</span>
                              </td>
                              <td style="padding-left:12px;">
                                <p style="margin:0; font-size:14px; color:#065f46;">
                                  <strong>Quality Check</strong> - We ensure everything is perfect before shipping
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
                                <span style="display:inline-block; width:20px; height:20px; background:#059669; color:#ffffff; text-align:center; border-radius:50%; font-size:12px; font-weight:700; line-height:20px;">3</span>
                              </td>
                              <td style="padding-left:12px;">
                                <p style="margin:0; font-size:14px; color:#065f46;">
                                  <strong>Dispatch & Tracking</strong> - Your order will be handed to our delivery partner
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
                                <span style="display:inline-block; width:20px; height:20px; background:#059669; color:#ffffff; text-align:center; border-radius:50%; font-size:12px; font-weight:700; line-height:20px;">4</span>
                              </td>
                              <td style="padding-left:12px;">
                                <p style="margin:0; font-size:14px; color:#065f46;">
                                  <strong>Tracking Updates</strong> - You'll receive tracking details via email once shipped
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
                      View Order Details
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background:#fef3c7; border-radius:10px; padding:20px; border-left:4px solid #f59e0b;">
                <tr>
                  <td>
                    <p style="margin:0; font-size:14px; color:#92400e; line-height:1.6;">
                      <strong style="color:#78350f;">📦 Estimated Processing Time:</strong><br/>
                      Your order will typically be dispatched within 1-2 business days. You'll receive shipping confirmation with tracking details once it's on its way.
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
    subject: `Order Accepted – #${data.orderNumber} | Western Terrain Coffee`,
    html,
  };
}