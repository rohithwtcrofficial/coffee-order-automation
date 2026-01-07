// src/app/api/dashboard/refresh/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Helper function to serialize Firestore data
function serializeFirestoreData<T>(data: any): T {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    // Convert Firestore Timestamps to ISO strings
    if (value && typeof value === 'object' && value._seconds !== undefined) {
      return new Date(value._seconds * 1000).toISOString();
    }
    return value;
  }));
}

export async function GET() {
  try {
    const [ordersSnapshot, customersSnapshot, productsSnapshot] = await Promise.all([
      adminDb.collection('orders').orderBy('createdAt', 'desc').get(),
      adminDb.collection('customers').get(),
      adminDb.collection('products').where('isActive', '==', true).get(),
    ]);

    const orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeFirestoreData({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      });
    });

    const customers = customersSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeFirestoreData({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      });
    });

    const products = productsSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeFirestoreData({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      });
    });

    return NextResponse.json({ orders, customers, products });
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to refresh dashboard data' },
      { status: 500 }
    );
  }
}