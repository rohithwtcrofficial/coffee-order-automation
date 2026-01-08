// src/components/dashboard/DashboardClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  ShoppingCart, Package, Users, TrendingUp, Search, 
  Calendar, DollarSign, Activity, ArrowUpRight, ArrowDownRight,
  Clock, Star, Box, AlertCircle, CheckCircle, XCircle,
  BarChart3, PieChart, RefreshCw, Download, Eye,
  Coffee, Award, Target, Zap, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import type { Order, Customer, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import Link from 'next/link';

interface DashboardClientProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
}

export default function DashboardClient({ orders, customers, products }: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    
    const recentOrders = orders.filter(order => {
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      return orderDate >= daysAgo;
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const recentRevenue = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const activeProducts = products.filter(p => p.isActive).length;
    const lowStockProducts = products.filter(p => p.stockQuantity < 10).length;
    
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    
    const statusCounts = {
  RECEIVED: orders.filter(o => o.status === 'RECEIVED').length,
  ACCEPTED: orders.filter(o => o.status === 'ACCEPTED').length,
  PACKED: orders.filter(o => o.status === 'PACKED').length,
  SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
  DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
  CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
};

    // Calculate growth rates (comparing with previous period)
    const previousPeriodStart = new Date(daysAgo.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
    const previousOrders = orders.filter(order => {
      const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
      return orderDate >= previousPeriodStart && orderDate < daysAgo;
    });
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const orderGrowth = previousOrders.length > 0 ? ((recentOrders.length - previousOrders.length) / previousOrders.length) * 100 : 0;

    return {
      totalOrders: orders.length,
      recentOrders: recentOrders.length,
      totalRevenue,
      recentRevenue,
      activeProducts,
      totalCustomers: customers.length,
      avgOrderValue,
      lowStockProducts,
      statusCounts,
      revenueGrowth,
      orderGrowth,
    };
  }, [orders, products, customers, dateRange]);

  // Revenue chart data (last 7 periods)
  const revenueChartData = useMemo(() => {
    const periods = 7;
    const periodLength = Math.floor(parseInt(dateRange) / periods);
    const data = [];
    const now = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      const periodEnd = new Date(now.getTime() - i * periodLength * 24 * 60 * 60 * 1000);
      const periodStart = new Date(periodEnd.getTime() - periodLength * 24 * 60 * 60 * 1000);
      
      const periodOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
        return orderDate >= periodStart && orderDate < periodEnd;
      });

      const revenue = periodOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      data.push({
        name: periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.round(revenue),
        orders: periodOrders.length
      });
    }

    return data;
  }, [orders, dateRange]);

  // Category distribution
  const categoryData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.category || 'Unknown';
        categoryCounts[category] = (categoryCounts[category] || 0) + item.quantity;
      });
    });

    const colors = ['#f59e0b', '#d97706', '#92400e', '#78350f', '#451a03'];
    
    return Object.entries(categoryCounts).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }));
  }, [orders]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { 
      name: string; 
      sales: number; 
      revenue: number; 
      category: string; 
      imageUrl?: string 
    }> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            sales: 0,
            revenue: 0,
            category: item.category || 'Unknown',
            imageUrl: item.imageUrl
          };
        }
        productSales[item.productId].sales += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  // Recent orders
  const recentOrdersList = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [orders]);

  // Top customers
  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }, [customers]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }).slice(0, 10);
  }, [products, searchTerm, categoryFilter]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      return customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    }).slice(0, 10);
  }, [customers, searchTerm]);

  const getStatusColor = (status: string) => {
  switch (status) {
    case 'DELIVERED': return 'text-green-600 bg-green-100';
    case 'SHIPPED': return 'text-blue-600 bg-blue-100';
    case 'PACKED': return 'text-orange-600 bg-orange-100';
    case 'ACCEPTED': return 'text-emerald-600 bg-emerald-100';
    case 'RECEIVED': return 'text-cyan-600 bg-cyan-100';
    case 'CANCELLED': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="max-w-1600px mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-xl">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">Real-time business analytics</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500 transition-colors bg-white"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-1600 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-blue-600 opacity-5"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                {stats.orderGrowth !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${stats.orderGrowth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {stats.orderGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(stats.orderGrowth).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500">{stats.recentOrders} in last {dateRange} days</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-linear-to-br from-green-500 to-emerald-600 opacity-5"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                {stats.revenueGrowth !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${stats.revenueGrowth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {stats.revenueGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(stats.revenueGrowth).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-gray-500">Avg: {formatCurrency(stats.avgOrderValue)}/order</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500 to-purple-600 opacity-5"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                {stats.lowStockProducts > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    <AlertCircle className="w-3 h-3" />
                    {stats.lowStockProducts}
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Active Products</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.activeProducts}</p>
              <p className="text-xs text-gray-500">of {products.length} total</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-linear-to-br from-amber-500 to-orange-600 opacity-5"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-500">Registered users</p>
            </div>
          </Card>
        </div>

        {/* Order Status Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="p-4 border-l-4 border-cyan-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Received</p>
                <p className="text-xl font-bold text-gray-900">{stats.statusCounts.RECEIVED}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Accepted</p>
                <p className="text-xl font-bold text-gray-900">{stats.statusCounts.ACCEPTED}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Packed</p>
                <p className="text-xl font-bold text-gray-900">{stats.statusCounts.PACKED}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <Box className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Shipped</p>
                <p className="text-xl font-bold text-gray-900">{stats.statusCounts.SHIPPED}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Delivered</p>
                <p className="text-xl font-bold text-gray-900">{stats.statusCounts.DELIVERED}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Cancelled</p>
                <p className="text-xl font-bold text-gray-900">{stats.statusCounts.CANCELLED}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend */}
          <Card className="lg:col-span-2 p-6 border-none shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Revenue Trend
                </h3>
                <p className="text-sm text-gray-600 mt-1">Last {dateRange} days performance</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                  formatter={(value: any) => ['₹' + value.toLocaleString(), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Category Distribution */}
          <Card className="p-6 border-none shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-amber-600" />
                  Categories
                </h3>
                <p className="text-sm text-gray-600 mt-1">Sales distribution</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: 'none', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {categoryData.map((cat, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-gray-700 font-medium">{cat.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{cat.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Search & Filter Section */}
        <Card className="p-6 border-none shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors bg-white"
            >
              <option value="all">All Status</option>
              <option value="RECEIVED">Order Received</option>
              <option value="ACCEPTED">Order Accepted</option>
              <option value="PACKED">Order Packed</option>
              <option value="SHIPPED">Order Shipped</option>
              <option value="DELIVERED">Order Delivered</option>
              <option value="CANCELLED">Order Cancelled</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 transition-colors bg-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>

          {searchTerm && (
            <div className="space-y-4">
              {filteredProducts.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Products ({filteredProducts.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {filteredProducts.map(product => (
                      <Link 
                        key={product.id} 
                        href={`/products/${product.id}/edit`}
                        className="p-4 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Coffee className="w-6 h-6 text-amber-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">{product.category}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-amber-700">{product.roastLevel}</span>
                              {product.stockQuantity < 10 && (
                                <span className="text-xs text-red-600 font-medium">Low stock</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {filteredCustomers.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Customers ({filteredCustomers.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className="p-4 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-1">{customer.email}</p>
                            <p className="text-xs font-bold text-green-700 mt-0.5">
                              {formatCurrency(customer.totalSpent)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Top Products & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card className="p-6 border-none shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Top Products
                </h3>
                <p className="text-sm text-gray-600 mt-1">Best sellers this period</p>
              </div>
              <Link href="/products" className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-linear-to-r from-gray-50 to-amber-50 rounded-xl hover:shadow-md transition-all group">
                    <div className="relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <Coffee className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-600">{product.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600">{product.sales} sold</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-bold text-green-700">{formatCurrency(product.revenue)}</span>
                      </div>
                    </div>
                    <Target className="w-5 h-5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Coffee className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No sales data available yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Orders */}
          <Card className="p-6 border-none shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Recent Orders
                </h3>
                <p className="text-sm text-gray-600 mt-1">Latest transactions</p>
              </div>
              <Link href="/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrdersList.length > 0 ? (
                recentOrdersList.map((order) => {
                  const customer = customers.find(c => c.id === order.customerId);
                  const orderDate = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
                  return (
                    <Link 
                      key={order.id} 
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-4 p-4 bg-linear-to-r from-gray-50 to-blue-50 rounded-xl hover:shadow-md transition-all group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-1">{customer?.name || 'Unknown'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-gray-500">{orderDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-gray-600">{order.items.length} items</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No orders yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Top Customers */}
        <Card className="p-6 border-none shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Top Customers
              </h3>
              <p className="text-sm text-gray-600 mt-1">Highest spending customers</p>
            </div>
            <Link href="/customers" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {topCustomers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {topCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="relative p-5 bg-linear-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all group overflow-hidden"
                >
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                    #{index + 1}
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg mb-3">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-purple-600 transition-colors mb-1">
                      {customer.name}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-1 mb-2">{customer.email}</p>
                    <div className="w-full pt-3 border-t border-purple-200">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Total Spent</span>
                        <span className="font-bold text-green-700">{formatCurrency(customer.totalSpent)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Orders</span>
                        <span className="font-bold text-purple-700">{customer.totalOrders}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No customers yet</p>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 border-none shadow-lg bg-linear-to-br from-amber-50 to-orange-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Frequently used features</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/orders/new"
              className="flex items-center gap-3 p-4 bg-white hover:bg-linear-to-br hover:from-blue-50 hover:to-blue-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-blue-200"
            >
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">New Order</p>
                <p className="text-xs text-gray-600">Create order</p>
              </div>
            </Link>
            <Link
              href="/products/new"
              className="flex items-center gap-3 p-4 bg-white hover:bg-linear-to-br hover:from-green-50 hover:to-green-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-green-200"
            >
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Add Product</p>
                <p className="text-xs text-gray-600">New product</p>
              </div>
            </Link>
            <Link
              href="/orders"
              className="flex items-center gap-3 p-4 bg-white hover:bg-linear-to-br hover:from-purple-50 hover:to-purple-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-purple-200"
            >
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">View Orders</p>
                <p className="text-xs text-gray-600">All orders</p>
              </div>
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-3 p-4 bg-white hover:bg-linear-to-br hover:from-amber-50 hover:to-amber-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-amber-200"
            >
              <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                <Coffee className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Manage Products</p>
                <p className="text-xs text-gray-600">Catalog</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}