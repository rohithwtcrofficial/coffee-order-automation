// functions/src/email/templates/delivered.ts

export interface DeliveredEmailData {
  customerName: string;
  orderNumber: string;
  productNames?: string[];
}

export function generateDeliveredEmail(
  data: DeliveredEmailData
): { subject: string; html: string } {
  return {
    subject: `Delivered! Enjoy Your Coffee - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Delivered</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 100%;">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 50px 40px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 15px;">✨</div>
                    <h1 style="margin: 0 0 15px 0; color: #ffffff; font-size: 36px; font-weight: 700; line-height: 1.2;">
                      Delivered!
                    </h1>
                    <p style="margin: 0; color: #ffffff; font-size: 18px; opacity: 0.95;">
                      Enjoy your fresh coffee
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px;">
                    
                    <h2 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">
                      Hi ${data.customerName},
                    </h2>
                    <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Your order <strong>#${data.orderNumber}</strong> has been delivered! We hope you're excited to brew your freshly roasted coffee.
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                      <div style="display: inline-block; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 30px; border-radius: 50%; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                        <div style="font-size: 48px;">🎉</div>
                      </div>
                    </div>

                    ${data.productNames && data.productNames.length > 0 ? `
                    <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #10b981;">
                      <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px; font-weight: 700;">
                        📦 Delivered Products:
                      </h3>
                      ${data.productNames.map(name => `
                        <p style="margin: 8px 0; color: #047857; font-size: 15px;">
                          ☕ ${name}
                        </p>
                      `).join('')}
                    </div>
                    ` : ''}

                    <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 30px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #10b981;">
                      <h3 style="margin: 0 0 20px 0; color: #065f46; font-size: 22px; font-weight: 700; text-align: center;">
                        ☕ Perfect Brewing Guide
                      </h3>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <p style="margin: 0; color: #047857; font-size: 15px;">
                              <strong>⚖️ Ratio:</strong> 1:16 (1g coffee to 16g water)
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <p style="margin: 0; color: #047857; font-size: 15px;">
                              <strong>🌡️ Temperature:</strong> 195-205°F (90-96°C)
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                            <p style="margin: 0; color: #047857; font-size: 15px;">
                              <strong>⚙️ Grind:</strong> Medium for drip, fine for espresso
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0;">
                            <p style="margin: 0; color: #047857; font-size: 15px;">
                              <strong>⏰ Freshness:</strong> Best within 2-4 weeks
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                      <p style="margin: 0 0 15px 0; color: #92400e; font-size: 18px; font-weight: 700;">
                        📦 Storage Tips:
                      </p>
                      <p style="margin: 8px 0; color: #78350f; font-size: 15px;">
                        ✓ Keep in an airtight container
                      </p>
                      <p style="margin: 8px 0; color: #78350f; font-size: 15px;">
                        ✓ Store in a cool, dark place
                      </p>
                      <p style="margin: 8px 0; color: #78350f; font-size: 15px;">
                        ✓ Avoid moisture and direct sunlight
                      </p>
                      <p style="margin: 8px 0; color: #78350f; font-size: 15px;">
                        ✓ Don't refrigerate (unless long-term storage)
                      </p>
                    </div>

                    <div style="background-color: #eff6ff; padding: 25px; border-radius: 8px; margin: 30px 0;">
                      <h3 style="margin: 0 0 20px 0; color: #1e40af; font-size: 18px; font-weight: 700; text-align: center;">
                        Popular Brewing Methods
                      </h3>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="width: 50%; padding: 10px; vertical-align: top;">
                            <div style="text-align: center;">
                              <div style="font-size: 32px; margin-bottom: 8px;">☕</div>
                              <p style="margin: 0; color: #1e40af; font-size: 15px; font-weight: 600;">
                                Pour Over
                              </p>
                              <p style="margin: 5px 0 0 0; color: #3b82f6; font-size: 13px;">
                                Clean, bright flavor
                              </p>
                            </div>
                          </td>
                          <td style="width: 50%; padding: 10px; vertical-align: top;">
                            <div style="text-align: center;">
                              <div style="font-size: 32px; margin-bottom: 8px;">☕</div>
                              <p style="margin: 0; color: #1e40af; font-size: 15px; font-weight: 600;">
                                French Press
                              </p>
                              <p style="margin: 5px 0 0 0; color: #3b82f6; font-size: 13px;">
                                Bold, full-bodied
                              </p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="width: 50%; padding: 10px; vertical-align: top;">
                            <div style="text-align: center;">
                              <div style="font-size: 32px; margin-bottom: 8px;">☕</div>
                              <p style="margin: 0; color: #1e40af; font-size: 15px; font-weight: 600;">
                                Espresso
                              </p>
                              <p style="margin: 5px 0 0 0; color: #3b82f6; font-size: 13px;">
                                Intense, concentrated
                              </p>
                            </div>
                          </td>
                          <td style="width: 50%; padding: 10px; vertical-align: top;">
                            <div style="text-align: center;">
                              <div style="font-size: 32px; margin-bottom: 8px;">☕</div>
                              <p style="margin: 0; color: #1e40af; font-size: 15px; font-weight: 600;">
                                Aeropress
                              </p>
                              <p style="margin: 5px 0 0 0; color: #3b82f6; font-size: 13px;">
                                Smooth, versatile
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <div style="text-align: center; margin: 40px 0; padding: 30px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                        <strong>We'd love to hear what you think!</strong><br>
                        Share your brewing experience with us on social media
                      </p>
                      <p style="margin: 20px 0; color: #6b7280; font-size: 14px;">
                        Tag us <strong style="color: #10b981;">@coffeebrands</strong> and use <strong style="color: #10b981;">#FreshlyRoasted</strong>
                      </p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="mailto:feedback@coffeebrands.com?subject=Feedback%20for%20Order%20${data.orderNumber}" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                        Share Your Feedback
                      </a>
                    </div>

                    <div style="margin-top: 40px; padding: 20px 0; border-top: 2px dashed #e5e7eb;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                        ✅ Ordered → ✅ Roasted → ✅ Shipped → <strong style="color: #10b981;">🎉 Delivered</strong>
                      </p>
                    </div>

                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">
                      Thank you for choosing Coffee Brands!
                    </p>
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Questions? Reply to this email or contact us at <a href="mailto:support@coffeebrands.com" style="color: #10b981; text-decoration: none;">support@coffeebrands.com</a>
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