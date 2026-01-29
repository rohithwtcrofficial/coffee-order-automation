// src/components/dashboard/MetricCards.tsx

import { Card } from '@/components/ui/Card';
import { ShoppingCart, IndianRupee, Package, Users, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { getDateRangeLabel } from '@/lib/utils/dashboard-utils';

interface MetricCardsProps {
  stats: {
    totalOrders: number;
    recentOrders: number;
    recentRevenue: number;
    avgOrderValue: number;
    activeProducts: number;
    lowStockProducts: number;
    totalCustomers: number;
    orderGrowth: number;
    revenueGrowth: number;
  };
  dateRange: string;
  customStart?: Date | null;
  customEnd?: Date | null;
}

export const MetricCards = ({ stats, dateRange, customStart, customEnd }: MetricCardsProps) => {
  const rangeLabel = getDateRangeLabel(dateRange, customStart, customEnd);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Orders */}
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
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.recentOrders}</p>
          <p className="text-xs text-gray-500">In {rangeLabel}</p>
        </div>
      </Card>

      {/* Total Revenue */}
      <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-linear-to-br from-green-500 to-emerald-600 opacity-5"></div>
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
          <p className="text-sm font-semibold text-gray-600 mb-1">Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(stats.recentRevenue)}</p>
          <p className="text-xs text-gray-500">Avg: {formatCurrency(stats.avgOrderValue)}/order</p>
        </div>
      </Card>

      {/* Active Products */}
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
          <p className="text-xs text-gray-500">Low stock: {stats.lowStockProducts}</p>
        </div>
      </Card>

      {/* Total Customers */}
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
  );
};