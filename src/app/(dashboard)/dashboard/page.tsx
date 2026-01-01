// src/app/(dashboard)/dashboard/page.tsx
import { Card } from '@/components/ui/Card';
import { adminDb } from '@/lib/firebase/admin';
import { ShoppingCart, Package, Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import Link from 'next/link';

async function getDashboardStats() {
  try {
    const [ordersSnapshot, productsSnapshot, customersSnapshot] = await Promise.all([
      adminDb.collection('orders').get(),
      adminDb.collection('products').where('isActive', '==', true).get(),
      adminDb.collection('customers').get(),
    ]);

    const orders = ordersSnapshot.docs.map(doc => doc.data());
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const recentOrders = orders.filter(order => {
      const createdAt = order.createdAt?.toDate();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdAt && createdAt > thirtyDaysAgo;
    }).length;

    return {
      totalOrders: ordersSnapshot.size,
      totalRevenue,
      activeProducts: productsSnapshot.size,
      totalCustomers: customersSnapshot.size,
      recentOrders,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalOrders: 0,
      totalRevenue: 0,
      activeProducts: 0,
      totalCustomers: 0,
      recentOrders: 0,
    };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here&apos;s your overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalOrders}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.recentOrders} in last 30 days
              </p>
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
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                All time
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.activeProducts}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                In catalog
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalCustomers}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Total registered
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/orders/new"
            className="flex items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 border border-blue-200"
          >
            <ShoppingCart size={20} />
            <span className="font-medium">Create New Order</span>
          </Link>
          <Link
            href="/products/new"
            className="flex items-center justify-center gap-2 p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors duration-200 border border-green-200"
          >
            <Package size={20} />
            <span className="font-medium">Add New Product</span>
          </Link>
          <Link
            href="/orders"
            className="flex items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors duration-200 border border-purple-200"
          >
            <ShoppingCart size={20} />
            <span className="font-medium">View All Orders</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}