// functions/src/email/templates/cancelled.ts

export interface CancelledEmailData {
  customerName: string;
  orderNumber: string;
  totalAmount: number;
}

export function generateCancelledEmail(
  data: CancelledEmailData
): { subject: string; html: string } {
  return {
    subject: `Order Cancelled - ${data.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Cancelled</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; max-width: 100%;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%); padding: 50px 40px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 15px;">❌</div>
                    <h1 style="margin: 0 0 15px 0; color: #ffffff; font-size: 36px; font-weight: 700; line-height: 1.2;">
                      Order Cancelled
                    </h1>
                    <p style="margin: 0; color: #ffffff; font-size: 18px; opacity: 0.95;">
                      Order #${data.orderNumber}
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    
                    <!-- Greeting -->
                    <h2 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">
                      Hi ${data.customerName},
                    </h2>
                    <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                      Your order <strong>#${data.orderNumber}</strong> has been cancelled as requested.
                    </p>

                    <!-- Refund Box -->
                    <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                      <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                        Refund Amount
                      </p>
                      <p style="margin: 0 0 20px 0; color: #111827; font-size: 36px; font-weight: 700;">
                        ₹${data.totalAmount.toFixed(2)}
                      </p>
                      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                          Your refund will be processed within <strong>5-7 business days</strong> to your original payment method.
                        </p>
                      </div>
                    </div>

                    <!-- Refund Timeline -->
                    <div style="background-color: #eff6ff; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                      <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px; font-weight: 700;">
                        📅 What Happens Next?
                      </h3>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding: 10px 0; vertical-align: top; width: 40px;">
                            <div style="width: 24px; height: 24px; background-color: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">1</div>
                          </td>
                          <td style="padding: 10px 0;">
                            <p style="margin: 0; color: #374151; font-size: 15px;">
                              <strong>Refund Initiated</strong> - Within 24 hours
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; vertical-align: top;">
                            <div style="width: 24px; height: 24px; background-color: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">2</div>
                          </td>
                          <td style="padding: 10px 0;">
                            <p style="margin: 0; color: #374151; font-size: 15px;">
                              <strong>Bank Processing</strong> - 3-5 business days
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; vertical-align: top;">
                            <div style="width: 24px; height: 24px; background-color: #3b82f6; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold;">3</div>
                          </td>
                          <td style="padding: 10px 0;">
                            <p style="margin: 0; color: #374151; font-size: 15px;">
                              <strong>Refund Completed</strong> - Amount credited to your account
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Feedback Section -->
                    <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ef4444;">
                      <p style="margin: 0 0 12px 0; color: #991b1b; font-size: 18px; font-weight: 700;">
                        💬 We'd Love Your Feedback
                      </p>
                      <p style="margin: 0 0 20px 0; color: #7f1d1d; font-size: 15px; line-height: 1.6;">
                        We're sorry to see you go. If there was an issue with your order, please let us know so we can improve!
                      </p>
                      <a href="mailto:support@coffeebrands.com" style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                        Contact Support
                      </a>
                    </div>

                    <!-- Come Back -->
                    <div style="text-align: center; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px;">
                      <p style="margin: 0 0 15px 0; font-size: 32px;">☕</p>
                      <p style="margin: 0 0 15px 0; color: #92400e; font-size: 18px; font-weight: 700;">
                        We Hope to See You Again!
                      </p>
                      <p style="margin: 0 0 20px 0; color: #78350f; font-size: 15px; line-height: 1.6;">
                        Your account is still active and ready whenever you want to order fresh coffee again.
                      </p>
                      <a href="#" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                        Browse Our Coffee
                      </a>
                    </div>

                    <!-- Support Info -->
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
                      <p style="margin: 0 0 10px 0; color: #111827; font-size: 16px; font-weight: 600;">
                        Need Help?
                      </p>
                      <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        If you have any questions about your refund or cancellation, our support team is here to help.
                      </p>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                      Questions? Reply to this email or contact us at <a href="mailto:support@coffeebrands.com" style="color: #6b7280; text-decoration: none; font-weight: 600;">support@coffeebrands.com</a>
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