// functions/src/email/templates/shipped.ts

export interface ShippedEmailData {
  customerName: string;
  orderNumber: string;
  trackingId?: string;
  productNames: string[];
}

export function generateShippedEmail(
  data: ShippedEmailData
): { subject: string; html: string } {
  const productsHtml = data.productNames
    .map(
      (name) => `
      <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #111827; font-size: 16px;">
          📦 ${name}
        </p>
      </div>
    `
    )
    .join('');

  return {
    subject: `Your Order Has Shipped - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Shipped</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 100%;">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 50px 40px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 15px;">🚚</div>
                    <h1 style="margin: 0 0 15px 0; color: #ffffff; font-size: 36px; font-weight: 700; line-height: 1.2;">
                      Your Order Has Shipped!
                    </h1>
                    <p style="margin: 0; color: #ffffff; font-size: 18px; opacity: 0.95;">
                      Order #${data.orderNumber} is on its way
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px;">
                    
                    <h2 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">
                      Hi ${data.customerName},
                    </h2>
                    <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Exciting news! Your freshly roasted coffee is on its way to you.
                    </p>

                    ${
                      data.trackingId
                        ? `
                    <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);">
                      <p style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                        Tracking Number
                      </p>
                      <p style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 28px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px;">
                        ${data.trackingId}
                      </p>
                      <a href="https://www.google.com/search?q=track+${data.trackingId}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                        Track Your Package
                      </a>
                    </div>
                    `
                        : `
                    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0; color: #92400e; font-size: 15px;">
                        <strong>📍 Tracking information will be updated soon.</strong><br>
                        We'll send you another email with tracking details once available.
                      </p>
                    </div>
                    `
                    }

                    <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #e5e7eb;">
                      <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 700;">
                        Your Products:
                      </h3>
                      ${productsHtml}
                    </div>

                    <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 30px 0;">
                      <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 18px; font-weight: 700;">
                        💡 Brewing Tip:
                      </p>
                      <p style="margin: 0; color: #1e3a8a; font-size: 15px; line-height: 1.6;">
                        Let your coffee rest for 24-48 hours after delivery for optimal flavor development. Store in an airtight container away from light and heat.
                      </p>
                    </div>

                    <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin: 30px 0;">
                      <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px; font-weight: 700;">
                        📦 Estimated Delivery
                      </h3>
                      <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">
                        Your order should arrive within <strong>3-5 business days</strong>. We'll send you another email once it's delivered.
                      </p>
                    </div>

                    <div style="margin-top: 40px; padding: 20px 0; border-top: 2px dashed #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                        ✅ Ordered → ✅ Roasted → <strong style="color: #3b82f6;">🚚 Shipped</strong> → 🎉 Delivered
                      </p>
                    </div>

                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Questions about your delivery? Reply to this email or contact us at <a href="mailto:support@coffeebrands.com" style="color: #3b82f6; text-decoration: none;">support@coffeebrands.com</a>
                    </p>
                    <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 13px;">
                      © 2024 Coffee Brands. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}