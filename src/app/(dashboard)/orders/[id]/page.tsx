// src/app/(dashboard)/orders/[id]/page.tsx
import { Card } from '@/components/ui/Card';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { StatusUpdater } from '@/components/orders/StatusUpdater';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { adminDb } from '@/lib/firebase/admin';
import { Order, Customer, OrderItem } from '@/lib/types';
import { ArrowLeft, Package, User, MapPin } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getOrderWithCustomer(orderId: string): Promise<{ order: Order; customer: Customer } | null> {
  try {
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return null;
    }

    const orderData = orderDoc.data();
    const customerDoc = await adminDb.collection('customers').doc(orderData?.customerId).get();

    return {
      order: {
        id: orderDoc.id,
        ...orderData,
        createdAt: orderData?.createdAt?.toDate() || new Date(),
        updatedAt: orderData?.updatedAt?.toDate() || new Date(),
      } as Order,
      customer: {
        id: customerDoc.id,
        ...customerDoc.data(),
        createdAt: customerDoc.data()?.createdAt?.toDate() || new Date(),
      } as Customer,
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getOrderWithCustomer(params.id);

  if (!data) {
    notFound();
  }

  const { order, customer } = data;

  return (
    <div className="p-6 space-y-6">
      <Link 
        href="/orders"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
      >
        <ArrowLeft size={20} />
        <span>Back to Orders</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Order {order.orderNumber}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-gray-500 mt-1">
            Created on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Order Items</h2>
              </div>
              <div className="space-y-4">
                {order.items.map((item: OrderItem, index: number) => (
                  <div key={index} className="flex items-start justify-between pb-4 border-b last:border-0">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-500">
                        {item.grams}g • Quantity: {item.quantity}
                      </p>
                      {item.roastLevel && (
                        <p className="text-sm text-gray-500">
                          {item.category} • {item.roastLevel} Roast
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.subtotal)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.pricePerUnit)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Customer Information</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-gray-900">{customer.phone}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
              </div>
              <p className="text-gray-900">{customer.address.street}</p>
              <p className="text-gray-900">
                {customer.address.city}, {customer.address.state} {customer.address.postalCode}
              </p>
              <p className="text-gray-900">{customer.address.country}</p>
            </div>
          </Card>
        </div>

        {/* Status Updater Sidebar */}
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Update Order Status
              </h2>
              <StatusUpdater
                orderId={order.id}
                currentStatus={order.status}
                currentTrackingId={order.trackingId}
              />
            </div>
          </Card>

          {order.trackingId && (
            <Card>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">
                  Tracking Information
                </h3>
                <p className="text-sm font-medium text-gray-500">Tracking ID</p>
                <p className="text-gray-900 font-mono text-sm">
                  {order.trackingId}
                </p>
              </div>
            </Card>
          )}

          {order.notes && (
            <Card>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">
                  Notes
                </h3>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}