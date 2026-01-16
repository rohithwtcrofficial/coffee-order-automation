// featuredProducts.ts

export interface FeaturedProduct {
  name: string;
  price: number;
  imageUrl: string;
  link: string;
}

export interface FeaturedProductsOptions {
  maxProducts?: number;
  showBrowseAllButton?: boolean;
  browseAllUrl?: string;
  browseAllText?: string;
}

/**
 * Generates HTML for a featured products section
 * @param products - Array of featured products to display
 * @param options - Configuration options for the section
 * @returns HTML string for the featured products section
 */
export function generateFeaturedProductsHtml(
  products: FeaturedProduct[],
  options: FeaturedProductsOptions = {}
): string {
  const {
    maxProducts = 3,
    showBrowseAllButton = true,
    browseAllUrl = 'https://westernterraincoffee.com/categories/',
    browseAllText = 'Browse All Products'
  } = options;

  if (!Array.isArray(products) || products.length === 0) {
    return '';
  }

  const productsToShow = products.slice(0, maxProducts);

  const productsHtml = productsToShow
    .map(
      (product) => `
      <td align="center" style="padding:12px; width:${100 / productsToShow.length}%;">
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
    .join('');

  const browseAllButton = showBrowseAllButton
    ? `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
      <tr>
        <td align="center">
          <a href="${browseAllUrl}"
             style="display:inline-block; background:#111827; color:#ffffff; padding:14px 32px; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">
            ${browseAllText}
          </a>
        </td>
      </tr>
    </table>
    `
    : '';

  return `
<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:40px; background:#f9fafb; border-radius:12px; padding:24px;">
  <tr>
    <td>
      <h2 style="margin:0 0 20px 0; font-size:20px; font-weight:700; color:#111827; text-align:center;">
        ☕ You Might Also Like
      </h2>
      <table width="100%" cellspacing="0" cellpadding="0">
        <tr>
          ${productsHtml}
        </tr>
      </table>
      ${browseAllButton}
    </td>
  </tr>
</table>
  `;
}