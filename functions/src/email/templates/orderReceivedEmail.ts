// orderReceivedEmail.ts
import * as admin from 'firebase-admin';
import { 
  FeaturedProduct, 
  generateFeaturedProductsHtml 
} from './featuredProducts';

export interface OrderItem {
  productName: string;
  grams: number;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  category?: string;
  roastLevel?: string;
  imageUrl?: string;
  productId?: string;
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
  featuredProducts?: FeaturedProduct[];
}

export async function generateOrderReceivedEmail(
  data: OrderReceivedEmailData,
  db: admin.firestore.Firestore
): Promise<{ subject: string; html: string }> {

  // -------------------------
  // Fetch current product images and URLs from variants subcollection
  // -------------------------
  const productData: Record<string, { imageUrl: string; productUrl: string }> = {};
  const items = data?.items || [];
  
  for (const item of items) {
    if (item.productId && item.grams) {
      try {
        console.log(`Fetching product data for productId: ${item.productId}, grams: ${item.grams}`);
        
        // Fetch the main product document for imageUrl
        const productDoc = await db.collection('products').doc(item.productId).get();
        
        if (productDoc.exists) {
          const product = productDoc.data();
          const imageUrl = product?.imageUrl || 'https://westernterraincoffee.com/images/placeholder.png';
          
          // Fetch the variant document for productLink
          const variantDoc = await db
            .collection('products')
            .doc(item.productId)
            .collection('variants')
            .doc(item.grams.toString())
            .get();
          
          let productUrl = 'https://westernterraincoffee.com/categories/';
          
          if (variantDoc.exists) {
            const variant = variantDoc.data();
            productUrl = variant?.productLink || productUrl;
            console.log(`✅ Found variant productLink for ${item.productId} (${item.grams}g): ${productUrl}`);
          } else {
            console.log(`❌ Variant document doesn't exist for ${item.productId} with ${item.grams}g`);
          }
          
          productData[item.productId] = { imageUrl, productUrl };
          console.log(`✅ Product data stored for ${item.productId}`);
        } else {
          console.log(`❌ Product document doesn't exist for ${item.productId}`);
          productData[item.productId] = {
            imageUrl: 'https://westernterraincoffee.com/images/placeholder.png',
            productUrl: 'https://westernterraincoffee.com/categories/'
          };
        }
      } catch (error) {
        console.error(`Error fetching product ${item.productId}:`, error);
        productData[item.productId] = {
          imageUrl: 'https://westernterraincoffee.com/images/placeholder.png',
          productUrl: 'https://westernterraincoffee.com/categories/'
        };
      }
    }
  }
  
  console.log('Final productData mapping:', productData);

  // -------------------------
  // Order Items Table
  // -------------------------
  const itemsHtml = items
    .map((item) => {
      const data = item.productId ? productData[item.productId] : null;
      const imageUrl = data?.imageUrl || 'https://westernterraincoffee.com/images/placeholder.png';
      const productUrl = data?.productUrl || 'https://westernterraincoffee.com/categories/';
      
      return `
      <tr>
        <td style="padding:16px 0; border-bottom:1px solid #e5e7eb;">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:100px; padding-right:16px;">
                <a href="${productUrl}" style="display:block;">
                  <img
                    src="${imageUrl}"
                    alt="${item.productName}"
                    width="90"
                    height="90"
                    style="border-radius:8px; display:block; border:1px solid #e5e7eb;"
                  />
                </a>
              </td>
              <td style="vertical-align:top;">
                <a href="${productUrl}" style="text-decoration:none; color:#111827;">
                  <h3 style="margin:0 0 6px 0; font-size:16px; font-weight:600; color:#111827;">
                    ${item.productName}
                  </h3>
                </a>
                <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280;">
                  ${item.grams}g • Quantity: ${item.quantity}
                </p>
                <p style="margin:0; font-size:16px; font-weight:600; color:#111827;">
                  ₹${item.subtotal.toFixed(2)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    })
    .join('');

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

  const orderLink = `https://westernterraincoffee.com/western217/orders`;

  // -------------------------
  // Final HTML
  // -------------------------
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation</title>
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
                Order Received!
              </h2>
              <p style="margin:0; font-size:16px; color:#065f46;">
                Thank you for your order, <strong>${data.customerName}</strong>
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

              <!-- Order Items -->
              <h3 style="margin:0 0 20px 0; font-size:18px; font-weight:700; color:#111827;">
                Your Items
              </h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
                ${itemsHtml}
                
                <!-- Total -->
                <tr>
                  <td style="padding:20px 16px; background:#f9fafb;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="text-align:right; padding-right:16px;">
                          <p style="margin:0; font-size:16px; font-weight:600; color:#6b7280;">
                            Total Amount
                          </p>
                        </td>
                        <td style="text-align:right; width:120px;">
                          <p style="margin:0; font-size:24px; font-weight:700; color:#059669;">
                            ₹${data.totalAmount.toFixed(2)}
                          </p>
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
                      Track Your Order
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background:#f9fafb; border-radius:10px; padding:20px; margin-top:24px;">
                <tr>
                  <td>
                    <h3 style="margin:0 0 12px 0; font-size:16px; font-weight:700; color:#111827;">
                      📦 Shipping Address
                    </h3>
                    <p style="margin:0; font-size:14px; line-height:1.6; color:#374151;">
                      <strong>${data.customerName}</strong><br/>
                      ${data.address?.street ?? '-'}<br/>
                      ${data.address?.city ?? ''}, ${data.address?.state ?? ''} ${data.address?.postalCode ?? ''}<br/>
                      ${data.address?.country ?? ''}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- What's Next -->
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
                                  <strong>Order Confirmation</strong> - You'll receive an email confirmation shortly
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
                                  <strong>Careful Packing</strong> - We'll pack your coffee with care to preserve freshness
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
                                  <strong>Shipping Updates</strong> - Track your package with real-time email updates
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
                                  <strong>Enjoy!</strong> - Brew and savor your premium coffee experience
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
    subject: `Order Confirmed - #${data.orderNumber} | Western Terrain Coffee`,
    html,
  };
}