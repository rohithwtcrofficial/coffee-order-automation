// src/app/(dashboard)/orders/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Package, User, MapPin, Calendar, Mail, Phone, CreditCard, Truck, CheckCircle2, Clock, Box, Send, PartyPopper, XCircle } from 'lucide-react';
import Link from 'next/link';
import { adminDb } from '@/lib/firebase/admin';
import { Order, Customer, Address, BadgeVariant } from '@/lib/types/order';
import { StatusUpdateSection } from '@/components/orders/StatusUpdateSection';

// Helper function to recursively convert Firestore Timestamps to ISO strings
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

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'RECEIVED': return 'from-blue-500 via-indigo-500 to-purple-500';
      case 'ACCEPTED': return 'from-green-500 via-emerald-500 to-teal-500';
      case 'PACKED': return 'from-amber-500 via-orange-500 to-yellow-500';
      case 'SHIPPED': return 'from-cyan-500 via-blue-500 to-indigo-500';
      case 'DELIVERED': return 'from-green-600 via-emerald-600 to-teal-600';
      case 'CANCELLED': return 'from-red-500 via-rose-500 to-pink-500';
      default: return 'from-gray-500 via-slate-500 to-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECEIVED': return <Clock className="w-5 h-5" />;
      case 'ACCEPTED': return <CheckCircle2 className="w-5 h-5" />;
      case 'PACKED': return <Box className="w-5 h-5" />;
      case 'SHIPPED': return <Send className="w-5 h-5" />;
      case 'DELIVERED': return <PartyPopper className="w-5 h-5" />;
      case 'CANCELLED': return <XCircle className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
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
    { status: 'RECEIVED', label: 'Order Received', icon: <Clock className="w-5 h-5" />, active: true },
    { status: 'ACCEPTED', label: 'Accepted', icon: <CheckCircle2 className="w-5 h-5" />, active: ['ACCEPTED', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
    { status: 'PACKED', label: 'Packed', icon: <Box className="w-5 h-5" />, active: ['PACKED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
    { status: 'SHIPPED', label: 'In Transit', icon: <Send className="w-5 h-5" />, active: ['SHIPPED', 'DELIVERED'].includes(order.status) },
    { status: 'DELIVERED', label: 'Delivered', icon: <PartyPopper className="w-5 h-5" />, active: order.status === 'DELIVERED' },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Back Button */}
        <Link
          href="/orders"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-all duration-300 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-sm hover:shadow-md border border-slate-200 hover:border-indigo-300"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          Back to Orders
        </Link>

        {/* Hero Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-indigo-50 to-purple-50 border border-indigo-100 shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-linear-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-linear-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex-1 space-y-6">
                {/* Order Header */}
                <div className="flex items-start gap-5">
                  <div className={`p-4 bg-linear-to-br ${getStatusGradient(order.status)} rounded-2xl shadow-lg`}>
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight">
                      Order <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">#{order.orderNumber}</span>
                    </h1>
                    <div className={`inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r ${getStatusGradient(order.status)} rounded-full shadow-lg`}>
                      <div className="text-white">
                        {getStatusIcon(order.status)}
                      </div>
                      <span className="text-white font-bold text-base tracking-wide">{order.status}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Date</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-linear-to-br from-emerald-500 to-teal-500 rounded-lg">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Items</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} Items
                    </p>
                  </div>

                  <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100 hover:border-indigo-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-linear-to-br from-amber-500 to-orange-500 rounded-lg">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
                    </div>
                    <p className="text-2xl font-black bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
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
              <div className="mt-10 pt-8 border-t border-indigo-100">
                <div className="relative">
                  {/* Progress Bar */}
                  <div className="absolute top-7 left-0 right-0 h-1.5 bg-slate-200 rounded-full">
                    <div 
                      className={`h-full bg-linear-to-r ${getStatusGradient(order.status)} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                      style={{ 
                        width: `${(statusTimeline.filter(s => s.active).length / statusTimeline.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Timeline Steps */}
                  <div className="relative flex justify-between">
                    {statusTimeline.map((step, idx) => (
                      <div key={step.status} className="flex flex-col items-center gap-3 relative">
                        <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 ${
                          step.active 
                            ? `bg-linear-to-br ${getStatusGradient(order.status)} text-white shadow-xl scale-110 rotate-3` 
                            : 'bg-white text-slate-400 border-2 border-slate-200 shadow-md'
                        }`}>
                          {step.active ? step.icon : <span className="text-sm">{idx + 1}</span>}
                        </div>
                        <div className="text-center max-w-25">
                          <span className={`text-xs font-bold tracking-wide ${
                            step.active ? 'text-slate-900' : 'text-slate-500'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 px-8 py-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Order Items</h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {order.items.map((item, index) => {
                  const currentImageUrl = item.productId ? productImages[item.productId] : null;
                  const imageUrl = currentImageUrl;

                  return (
                    <div
                      key={index}
                      className="group relative bg-linear-to-br from-slate-50 to-indigo-50 rounded-2xl p-6 border-2 border-slate-100 hover:border-indigo-300 hover:shadow-2xl transition-all duration-500"
                    >
                      <div className="flex items-center gap-6">
                        {imageUrl ? (
                          <div className="relative w-28 h-28 bg-white rounded-2xl overflow-hidden shadow-lg shrink-0 ring-4 ring-slate-100 group-hover:ring-indigo-300 transition-all duration-500">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={imageUrl}
                              alt={item.productName}
                              className="w-full h-full object-cover group-hover:scale-125 group-hover:rotate-3 transition-all duration-700"
                            />
                          </div>
                        ) : (
                          <div className="w-28 h-28 bg-linear-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                            <Package className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0 space-y-3">
                          <h3 className="font-black text-slate-900 text-xl tracking-tight">{item.productName}</h3>
                          <p className="text-sm font-semibold text-slate-600">
                            {item.category} <span className="text-slate-400">•</span> {item.roastLevel} Roast
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-4 py-2 bg-linear-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-black text-sm shadow-lg">
                              {item.grams}g
                            </span>
                            <span className="px-4 py-2 bg-white text-slate-700 rounded-xl font-bold text-sm shadow-md border-2 border-slate-200">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-slate-600 text-sm font-bold">
                              ₹{item.pricePerUnit.toFixed(2)} each
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-4xl font-black bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            ₹{item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 px-8 py-6 border-t-2 border-indigo-100">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-slate-700 tracking-tight">Total Amount</span>
                  <span className="text-5xl font-black bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    ₹{order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tracking Information */}
            {order.trackingId && order.status === 'SHIPPED' && (
              <div className="relative overflow-hidden bg-linear-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-3xl p-8 shadow-2xl">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative flex items-start gap-5">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl">
                    <Truck className="w-9 h-9 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-white text-2xl mb-2 tracking-tight">Package In Transit</h3>
                    <p className="text-cyan-100 text-base mb-5 font-medium">Your order is on its way to you!</p>
                    <div className="inline-flex items-center gap-4 px-6 py-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-white/50">
                      <span className="text-sm font-bold text-slate-600 tracking-wide">TRACKING ID</span>
                      <span className="font-mono font-black text-indigo-600 text-xl">{order.trackingId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Customer Information */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-linear-to-r from-emerald-500 to-teal-500 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">Customer Info</h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <p className="text-xs text-slate-500 mb-2 font-black uppercase tracking-widest">Full Name</p>
                  <p className="font-black text-slate-900 text-xl tracking-tight">{customer.name}</p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all duration-300 border border-blue-100">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <a href={`mailto:${customer.email}`} className="text-slate-700 hover:text-blue-600 transition-colors font-bold text-sm flex-1 truncate">
                    {customer.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 p-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all duration-300 border border-green-100">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <a href={`tel:${customer.phone}`} className="text-slate-700 hover:text-green-600 transition-colors font-bold text-sm">
                    {customer.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-linear-to-r from-orange-500 to-red-500 px-6 py-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">Delivery Address</h2>
                  {deliveryAddress.label && (
                    <span className="px-3 py-1.5 bg-white/90 text-orange-600 rounded-lg text-xs font-black uppercase tracking-wider">
                      {deliveryAddress.label}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-2 text-slate-700 leading-relaxed">
                <p className="font-black text-slate-900 text-lg">{deliveryAddress.street}</p>
                <p className="font-semibold text-base">{deliveryAddress.city}, {deliveryAddress.state}</p>
                <p className="font-bold text-base">{deliveryAddress.postalCode}</p>
                <p className="font-black text-slate-900 text-base mt-3 pt-3 border-t border-slate-200">
                  {deliveryAddress.country}
                </p>
              </div>

              {customer.addresses && customer.addresses.length > 1 && (
                <div className="px-6 pb-6">
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-black text-slate-600 mb-3 uppercase tracking-wider">
                      Other Addresses ({customer.addresses.length - 1})
                    </p>
                    <div className="space-y-2">
                      {customer.addresses
                        .filter((addr) => addr.id !== deliveryAddress.id)
                        .slice(0, 2)
                        .map((addr) => (
                          <div key={addr.id} className="text-xs text-slate-600 p-3 bg-slate-50 rounded-lg font-semibold">
                            {addr.label && <span className="font-black text-slate-700">{addr.label}: </span>}
                            {addr.street}, {addr.city}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-linear-to-br from-purple-500 via-pink-500 to-rose-500 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-black text-white text-xl tracking-tight">Order Summary</h3>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-white/30">
                    <span className="text-purple-100 font-bold tracking-wide">Order Number</span>
                    <span className="font-mono font-black text-white bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-base">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-100 font-bold tracking-wide">Total Items</span>
                    <span className="font-black text-white text-lg">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-100 font-bold tracking-wide">Total Amount</span>
                    <span className="font-black text-white text-lg">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/30">
                    <span className="text-purple-100 font-bold tracking-wide">Created</span>
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