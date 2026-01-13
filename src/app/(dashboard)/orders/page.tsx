// src/app/(dashboard)/orders/page.tsx
import { Card } from '@/components/ui/Card';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { Plus, ShoppingCart, Filter, Download, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { Order } from '@/lib/types/order';

// Helper function to recursively convert Firestore Timestamps to ISO strings
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Check if it's a Firestore Timestamp
  if (data && typeof data === 'object' && '_seconds' in data && '_nanoseconds' in data) {
    return new Date(data._seconds * 1000).toISOString();
  }

  // Check if it has a toDate method (Firestore Timestamp)
  if (data && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  // Handle objects
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        serialized[key] = serializeFirestoreData(data[key]);
      }
    }
    return serialized;
  }

  // Return primitive values as-is
  return data;
}

async function getOrders(): Promise<Order[]> {
  try {
    const ordersSnapshot = await adminDb
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return ordersSnapshot.docs.map((doc) => {
      const data = doc.data();
      // Recursively serialize all Firestore data
      return serializeFirestoreData({
        id: doc.id,
        ...data,
      });
    }) as Order[];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

async function getOrderStats(orders: Order[]) {
  const stats = {
    total: orders.length,
    received: orders.filter(o => o.status === 'RECEIVED').length,
    accepted: orders.filter(o => o.status === 'ACCEPTED').length,
    packed: orders.filter(o => o.status === 'PACKED').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    cancelled: orders.filter(o => o.status === 'CANCELLED').length,
  };
  return stats;
}
async function getProductImages(orders: Order[]): Promise<Record<string, string>> {
  const uniqueProductIds = new Set<string>();
  
  // Collect all unique product IDs from all orders
  orders.forEach(order => {
    order.items?.forEach(item => {
      if (item.productId) {
        uniqueProductIds.add(item.productId);
      }
    });
  });

  const productImages: Record<string, string> = {};

  // Fetch images for each product
  for (const productId of uniqueProductIds) {
    try {
      const productDoc = await adminDb.collection('products').doc(productId).get();
      if (productDoc.exists) {
        const productData = productDoc.data();
        if (productData?.imageUrl) {
          productImages[productId] = productData.imageUrl;
        }
      }
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
    }
  }

  return productImages;
}

export default async function OrdersPage() {
  const orders = await getOrders();
  const productImages = await getProductImages(orders);
  const stats = await getOrderStats(orders);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            {/* Header Content */}
            <div className="flex flex-col gap-4">
              {/* Top Row - Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Side - Title & Description */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                      Orders
                    </h1>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Manage and track orders • {orders.length} total
                    </p>
                  </div>
                </div>

                {/* Right Side - Action Buttons */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                  <Link
                    href="/orders/new"
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all shadow-lg shadow-blue-600/30 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">New Order</span>
                    <span className="sm:hidden">New</span>
                  </Link>
                </div>
              </div>

              {/* Bottom Row - Stats */}
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 sm:gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Total</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                <p className="text-xs text-cyan-700 font-medium mb-1">Received</p>
                <p className="text-lg sm:text-xl font-bold text-cyan-900">{stats.received}</p>
               </div>
               <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                <p className="text-xs text-emerald-700 font-medium mb-1">Accepted</p>
                <p className="text-lg sm:text-xl font-bold text-emerald-900">{stats.accepted}</p>
               </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-orange-700 font-medium mb-1">Packed</p>
                  <p className="text-lg sm:text-xl font-bold text-orange-900">{stats.packed}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium mb-1">Shipped</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-900">{stats.shipped}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-green-700 font-medium mb-1">Delivered</p>
                  <p className="text-lg sm:text-xl font-bold text-green-900">{stats.delivered}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <p className="text-xs text-red-700 font-medium mb-1">Cancelled</p>
                  <p className="text-lg sm:text-xl font-bold text-red-900">{stats.cancelled}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-400 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card className="border-none shadow-xl overflow-hidden">
         <OrdersTable orders={orders} productImages={productImages} />
        </Card>
      </div>
    </div>
  );
}