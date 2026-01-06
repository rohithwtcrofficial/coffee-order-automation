// src/app/(dashboard)/orders/page.tsx
import { Card } from '@/components/ui/Card';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { Plus } from 'lucide-react';
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

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and track all customer orders</p>
        </div>
        <Link
          href="/orders/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
        >
          <Plus size={20} />
          New Order
        </Link>
      </div>

      <Card>
        <OrdersTable orders={orders} />
      </Card>
    </div>
  );
}