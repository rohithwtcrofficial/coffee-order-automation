// src/app/(dashboard)/orders/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Package, User, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { Order, Customer } from '@/lib/types';

async function getOrderWithCustomer(orderId: string): Promise<{ order: Order; customer: Customer } | null> {
  try {
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return null;
    }

    const orderData = orderDoc.data();
    const customerDoc = await adminDb.collection('customers').doc(orderData?.customerId).get();

    if (!customerDoc.exists) {
      return null;
    }

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
  params: Promise<{ id: string }>;
}) {
  // Await params in Next.js 15+
  const { id } = await params;
  const data = await getOrderWithCustomer(id);

  if (!data) {
    notFound();
  }

  const { order, customer } = data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED':
        return 'warning';
      case 'PROCESSING':
        return 'info';
      case 'SHIPPED':
        return 'info';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/orders"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
        </div>
        <Badge variant={getStatusColor(order.status) as any}>
          {order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
            </div>

            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {item.imageUrl ? (
                      <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">
                        {item.category} • {item.roastLevel} Roast
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.grams}g × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{item.subtotal.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">
                      ₹{item.pricePerUnit.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-xl font-bold">
                <span>Total Amount</span>
                <span className="text-primary-600">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Order Timeline */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Order Timeline</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <p className="font-medium text-gray-900">Order Placed</p>
                  <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              {order.updatedAt && order.updatedAt.getTime() !== order.createdAt.getTime() && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">{formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Customer Information */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-900">{customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{customer.phone}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
            </div>

            <div className="text-gray-900">
              <p>{customer.address.street}</p>
              <p>
                {customer.address.city}, {customer.address.state}
              </p>
              <p>{customer.address.postalCode}</p>
              <p>{customer.address.country}</p>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Order Number</span>
                <span className="font-medium text-gray-900">{order.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Items</span>
                <span className="font-medium text-gray-900">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Currency</span>
                <span className="font-medium text-gray-900">INR (₹)</span>
              </div>
            </div>
          </Card>

          <Link href={`/orders/${id}/edit`}>
            <Button className="w-full">Update Order Status</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}