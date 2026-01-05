interface DeliveredEmailData {
  customerName: string;
  orderNumber: string;
  productNames: string[];
}

export function generateDeliveredEmail(data: DeliveredEmailData) {
  const html = `
  <div style="font-family:Arial, sans-serif; max-width:600px; margin:auto;">
    <h2>✨ Delivered!</h2>

    <p>Hi <strong>${data.customerName}</strong>,</p>

    <p>
      Your order <strong>${data.orderNumber}</strong> has been delivered successfully.
      We hope you enjoy your freshly roasted coffee!
    </p>

    <div style="background:#f9f9f9; padding:14px; margin:16px 0;">
      <h4>☕ Perfect Brewing Guide</h4>
      <ul>
        <li><strong>Ratio:</strong> 1:16 (1g coffee to 16g water)</li>
        <li><strong>Water Temperature:</strong> 90–96°C</li>
        <li><strong>Grind:</strong> Medium (drip), Fine (espresso)</li>
      </ul>
    </div>

    <p>
      Share your brewing experience with us — we’d love to hear from you!
    </p>

    <hr/>
    <p style="text-align:center; font-size:12px;">
      © 2026 <strong>Western Terrain Coffee Roasters</strong><br/>
      <a href="https://westernterraincoffee.com/">westernterraincoffee.com</a>
    </p>
  </div>
  `;

  return {
    subject: `Order Delivered – ${data.orderNumber}`,
    html,
  };
}
