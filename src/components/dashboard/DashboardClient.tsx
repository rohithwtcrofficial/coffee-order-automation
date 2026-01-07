// src/components/dashboard/DashboardClient.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  ShoppingCart, Package, Users, TrendingUp, Search, 
  Filter, Calendar, DollarSign, ArrowUpRight, ArrowDownRight,
  Download, RefreshCw, MapPin, Clock, CheckCircle, 
  XCircle, AlertCircle, Truck, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/formatters';
import type { Order, Customer, Product } from '@/lib/types/order';

interface DashboardProps {
  initialOrders: Order[];
  initialCustomers: Customer[];
  initialProducts: Product[];
}

export default function DashboardClient({ 
  initialOrders, 
  initialCustomers, 
  initialProducts 
}: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');

  // Refresh data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/dashboard/refresh');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setCustomers(data.customers);
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setIsRefreshing(false);
  };

  // Filter data based on date range
  const getDateFilter = useCallback(() => {
    const now = new Date();
    switch (dateRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  }, [dateRange]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    const dateFilter = getDateFilter();

    if (dateFilter) {
      filtered = filtered.filter(order => {
        const orderDate = order.createdAt instanceof Date 
          ? order.createdAt 
          : new Date(order.createdAt);
        return orderDate >= dateFilter;
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.items.some(item => item.category === categoryFilter)
      );
    }

    if (customerFilter !== 'all') {
      filtered = filtered.filter(order => order.customerId === customerFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.trackingId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [orders, dateRange, statusFilter, categoryFilter, customerFilter, searchTerm, getDateFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const previousDateFilter = getDateFilter();
    
    let previousOrders = orders;
    if (previousDateFilter) {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const prevStart = new Date(previousDateFilter.getTime() - days * 24 * 60 * 60 * 1000);
      previousOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Date 
          ? order.createdAt 
          : new Date(order.createdAt);
        return orderDate >= prevStart && orderDate < previousDateFilter;
      });
    }

    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const orderChange = previousOrders.length > 0
      ? ((filteredOrders.length - previousOrders.length) / previousOrders.length) * 100
      : 0;

    const avgOrderValue = filteredOrders.length > 0 
      ? totalRevenue / filteredOrders.length 
      : 0;

    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categorySales = filteredOrders.reduce((acc, order) => {
      order.items.forEach(item => {
        acc[item.category] = (acc[item.category] || 0) + item.subtotal;
      });
      return acc;
    }, {} as Record<string, number>);

    const topProducts = filteredOrders.reduce((acc, order) => {
      order.items.forEach(item => {
        if (!acc[item.productId]) {
          acc[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        acc[item.productId].quantity += item.quantity;
        acc[item.productId].revenue += item.subtotal;
      });
      return acc;
    }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

    const topProductsList = Object.entries(topProducts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topCustomers = customers
      .filter(c => filteredOrders.some(o => o.customerId === c.id))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      activeProducts: products.length,
      totalCustomers: customers.length,
      avgOrderValue,
      revenueChange,
      orderChange,
      statusCounts,
      categorySales,
      topProducts: topProductsList,
      topCustomers
    };
  }, [filteredOrders, orders, customers, products, dateRange, getDateFilter]);

  // Unique categories and customers for filters
  const categories = useMemo(() => {
    const cats = new Set<string>();
    orders.forEach(order => {
      order.items.forEach(item => cats.add(item.category));
    });
    return Array.from(cats).sort();
  }, [orders]);

  const getStatusColor = (status: string) => {
    const colors = {
      PLACED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      PLACED: Clock,
      PROCESSING: AlertCircle,
      SHIPPED: Truck,
      DELIVERED: CheckCircle,
      CANCELLED: XCircle
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const exportData = () => {
    const csv = [
      ['Order Number', 'Customer', 'Status', 'Total', 'Date'],
      ...filteredOrders.map(order => {
        const customer = customers.find(c => c.id === order.customerId);
        const date = order.createdAt instanceof Date 
          ? order.createdAt.toLocaleDateString() 
          : new Date(order.createdAt).toLocaleDateString();
        return [
          order.orderNumber,
          customer?.name || 'Unknown',
          order.status,
          order.totalAmount.toString(),
          date
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time business analytics and insights</p>
        </div>
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Customers</option>
            {customers.slice(0, 20).map(customer => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalOrders}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {stats.orderChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${stats.orderChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(stats.orderChange).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500">vs previous period</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {stats.revenueChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${stats.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(stats.revenueChange).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500">vs previous period</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.avgOrderValue)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Per transaction
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.activeProducts}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {stats.totalCustomers} customers
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Order Status</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => {
              const percentage = (count / stats.totalOrders) * 100;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="text-sm font-medium text-gray-700">{status}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getStatusColor(status).replace('text-', 'bg-').replace('100', '500')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Category Sales */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Sales by Category</h3>
            <PieChartIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {Object.entries(stats.categorySales)
              .sort((a, b) => b[1] - a[1])
              .map(([category, revenue]) => {
                const percentage = (revenue / stats.totalRevenue) * 100;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-linear-to-r from-blue-500 to-purple-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Top Products and Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-4">
            {stats.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4">
                <div className="shrink-0 w-8 h-8 bg-linear-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.quantity} units sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Customers</h3>
          <div className="space-y-4">
            {stats.topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-4">
                <div className="shrink-0 w-8 h-8 bg-linear-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {customer.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {customer.totalOrders} orders
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order #</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Total</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0, 10).map((order) => {
                const customer = customers.find(c => c.id === order.customerId);
                const date = order.createdAt instanceof Date 
                  ? order.createdAt 
                  : new Date(order.createdAt);
                
                return (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {customer?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{customer?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {order.items.length} items
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {date.toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}