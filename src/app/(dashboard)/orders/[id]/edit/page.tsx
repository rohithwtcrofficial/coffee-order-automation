// src/app/(dashboard)/orders/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Package, User, MapPin, Calendar, Mail, Phone, CreditCard, Truck, CheckCircle2, Clock, Box, Send, PartyPopper, XCircle } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { Order, Customer, Address, BadgeVariant } from '@/lib/types/order';
import { StatusUpdateSection } from '@/components/orders/StatusUpdateSection';

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

async function getOrderWithCustomer(orderId: string): Promise<{ order: Order; customer: Customer; deliveryAddress: Address; productImages: Record<string, string> } | null> {
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
    
    let deliveryAddress = orderData?.deliveryAddress;

    if (!deliveryAddress && orderData?.deliveryAddressId) {
      deliveryAddress = customerData?.addresses?.find(
        (addr: Address) => addr.id === orderData.deliveryAddressId
      );
    }

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

    const productImages: Record<string, string> = {};
    const items = orderData?.items || [];
    
    for (const item of items) {
      if (item.productId) {
        try {
          const productDoc = await adminDb.collection('products').doc(item.productId).get();
          if (productDoc.exists) {
            const productData = productDoc.data();
            if (productData?.imageUrl) {
              productImages[item.productId] = productData.imageUrl;
            }
          }
        } catch (error) {
          console.error(`Error fetching product ${item.productId}:`, error);
        }
      }
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
      productImages,
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

  const { order, customer, deliveryAddress, productImages } = data;

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return { bg: 'bg-cyan-600', border: 'border-cyan-700', icon: <Clock className="w-5 h-5" /> };
      case 'ACCEPTED':
        return { bg: 'bg-emerald-600', border: 'border-emerald-700', icon: <CheckCircle2 className="w-5 h-5" /> };
      case 'PACKED':
        return { bg: 'bg-orange-600', border: 'border-orange-700', icon: <Box className="w-5 h-5" /> };
      case 'SHIPPED':
        return { bg: 'bg-blue-600', border: 'border-blue-700', icon: <Send className="w-5 h-5" /> };
      case 'DELIVERED':
        return { bg: 'bg-green-600', border: 'border-green-700', icon: <PartyPopper className="w-5 h-5" /> };
      case 'CANCELLED':
        return { bg: 'bg-red-600', border: 'border-red-700', icon: <XCircle className="w-5 h-5" /> };
      default:
        return { bg: 'bg-gray-600', border: 'border-gray-700', icon: <Package className="w-5 h-5" /> };
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
    { status: 'RECEIVED', label: 'Received', icon: <Clock className="w-5 h-5" />, color: 'cyan', active: true },
    { status: 'ACCEPTED', label: 'Accepted', icon: <CheckCircle2 className="w-5 h-5" />, color: 'emerald', active: ['ACCEPTED', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
    { status: 'PACKED', label: 'Packed', icon: <Box className="w-5 h-5" />, color: 'orange', active: ['PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
    { status: 'SHIPPED', label: 'Shipped', icon: <Send className="w-5 h-5" />, color: 'blue', active: ['SHIPPED', 'DELIVERED'].includes(order.status) },
    { status: 'DELIVERED', label: 'Delivered', icon: <PartyPopper className="w-5 h-5" />, color: 'green', active: order.status === 'DELIVERED' },
  ];

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Back Button */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors bg-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow border border-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 space-y-5">
                {/* Order Title & Status */}
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 ${statusConfig.bg} rounded-xl shadow-lg`}>
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3">
                      Order #{order.orderNumber}
                    </h1>
                    <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 ${statusConfig.bg} rounded-lg shadow-md border-2 ${statusConfig.border}`}>
                      <div className="text-white">
                        {statusConfig.icon}
                      </div>
                      <span className="text-white font-bold text-base uppercase tracking-wide">{order.status}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gray-900 rounded-lg">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Order Date</span>
                    </div>
                    <p className="text-base font-bold text-gray-900">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gray-900 rounded-lg">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total Items</span>
                    </div>
                    <p className="text-base font-bold text-gray-900">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} Items
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gray-900 rounded-lg">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Total Amount</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">
                      ₹{order.totalAmount.toFixed(2)}
                    </p>
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

            {/* Status Timeline */}
            {order.status !== 'CANCELLED' && (
              <div className="mt-8 pt-6 border-t-2 border-gray-100">
                <div className="relative">
                  {/* Progress Bar */}
                  <div className="absolute top-7 left-0 right-0 h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full bg-gray-900 rounded-full transition-all duration-1000 ease-out`}
                      style={{ 
                        width: `${(statusTimeline.filter(s => s.active).length / statusTimeline.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Timeline Steps */}
                  <div className="relative flex justify-between">
                    {statusTimeline.map((step, idx) => (
                      <div key={step.status} className="flex flex-col items-center gap-3">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold transition-all duration-500 border-3 ${
                          step.active 
                            ? 'bg-gray-900 text-white shadow-xl scale-110 border-gray-900' 
                            : 'bg-white text-gray-400 border-gray-300 shadow'
                        }`}>
                          {step.active ? step.icon : <span className="text-sm font-bold">{idx + 1}</span>}
                        </div>
                        <span className={`text-xs font-bold uppercase tracking-wider text-center max-w-20 ${
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-6 py-5 border-b-4 border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wide">Order Items</h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {order.items.map((item, index) => {
                  const currentImageUrl = item.productId ? productImages[item.productId] : null;
                  const imageUrl = currentImageUrl;

                  return (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-5 border-2 border-gray-200 hover:border-gray-900 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-5">
                        {imageUrl ? (
                          <div className="w-24 h-24 bg-white rounded-lg overflow-hidden shadow-md shrink-0 border-2 border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border-2 border-gray-200">
                            <Package className="w-10 h-10 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="font-black text-gray-900 text-lg">{item.productName}</h3>
                          <p className="text-sm font-bold text-gray-600">
                            {item.category} • {item.roastLevel} Roast
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-4 py-1.5 bg-gray-900 text-white rounded-lg font-bold text-sm">
                              {item.grams}g
                            </span>
                            <span className="px-4 py-1.5 bg-white text-gray-900 rounded-lg font-bold text-sm border-2 border-gray-300">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-gray-700 text-sm font-bold">
                              ₹{item.pricePerUnit.toFixed(2)} each
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-3xl font-black text-gray-900">
                            ₹{item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-100 px-6 py-5 border-t-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-gray-700 uppercase tracking-wide">Total Amount</span>
                  <span className="text-4xl font-black text-gray-900">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {order.trackingId && order.status === 'SHIPPED' && (
              <div className="bg-blue-600 rounded-xl p-6 shadow-lg border-2 border-blue-700">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Truck className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-xl mb-2 uppercase tracking-wide">Package In Transit</h3>
                    <p className="text-blue-100 text-sm mb-4 font-semibold">Your order is on its way!</p>
                    <div className="inline-flex items-center gap-4 px-5 py-3 bg-white rounded-lg shadow-md border-2 border-blue-200">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tracking ID</span>
                      <span className="font-mono font-black text-blue-600 text-lg">{order.trackingId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-emerald-600 px-6 py-5 border-b-4 border-emerald-700">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wide">Customer</h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-black uppercase tracking-widest">Full Name</p>
                  <p className="font-black text-gray-900 text-xl">{customer.name}</p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <a href={`mailto:${customer.email}`} className="text-gray-900 hover:text-blue-600 transition-colors font-bold text-sm flex-1 truncate">
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <a href={`tel:${customer.phone}`} className="text-gray-900 hover:text-green-600 transition-colors font-bold text-sm">
                    {customer.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-orange-600 px-6 py-5 border-b-4 border-orange-700">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="p-2.5 bg-white/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wide">Delivery Address</h2>
                  {deliveryAddress.label && (
                    <span className="px-3 py-1 bg-white/90 text-orange-600 rounded-lg text-xs font-black uppercase tracking-wider">
                      {deliveryAddress.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-2 text-gray-700">
                <p className="font-black text-gray-900 text-base">{deliveryAddress.street}</p>
                <p className="font-bold text-sm">{deliveryAddress.city}, {deliveryAddress.state}</p>
                <p className="font-bold text-sm">{deliveryAddress.postalCode}</p>
                <p className="font-black text-gray-900 text-sm mt-3 pt-3 border-t-2 border-gray-100">
                  {deliveryAddress.country}
                </p>
              </div>

              {customer.addresses && customer.addresses.length > 1 && (
                <div className="px-6 pb-6">
                  <div className="pt-4 border-t-2 border-gray-100">
                    <p className="text-xs font-black text-gray-600 mb-3 uppercase tracking-wider">
                      Other Addresses ({customer.addresses.length - 1})
                    </p>
                    <div className="space-y-2">
                      {customer.addresses
                        .filter((addr) => addr.id !== deliveryAddress.id)
                        .slice(0, 2)
                        .map((addr) => (
                          <div key={addr.id} className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg font-semibold border border-gray-200">
                            {addr.label && <span className="font-black text-gray-700">{addr.label}: </span>}
                            {addr.street}, {addr.city}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden border-2 border-gray-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-700">
                  <div className="p-2.5 bg-white/10 rounded-lg">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-black text-white text-lg uppercase tracking-wide">Summary</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                    <span className="text-gray-400 font-bold uppercase tracking-wide">Order Number</span>
                    <span className="font-mono font-black text-white bg-white/10 px-4 py-2 rounded-lg text-base">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-bold uppercase tracking-wide">Total Items</span>
                    <span className="font-black text-white text-lg">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-bold uppercase tracking-wide">Currency</span>
                    <span className="font-black text-white text-lg">INR (₹)</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <span className="text-gray-400 font-bold uppercase tracking-wide">Created</span>
                    <span className="font-bold text-white text-xs">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}