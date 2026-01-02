// src/app/(dashboard)/customers/[id]/page.tsx
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/utils/formatters';
import { adminDb } from '@/lib/firebase/admin';
import { Customer, Order } from '@/lib/types';
import { ArrowLeft, User, Mail, Phone, MapPin, ShoppingCart, Package } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';

async function getCustomerWithOrders(customerId: string): Promise<{ customer: Customer; orders: Order[] } | null> {
  try {
    const customerDoc = await adminDb.collection('customers').doc(customerId).get();
    
    if (!customerDoc.exists) {
      return null;
    }

    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('customerId', '==', customerId)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Order[];

    return {
      customer: {
        id: customerDoc.id,
        ...customerDoc.data(),
        createdAt: customerDoc.data()?.createdAt?.toDate() || new Date(),
      } as Customer,
      orders,
    };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
     const { id } = await params;
    const data = await getCustomerWithOrders(id);

  if (!data) {
    notFound();
  }

  const { customer, orders } = data;

  return (
    <div className="space-y-6">
      <Link 
        href="/customers"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Customers
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
        <p className="text-gray-600 mt-1">Customer since {formatDateShort(customer.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Sidebar */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{customer.email}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Address */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Address</h2>
            </div>
            <div className="text-sm text-gray-900 space-y-1">
              <p>{customer.address.street}</p>
              <p>
                {customer.address.city}, {customer.address.state} {customer.address.postalCode}
              </p>
              <p>{customer.address.country}</p>
            </div>
          </Card>

          {/* Stats */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Orders</span>
                <Badge variant="info">{customer.totalOrders}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Spent</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(customer.totalSpent)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Order</span>
                <span className="text-sm font-semibold text-gray-900">
                  {customer.totalOrders > 0
                    ? formatCurrency(customer.totalSpent / customer.totalOrders)
                    : '$0.00'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Orders List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
              <Badge variant="default">{orders.length}</Badge>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/orders/${order.id}`}
                    className="block"
                  >
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">
                              {item.productName} ({item.grams}g) × {item.quantity}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total</span>
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      {order.trackingId && (
                        <div className="mt-2 text-xs text-gray-600">
                          Tracking: {order.trackingId}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
