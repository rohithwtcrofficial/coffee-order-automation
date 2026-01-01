// src/app/(dashboard)/orders/page.tsx
import { Card } from '@/components/ui/Card';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { Order } from '@/lib/types';

async function getOrders(): Promise<Order[]> {
  try {
    const ordersSnapshot = await adminDb
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Order[];
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