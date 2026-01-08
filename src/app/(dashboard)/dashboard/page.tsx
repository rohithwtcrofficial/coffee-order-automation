import { adminDb } from '@/lib/firebase/admin';
import DashboardClient from '@/components/dashboard/DashboardClient';
import type { Order, Customer, Product } from '@/lib/types';

function serializeFirestoreData<T>(data: any): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (value && typeof value === 'object' && value._seconds !== undefined) {
      return new Date(value._seconds * 1000).toISOString();
    }
    return value;
  }));
}

async function getDashboardData() {
  try {
    const [ordersSnapshot, customersSnapshot, productsSnapshot] = await Promise.all([
      adminDb.collection('orders').orderBy('createdAt', 'desc').get(),
      adminDb.collection('customers').get(),
      adminDb.collection('products').get(),
    ]);

    const orders: Order[] = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeFirestoreData({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      });
    });

    const customers: Customer[] = customersSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeFirestoreData({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      });
    });

    const products: Product[] = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeFirestoreData({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      });
    });

    return { orders, customers, products };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      orders: [] as Order[],
      customers: [] as Customer[],
      products: [] as Product[],
    };
  }
}

export default async function DashboardPage() {
  const { orders, customers, products } = await getDashboardData();

  return (
    <DashboardClient
      orders={orders}
      customers={customers}
      products={products}
    />
  );
}