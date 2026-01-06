// src/app/actions/customerActions.ts
'use server';

import { adminDb } from '@/lib/firebase/admin';
import { Customer } from '@/lib/types/order';

function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (data && typeof data === 'object' && '_seconds' in data && '_nanoseconds' in data) {
    return new Date(data._seconds * 1000).toISOString();
  }

  if (data && typeof data.toDate === 'function') {
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(item => serializeFirestoreData(item));
  }

  if (typeof data === 'object') {
    const serialized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        serialized[key] = serializeFirestoreData(data[key]);
      }
    }
    return serialized;
  }

  return data;
}

export async function searchCustomerByEmail(email: string) {
  try {
    const customerQuery = await adminDb
      .collection('customers')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (customerQuery.empty) {
      return { found: false, customer: null };
    }

    const customerDoc = customerQuery.docs[0];
    const customer = serializeFirestoreData({
      id: customerDoc.id,
      ...customerDoc.data(),
    }) as Customer;

    return { found: true, customer };
  } catch (error) {
    console.error('Error searching customer:', error);
    return { found: false, customer: null, error: 'Failed to search customer' };
  }
}

export async function searchCustomerByPhone(phone: string) {
  try {
    const customerQuery = await adminDb
      .collection('customers')
      .where('phone', '==', phone.trim())
      .limit(1)
      .get();

    if (customerQuery.empty) {
      return { found: false, customer: null };
    }

    const customerDoc = customerQuery.docs[0];
    const customer = serializeFirestoreData({
      id: customerDoc.id,
      ...customerDoc.data(),
    }) as Customer;

    return { found: true, customer };
  } catch (error) {
    console.error('Error searching customer:', error);
    return { found: false, customer: null, error: 'Failed to search customer' };
  }
}