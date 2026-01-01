// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

interface UpdateOrderRequest {
  status: string;
  trackingId?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateOrderRequest = await request.json();
    const { status, trackingId } = body;
    const orderId = params.id;

    // Use Record<string, any> for Firebase update compatibility
    const updateData: Record<string, string | FirebaseFirestore.FieldValue> = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (trackingId !== undefined) {
      updateData.trackingId = trackingId;
    }

    await adminDb.collection('orders').doc(orderId).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();
    
    const order = {
      id: orderDoc.id,
      ...orderData,
      createdAt: orderData?.createdAt?.toDate(),
      updatedAt: orderData?.updatedAt?.toDate(),
    };

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}