// src/app/(dashboard)/orders/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Package, User, MapPin, Calendar, Mail, Phone, CreditCard, Truck } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { Order, Customer, Address, BadgeVariant } from '@/lib/types/order';
import { StatusUpdateSection } from '@/components/orders/StatusUpdateSection';

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

async function getOrderWithCustomer(orderId: string): Promise<{ order: Order; customer: Customer; deliveryAddress: Address } | null> {
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

    const customerData = customerDoc.data();
    
    // Find the delivery address used for this order
    let deliveryAddress = orderData?.deliveryAddress;

// fallback for legacy orders
if (!deliveryAddress && orderData?.deliveryAddressId) {
  deliveryAddress = customerData?.addresses?.find(
    (addr: Address) => addr.id === orderData.deliveryAddressId
  );
}

// FINAL fallback (never crash UI)
if (!deliveryAddress) {
  deliveryAddress = {
    street: 'Address unavailable',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    label: 'Deleted',
    isDefault: false,
  };
}


    return {
      order: serializeFirestoreData({
        id: orderDoc.id,
        ...orderData,
      }) as Order,
      customer: serializeFirestoreData({
        id: customerDoc.id,
        ...customerData,
      }) as Customer,
      deliveryAddress: serializeFirestoreData(deliveryAddress) as Address,
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
  const { id } = await params;
  const data = await getOrderWithCustomer(id);

  if (!data) {
    notFound();
  }

  const { order, customer, deliveryAddress } = data;

 const getStatusColor = (status: string): BadgeVariant => {
  switch (status) {
    case 'RECEIVED': return 'info';
    case 'ACCEPTED': return 'success';
    case 'PACKED': return 'info';
    case 'SHIPPED': return 'info';
    case 'DELIVERED': return 'success';
    case 'CANCELLED': return 'danger';
    default: return 'default';
  }
};

  const getStatusIcon = (status: string) => {
  switch (status) {
    case 'RECEIVED': return '📥';
    case 'ACCEPTED': return '✅';
    case 'PACKED': return '📦';
    case 'SHIPPED': return '🚚';
    case 'DELIVERED': return '🎉';
    case 'CANCELLED': return '❌';
    default: return '📋';
  }
};

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const statusTimeline = [
  { status: 'RECEIVED', label: 'Received', active: true },
  { status: 'ACCEPTED', label: 'Accepted', active: ['ACCEPTED', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
  { status: 'PACKED', label: 'Packed', active: ['PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
  { status: 'SHIPPED', label: 'Shipped', active: ['SHIPPED', 'DELIVERED'].includes(order.status) },
  { status: 'DELIVERED', label: 'Delivered', active: order.status === 'DELIVERED' },
];

  return (
    <div className="space-y-6 pb-8">
      <Link
        href="/orders"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Link>

      {/* Header with Status */}
      <div className="bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white rounded-xl shadow-md">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Order #{order.orderNumber}
                </h1>
                <Badge variant={getStatusColor(order.status)} className="text-sm px-3 py-1 mt-1">
                  {getStatusIcon(order.status)} {order.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-700">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <Package className="w-4 h-4 text-indigo-600" />
                <span className="font-medium">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-indigo-600">₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status Update Section */}
          <StatusUpdateSection 
            orderId={id}
            currentStatus={order.status}
            orderNumber={order.orderNumber}
            currentTrackingId={order.trackingId}
          />
        </div>

        {/* Status Timeline - Only show if not cancelled */}
        {order.status !== 'CANCELLED' && (
          <div className="mt-8 pt-6 border-t-2 border-indigo-200">
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="absolute top-6 left-0 right-0 h-2 bg-gray-300 rounded-full">
                <div 
                  className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-md"
                  style={{ 
                    width: `${(statusTimeline.filter(s => s.active).length / statusTimeline.length) * 100}%` 
                  }}
                ></div>
              </div>
              
              {/* Timeline Steps */}
              <div className="relative flex justify-between">
                {statusTimeline.map((step, idx) => (
                  <div key={step.status} className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 shadow-lg ${
                      step.active 
                        ? 'bg-linear-to-br from-indigo-500 to-purple-500 text-white scale-110' 
                        : 'bg-white text-gray-400 border-2 border-gray-300'
                    }`}>
                      {step.active ? '✓' : idx + 1}
                    </div>
                    <span className={`text-sm mt-3 font-semibold whitespace-nowrap text-center ${
                      step.active ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xl border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
              <div className="p-2.5 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Order Items</h2>
            </div>

            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="group relative bg-linear-to-r from-gray-50 to-blue-50 rounded-2xl p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    {item.imageUrl ? (
                      <div className="relative w-24 h-24 bg-white rounded-xl overflow-hidden shadow-md shrink-0 ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-md border-2 border-gray-200">
                        <Package className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-xl mb-2">{item.productName}</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {item.category} • {item.roastLevel} Roast
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-3 py-1.5 bg-linear-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-bold text-sm shadow-md">
                          {item.grams}g
                        </span>
                        <span className="px-3 py-1.5 bg-white text-gray-700 rounded-lg font-semibold text-sm shadow-sm border border-gray-200">
                          Qty: {item.quantity}
                        </span>
                        <span className="text-gray-600 text-sm font-medium">
                          ₹{item.pricePerUnit.toFixed(2)} each
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-3xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ₹{item.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t-2 border-gray-200 bg-linear-to-r from-indigo-50 to-purple-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-700">Total Amount</span>
                <span className="text-4xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ₹{order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {/* Tracking Information */}
          {order.trackingId && order.status === 'SHIPPED' && (
            <Card className="bg-linear-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-md">
                  <Truck className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">Tracking Information</h3>
                  <p className="text-sm text-gray-600 mb-3">Your order is on its way!</p>
                  <div className="inline-flex items-center gap-3 px-5 py-3 bg-white rounded-xl border-2 border-blue-200 shadow-md">
                    <span className="text-sm font-semibold text-gray-600">Tracking ID:</span>
                    <span className="font-mono font-bold text-blue-600 text-lg">{order.trackingId}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="shadow-xl border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-100">
              <div className="p-2.5 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl shadow-md">
                <User className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Customer</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Name</p>
                <p className="font-bold text-gray-900 text-lg">{customer.name}</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <Mail className="w-5 h-5 text-blue-500" />
                <a href={`mailto:${customer.email}`} className="text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm">
                  {customer.email}
                </a>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <Phone className="w-5 h-5 text-green-500" />
                <a href={`tel:${customer.phone}`} className="text-gray-700 hover:text-green-600 transition-colors font-medium text-sm">
                  {customer.phone}
                </a>
              </div>
            </div>
          </Card>

          {/* Delivery Address */}
      <Card className="shadow-xl border-2 border-gray-200">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-gray-100">
          <div className="p-2.5 bg-linear-to-br from-orange-500 to-red-500 rounded-xl shadow-md">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
          {deliveryAddress.label && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
              {deliveryAddress.label}
            </span>
          )}
          {deliveryAddress.isDefault && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
              Default
            </span>
          )}
        </div>

        <div className="text-gray-700 leading-relaxed space-y-1">
          <p className="font-semibold text-gray-900">{deliveryAddress.street}</p>
          <p>{deliveryAddress.city}, {deliveryAddress.state}</p>
          <p className="font-medium">{deliveryAddress.postalCode}</p>
          <p className="font-semibold text-gray-900 mt-2 pt-2 border-t border-gray-200">
            {deliveryAddress.country}
          </p>
        </div>

        {/* Show all customer addresses */}
        {customer.addresses && customer.addresses.length > 1 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-600 mb-2">
              Other Addresses ({customer.addresses.length - 1})
            </p>
            <div className="space-y-2">
              {customer.addresses
                .filter((addr) => addr.id !== deliveryAddress.id)
                .slice(0, 2)
                .map((addr) => (
                  <div key={addr.id} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                    {addr.label && <span className="font-semibold">{addr.label}: </span>}
                    {addr.street}, {addr.city}
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>

          {/* Order Summary */}
          <Card className="bg-linear-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-xl">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-purple-200">
              <div className="p-2.5 bg-white rounded-xl shadow-md">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Order Summary</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-purple-200">
                <span className="text-gray-600 font-medium">Order Number</span>
                <span className="font-mono font-bold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">{order.orderNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Total Items</span>
                <span className="font-bold text-gray-900">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Currency</span>
                <span className="font-bold text-gray-900">INR (₹)</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-purple-200">
                <span className="text-gray-600 font-medium">Created</span>
                <span className="font-semibold text-gray-900 text-xs">
                  {formatDate(order.createdAt)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}