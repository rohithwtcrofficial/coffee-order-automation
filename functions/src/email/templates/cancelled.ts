export interface CancelledEmailData {
  customerName: string;
  orderNumber: string;
  totalAmount: number;
}

export function generateCancelledEmail(
  data: CancelledEmailData
): { subject: string; html: string } {

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Order Cancelled</title>
</head>
<body style="font-family:Arial, sans-serif; max-width:600px; margin:auto; color:#333;">

  <h2 style="text-align:center;">❌ Order Cancelled</h2>

  <p>Hi <strong>${data.customerName}</strong>,</p>

  <p>
    Your order <strong>#${data.orderNumber}</strong> has been cancelled successfully.
  </p>

  <div style="background:#f3f3f3; padding:12px; margin:16px 0;">
    <strong>Refund Amount:</strong><br/>
    ₹${data.totalAmount.toFixed(2)}
  </div>

  <p>
    The refund has been initiated and will be credited to your original
    payment method within <strong>5–7 business days</strong>.
  </p>

  <p>
    If there was an issue with your order or experience, please let us know.
    We’re always looking to improve.
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
    subject: `Order Cancelled – #${data.orderNumber}`,
    html,
  };
}
