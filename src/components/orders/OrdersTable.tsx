// src/components/orders/OrdersTable.tsx
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Order, BadgeVariant } from '@/lib/types/order';
import { Eye, Package, Calendar, DollarSign, Search, Filter } from 'lucide-react';
import Link from 'next/link';

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const getStatusColor = (status: string): BadgeVariant => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLACED': return '📦';
      case 'PROCESSING': return '⚙️';
      case 'SHIPPED': return '🚚';
      case 'DELIVERED': return '✅';
      case 'CANCELLED': return '❌';
      default: return '📋';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    ALL: orders.length,
    PLACED: orders.filter(o => o.status === 'PLACED').length,
    PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
    SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-600 mb-6">Start by creating your first order</p>
        <Link
          href="/orders/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Package className="w-4 h-4" />
          Create Order
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by order number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Status Filter Tabs */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' ? '📊' : getStatusIcon(status)} {status} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid - Better for mobile */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No orders found matching your filters</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all duration-200 hover:border-primary-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {order.orderNumber}
                    </h3>
                    <Badge variant={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)} {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(order.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600 mb-1">
                    ₹{order.totalAmount.toFixed(2)}
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
                    >
                      {item.imageUrl ? (
                        <div className="w-6 h-6 rounded overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <Package className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900">
                        {item.productName}
                      </span>
                      <span className="text-gray-600">
                        {item.grams}g × {item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="inline-flex items-center px-3 py-1.5 bg-primary-50 rounded-lg text-sm font-medium text-primary-700">
                      +{order.items.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {filteredOrders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Total Orders</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{filteredOrders.length}</div>
          </div>
          
          <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              ₹{filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
            </div>
          </div>
          
          <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium">Total Items</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {filteredOrders.reduce((sum, o) => 
                sum + o.items.reduce((s, i) => s + i.quantity, 0), 0
              )}
            </div>
          </div>
          
          <div className="bg-linear-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Avg Order Value</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              ₹{(filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0) / filteredOrders.length).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}