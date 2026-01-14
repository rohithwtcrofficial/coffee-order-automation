// src/components/dashboard/DashboardClient.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { 
  ShoppingCart, Package, Users, TrendingUp, Search, 
  Calendar, IndianRupee, Activity, ArrowUpRight, ArrowDownRight,
  Clock, Star, Box, AlertCircle, CheckCircle, XCircle,
  BarChart3, PieChart, RefreshCw, Download, Eye,
  Coffee, Award, Target, Zap, ChevronRight, LineChart,
  AreaChart as AreaChartIcon, Gauge
} from 'lucide-react';
import { 
  AreaChart, Area, PieChart as RePieChart, Pie, Cell,
  BarChart, Bar, LineChart as ReLineChart, Line,
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { Order, Customer, Product } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import Link from 'next/link';

interface DashboardClientProps {
  orders: Order[];
  customers: Customer[];
  products: Product[];
}

// Helper function to safely convert Firebase timestamps
const getOrderDate = (order: any): Date => {
  const createdAt = order.createdAt;
  
  // Handle Firebase Timestamp objects
  if (createdAt && typeof createdAt === 'object' && 'toDate' in createdAt) {
    return createdAt.toDate();
  }
  
  // Handle Date objects
  if (createdAt instanceof Date) {
    return createdAt;
  }
  
  // Handle ISO strings or timestamp numbers
  if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    return new Date(createdAt);
  }
  
  // Fallback to current date
  return new Date();
};

export default function DashboardClient({ orders, customers, products }: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('30'); // days
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Calculate statistics with FIXED date handling
  const stats = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    const daysBack = parseInt(dateRange);
    const daysAgo = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    daysAgo.setHours(0, 0, 0, 0); // Start of that day
    
    console.log('Date Range:', { now, daysAgo, daysBack, dateRange }); // Debug
    
    const recentOrders = orders.filter(order => {
      const orderDate = getOrderDate(order);
      const isInRange = orderDate >= daysAgo && orderDate <= now;
      return isInRange;
    });

    console.log('Recent Orders:', recentOrders.length, 'Total Orders:', orders.length); // Debug

    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const recentRevenue = recentOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    const activeProducts = products.filter(p => p.isActive).length;
    const lowStockProducts = products.filter(p => p.stockQuantity < 10).length;
    
    const avgOrderValue = recentOrders.length > 0 ? recentRevenue / recentOrders.length : 0;
    
    const statusCounts = {
      RECEIVED: orders.filter(o => o.status === 'RECEIVED').length,
      ACCEPTED: orders.filter(o => o.status === 'ACCEPTED').length,
      PACKED: orders.filter(o => o.status === 'PACKED').length,
      SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
      DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    };

    // Calculate growth rates (comparing with previous period)
    const previousPeriodEnd = new Date(daysAgo.getTime() - 1); // 1ms before daysAgo
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - daysBack * 24 * 60 * 60 * 1000);
    previousPeriodStart.setHours(0, 0, 0, 0);
    
    const previousOrders = orders.filter(order => {
      const orderDate = getOrderDate(order);
      return orderDate >= previousPeriodStart && orderDate < daysAgo;
    });
    
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
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
      daysAgo, // For chart calculations
      now, // For chart calculations
    };
  }, [orders, products, customers, dateRange]);

  // Revenue chart data - FIXED
  const revenueChartData = useMemo(() => {
    const dataMap: Record<string, { revenue: number; orderCount: number }> = {};
    const daysBack = parseInt(dateRange);
    const now = new Date();
    
    // Initialize all days in range
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!dataMap[dateKey]) {
        dataMap[dateKey] = { revenue: 0, orderCount: 0 };
      }
    }

    // Aggregate orders by date
    orders.forEach(order => {
      const orderDate = getOrderDate(order);
      const orderDaysBack = Math.floor((now.getTime() - orderDate.getTime()) / (24 * 60 * 60 * 1000));
      
      // Only include orders within the date range
      if (orderDaysBack >= 0 && orderDaysBack < daysBack) {
        const dateKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (dataMap[dateKey]) {
          dataMap[dateKey].revenue += order.totalAmount || 0;
          dataMap[dateKey].orderCount += 1;
        }
      }
    });

    // Convert to sorted array
    const chartData = Object.entries(dataMap)
      .map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue),
        orders: data.orderCount
      }));

    console.log('Chart Data:', chartData); // Debug
    return chartData;
  }, [orders, dateRange]);

  // Category distribution
  const categoryData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    const categoryRevenue: Record<string, number> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const category = item.category || 'Unknown';
        categoryCounts[category] = (categoryCounts[category] || 0) + item.quantity;
        categoryRevenue[category] = (categoryRevenue[category] || 0) + (item.subtotal || 0);
      });
    });

    const colors = ['#f59e0b', '#d97706', '#92400e', '#78350f', '#451a03'];
    
    return Object.entries(categoryCounts)
      .map(([name, value], index) => ({
        name,
        value,
        revenue: categoryRevenue[name] || 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  // Order status breakdown
  const statusChartData = useMemo(() => {
    const statusMap: Record<string, { count: number; color: string }> = {
      RECEIVED: { count: stats.statusCounts.RECEIVED, color: '#06b6d4' },
      ACCEPTED: { count: stats.statusCounts.ACCEPTED, color: '#10b981' },
      PACKED: { count: stats.statusCounts.PACKED, color: '#f97316' },
      SHIPPED: { count: stats.statusCounts.SHIPPED, color: '#3b82f6' },
      DELIVERED: { count: stats.statusCounts.DELIVERED, color: '#22c55e' },
      CANCELLED: { count: stats.statusCounts.CANCELLED, color: '#ef4444' },
    };

    return Object.entries(statusMap)
      .map(([name, data]) => ({
        name,
        value: data.count,
        color: data.color
      }))
      .filter(item => item.value > 0);
  }, [stats]);

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
        productSales[item.productId].sales += item.quantity || 0;
        productSales[item.productId].revenue += item.subtotal || 0;
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
        const dateA = getOrderDate(a);
        const dateB = getOrderDate(b);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-xl">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-5"></div>
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
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-5"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <IndianRupee className="w-6 h-6 text-green-600" />
                </div>
                {stats.revenueGrowth !== 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${stats.revenueGrowth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {stats.revenueGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(stats.revenueGrowth).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(stats.recentRevenue)}</p>
              <p className="text-xs text-gray-500">Avg: {formatCurrency(stats.avgOrderValue)}/order</p>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-5"></div>
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
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-5"></div>
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

        {/* Charts Row - PowerBI Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend - FIXED */}
          <Card className="lg:col-span-2 p-6 border-none shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AreaChartIcon className="w-5 h-5 text-green-600" />
                  Revenue Trend
                </h3>
                <p className="text-sm text-gray-600 mt-1">Last {dateRange} days - Daily revenue breakdown</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            
            {revenueChartData.length > 0 && revenueChartData.some(d => d.revenue > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#6b7280' }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '2px solid #f3f4f6', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
                      }}
                      formatter={(value: any) => ['₹' + value.toLocaleString('en-IN'), 'Revenue']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      isAnimationActive={true}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium">Peak Revenue</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(Math.max(...revenueChartData.map(d => d.revenue), 0))}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium">Avg Daily</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(revenueChartData.length > 0 ? revenueChartData.reduce((sum, d) => sum + d.revenue, 0) / revenueChartData.length : 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-gray-600 font-medium">Total Orders</p>
                    <p className="text-lg font-bold text-gray-900">
                      {revenueChartData.reduce((sum, d) => sum + d.orders, 0)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <LineChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No revenue data for selected period</p>
                  <p className="text-xs text-gray-400 mt-2">Orders will appear here once they are placed</p>
                </div>
              </div>
            )}
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
            
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <RePieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      isAnimationActive={true}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '2px solid #f3f4f6', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
                      }}
                      formatter={(value: any) => [value + ' units', 'Sales']}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {categoryData.slice(0, 4).map((cat, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-gray-700 font-medium text-xs line-clamp-1">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs">{cat.value}</span>
                        <span className="text-xs text-gray-500">{formatCurrency(cat.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No category data</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Order Status Breakdown */}
        {statusChartData.length > 0 && (
          <Card className="p-6 border-none shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-indigo-600" />
                  Order Status Breakdown
                </h3>
                <p className="text-sm text-gray-600 mt-1">Current order pipeline</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis type="number" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" style={{ fontSize: '12px' }} width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '2px solid #f3f4f6', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
                  }}
                  formatter={(value: any) => [value + ' orders', 'Count']}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

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
                  <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl hover:shadow-md transition-all group">
                    <div className="relative">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <Coffee className="w-7 h-7 text-white" />
                        </div>
                      )}
                      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
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
                  const orderDate = getOrderDate(order);
                  return (
                    <Link 
                      key={order.id} 
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:shadow-md transition-all group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                          Order #{order.orderNumber}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-1">{customer?.name || 'Unknown'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(orderDate)}</span>
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
                  className="relative p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-lg transition-all group overflow-hidden"
                >
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                    #{index + 1}
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg mb-3">
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
        <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
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
              className="flex items-center gap-3 p-4 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-blue-200"
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
              className="flex items-center gap-3 p-4 bg-white hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-green-200"
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
              className="flex items-center gap-3 p-4 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-purple-200"
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
              className="flex items-center gap-3 p-4 bg-white hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 rounded-xl transition-all group shadow-sm hover:shadow-md border-2 border-transparent hover:border-amber-200"
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