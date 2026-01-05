interface CancelledEmailData {
  customerName: string;
  orderNumber: string;
  totalAmount: number;
}

export function generateCancelledEmail(data: CancelledEmailData) {
  const html = `
  <div style="font-family:Arial, sans-serif; max-width:600px; margin:auto;">
    <h2>❌ Order Cancelled</h2>

    <p>Hi <strong>${data.customerName}</strong>,</p>

    <p>
      Your order <strong>${data.orderNumber}</strong> has been cancelled as requested.
    </p>

    <div style="background:#f3f3f3; padding:12px; margin:16px 0;">
      <strong>Refund Amount:</strong><br/>
      ₹${data.totalAmount.toFixed(2)}
    </div>

    <p>
      The refund will be processed within <strong>5–7 business days</strong>
      to your original payment method.
    </p>

    <p>
      If there was an issue with your order, please let us know —
      we’re always looking to improve.
    </p>

    <hr/>
    <p style="text-align:center; font-size:12px;">
      © 2026 <strong>Western Terrain Coffee Roasters</strong><br/>
      <a href="https://westernterraincoffee.com/">westernterraincoffee.com</a>
    </p>
  </div>
  `;

  return {
    subject: `Order Cancelled – ${data.orderNumber}`,
    html,
  };
}
